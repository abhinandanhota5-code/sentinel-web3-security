/**
 * Wiring for the Sentinel backend: builds the grounded explanation engine and
 * the (default no-op) PRISM client. The Gemini API key never leaves this
 * process; responses never include it.
 */

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import {
  createSentinelAi,
  GeminiExplanationProvider,
  OllamaExplanationProvider,
  OpenRouterExplanationProvider,
  MockExplanationProvider,
  NullPrismClient,
  evaluateExplanation,
  parseEvidenceBundle,
  validateDraft,
  EvidenceValidationError,
  EvidenceIndex,
  type EvidenceBundle,
  type Explanation,
  type ExplanationProvider,
  type UnknownField,
} from "@sentinel/ai";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { ApiConfig, ExplainRequestBody } from "./config.js";
import {
  adaptEngineBundle,
  normalizeChain,
  type EngineBundle,
} from "./engine-adapter.js";

/**
 * Port of the deterministic security engine. The real implementation is the
 * CJS `src/security-engine` package; tests inject fakes. sentinel-api contains
 * no blockchain logic of its own â€” it only invokes this port.
 */
export interface SecurityEnginePort {
  analyzeAddressSecurity(args: {
    provider: unknown;
    address: string;
    chain: string;
  }): Promise<EngineBundle>;
}

export interface AppDeps {
  config: ApiConfig;
  /** Deterministic engine; defaults to the real CJS security engine. */
  securityEngine?: SecurityEnginePort | undefined;
  /** Blockchain provider for the engine; defaults to createEthereumProvider(). */
  blockchainProvider?: unknown;
  /** Explanation provider override (tests); defaults from the provider config. */
  explanationProvider?: ExplanationProvider | undefined;
}

interface RealSecurityEngineModule {
  createEthereumProvider: (opts?: Record<string, unknown>) => unknown;
  analyzeAddressSecurity: SecurityEnginePort["analyzeAddressSecurity"];
}

/**
 * Resolve the deterministic CJS security engine relative to this compiled
 * file (dist/), independent of the process cwd. Returns undefined when the
 * engine is not present so the AI-only endpoints still boot.
 */
function loadRealSecurityEngine(): RealSecurityEngineModule | undefined {
  try {
    const here = fileURLToPath(new URL(".", import.meta.url));
    const enginePath = path.resolve(here, "..", "..", "src", "security-engine", "index.js");
    return createRequire(import.meta.url)(enginePath) as RealSecurityEngineModule;
  } catch {
    return undefined;
  }
}

/** Real engine + provider, loaded lazily so AI-only routes work without it. */
function createDefaultSecurityEngine(): SecurityEnginePort & {
  provider: () => unknown;
} {
  let mod: RealSecurityEngineModule | undefined;
  let provider: unknown;
  const load = (): RealSecurityEngineModule => {
    if (!mod) {
      mod = loadRealSecurityEngine();
      if (!mod) throw new Error("security engine module not found");
    }
    return mod;
  };
  return {
    provider: () => {
      if (provider === undefined) provider = load().createEthereumProvider();
      return provider;
    },
    analyzeAddressSecurity: (args) => load().analyzeAddressSecurity(args),
  };
}

const UNKNOWN_REASONS: readonly UnknownField["reason"][] = [
  "no_evidence",
  "source_unreachable",
  "out_of_scope",
  "contradicted",
  "deprecated",
];

/** Which explanation provider the given config resolves to (never secrets). */
export function configuredProviderName(config: ApiConfig): string {
  if (
    config.explanationProvider === "ollama" &&
    (config.ollamaBaseUrl ?? true)
  ) {
    // Ollama needs no API key; a local server URL (or the default) suffices.
    return "ollama";
  }
  if (
    config.explanationProvider === "openrouter" &&
    config.openrouterApiKey &&
    config.openrouterApiKey.trim().length > 0
  ) {
    return "openrouter";
  }
  if (config.explanationProvider === "gemini" && config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
    return "gemini";
  }
  return "mock";
}

/** Minimal request validation; errors carry an HTTP status. */
export class BadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "BadRequestError";
  }
}

function parseUnknowns(raw: unknown): UnknownField[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new BadRequestError("unknowns must be an array");
  return raw.map((u) => {
    if (typeof u !== "object" || u === null) throw new BadRequestError("each unknown must be an object");
    const rec = u as Record<string, unknown>;
    if (typeof rec.field !== "string" || rec.field.length === 0) {
      throw new BadRequestError("unknown.field must be a non-empty string");
    }
    if (typeof rec.reason !== "string" || !UNKNOWN_REASONS.includes(rec.reason as UnknownField["reason"])) {
      throw new BadRequestError(`unknown.reason must be one of ${UNKNOWN_REASONS.join("|")}`);
    }
    const out: UnknownField = { field: rec.field, reason: rec.reason as UnknownField["reason"] };
    if (typeof rec.detail === "string") out.detail = rec.detail;
    return out;
  });
}

function parseBody(raw: unknown): ExplainRequestBody {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("body must be a JSON object");
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.question !== "string" || body.question.trim().length === 0) {
    throw new BadRequestError("question is required");
  }
  if (body.question.length > 2_000) throw new BadRequestError("question too long (max 2000 chars)");
  if (body.audience !== undefined && !["retail", "analyst", "developer"].includes(body.audience as string)) {
    throw new BadRequestError("audience must be retail|analyst|developer");
  }
  return body as unknown as ExplainRequestBody;
}

function guardBundleSize(bundle: EvidenceBundle, max: number): void {
  if (bundle.records.length > max) {
    throw new BadRequestError(`bundle exceeds ${max} evidence records`, 413);
  }
}

/** Serialize an Explanation for the client. Never includes secrets. */
export function serializeExplanation(e: Explanation): Record<string, unknown> {
  return {
    text: e.text,
    blocked: e.blocked,
    refused: e.refused ?? null,
    // Exact provider failure cause (already sanitized upstream: secrets
    // redacted, message text only). Present only for provider_error so clients
    // can report e.g. "Gemini 429 quota" instead of an opaque refusal.
    // providerCode is the machine-readable classification (OLLAMA_UNAVAILABLE,
    // MODEL_NOT_FOUND, TIMEOUT, INVALID_RESPONSE) for UI root-cause display.
    ...(e.refused === "provider_error" && e.providerError
      ? { providerError: e.providerError }
      : {}),
    ...(e.refused === "provider_error" && e.providerCode
      ? { providerCode: e.providerCode }
      : {}),
    citations: Object.fromEntries(e.citations),
    knowledgeByCitation: Object.fromEntries(e.knowledgeByCitation),
    validation: {
      clean: e.validation.clean,
      strippedCitations: e.validation.strippedCitations,
      unsupportedClaims: e.validation.unsupportedClaims,
    },
  };
}

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** Chains the deterministic engine currently supports. */
const SUPPORTED_CHAINS = new Set(["ethereum"]);

export function buildApp(deps: AppDeps): Express {
  const { config } = deps;

  // Deterministic engine wiring: injected port, else the real CJS engine.
  const defaultEngine = deps.securityEngine ? undefined : createDefaultSecurityEngine();
  const securityEngine: SecurityEnginePort = deps.securityEngine ?? defaultEngine!;
  let blockchainProvider: unknown = deps.blockchainProvider;
  if (blockchainProvider === undefined && defaultEngine) {
    try {
      blockchainProvider = defaultEngine.provider();
    } catch {
      blockchainProvider = undefined; // /analyze will fail per-request, AI routes still serve
    }
  }

  /** Resolve the vendor-agnostic explanation provider from server config. */
  function defaultExplanationProvider(): ExplanationProvider {
    if (config.explanationProvider === "ollama") {
      return new OllamaExplanationProvider({
        timeoutMs: Math.max(config.timeoutMs, 120_000), // local inference needs headroom
        ...(config.ollamaBaseUrl ? { baseUrl: config.ollamaBaseUrl } : {}),
        ...(config.ollamaModel ? { model: config.ollamaModel } : {}),
      });
    }
    const openrouterReady = config.explanationProvider === "openrouter" && !!config.openrouterApiKey;
    const geminiReady = config.explanationProvider === "gemini" && !!config.geminiApiKey;
    if (openrouterReady) {
      return new OpenRouterExplanationProvider({
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
        ...(config.openrouterModel ? { model: config.openrouterModel } : {}),
      });
    }
    if (geminiReady) {
      return new GeminiExplanationProvider({
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
        ...(config.model ? { model: config.model } : {}),
      });
    }
    return new MockExplanationProvider();
  }

  const provider = deps.explanationProvider ?? defaultExplanationProvider();

  const { engine, prism } = createSentinelAi({ provider, prismClient: new NullPrismClient() });

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: config.bodyLimit }));

  // Desktop packaging only: the packaged renderer runs from a file:// page
  // (origin "null"), so its fetches to the loopback API need an explicit,
  // minimal JSON CORS policy. The web deployment stays same-origin and never
  // enables this; the Electron main process sets SENTINEL_DESKTOP=1.
  if (config.desktopCors) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      // Chromium Private Network Access preflight support for loopback calls.
      res.setHeader("Access-Control-Allow-Private-Network", "true");
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      provider: configuredProviderName(config),
      prism: prism.name,
    });
  });

  app.post("/api/v1/explain", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = parseBody(req.body);
      let bundle: EvidenceBundle;
      try {
        bundle = parseEvidenceBundle(body.bundle);
      } catch (err) {
        throw new BadRequestError(
          `invalid evidence bundle: ${err instanceof EvidenceValidationError ? err.message : "malformed"}`,
        );
      }
      guardBundleSize(bundle, config.maxEvidenceRecords);
      const unknowns = parseUnknowns(body.unknowns);

      const explanation = await engine.explain({
        bundle,
        question: body.question,
        audience: body.audience ?? "retail",
        unknowns,
      });

      res.json(serializeExplanation(explanation));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/v1/evaluate", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : {};
      const body = parseBody(raw);
      const draft = raw.draft;
      if (typeof draft !== "string" || draft.trim().length === 0) {
        throw new BadRequestError("draft is required");
      }
      const bundle = parseEvidenceBundle(body.bundle);
      guardBundleSize(bundle, config.maxEvidenceRecords);
      const unknowns = parseUnknowns(body.unknowns);

      // Deterministic evaluation of the draft against the bundle â€” same
      // validator the explanation pipeline uses.
      const index = new EvidenceIndex(bundle);
      const validation = validateDraft(draft, bundle, index.knowledgeMap());

      const evaluation = evaluateExplanation({
        requestId:
          typeof req.headers["x-request-id"] === "string"
            ? (req.headers["x-request-id"] as string)
            : crypto.randomUUID(),
        bundle,
        requestQuestion: body.question,
        draft,
        validation,
        unknowns,
      });

      await prism.submitEvaluation(evaluation);
      res.json(evaluation);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/v1/analyze", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        throw new BadRequestError("body must be a JSON object");
      }
      const body = req.body as Record<string, unknown>;
      const address = body.address;
      if (typeof address !== "string" || !HEX_ADDRESS.test(address)) {
        throw new BadRequestError("address must be a 20-byte hex address");
      }
      const chain = typeof body.chain === "string" && body.chain.length > 0 ? body.chain : "ethereum";
      if (!SUPPORTED_CHAINS.has(chain)) {
        throw new BadRequestError(`unsupported chain: ${chain}`);
      }
      const question =
        typeof body.question === "string" && body.question.trim().length > 0
          ? body.question
          : `Explain the security posture of ${address} on ${chain}.`;
      if (body.audience !== undefined && !["retail", "analyst", "developer"].includes(body.audience as string)) {
        throw new BadRequestError("audience must be retail|analyst|developer");
      }
      const audience = (body.audience as "retail" | "analyst" | "developer" | undefined) ?? "retail";

      // 1-2. Deterministic engine runs first; it is the sole source of truth.
      if (blockchainProvider === undefined) {
        throw new BadRequestError("blockchain provider unavailable", 503);
      }
      const rawEngineBundle = await securityEngine.analyzeAddressSecurity({
        provider: blockchainProvider,
        address,
        chain,
      });

      // 3. Deterministic adapter: engine findings -> AI EvidenceBundle.
      const adapted = adaptEngineBundle(rawEngineBundle);
      // Defense-in-depth: the adapted bundle must satisfy the AI schema's
      // epistemic invariants before it may reach the explanation engine.
      parseEvidenceBundle(adapted.bundle);

      // 4. Grounded AI explanation. The engine already refuses empty evidence.
      const explanation = await engine.explain({
        bundle: adapted.bundle,
        question,
        audience,
        unknowns: adapted.unknowns,
      });

      // Compact deterministic current-state view for the UI. Derived ONLY
      // from engine records; nothing inferred here, nothing erased by AI.
      const recs =
        (rawEngineBundle as unknown as { evidence?: Array<Record<string, unknown>> }).evidence ?? [];
      const byType = (t: string) => recs.filter((r) => r.findingType === t);
      const nativeRec = byType("NATIVE_BALANCE")[0]?.explanationInputs as
        | { nativeBalanceWei?: string }
        | undefined;
      const delegationRec = byType("EIP7702_DELEGATION")[0]?.evidence as
        | { delegatedTo?: string; delegatedToIsContract?: boolean; delegatedToCodeSizeBytes?: number }
        | undefined;
      const txCountRec = byType("TRANSACTION_COUNT")[0]?.explanationInputs as
        | { transactionCount?: number }
        | undefined;
      const tokens = byType("CURRENT_TOKEN_EXPOSURE").map((r) => {
        const ev = r.evidence as { tokenAddress?: string; tokenBalance?: string; tokenSymbol?: string } | undefined;
        const inputs = r.explanationInputs as { currentBalance?: string } | undefined;
        const balance = inputs?.currentBalance ?? ev?.tokenBalance ?? "0";
        let positive = false;
        try {
          positive = BigInt(balance) > BigInt(0);
        } catch {
          positive = false;
        }
        return {
          token: ev?.tokenAddress ?? null,
          symbol: ev?.tokenSymbol ?? null,
          balance,
          positive,
          knowledgeType: r.knowledgeType ?? null,
        };
      });
      const activeVectors = tokens
        .filter((t) => t.positive)
        .map((t) => ({ type: "TOKEN_BALANCE", token: t.token, symbol: t.symbol, balance: t.balance }));
      let tokenWeiTotal = BigInt(0);
      for (const t of tokens) {
        try {
          tokenWeiTotal += BigInt(t.balance);
        } catch {
          // skip malformed
        }
      }
      const engineUnknowns = recs
        .filter((r) => r.knowledgeType === "UNKNOWN")
        .map((r) => ({
          findingType: r.findingType ?? null,
          detail:
            (r.coverageGaps as string[] | undefined)?.[0] ??
            (r.limitations as string[] | undefined)?.[0] ??
            null,
        }));

      res.json({
        subject: {
          chain: normalizeChain(chain),
          address,
          addressType: rawEngineBundle.addressType ?? null,
        },
        investigation: {
          address,
          chain,
          addressType: rawEngineBundle.addressType ?? null,
          dataMode: rawEngineBundle.dataMode ?? null,
          engine: "deterministic-security-engine",
        },
        history: {
          transactionCount: txCountRec?.transactionCount ?? null,
          contractInteractions: byType("CONTRACT_INTERACTION").length,
          tokenTransfers: byType("TOKEN_TRANSFER").length,
        },
        currentExposure: {
          nativeBalanceWei: nativeRec?.nativeBalanceWei ?? null,
          eip7702: delegationRec ?? null,
          tokens,
        },
        activeVectors,
        blastRadius: {
          tokenWeiTotal: tokenWeiTotal.toString(),
          note: "Raw sum of observed token balances; no USD pricing. Allowance state may be UNKNOWN â€” see coverageGaps/unknowns.",
        },
        findings: adapted.findings,
        evidence: adapted.bundle,
        explanation: serializeExplanation(explanation),
        coverageGaps: adapted.coverageGaps,
        unknowns: adapted.unknowns,
        engineUnknowns,
        dataMode: adapted.dataMode,
      });
    } catch (err) {
      next(err);
    }
  });

  // 404 for unknown routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not found" });
  });

  // Central error handler: never leaks internals or secrets.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof BadRequestError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof EvidenceValidationError) {
      res.status(400).json({ error: `invalid evidence: ${err.message}` });
      return;
    }
    const anyErr = err as { status?: number; type?: string; message?: string };
    if (anyErr?.type === "entity.too.large") {
      res.status(413).json({ error: "request body too large" });
      return;
    }
    if (anyErr?.type === "entity.parse.failed") {
      res.status(400).json({ error: "malformed JSON body" });
      return;
    }
    // Provider errors: sanitized upstream (secrets redacted, message only).
    // Report the exact provider failure (e.g. HTTP 429 quota exhaustion)
    // instead of hiding it behind a generic 500. Structural name check avoids
    // importing vendor SDKs into the API layer while still surfacing exactly
    // the provider's sanitized message.
    const providerMessage =
      anyErr instanceof Error &&
      (anyErr.name === "GeminiProviderError" ||
        anyErr.name === "OpenRouterProviderError" ||
        anyErr.name === "OllamaProviderError")
        ? anyErr.message
        : undefined;
    if (providerMessage) {
      res.status(502).json({ error: providerMessage });
      return;
    }
    // Unknown errors: generic message, no stack, no provider details.
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
