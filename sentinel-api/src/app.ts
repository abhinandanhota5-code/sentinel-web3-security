/**
 * Wiring for the Sentinel backend: builds the grounded explanation engine and
 * the (default no-op) PRISM client. The Gemini API key never leaves this
 * process; responses never include it.
 */

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import {
  createSentinelAi,
  GeminiExplanationProvider,
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
 * no blockchain logic of its own — it only invokes this port.
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
  /** Explanation provider override (tests); defaults from GEMINI_API_KEY. */
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

  const provider =
    deps.explanationProvider ??
    (config.geminiApiKey
      ? new GeminiExplanationProvider({
          timeoutMs: config.timeoutMs,
          maxRetries: config.maxRetries,
          ...(config.model ? { model: config.model } : {}),
        })
      : new MockExplanationProvider());

  const { engine, prism } = createSentinelAi({ provider, prismClient: new NullPrismClient() });

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: config.bodyLimit }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      provider: config.geminiApiKey ? "gemini" : "mock",
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

      // Deterministic evaluation of the draft against the bundle — same
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

      res.json({
        subject: {
          chain: normalizeChain(chain),
          address,
          addressType: rawEngineBundle.addressType ?? null,
        },
        findings: adapted.findings,
        evidence: adapted.bundle,
        explanation: serializeExplanation(explanation),
        coverageGaps: adapted.coverageGaps,
        unknowns: adapted.unknowns,
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
    // Unknown errors: generic message, no stack, no provider details.
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
