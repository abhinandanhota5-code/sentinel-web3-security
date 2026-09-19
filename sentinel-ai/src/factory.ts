/**
 * Factory + wiring helpers for the AI/PRISM layer.
 *
 * The frontend never touches this package directly; a backend route or worker
 * composes the engine and PRISM client here and exposes the result.
 */

import { GroundedExplanationEngine, type ExplanationEngine, type ExplanationProvider } from "./engine.js";
import { NullPrismClient, type PrismClient } from "./prism.js";

/** All knobs for the AI layer in one place. */
export interface SentinelAiConfig {
  /** Vendor-agnostic LLM provider implementation. */
  provider: ExplanationProvider;
  /** PRISM adapter; defaults to no-op when PRISM is not configured. */
  prismClient?: PrismClient;
  /** Fail closed on unsupported claims (default true). */
  strict?: boolean;
}

export interface SentinelAi {
  engine: ExplanationEngine;
  prism: PrismClient;
}

/** Compose the AI layer from config. Pure wiring, no side effects. */
export function createSentinelAi(config: SentinelAiConfig): SentinelAi {
  return {
    engine: new GroundedExplanationEngine(config.provider, { strict: config.strict ?? true }),
    prism: config.prismClient ?? new NullPrismClient(),
  };
}
