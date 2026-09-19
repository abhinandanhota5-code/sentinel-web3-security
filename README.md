# SENTINEL — Pitch Deck

**From alert to evidence.** An evidence-first investigation layer for Web3 security,
explored as a *complement* to detection systems (Forta) and protection systems (Hypernative).

> **Sentinel AI layer:** the evidence-grounded AI explanation layer + PRISM
> (BlockConvey) observability adapter lives in [`sentinel-ai/`](./sentinel-ai) —
> TypeScript, fully tested, isolated from the frontend. See its README for the
> OBSERVED/INFERRED/UNKNOWN contract and hallucination safeguards.
>
> **Sentinel API:** the backend that serves it (explain/evaluate endpoints,
> server-side Gemini key) lives in [`sentinel-api/`](./sentinel-api).

## View & Export the Deck

```bash
npm install
npm run build       # compiles deck/sass/theme.scss -> deck/theme.css
npm run export-ppt  # generates SENTINEL-Multipli-Hackathon.pptx (16 polished slides)
npx serve .         # or: python3 -m http.server
# open http://localhost:3000 for Reveal.js
```

Reveal.js controls: `←/→` navigate · `Esc` slide overview · `S` speaker notes.
PowerPoint deck: `SENTINEL-Multipli-Hackathon.pptx` contains full presenter speaker notes and high-fidelity vector layouts.

## Deck Structure (16 Slides)

| # | Slide | Focus |
|---|-------|-------|
| 1 | Title — From Alert to Evidence | Executive overview, problem statement, key value props |
| 2 | Thesis: Three Layers, One Gap | Detection vs Protection vs Investigation (6 core questions) |
| 3 | Lifecycle Positioning | Complementary pipeline from raw activity to human agency |
| 4 | Core: Evidence Trail with Confidence Classes | Concrete approval incident + OBSERVED / INFERRED / UNKNOWN discipline |
| 5 | History vs Exposure & Coverage Transparency | Past behavior vs present blast radius; visible analysis boundaries |
| 6 | Investigable Alerts & Evidence Graph | Actionable warning card ($ at risk) + cryptographic proof graph |
| 7 | Pre-Signing Explanation & AI Architecture | In-wallet review modal + deterministic grounding (AI as narrator, not witness) |
| 8 | Concrete Signals Investigated | Approvals, governance/admin roles, proxies, fund flows, clusters, multi-chain |
| 9 | Competitive Landscape (12-Dimension Matrix) | Rigorous factual benchmark: Explorer vs Forta vs Hypernative vs SENTINEL |
| 10 | Investigation Workflow (6 Stages) | Real-world 3-second end-to-end incident execution pipeline |
| 11 | Technical Architecture & Implementation Stack | Frontend/graph UX, deterministic analysis engine, intelligence/pgvector tier |
| 12 | Multipli Hackathon Ecosystem Impact | Cross-chain reputation sync, DeFi yield guard, protocol attestation, SDK |
| 13 | Product Roadmap & Milestones | Hackathon MVP -> Multi-chain & extension -> Real-time ingestion -> Decentralized registry |
| 14 | Security UX Paradigm Shift | Broken status quo (alarm fatigue, opaque scores) vs SENTINEL human agency |
| 15 | Closing Vision & Summary | The 3 core takeaways, demo links, and Multipli Hackathon conclusion |
| 16 | Appendix: Research Methodology & Citations | Official documentation sources (Forta, Hypernative) & verified metrics |

## Research Method

- **Documented capability** — claims sourced from current official Forta docs
  (docs.forta.network) and Hypernative product pages (hypernative.io), accessed Sep 2026.
- **Architectural inference** — trade-offs derived from documented product shapes,
  labeled as such; no "X cannot do Y" claims.
- **Our proposed idea** — SENTINEL concepts, labeled throughout.
- Vendor metrics (99% detection, <0.001% FP, 96% scam detection, sub-100ms) are
  labeled vendor-reported.

## Files

- `SENTINEL-Multipli-Hackathon.pptx` — 16-slide PowerPoint presentation with full speaker notes
- `export-ppt.js` — Node.js generator script using `pptxgenjs`
- `index.html` — Reveal.js interactive deck (slides + speaker notes inline)
- `deck/sass/theme.scss` — Theme source (dark security ops palette)
- `deck/theme.css` — Compiled theme (generated, do not edit)

## Security Engine

The evidence-first engine lives in `src/security-engine` and is independent of the presentation deck. It exposes two async entry points:

```js
const {
  DemoBlockchainProvider,
  analyzeAddressSecurity,
  analyzeProtocolSecurity
} = require('./src/security-engine');

const addressResult = await analyzeAddressSecurity({
  provider: new DemoBlockchainProvider(),
  address: '0x1111111111111111111111111111111111111111',
  chain: 'ethereum'
});
```

Both entry points return the same `EvidenceBundle` shape:

```js
{
  schemaVersion: '1.0',
  bundleType: 'SENTINEL_EVIDENCE',
  dataMode: 'DEMO',
  chain: 'ethereum',
  address: '0x...',
  addressType: 'EOA',
  subject: { address: '0x...', addressType: 'EOA' },
  evidence: [{
    id: 'E1',
    kind: 'approval',
    findingType: 'UNLIMITED_ALLOWANCE',
    knowledgeType: 'OBSERVED',
    severity: 'HIGH',
    entity: '0x...',
    chain: 'ethereum',
    wallet: '0x...',
    token: '0x...',
    spender: '0x...',
    allowance: '0xffff...',
    transactionHash: '0x...',
    blockNumber: 12345678,
    timestamp: '2026-01-02T00:00:00Z',
    evidence: {},
    sourceReferences: {},
    explanationInputs: {},
    coverageGaps: []
  }],
  coverageGaps: []
}
```

The `evidence` entry retains the original structured provider evidence and normalized identifiers. `knowledgeType` is always `OBSERVED`, `INFERRED`, or `UNKNOWN`; no missing blockchain field is filled with a fabricated value. The engine does not emit a generic risk score.

The handoff to Sentinel AI is wired end-to-end via the HTTP API:

```bash
# Address in -> grounded explanation out; the API calls the engine for you:
curl -X POST http://localhost:8787/api/v1/analyze \
  -H 'content-type: application/json' \
  -d '{"address":"0x…","chain":"ethereum"}'
```

`sentinel-api` adapts the engine's findings to the AI layer's `EvidenceBundle`
via `sentinel-api/src/engine-adapter.ts` (verbatim passthrough, documented
`ethereum` -> `eip155:1` mapping, adapter-time `capturedAt`).

The security engine stops at `EvidenceBundle`. It has no AI dependency, does not call an LLM, and does not know about PRISM. The `sentinel-api/src/engine-adapter.ts` integration is covered by tests that run the actual CJS engine against the demo provider and verify that IDs, citations, addresses, allowances, hashes, and tri-state knowledge values survive the handoff.

### Ethereum data providers

Copy `.env.example` to `.env` and set:

```bash
ETHERSCAN_API_KEY=your-key
ETHEREUM_RPC_URL=https://your-ethereum-rpc.example
```

`createEthereumProvider()` selects `CompositeBlockchainProvider` when both values exist. Etherscan supplies indexed data through its v2 API: `account/txlist`, `account/txlistinternal`, `account/tokentx`, `contract/getsourcecode`, and `logs/getlogs`. The RPC adapter separately handles `eth_getCode`, `eth_call`, `eth_getLogs`, and `eth_getStorageAt` for balances, allowances, owner/admin calls, and EIP-1967 proxy slots. Etherscan never makes security decisions; it only produces normalized observations.

With no credentials, `createEthereumProvider()` returns `DemoBlockchainProvider` and the resulting bundle is marked `dataMode: "DEMO"`. With only an Etherscan key, indexed history still works, while unsupported direct state is represented as `UNKNOWN` coverage gaps. API failures, rate limits, unverified source, and unavailable RPC state are never converted into empty or safe results.

Example real-address analysis:

```js
const { createEthereumProvider, analyzeAddressSecurity } = require('./src/security-engine');

const bundle = await analyzeAddressSecurity({
  provider: createEthereumProvider(),
  address: '0x1111111111111111111111111111111111111111',
  chain: 'ethereum'
});
```

`BlockchainProvider` is the adapter contract for a future RPC/indexer implementation. `DemoBlockchainProvider` is deterministic and marks results with `dataMode: "DEMO"`; its addresses and transaction identifiers are demonstration fixtures, not claims about a live chain. Providers should set `mode` to `REAL` only when backed by a verified live source; otherwise results are marked `UNSPECIFIED`. The AI layer can consume the findings as evidence, but it is not involved in discovering them.
