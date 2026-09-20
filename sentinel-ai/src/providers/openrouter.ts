/**
 * OpenRouter-backed {@link ExplanationProvider} for the Sentinel AI layer.
 *
 * Responsibilities are strictly limited to LLM transport:
 *  - read the API key from the OPENROUTER_API_KEY environment variable (never
 *    hardcoded, never accepted from untrusted callers, never logged),
 *  - map PromptPair: `system` -> system message, `user` -> user message,
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

import type { ExplanationProvider, PromptPair } from "../engine.js";

/** Error raised for provider configuration or transport failures. */
export class OpenRouterProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterProviderError";
  }
}

const OPENROUTER_KEY_PATTERN = /sk-or-[0-9A-Za-z_-]{10,}/g;

/**
 * Remove credential material from an error message before it is embedded in
 * an exception. Callers should still avoid logging errors verbatim; this is
 * defense in depth, not a logging feature.
 */
export function redactOpenRouterSecrets(message: string, ...secrets: (string | undefined)[]): string {
  let redacted = message;
  for (const secret of secrets) {
    if (secret && secret.length > 0) {
      redacted = redacted.split(secret).join("[redacted]");
    }
  }
  return redacted.replace(OPENROUTER_KEY_PATTERN, "[redacted]");
}

export interface OpenRouterProviderConfig {
  /**
   * API key override. Production code should leave this unset so the key is
   * read from the OPENROUTER_API_KEY environment variable only.
   */
  apiKey?: string;
  /** OpenRouter model id. Defaults to {@link DEFAULT_OPENROUTER_MODEL}. */
  model?: string;
  /** Request timeout in milliseconds. Defaults to 45_000. */
  timeoutMs?: number;
  /** Sampling temperature; explanations should be conservative. Default 0.2. */
  temperature?: number;
  /** Output token cap (includes reasoning tokens on reasoning models). Default 2048. */
  maxOutputTokens?: number;
  /** Retries for transient server-side failures (429/500/503). Default 3. */
  maxRetries?: number;
  /** Optional OpenRouter site attribution headers. */
  appTitle?: string;
  /** Test seam: construct the transport client instead of the real fetch one. */
  clientFactory?: (apiKey: string) => OpenRouterClientLike;
}

export const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v4-flash-0731:free";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Minimal injectable transport seam; the default implementation uses fetch. */
export interface OpenRouterClientLike {
  complete(body: OpenRouterRequestBody, init?: { signal?: AbortSignal }): Promise<OpenRouterSuccessResponse>;
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequestBody {
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
  max_tokens: number;
}

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface OpenRouterSuccessResponse {
  choices?: Array<{
    message?: { role?: string; content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: OpenRouterUsage;
  error?: { message?: string; code?: number };
}

/** Real transport: authenticated POST to the chat/completions endpoint. */
class FetchOpenRouterClient implements OpenRouterClientLike {
  constructor(
    private readonly apiKey: string,
    private readonly appTitle?: string,
  ) {}

  async complete(
    body: OpenRouterRequestBody,
    init?: { signal?: AbortSignal },
  ): Promise<OpenRouterSuccessResponse> {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        // Optional attribution; never includes secrets.
        ...(this.appTitle ? { "x-title": this.appTitle } : {}),
      },
      body: JSON.stringify(body),
      ...(init?.signal ? { signal: init.signal } : {}),
    });

    const raw = await res.text();
    let parsed: OpenRouterSuccessResponse | undefined;
    try {
      parsed = JSON.parse(raw) as OpenRouterSuccessResponse;
    } catch {
      parsed = undefined; // non-JSON body (gateway/html error pages)
    }

    if (!res.ok) {
      const detail = parsed?.error?.message ?? raw.slice(0, 300);
      throw new OpenRouterProviderError(
        `OpenRouter API request failed: HTTP ${res.status}${detail ? `: ${detail}` : ""}`,
      );
    }
    if (!parsed) {
      throw new OpenRouterProviderError(
        `OpenRouter API request failed: HTTP ${res.status}: unparseable response body`,
      );
    }
    return parsed;
  }
}

export class OpenRouterExplanationProvider implements ExplanationProvider {
  readonly name = "openrouter";

  private readonly client: OpenRouterClientLike;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly maxRetries: number;
  /** Kept only for redaction of error messages; never logged or returned. */
  private readonly apiKey: string;

  constructor(config: OpenRouterProviderConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new OpenRouterProviderError(
        "Missing OpenRouter API key: set the OPENROUTER_API_KEY environment variable",
      );
    }

    this.apiKey = apiKey;
    this.model = config.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
    this.timeoutMs = config.timeoutMs ?? 45_000;
    this.temperature = config.temperature ?? 0.2;
    // Generous default: reasoning models spend budget before emitting content.
    this.maxOutputTokens = config.maxOutputTokens ?? 2048;
    this.maxRetries = config.maxRetries ?? 3;
    this.client = config.clientFactory
      ? config.clientFactory(apiKey)
      : new FetchOpenRouterClient(apiKey, config.appTitle);
  }

  async generate(prompt: PromptPair, opts?: { signal?: AbortSignal }): Promise<string> {
    if (opts?.signal?.aborted) {
      throw new OpenRouterProviderError("Generation aborted before request");
    }

    const body: OpenRouterRequestBody = {
      model: this.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: this.temperature,
      max_tokens: this.maxOutputTokens,
    };

    try {
      let lastError: OpenRouterProviderError | undefined;
      const attempts = this.maxRetries + 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          const response = await this.requestOnce(body, opts?.signal);
          return extractText(response, this.model);
        } catch (err) {
          lastError = toProviderError(err, this.apiKey);
          // Abort/timeout and permanent client errors are not retried.
          if (!isOpenRouterTransientError(lastError) || attempt === attempts - 1) throw lastError;
          await delay(openRouterBackoffDelayMs(attempt));
        }
      }
      throw lastError ?? new OpenRouterProviderError("OpenRouter request failed");
    } catch (err) {
      throw err instanceof OpenRouterProviderError ? err : toProviderError(err, this.apiKey);
    }
  }

  /** One HTTP call raced against the attempt timeout and the external signal. */
  private async requestOnce(
    body: OpenRouterRequestBody,
    external?: AbortSignal,
  ): Promise<OpenRouterSuccessResponse> {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    external?.addEventListener("abort", onExternalAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Race the client call against the attempt deadline: the transport may
      // ignore the abort signal (or the failure may not surface as AbortError).
      return await Promise.race([
        this.client.complete(body, { signal: controller.signal }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(
              new OpenRouterProviderError(
                external?.aborted ? "Generation aborted" : "OpenRouter request timed out or was aborted",
              ),
            );
          });
        }),
      ]);
    } finally {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    }
  }
}

/** Pull the generated text out of an API response; throw when unusable. */
function extractText(response: OpenRouterSuccessResponse, model: string): string {
  if (response.error?.message) {
    throw new OpenRouterProviderError(`OpenRouter API request failed: ${response.error.message}`);
  }
  const choice = response.choices?.[0];
  const content = choice?.message?.content;
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (trimmed.length === 0) {
    // Reasoning models can exhaust max_tokens before emitting content.
    const finish = choice?.finish_reason ?? "unknown";
    throw new OpenRouterProviderError(
      `OpenRouter returned an empty response for model ${model} (finish_reason: ${finish})`,
    );
  }
  return trimmed;
}

/** Normalize any failure into a sanitized OpenRouterProviderError. */
function toProviderError(err: unknown, apiKey: string): OpenRouterProviderError {
  if (err instanceof OpenRouterProviderError) {
    return err;
  }
  if (err instanceof Error && err.name === "AbortError") {
    return new OpenRouterProviderError("OpenRouter request timed out or was aborted");
  }
  const raw = err instanceof Error ? err.message : String(err);
  const detail = redactOpenRouterSecrets(raw, apiKey);
  // Never include stack traces or config objects; message text only.
  return new OpenRouterProviderError(`OpenRouter API request failed: ${detail}`);
}

/**
 * Transient server-side failures worth retrying: rate limits and capacity
 * errors (429/500/503). Client errors (401 auth, 402 insufficient credits,
 * 403, 404 model) and aborts are not retried.
 */
export function isOpenRouterTransientError(err: OpenRouterProviderError): boolean {
  if (/timed out or was aborted/i.test(err.message)) return false;
  return /(\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|rate limit|overloaded|temporarily)/i.test(err.message);
}

/** Jittered exponential backoff: ~500ms, ~1s, ~2s... capped at 4s. */
export function openRouterBackoffDelayMs(attempt: number): number {
  const base = Math.min(500 * 2 ** attempt, 4_000);
  return base + Math.floor(Math.random() * 250);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
