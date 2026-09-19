/**
 * Adapter: deterministic security-engine bundle -> @sentinel/ai EvidenceBundle.
 *
 * The security engine is the SOLE source of blockchain truth. This adapter only
 * re-shapes its output; it never invents, infers, or completes facts.
 *
 * Provenance rules:
 * - `source.tool` is derived from the finding's own kind/findingType (e.g.
 *   "security-engine:approval"). It names the deterministic component, never an
 *   RPC method or Etherscan endpoint, because engine findings do not record the
 *   underlying transport per finding. Transport names would be invented
 *   provenance, so they are not claimed here.
 * - `source.locator` is `dataMode:<MODE>` — the engine's own provenance marker.
 * - `capturedAt` is set when the adapter received the finding. It is NOT the
 *   blockchain event time; event times live inside finding.evidence.timestamp
 *   when the engine captured them and are preserved verbatim.
 * - Finding literals (addresses, hashes, timestamps, allowance strings) are
 *   preserved verbatim inside `finding`, so validateDraft() can ground them.
 *
 * Chain mapping (documented boundary normalization only):
 *   "ethereum" -> "eip155:1"  (CAIP-2). Anything else passes through unchanged.
 */

import type {
  EvidenceBundle,
  EvidenceRecord,
  UnknownField,
} from "@sentinel/ai";

/** Minimal structural type of the deterministic security-engine finding. */
export interface EngineFinding {
  id: string;
  kind?: string;
  findingType: string;
  knowledgeType: "OBSERVED" | "INFERRED" | "UNKNOWN";
  severity?: string;
  entity?: string;
  chain?: string;
  wallet?: string;
  contractAddress?: string;
  token?: string;
  spender?: string;
  allowance?: string;
  owner?: string;
  admin?: string;
  role?: string;
  implementation?: string;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: string;
  relevantContractAddresses?: string[];
  evidence?: Record<string, unknown>;
  sourceReferences?: Record<string, unknown>;
  explanationInputs?: Record<string, unknown>;
  coverageGaps?: string[];
}

/** Minimal structural type of the deterministic security-engine bundle. */
export interface EngineBundle {
  schemaVersion?: string;
  bundleType?: string;
  dataMode?: string;
  chain?: string;
  address?: string;
  addressType?: string;
  subject?: { address?: string; addressType?: string; protocol?: unknown };
  protocol?: { name?: string; chain?: string; contracts?: unknown[] };
  evidence: EngineFinding[];
  coverageGaps?: string[];
}

/** What the adapter hands to the explanation engine and the API response. */
export interface AdaptedEngineBundle {
  bundle: EvidenceBundle;
  /** Explicit absences of knowledge, for ExplanationRequest.unknowns. */
  unknowns: UnknownField[];
  /** The engine's own dataMode (REAL | DEMO | MIXED | UNSPECIFIED), verbatim. */
  dataMode: string;
  /** The engine's original findings, for the deterministic part of the response. */
  findings: EngineFinding[];
  /** Bundle-level coverage gaps, verbatim. */
  coverageGaps: string[];
}

const CHAIN_MAP: Record<string, string> = { ethereum: "eip155:1" };

/** Normalize the chain id at the adapter boundary only. */
export function normalizeChain(chain: string | undefined): string {
  if (!chain) return "eip155:1";
  return CHAIN_MAP[chain.toLowerCase()] ?? chain;
}

/** UTC ISO-8601 for "when the adapter received this observation". */
function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Derive source.tool from the finding's own kind/findingType. No transport is
 * claimed: the engine findings do not record which transport produced them, so
 * the adapter must not invent "rpc" or "etherscan" here.
 */
function deriveTool(finding: EngineFinding): string {
  return `security-engine:${finding.kind ?? finding.findingType}`;
}

function deriveLocator(dataMode: string | undefined): string {
  return `dataMode:${dataMode ?? "UNSPECIFIED"}`;
}

/**
 * Map one engine finding to an AI evidence record. The finding is embedded
 * verbatim; nothing is added, completed, or dropped.
 *
 * Locator rule: INFERRED findings must cite their inference basis for the AI
 * schema's epistemic invariant. The engine's own rule identity is its
 * findingType (with explanationInputs preserved verbatim inside `finding`),
 * so the locator is `rule:<findingType>`. No new inference is created here.
 */
export function adaptFinding(
  finding: EngineFinding,
  dataMode: string | undefined,
  capturedAt: string,
): EvidenceRecord {
  const locator =
    finding.knowledgeType === "INFERRED"
      ? `rule:${finding.findingType}`
      : deriveLocator(dataMode);
  return {
    id: finding.id,
    kind: "engine_finding",
    chain: normalizeChain(finding.chain),
    knowledgeType: finding.knowledgeType,
    source: { tool: deriveTool(finding), locator },
    capturedAt,
    finding: finding as unknown as Record<string, unknown>,
  };
}

/**
 * Collect explicit UnknownFields from bundle-level coverage gaps and
 * per-finding limitations. Provider failures are already UNKNOWN findings in
 * the engine output; they surface here so the AI layer must disclose them.
 */
function collectUnknowns(engineBundle: EngineBundle): UnknownField[] {
  const unknowns: UnknownField[] = [];
  for (const gap of engineBundle.coverageGaps ?? []) {
    unknowns.push({ field: "engine.coverageGap", reason: "source_unreachable", detail: gap });
  }
  for (const finding of engineBundle.evidence) {
    for (const limitation of finding.coverageGaps ?? []) {
      unknowns.push({
        field: `finding.${finding.id}`,
        reason: "source_unreachable",
        detail: limitation,
      });
    }
    if (finding.knowledgeType === "UNKNOWN") {
      unknowns.push({
        field: `finding.${finding.id}.fact`,
        reason: "no_evidence",
        detail: finding.findingType,
      });
    }
  }
  return unknowns;
}

/**
 * Convert a security-engine result into the AI-layer input:
 * the EvidenceBundle, the explicit unknowns, and the deterministic context.
 */
export function adaptEngineBundle(
  engineBundle: EngineBundle,
  opts: { capturedAt?: string } = {},
): AdaptedEngineBundle {
  const capturedAt = opts.capturedAt ?? nowIso();
  const dataMode = engineBundle.dataMode ?? "UNSPECIFIED";

  const records = engineBundle.evidence.map((f) => adaptFinding(f, dataMode, capturedAt));
  const subjectAddress = engineBundle.address ?? engineBundle.subject?.address;

  return {
    bundle: {
      subject: {
        chain: normalizeChain(engineBundle.chain),
        ...(subjectAddress ? { address: subjectAddress } : {}),
      },
      assembledAt: capturedAt,
      records,
      engineVersion: `security-engine:${engineBundle.schemaVersion ?? "unknown"}:${dataMode}`,
    },
    unknowns: collectUnknowns(engineBundle),
    dataMode,
    findings: engineBundle.evidence,
    coverageGaps: engineBundle.coverageGaps ?? [],
  };
}
