# @sentinel/ai — Explanation Layer & PRISM Adapter

Evidence-grounded AI explanation layer for **Sentinel** (Web3 Security &
Protocol Health), plus a clean adapter for **PRISM by BlockConvey**
(AI observability/evaluation).

```
Blockchain → Deterministic Security Analysis → Evidence
           → AI Explanation (this package) → PRISM → User
```

## Invariants

1. **The deterministic engine is the source of truth.** This package never
   produces blockchain facts; it only narrates `EvidenceBundle` records it
   receives, validates, and cites.
2. **OBSERVED / INFERRED / UNKNOWN discipline.** Every evidence record carries
   a `knowledgeType`. Absence of evidence is represented explicitly as
   `UnknownField`/`CoverageGap` — never guessed.
3. **Hallucination safeguards.** Drafts are validated before display: invented
   addresses, hashes, timestamps, or big numbers fail validation; in strict
   mode the draft is withheld rather than shown with unsupported claims.
4. **PRISM is observability, not detection.** This package ships a
   `PrismClient` interface, a no-op default, and a generic HTTP adapter
   skeleton. No endpoints are invented; wire the verified BlockConvey PRISM
   API/SDK into `HttpPrismClient`/your own adapter at deploy time.
5. **Frontend isolation.** Nothing here imports frontend code and nothing here
   should be imported by it; a backend route composes `createSentinelAi()` and
   exposes results.

## Layout

```
src/knowledge.ts   OBSERVED/INFERRED/UNKNOWN types, UnknownField, CoverageGap
src/evidence.ts    Evidence schema + strict parser (the engine↔AI contract)
src/prompt.ts      Static grounding system prompt + deterministic prompt builder
src/validate.ts    Citation + literal grounding validator, draft sanitizer
src/engine.ts      ExplanationEngine abstraction + GroundedExplanationEngine
src/prism.ts       PrismClient interface, Null/HTTP clients, evaluation signals
src/factory.ts     createSentinelAi() wiring
tests/             node:test suite (schema, prompts, safeguards, engine, PRISM)
```

## Usage

```ts
import { createSentinelAi, NullPrismClient } from "@sentinel/ai";

const ai = createSentinelAi({
  provider: myLlmAdapter,          // implements ExplanationProvider
  prismClient: new NullPrismClient(), // swap for a verified PRISM adapter later
});

const explanation = await ai.engine.explain({
  bundle,        // EvidenceBundle produced by the deterministic engine
  question: "Why is this approval risky?",
  audience: "retail",
  unknowns: [{ field: "token.symbol", reason: "no_evidence" }],
});
```

### Gemini provider (server-side only)

`GeminiExplanationProvider` implements `ExplanationProvider` on the official
`@google/genai` SDK. It reads the API key **only** from `GEMINI_API_KEY`
(never hardcoded, never logged, errors are redacted before surfacing), maps
`PromptPair.system` -> Gemini `systemInstruction` and `PromptPair.user` ->
`contents`, enforces a per-attempt timeout (default 30s), honors external
`AbortSignal`s, retries transient 429/500/503 capacity errors with jittered
exponential backoff (default 3 retries), and fails fast on daily-quota
exhaustion. It returns only the generated text. All output still passes
through the engine's `validateDraft()`/`sanitizeDraft()` safeguards.

```ts
import { GeminiExplanationProvider, MockExplanationProvider } from "@sentinel/ai";

// Production (backend only):
const provider = new GeminiExplanationProvider();            // uses GEMINI_API_KEY
const provider2 = new GeminiExplanationProvider({ model: "gemini-flash-latest", timeoutMs: 30_000 });

// Tests / local dev (no network, no key required):
const mock = new MockExplanationProvider(() => "Grounded explanation [E0].");
```

Required environment variable: `GEMINI_API_KEY` (see `.env.example`).

Live smoke check (uses one or two real API calls, requires the key):

```bash
cd sentinel-ai && npm run build
node --env-file=../.env --experimental-strip-types --no-warnings scripts/verify-gemini.ts
# optional: GEMINI_MODEL=gemini-2.5-flash node --env-file=../.env ... scripts/verify-gemini.ts
```

## Evaluation signals (for PRISM)

`evaluateExplanation()` computes: citation coverage, invalid citations,
literal grounding rate, unsupported-claim count, OBSERVED/INFERRED separation,
permission grounding, uncertainty handling, and explanation completeness —
then assigns a `pass | warn | fail` verdict.

## Checks

```bash
cd sentinel-ai
npm install
npm run check   # typecheck (src + tests) + node:test run
```
