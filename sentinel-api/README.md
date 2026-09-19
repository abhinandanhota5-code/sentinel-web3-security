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
- No blockchain logic here: this service only orchestrates `@sentinel/ai`.

## Checks

```bash
cd sentinel-api
npm run check   # build + typecheck (src & tests) + HTTP test suite
```
