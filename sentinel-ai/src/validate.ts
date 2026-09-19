/**
 * Hallucination safeguards.
 *
 * Validates a model draft against the evidence bundle BEFORE anything reaches
 * the user. Two layers:
 *
 * 1. Structural check — every on-chain claim carries a citation to a real
 *    evidence record; citation ids that don't exist are stripped.
 * 2. Grounding check — literals (addresses, hashes, roles, big amounts,
 *    timestamps) appearing in the draft must originate from the bundle or the
 *    subject. Unmatched literals are classified as unsupported claims.
 *
 * The validator never rewrites on-chain facts; it only removes or flags.
 */

import type { EvidenceBundle } from "./evidence.js";
import type { KnowledgeType } from "./knowledge.js";

/** A claim the draft made that no evidence record supports. */
export interface UnsupportedClaim {
  /** The literal that could not be grounded. */
  literal: string;
  /** Structural category of the literal. */
  type: "address" | "hash32" | "timestamp" | "large_number";
  /** Position in the draft (character offset). */
  index: number;
}

export interface ValidationResult {
  /** Citations removed because they referenced non-existent evidence. */
  strippedCitations: string[];
  /** Literals with no origin in the evidence bundle. */
  unsupportedClaims: UnsupportedClaim[];
  /** True when the draft can be shown to the user without edits. */
  clean: boolean;
}

const HEX_40 = /0x[0-9a-fA-F]{40}/g;
const HEX_64 = /0x[0-9a-fA-F]{64}/g;
const ISO_TS = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g;
const BIG_NUMBER = /\b\d{16,}\b/g;
const CITATION = /\[E(\d+)\]/g;

/** Extract the set of literal strings that the bundle can vouch for. */
export function groundedLiterals(bundle: EvidenceBundle): Set<string> {
  const literals = new Set<string>();

  const add = (v: unknown): void => {
    if (typeof v === "string" && v.length > 0) literals.add(v);
    if (typeof v === "number") literals.add(String(v));
  };

  const walk = (v: unknown): void => {
    if (v === null || v === undefined) return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (typeof v === "object") {
      for (const value of Object.values(v as Record<string, unknown>)) walk(value);
      return;
    }
    add(v);
  };

  walk(bundle.subject);
  for (const record of bundle.records) walk(record);
  return literals;
}

/**
 * Validate a draft explanation. `citationKnowledge` maps citation index to the
 * knowledge type of the cited record, enabling INFERRED-label enforcement.
 */
export function validateDraft(
  draft: string,
  bundle: EvidenceBundle,
  citationKnowledge: ReadonlyMap<number, KnowledgeType>,
): ValidationResult {
  const allowed = groundedLiterals(bundle);
  const unsupportedClaims: UnsupportedClaim[] = [];

  // Spans already claimed by a longer literal (e.g. a 64-char hash contains a
  // 40-char address-shaped prefix) must not be re-scanned by shorter patterns.
  const claimed: Array<[number, number]> = [];
  const insideClaimed = (i: number): boolean =>
    claimed.some(([start, end]) => i >= start && i < end);

  const scan = (re: RegExp, type: UnsupportedClaim["type"], recordSpan = false): void => {
    for (const m of draft.matchAll(re)) {
      const literal = m[0];
      const at = m.index ?? 0;
      if (insideClaimed(at)) continue;
      if (recordSpan) claimed.push([at, at + literal.length]);
      if (!allowed.has(literal)) {
        unsupportedClaims.push({ literal, type, index: at });
      }
    }
  };

  // Order matters: longest literals first; hash spans are recorded so the
  // 40-char address pattern skips their address-shaped prefixes.
  scan(HEX_64, "hash32", true);
  scan(HEX_40, "address");
  scan(ISO_TS, "timestamp");
  scan(BIG_NUMBER, "large_number");

  // Dedupe by literal keeping first occurrence.
  const seen = new Set<string>();
  const deduped = unsupportedClaims.filter((c) => {
    if (seen.has(c.literal)) return false;
    seen.add(c.literal);
    return true;
  });

  // Citations must point at records that exist.
  const strippedCitations: string[] = [];
  for (const m of draft.matchAll(CITATION)) {
    const idx = Number(m[1]);
    if (!citationKnowledge.has(idx)) strippedCitations.push(m[0]);
  }

  return {
    strippedCitations,
    unsupportedClaims: deduped,
    clean: strippedCitations.length === 0 && deduped.length === 0,
  };
}

/**
 * Produce a user-safe draft: drop invalid citations and hard-fail on
 * unsupported literals rather than silently shipping them. When the draft is
 * not salvageable, returns a safe fallback that discloses the failure.
 */
export function sanitizeDraft(
  draft: string,
  result: ValidationResult,
  opts: { strict?: boolean } = {},
): { text: string; blocked: boolean } {
  let text = draft;
  for (const citation of result.strippedCitations) {
    text = text.split(citation).join("");
  }

  if (result.unsupportedClaims.length > 0) {
    if (opts.strict !== false) {
      // Never surface invented facts: replace the whole draft.
      return {
        text:
          "This explanation was withheld: the draft contained claims not grounded in engine evidence. " +
          "Re-run the explanation with a completed evidence bundle.",
        blocked: true,
      };
    }
    // Non-strict mode still removes the unsupported literals themselves.
    for (const claim of result.unsupportedClaims) {
      text = text.split(claim.literal).join("[unsupported]");
    }
  }

  return { text, blocked: result.unsupportedClaims.length > 0 };
}
