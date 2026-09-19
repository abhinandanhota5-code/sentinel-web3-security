/**
 * Local verification script (not part of the test suite, not committed CI).
 * Exercises the full grounded pipeline with the real Gemini provider.
 *
 * Usage: node --env-file=../.env --experimental-strip-types scripts/verify-gemini.ts
 * (runs against the compiled dist/ output; run `npm run build` first)
 */

import { GeminiExplanationProvider } from "../dist/providers/gemini.js";
import { GroundedExplanationEngine } from "../dist/engine.js";
import { parseEvidenceBundle, type EvidenceBundle } from "../dist/evidence.js";
import { SYSTEM_PROMPT, buildGroundedUserPrompt } from "../dist/prompt.js";

const ADDR_A = "0x1111111111111111111111111111111111111111";
const ADDR_B = "0x2222222222222222222222222222222222222222";
const ADDR_C = "0x3333333333333333333333333333333333333333";
const TX = `0x${"ab".repeat(32)}`;

const bundle: EvidenceBundle = parseEvidenceBundle({
  subject: { chain: "eip155:1", address: ADDR_A },
  assembledAt: "2026-09-19T10:00:01Z",
  engineVersion: "engine-1.0.0",
  records: [
    {
      id: "ev-approve-1",
      kind: "approval",
      chain: "eip155:1",
      source: { tool: "rpc-eth-call", version: "1.0.0", locator: "alchemy-mainnet" },
      capturedAt: "2026-09-19T10:00:00Z",
      knowledgeType: "OBSERVED",
      token: ADDR_B,
      owner: ADDR_A,
      spender: ADDR_C,
      amount: "999999999999999999000",
      unlimited: false,
      txHash: TX,
    },
  ],
});

const provider = new GeminiExplanationProvider({
  timeoutMs: 45_000,
  // Optional override, e.g. GEMINI_MODEL=gemini-2.5-flash
  ...(process.env.GEMINI_MODEL ? { model: process.env.GEMINI_MODEL } : {}),
});
const engine = new GroundedExplanationEngine(provider);

// Direct provider probe: surface the provider-level error, if any.
try {
  const direct = await provider.generate(
    { system: "Answer with a single word.", user: "Say OK." },
    {},
  );
  console.log("=== direct provider probe OK:", direct.slice(0, 60), "===");
} catch (err) {
  console.log("=== direct provider probe FAILED:", err instanceof Error ? err.message : err, "===");
}

// Full-sized request probe: same prompt pair the engine would send.
try {
  const full = await provider.generate(
    {
      system: SYSTEM_PROMPT,
      user: buildGroundedUserPrompt({
        bundle,
        question: "Explain this ERC-20 approval and whether it looks risky.",
        audience: "retail",
        unknowns: [{ field: "token.symbol", reason: "no_evidence" }],
      }),
    },
    {},
  );
  console.log("=== full prompt probe OK (first 200 chars): ===");
  console.log(full.slice(0, 200));
} catch (err) {
  console.log("=== full prompt probe FAILED:", err instanceof Error ? err.message : err, "===");
}

const explanation = await engine.explain({
  bundle,
  question: "Explain this ERC-20 approval and whether it looks risky.",
  audience: "retail",
  unknowns: [{ field: "token.symbol", reason: "no_evidence" }],
});

console.log("=== provider:", provider.name, "===");
console.log("=== blocked:", explanation.blocked, "| refused:", explanation.refused ?? "none", "===");
console.log("=== validation clean:", explanation.validation.clean, "===");
console.log("=== explanation ===");
console.log(explanation.text);
