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
  /** GEMINI_API_KEY; absent => engine is built on the mock provider. */
  geminiApiKey: string | undefined;
  model: string | undefined;
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
    model: env.GEMINI_MODEL,
    timeoutMs: intEnv(env, "GEMINI_TIMEOUT_MS", 30_000),
    maxRetries: intEnv(env, "GEMINI_MAX_RETRIES", 3),
    maxEvidenceRecords: intEnv(env, "MAX_EVIDENCE_RECORDS", 200),
    bodyLimit: env.BODY_LIMIT ?? "1mb",
  };
}
