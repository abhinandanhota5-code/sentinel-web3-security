/**
 * Ollama-backed {@link ExplanationProvider} for the Sentinel AI layer.
 *
 * Responsibilities are strictly limited to LLM transport against a LOCAL
 * Ollama server (default http://localhost:11434):
 *  - read the base URL from OLLAMA_BASE_URL and the model from OLLAMA_MODEL,
 *  - map PromptPair: `system` -> system message, `user` -> user message,
 *  - return only the generated text,
 *  - surface connection/timeout/abort failures as provider errors so the
 *    existing GroundedExplanationEngine returns its existing provider_error
 *    response (deterministic evidence is never replaced by model prose).
 *
 * This module contains NO blockchain logic and does not touch evidence
 * validation: GroundedExplanationEngine still runs validateDraft() and
 * sanitizeDraft() on everything this provider returns. The Ollama endpoint is
 * server-side only; nothing here is ever exposed to the frontend.
 */

import type { ExplanationProvider, PromptPair } from "../engine.js";

/** Structural slice of the HTTP client used here; injectable for tests. */
export interface OllamaClientLike {
  generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse>;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream: false;
  format?: "json";
  options?: { temperature?: number; num_predict?: number };
}

export interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

/** Machine-readable Ollama failure classification for the UI. */
export type OllamaFailureCode =
  | "OLLAMA_UNAVAILABLE"
  | "MODEL_NOT_FOUND"
  | "TIMEOUT"
  | "INVALID_RESPONSE";

/** Error raised for provider configuration or transport failures. */
export class OllamaProviderError extends Error {
  readonly code: OllamaFailureCode;
  constructor(message: string, code: OllamaFailureCode = "INVALID_RESPONSE") {
    super(message);
    this.name = "OllamaProviderError";
    this.code = code;
  }
}

export interface OllamaProviderConfig {
  /** Base URL of the local Ollama server. Default OLLAMA_BASE_URL or http://localhost:11434. */
  baseUrl?: string;
  /** Model tag. Default OLLAMA_MODEL or "llama3.1:8b". */
  model?: string;
  /** Request timeout in milliseconds. Default 120_000 (local inference is slower). */
  timeoutMs?: number;
  /** Sampling temperature; explanations should be conservative. Default 0.2. */
  temperature?: number;
  /** Output token cap. Default 1024. */
  maxOutputTokens?: number;
  /** Test seam: construct the HTTP client instead of the real fetch-based one. */
  clientFactory?: (baseUrl: string) => OllamaClientLike;
}

export const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

export class OllamaExplanationProvider implements ExplanationProvider {
  readonly name = "ollama";

  private readonly client: OllamaClientLike;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;

  constructor(config: OllamaProviderConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, "");
    this.model = config.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
    if (!this.model || this.model.trim().length === 0) {
      throw new OllamaProviderError(
        "Missing Ollama model: set the OLLAMA_MODEL environment variable",
        "MODEL_NOT_FOUND",
      );
    }
    this.timeoutMs = config.timeoutMs ?? 120_000;
    this.temperature = config.temperature ?? 0.2;
    this.maxOutputTokens = config.maxOutputTokens ?? 1024;
    this.client = config.clientFactory
      ? config.clientFactory(this.baseUrl)
      : createFetchOllamaClient(this.baseUrl, this.timeoutMs);
  }

  async generate(prompt: PromptPair, opts?: { signal?: AbortSignal }): Promise<string> {
    if (opts?.signal?.aborted) {
      throw new OllamaProviderError("Generation aborted before request");
    }

    const request: OllamaGenerateRequest = {
      model: this.model,
      prompt: prompt.user,
      system: prompt.system,
      stream: false,
      options: {
        temperature: this.temperature,
        num_predict: this.maxOutputTokens,
      },
    };

    try {
      const response = await this.client.generate(request);
      const text = (response.response ?? "").trim();
      if (text.length === 0) {
        throw new OllamaProviderError(
          response.error
            ? `Ollama returned an error for model ${this.model}: ${response.error}`
            : `Ollama returned an empty response for model ${this.model}`,
          /not found/i.test(response.error ?? "") ? "MODEL_NOT_FOUND" : "INVALID_RESPONSE",
        );
      }
      return text;
    } catch (err) {
      throw err instanceof OllamaProviderError ? err : toProviderError(err);
    }
  }
}

/** Real HTTP client for Ollama's /api/generate endpoint (non-streaming). */
function createFetchOllamaClient(baseUrl: string, timeoutMs: number): OllamaClientLike {
  return {
    async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        const aborted = controller.signal.aborted;
        const raw = err instanceof Error ? err.message : String(err);
        throw new OllamaProviderError(
          aborted
            ? `Ollama request timed out after ${timeoutMs}ms`
            : `Ollama is unreachable at ${baseUrl}: ${raw}`,
          aborted ? "TIMEOUT" : "OLLAMA_UNAVAILABLE",
        );
      }
      clearTimeout(timer);
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new OllamaProviderError(
          `Ollama API request failed: HTTP ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
          res.status === 404 ? "MODEL_NOT_FOUND" : "INVALID_RESPONSE",
        );
      }
      return (await res.json()) as OllamaGenerateResponse;
    },
  };
}

/** Normalize any failure into a sanitized OllamaProviderError. */
function toProviderError(err: unknown): OllamaProviderError {
  if (err instanceof OllamaProviderError) return err;
  const raw = err instanceof Error ? err.message : String(err);
  // Never include stack traces or config objects; message text only.
  return new OllamaProviderError(`Ollama request failed: ${raw}`);
}
