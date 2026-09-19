/**
 * Gemini-backed {@link ExplanationProvider} for the Sentinel AI layer.
 *
 * Responsibilities are strictly limited to LLM transport:
 *  - read the API key from the GEMINI_API_KEY environment variable (never
 *    hardcoded, never accepted from untrusted callers, never logged),
 *  - map PromptPair: `system` -> Gemini systemInstruction, `user` -> contents,
 *  - return only the generated text,
 *  - surface API/timeout/abort failures as provider errors so the existing
 *    GroundedExplanationEngine returns its existing provider_error response.
 *
 * This module contains NO blockchain logic and does not touch evidence
 * validation: GroundedExplanationEngine still runs validateDraft() and
 * sanitizeDraft() on everything this provider returns.
 *
 * Server-side only. The API key must never reach the frontend.
 */

import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import type { ExplanationProvider, PromptPair } from "../engine.js";

/** Structural slice of the SDK client used here; injectable for tests. */
export interface GeminiClientLike {
  models: {
    generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;
  };
}

/** Error raised for provider configuration or transport failures. */
export class GeminiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiProviderError";
  }
}

const GOOGLE_API_KEY_PATTERN = /AIza[0-9A-Za-z_-]{10,}/g;

/**
 * Remove credential material from an error message before it is embedded in
 * an exception. Callers should still avoid logging errors verbatim; this is
 * defense in depth, not a logging feature.
 */
export function redactSecrets(message: string, ...secrets: (string | undefined)[]): string {
  let redacted = message;
  for (const secret of secrets) {
    if (secret && secret.length > 0) {
      redacted = redacted.split(secret).join("[redacted]");
    }
  }
  return redacted.replace(GOOGLE_API_KEY_PATTERN, "[redacted]");
}

export interface GeminiProviderConfig {
  /**
   * API key override. Production code should leave this unset so the key is
   * read from the GEMINI_API_KEY environment variable only.
   */
  apiKey?: string;
  /** Gemini model id. Defaults to "gemini-flash-latest". */
  model?: string;
  /** Request timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
  /** Sampling temperature; explanations should be conservative. Default 0.2. */
  temperature?: number;
  /** Output token cap. Default 1024. */
  maxOutputTokens?: number;
  /** Test seam: construct the SDK client instead of the real one. */
  clientFactory?: (apiKey: string) => GeminiClientLike;
}

export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

export class GeminiExplanationProvider implements ExplanationProvider {
  readonly name = "gemini";

  private readonly client: GeminiClientLike;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  /** Kept only for redaction of error messages; never logged or returned. */
  private readonly apiKey: string;

  constructor(config: GeminiProviderConfig = {}) {
    const apiKey = config.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new GeminiProviderError(
        "Missing Gemini API key: set the GEMINI_API_KEY environment variable",
      );
    }

    this.apiKey = apiKey;
    this.model = config.model ?? DEFAULT_GEMINI_MODEL;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.temperature = config.temperature ?? 0.2;
    this.maxOutputTokens = config.maxOutputTokens ?? 1024;
    this.client = config.clientFactory
      ? config.clientFactory(apiKey)
      : (new GoogleGenAI({ apiKey }) as unknown as GeminiClientLike);
  }

  async generate(prompt: PromptPair, opts?: { signal?: AbortSignal }): Promise<string> {
    if (opts?.signal?.aborted) {
      throw new GeminiProviderError("Generation aborted before request");
    }

    const request: GenerateContentParameters = {
      model: this.model,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens,
      },
    };

    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    opts?.signal?.addEventListener("abort", onExternalAbort, { once: true });

    const timer = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response = await Promise.race([
        this.client.models.generateContent(request),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new GeminiProviderError("Gemini request timed out or was aborted"));
          });
        }),
      ]);
      return extractText(response, this.model);
    } catch (err) {
      throw toProviderError(err, this.apiKey);
    } finally {
      clearTimeout(timer);
      opts?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}

/** Pull the generated text out of an SDK response; throw when unusable. */
function extractText(response: GenerateContentResponse, model: string): string {
  const text = response.text ?? response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new GeminiProviderError(`Gemini returned an empty response for model ${model}`);
  }
  return trimmed;
}

/** Normalize any failure into a sanitized GeminiProviderError. */
function toProviderError(err: unknown, apiKey: string): GeminiProviderError {
  if (err instanceof GeminiProviderError) {
    return err;
  }
  const raw = err instanceof Error ? err.message : String(err);
  const detail = redactSecrets(raw, apiKey);
  // Never include stack traces or config objects; message text only.
  return new GeminiProviderError(`Gemini API request failed: ${detail}`);
}
