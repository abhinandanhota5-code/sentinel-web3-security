# @sentinel/api — Sentinel Backend API

Minimal Express backend that serves the evidence-grounded AI explanation layer
(`@sentinel/ai`) over HTTP. The Gemini API key lives **only in this process**;
the frontend never sees it and responses never include it.

```
Frontend ──HTTP──> sentinel-api ──> @sentinel/ai (grounded engine)
                                       │  deterministic evidence validation
                                       │  validateDraft() + sanitizeDraft()
                                       └─> Gemini (server-side, GEMINI_API_KEY)
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness + active provider (`gemini` or `mock`) + PRISM client name |
| POST | `/api/v1/explain` | Grounded explanation for an `EvidenceBundle` + question |
| POST | `/api/v1/evaluate` | Deterministic PRISM evaluation signals for a draft vs a bundle |
| POST | `/api/v1/analyze` | Address -> deterministic engine -> adapter -> grounded explanation |

### POST /api/v1/analyze

Full pipeline in one call — the frontend only supplies an address:

```jsonc
{ "address": "0x…", "chain": "ethereum", "question": "optional", "audience": "retail" }
```

The route invokes the deterministic security engine (`analyzeAddressSecurity`
with the existing `createEthereumProvider()` — Etherscan + RPC), adapts its
findings via `src/engine-adapter.ts`, runs the grounded explanation, and
returns:

```jsonc
{
  "subject": { "chain": "eip155:1", "address": "0x…", "addressType": "EOA" },
  "findings": [ /* engine findings verbatim, ids/types/severities/knowledgeType */ ],
  "evidence": { /* the adapted @sentinel/ai EvidenceBundle */ },
  "explanation": { "text", "blocked", "refused", "citations", "…" },
  "coverageGaps": [ /* engine coverage gaps verbatim */ ],
  "unknowns": [ { "field", "reason", "detail" } ],
  "dataMode": "REAL"   // REAL | DEMO | MIXED | UNSPECIFIED
}
```

Adapter guarantees (see `src/engine-adapter.ts`):

- The engine is the sole source of truth; findings are embedded **verbatim**
  (`kind: "engine_finding"`) — no value is completed, converted, or dropped.
- Provider failures stay UNKNOWN: coverage gaps/limitations become
  `UnknownField`s (`source_unreachable` / `no_evidence`), never findings.
- `ethereum` -> `eip155:1` (CAIP-2) is normalized at this boundary only.
- `source.tool` = `security-engine:<kind>`; `source.locator` = `dataMode:<MODE>`
  (INFERRED findings cite `rule:<findingType>`). `capturedAt` is when the
  adapter received the observation, NOT the blockchain event time.

### POST /api/v1/explain

```jsonc
{
  "bundle": { /* EvidenceBundle from the deterministic engine */ },
  "question": "Why is this approval risky?",
  "audience": "retail",            // retail | analyst | developer (optional)
  "unknowns": [                    // optional explicit evidence gaps
    { "field": "token.symbol", "reason": "no_evidence" }
  ]
}
```

Response: `{ text, blocked, refused, citations, knowledgeByCitation, validation }`.
`refused` is `"no_evidence"` (empty bundle) or `"provider_error"` (LLM
unavailable/quota) — the evidence itself is never fabricated to compensate.

### POST /api/v1/evaluate

Same body plus `draft` (the explanation text to score). Returns PRISM signals
(citation coverage, literal grounding, unsupported claims, knowledge
separation, uncertainty handling) and a `pass | warn | fail` verdict.

## Running

```bash
cd sentinel-api
npm install
npm run build
npm start          # loads ../.env via --env-file; PORT defaults to 8787
```

Without `GEMINI_API_KEY` the server automatically runs on the mock provider
(no network, deterministic output) — useful for local development.

The deterministic engine (`../src/security-engine`) is loaded from disk at
startup; if it is missing, `/analyze` returns `503` while `/healthz`,
`/explain`, and `/evaluate` still serve.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(unset → mock provider)* | Gemini key; server-side only |
| `PORT` | `8787` | Listen port |
| `GEMINI_MODEL` | `gemini-flash-latest` | Model id |
| `GEMINI_TIMEOUT_MS` | `30000` | Per-attempt request timeout |
| `GEMINI_MAX_RETRIES` | `3` | Transient-error retries |
| `MAX_EVIDENCE_RECORDS` | `200` | Per-request bundle cap (413 beyond) |
| `BODY_LIMIT` | `1mb` | JSON body limit |

## Security posture

- API key read only from the environment; never hardcoded, never logged,
  never echoed in responses or error bodies.
- All evidence is strictly validated before it reaches the engine; malformed
  bundles get `400`, oversized ones `413`.
- Unknown errors return a generic `500` — no stacks, no provider internals.
- No blockchain logic here: this service only orchestrates `@sentinel/ai` and
  the deterministic engine; it never talks to Etherscan/RPC itself.
- `/analyze` re-validates every adapted bundle with `parseEvidenceBundle()`
  before it may reach the explanation engine (schema + epistemic invariants).

## Checks

```bash
cd sentinel-api
npm run check   # build + typecheck (src & tests) + HTTP test suite
```
