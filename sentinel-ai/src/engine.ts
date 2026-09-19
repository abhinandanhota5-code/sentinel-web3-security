/**
 * ExplanationEngine abstraction.
 *
 * Separates:
 *  - the deterministic evidence index (no ML anywhere near it),
 *  - the pluggable LLM provider,
 *  - the grounded generation pipeline (build prompt -> generate -> validate -> sanitize).
 *
 * Concrete providers (OpenAI, Anthropic, local models) plug in via
 * {@link ExplanationProvider}; nothing in this layer depends on a vendor SDK.
 */

import type { EvidenceBundle, EvidenceId } from "./evidence.js";
import type { KnowledgeType, UnknownField } from "./knowledge.js";
import { knowledgeTypeByEvidenceId } from "./knowledge.js";
import {
  SYSTEM_PROMPT,
  buildGroundedUserPrompt,
  type Audience,
  type ExplanationRequest,
} from "./prompt.js";
import { validateDraft, sanitizeDraft, type ValidationResult } from "./validate.js";

export type { Audience, ExplanationRequest } from "./prompt.js";
export type { ValidationResult } from "./validate.js";

/** Fully formed prompt pair handed to a provider. */
export interface PromptPair {
  system: string;
  user: string;
}

/** Minimal vendor-agnostic chat interface for an LLM. */
export interface ExplanationProvider {
  readonly name: string;
  generate(prompt: PromptPair, opts?: { signal?: AbortSignal }): Promise<string>;
}

/**
 * Deterministic, testable core shared by any engine implementation.
 * Holds the evidence index and citation/knowledge lookup.
 */
export class EvidenceIndex {
  private readonly byIndex = new Map<number, EvidenceId>();
  private readonly knowledge = new Map<number, KnowledgeType>();

  constructor(bundle: EvidenceBundle) {
    bundle.records.forEach((record, i) => {
      this.byIndex.set(i, record.id);
      this.knowledge.set(i, record.knowledgeType);
    });
  }

  get size(): number {
    return this.byIndex.size;
  }

  /** Citation id -> stable engine evidence id. */
  evidenceId(citationIndex: number): EvidenceId | undefined {
    return this.byIndex.get(citationIndex);
  }

  /** Citation id -> epistemic label, for INFERRED enforcement. */
  knowledgeOf(citationIndex: number): KnowledgeType | undefined {
    return this.knowledge.get(citationIndex);
  }

  /** All citations as a read-only map for {@link Explanation}. */
  get citations(): ReadonlyMap<number, EvidenceId> {
    return this.byIndex;
  }

  /** Convenience wrapper used by tests and tooling. */
  knowledgeMap(): ReadonlyMap<number, KnowledgeType> {
    return this.knowledge;
  }
}

/** Result returned to callers (e.g. an API route). Kept frontend-agnostic. */
export interface Explanation {
  text: string;
  /** Citation id -> stable evidence id used in the final text. */
  citations: ReadonlyMap<number, EvidenceId>;
  /** Epistemic label per citation id. */
  knowledgeByCitation: ReadonlyMap<number, KnowledgeType>;
  validation: ValidationResult;
  /** True when sanitizeDraft replaced the draft with the withheld notice. */
  blocked: boolean;
  /** Set when generation was refused or produced nothing usable. */
  refused?: "no_evidence" | "provider_error";
  /**
   * Exact provider failure detail when `refused === "provider_error"`.
   * Already sanitized by the provider (secrets redacted, no stacks); surfaced
   * verbatim so callers can report the real cause (e.g. HTTP 429 quota)
   * instead of a generic refusal. Never present for fabricated text.
   */
  providerError?: string;
}

/**
 * The abstraction every explanation engine implements. The grounded default is
 * {@link GroundedExplanationEngine}; test doubles implement this too.
 */
export interface ExplanationEngine {
  explain(request: ExplanationRequest): Promise<Explanation>;
}

export class GroundedExplanationEngine implements ExplanationEngine {
  private readonly provider: ExplanationProvider;
  private readonly strict: boolean;

  constructor(provider: ExplanationProvider, opts: { strict?: boolean } = {}) {
    this.provider = provider;
    this.strict = opts.strict !== false;
  }

  async explain(request: ExplanationRequest): Promise<Explanation> {
    const index = new EvidenceIndex(request.bundle);

    // No evidence at all: refuse rather than let a model narrate from priors.
    if (request.bundle.records.length === 0) {
      return {
        text: "No engine evidence is available for this subject. All on-chain details are unknown.",
        citations: new Map(),
        knowledgeByCitation: new Map(),
        validation: { strippedCitations: [], unsupportedClaims: [], clean: true },
        blocked: false,
        refused: "no_evidence",
      };
    }

    const prompt: PromptPair = {
      system: SYSTEM_PROMPT,
      user: buildGroundedUserPrompt(request),
    };

    let draft: string;
    try {
      draft = await this.provider.generate(prompt, {});
    } catch (err) {
      // The provider already sanitized its errors (GeminiProviderError goes
      // through redactSecrets; no stacks, no config). Surface the exact cause
      // to the caller while the narrative itself stays a fixed refusal text —
      // the evidence is never fabricated to compensate for a failed model.
      const providerError =
        err instanceof Error ? err.message : err !== undefined ? String(err) : undefined;
      return {
        text: "Explanation is temporarily unavailable. The underlying evidence remains valid.",
        citations: new Map(),
        knowledgeByCitation: new Map(),
        validation: { strippedCitations: [], unsupportedClaims: [], clean: true },
        blocked: false,
        refused: "provider_error",
        providerError: providerError
          ? providerError.slice(0, 500)
          : "provider generate() failed without an error message",
      };
    }

    const validation = validateDraft(draft, request.bundle, index.knowledgeMap());
    const { text, blocked } = sanitizeDraft(draft, validation, { strict: this.strict });

    return {
      text,
      citations: index.citations,
      knowledgeByCitation: index.knowledgeMap(),
      validation,
      blocked,
    };
  }
}
