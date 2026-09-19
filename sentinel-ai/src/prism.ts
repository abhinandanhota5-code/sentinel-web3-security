/**
 * PRISM by BlockConvey — AI observability/evaluation integration.
 *
 * PRISM is the observability and evaluation layer for the AI explanation
 * system, NOT the blockchain detection engine. This module defines a clean
 * adapter interface so the verified BlockConvey PRISM API/SDK can be plugged
 * in later without touching explanation code.
 *
 * No invented endpoints, no fake live integration: the default client is a
 * no-op, and any real client must implement the adapter interface itself.
 */

import type { EvidenceBundle } from "./evidence.js";
import type { ValidationResult } from "./validate.js";
import type { Explanation } from "./engine.js";

/**
 * Evaluation signals for one explanation. Each field is optional so that
 * partial evaluation is always possible; consumers decide which signals to
 * require.
 */
export interface EvaluationSignal {
  /** Fraction of on-chain claims carrying a valid [E<n>] citation. */
  citationCoverage?: number;
  /** Draft cited records that do not exist (before stripping). */
  invalidCitations?: string[];
  /** Correct tx/contract literals: supported literals / referenced literals. */
  literalGroundingRate?: number;
  /** Literals with no evidence origin. */
  unsupportedClaims?: number;
  /** Draft kept OBSERVED and INFERRED vocabulary distinct. */
  knowledgeSeparationOk?: boolean;
  /** Roles/permissions mentioned in the draft appear in evidence. */
  permissionGroundingOk?: boolean;
  /** The draft discloses unknowns instead of guessing. */
  uncertaintyHandlingOk?: boolean;
  /** Requested topics vs topics actually covered (0..1). */
  explanationCompleteness?: number;
}

/** Dimensions evaluated for a single explanation request/response pair. */
export interface PrismEvaluation {
  /** Correlates with the request; generate with crypto.randomUUID() at call sites. */
  requestId: string;
  createdAt: string;
  signals: EvaluationSignal;
  /** Overall verdict for quick filtering. */
  verdict: "pass" | "warn" | "fail";
}

/** Envelope for spans sent to PRISM. */
export interface PrismSpan {
  name: string;
  requestId: string;
  startedAt: string;
  endedAt: string;
  attributes: Record<string, string | number | boolean>;
}

/** Metrics batch for PRISM aggregation. */
export interface PrismMetric {
  name: string;
  value: number;
  requestId?: string;
  labels?: Record<string, string>;
}

/**
 * The adapter every PRISM backend must implement. Kept deliberately narrow:
 * record an evaluation, a span, and a metric batch. No invented endpoints, no
 * vendor SDK dependency here.
 */
export interface PrismClient {
  readonly name: string;
  submitEvaluation(evaluation: PrismEvaluation): Promise<void>;
  submitSpan(span: PrismSpan): Promise<void>;
  submitMetrics(metrics: PrismMetric[]): Promise<void>;
}

/** No-op client: default when PRISM is not configured. Never throws. */
export class NullPrismClient implements PrismClient {
  readonly name = "null-prism";
  async submitEvaluation(_evaluation: PrismEvaluation): Promise<void> {}
  async submitSpan(_span: PrismSpan): Promise<void> {}
  async submitMetrics(_metrics: PrismMetric[]): Promise<void> {}
}

/** Configuration for the optional HTTP adapter. */
export interface HttpPrismConfig {
  /** Base URL of the verified BlockConvey PRISM deployment. */
  baseUrl: string;
  /** Credential material; injected by the deployer, never logged. */
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Minimal, explicit HTTP adapter skeleton. Intentionally generic: it POSTs
 * JSON to `<baseUrl>/v1/evaluations|spans|metrics`. Adjust paths/headers to
 * the verified BlockConvey PRISM API contract when connecting the real
 * service; nothing else in this package assumes these paths exist.
 */
export class HttpPrismClient implements PrismClient {
  readonly name = "http-prism";
  private readonly config: HttpPrismConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: HttpPrismConfig) {
    this.config = config;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 5_000;
  }

  private async post(path: string, body: unknown): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`PRISM request failed: ${res.status} ${res.statusText}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  submitEvaluation(evaluation: PrismEvaluation): Promise<void> {
    return this.post("/v1/evaluations", evaluation);
  }

  submitSpan(span: PrismSpan): Promise<void> {
    return this.post("/v1/spans", span);
  }

  submitMetrics(metrics: PrismMetric[]): Promise<void> {
    return this.post("/v1/metrics", metrics);
  }
}

/** Compute the aggregate verdict from individual signals. */
export function verdictFor(signals: EvaluationSignal): PrismEvaluation["verdict"] {
  const hardFails =
    (signals.unsupportedClaims !== undefined && signals.unsupportedClaims > 0) ||
    signals.knowledgeSeparationOk === false ||
    signals.uncertaintyHandlingOk === false;
  if (hardFails) return "fail";

  const warns =
    (signals.invalidCitations !== undefined && signals.invalidCitations.length > 0) ||
    (signals.citationCoverage !== undefined && signals.citationCoverage < 0.8) ||
    (signals.literalGroundingRate !== undefined && signals.literalGroundingRate < 0.9) ||
    (signals.explanationCompleteness !== undefined && signals.explanationCompleteness < 0.5);
  return warns ? "warn" : "pass";
}

/** Result of evaluating one explanation. */
export interface EvaluationInput {
  requestId: string;
  bundle: EvidenceBundle;
  requestQuestion: string;
  draft: string;
  validation: ValidationResult;
  /** Topics the caller expected the explanation to cover. */
  expectedTopics?: string[];
  /** Topics the draft actually covered (caller-provided or heuristic). */
  coveredTopics?: string[];
  /** Unknowns surfaced in the prompt; the draft should reference them. */
  unknowns?: readonly { field: string }[];
  /** Draft text should mark inferences; detect the "Inferred:" marker. */
  hasInferredEvidence?: boolean;
}

/**
 * Evaluate an explanation against the evidence bundle. Pure function; no I/O,
 * no PRISM call. Call {@link PrismClient.submitEvaluation} with the result.
 */
export function evaluateExplanation(input: EvaluationInput): PrismEvaluation {
  const { bundle, draft, validation } = input;

  // 1. Citation coverage over claims that contain on-chain literals.
  const claims = draft.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const claimsWithLiterals = claims.filter((s) =>
    /0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]{40}|\b\d{16,}\b/.test(s),
  );
  const citedClaims = claimsWithLiterals.filter((s) => /\[E\d+\]/.test(s));
  const citationCoverage =
    claimsWithLiterals.length === 0
      ? 1
      : citedClaims.length / claimsWithLiterals.length;

  // 2. Literal grounding: which referenced literals are evidence-backed.
  const referenced = [
    ...draft.matchAll(/0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]{40}|\b\d{16,}\b/g),
  ].map((m) => m[0]);
  const supported = referenced.filter((lit) => validation.unsupportedClaims.every((c) => c.literal !== lit));
  const literalGroundingRate =
    referenced.length === 0 ? 1 : supported.length / referenced.length;

  // 3. Knowledge separation: INFERRED evidence must be marked in the draft.
  const hasInferred = input.hasInferredEvidence ?? bundle.records.some((r) => r.knowledgeType === "INFERRED");
  const knowledgeSeparationOk = !hasInferred || /Inferred:/i.test(draft);

  // 4. Uncertainty handling: explicit unknowns must be acknowledged.
  const unknownFields = (input.unknowns ?? []).map((u) => u.field);
  const uncertaintyHandlingOk =
    unknownFields.length === 0 ||
    unknownFields.every((f) => draft.toLowerCase().includes(f.toLowerCase()) || /unknown/i.test(draft));

  // 5. Permission grounding: role mentions should map to role evidence.
  const roleEvidence = bundle.records.filter((r) => r.kind === "role");
  let permissionGroundingOk: boolean | undefined;
  if (roleEvidence.length > 0) {
    const roleNames = roleEvidence
      .map((r) => ("roleName" in r ? r.roleName : undefined))
      .filter((n): n is string => typeof n === "string");
    permissionGroundingOk =
      roleNames.length === 0 || roleNames.every((n) => draft.includes(n));
  }

  // 6. Completeness: covered topics vs expected topics.
  let explanationCompleteness: number | undefined;
  if (input.expectedTopics && input.expectedTopics.length > 0) {
    const covered = input.expectedTopics.filter(
      (t) => input.coveredTopics?.includes(t) ?? draft.toLowerCase().includes(t.toLowerCase()),
    );
    explanationCompleteness = covered.length / input.expectedTopics.length;
  }

  const signals: EvaluationSignal = {
    citationCoverage,
    invalidCitations: validation.strippedCitations,
    literalGroundingRate,
    unsupportedClaims: validation.unsupportedClaims.length,
    knowledgeSeparationOk,
    uncertaintyHandlingOk,
    ...(permissionGroundingOk !== undefined ? { permissionGroundingOk } : {}),
    ...(explanationCompleteness !== undefined ? { explanationCompleteness } : {}),
  };

  return {
    requestId: input.requestId,
    createdAt: new Date().toISOString(),
    signals,
    verdict: verdictFor(signals),
  };
}
