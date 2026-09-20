/**
 * Epistemic discipline for the AI layer.
 *
 * Every on-chain fact is either OBSERVED (directly read from the chain by the
 * deterministic engine), INFERRED (derived from OBSERVED facts by a stated
 * rule), or UNKNOWN (the engine could not establish it). The AI must not
 * collapse these categories.
 */

/** How a fact is known. */
export type KnowledgeType = "OBSERVED" | "EXTERNAL" | "INFERRED" | "UNKNOWN";

/**
 * An explicitly represented absence of knowledge.
 * UNKNOWN fields must be rendered to the user as such — never guessed.
 */
export interface UnknownField {
  field: string;
  /** Why the engine could not establish this fact. */
  reason:
    | "no_evidence"
    | "source_unreachable"
    | "out_of_scope"
    | "contradicted"
    | "deprecated";
  /** Optional human-readable detail, e.g. the RPC error. */
  detail?: string;
}

export const UNKNOWN_FIELD_KINDS: readonly UnknownField["reason"][] = [
  "no_evidence",
  "source_unreachable",
  "out_of_scope",
  "contradicted",
  "deprecated",
] as const;

/** A topic the explanation could not cover because evidence was missing. */
export interface CoverageGap {
  topic: string;
  unknowns: UnknownField[];
}

/** Map evidence (by id) to its epistemic label for quick lookup. */
export function knowledgeTypeByEvidenceId(
  records: readonly { id: string; knowledgeType: KnowledgeType }[],
): ReadonlyMap<string, KnowledgeType> {
  return new Map(records.map((r) => [r.id, r.knowledgeType]));
}
