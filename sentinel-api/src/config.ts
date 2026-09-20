/**
 * Server configuration. Everything comes from the environment; no secrets are
 * hardcoded and none are ever logged.
 */

/** Explanation request body accepted by POST /api/v1/explain. */
export interface ExplainRequestBody {
  bundle: unknown;
  question: string;
  audience?: "retail" | "analyst" | "developer";
  unknowns?: unknown;
  expectedTopics?: string[];
}

export interface ApiConfig {
  port: number;
  /** GEMINI_API_KEY; used when the configured provider is gemini. */
  geminiApiKey: string | undefined;
  /** OPENROUTER_API_KEY; used when the configured provider is openrouter. */
  openrouterApiKey: string | undefined;
  /** Explanation provider: "ollama" (default for the demo), "gemini" or "openrouter". */
  explanationProvider: "ollama" | "gemini" | "openrouter";
  /** Ollama local server base URL. */
  ollamaBaseUrl: string | undefined;
  /** Ollama model tag. */
  ollamaModel: string | undefined;
  model: string | undefined;
  openrouterModel: string | undefined;
  timeoutMs: number;
  maxRetries: number;
  /** Max accepted evidence records per request. */
  maxEvidenceRecords: number;
  /** Max request body size for JSON parsing. */
  bodyLimit: string;
}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw.length === 0) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: intEnv(env, "PORT", 8787),
    geminiApiKey: env.GEMINI_API_KEY,
    openrouterApiKey: env.OPENROUTER_API_KEY,
    explanationProvider:
      env.EXPLANATION_PROVIDER === "ollama" ||
      env.EXPLANATION_PROVIDER === "openrouter" ||
      env.EXPLANATION_PROVIDER === "gemini"
        ? env.EXPLANATION_PROVIDER
        : env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY
          ? "openrouter"
          : "gemini",
    model: env.GEMINI_MODEL,
    openrouterModel: env.OPENROUTER_MODEL,
    ollamaBaseUrl: env.OLLAMA_BASE_URL,
    ollamaModel: env.OLLAMA_MODEL,
    timeoutMs: intEnv(env, "EXPLANATION_TIMEOUT_MS", intEnv(env, "GEMINI_TIMEOUT_MS", 30_000)),
    maxRetries: intEnv(env, "EXPLANATION_MAX_RETRIES", intEnv(env, "GEMINI_MAX_RETRIES", 3)),
    maxEvidenceRecords: intEnv(env, "MAX_EVIDENCE_RECORDS", 200),
    bodyLimit: env.BODY_LIMIT ?? "1mb",
  };
}
