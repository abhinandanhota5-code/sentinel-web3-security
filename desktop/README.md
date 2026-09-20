# Sentinel Desktop

Electron packaging for the Sentinel web app. The desktop build reuses the
existing architecture unchanged:

```
Electron (electron/main.cjs)
├── React/Vite frontend  → frontend/dist (packaged, loaded via file://)
└── local Sentinel API   → desktop/backend/backend.mjs (child process,
    ├── deterministic security engine (src/security-engine, CJS, resolved
    │   at runtime — unchanged)
    └── grounded explanation layer (@sentinel/ai)
```

The Electron main process:

1. picks an available loopback port (never hardcoded),
2. spawns the bundled API with `ELECTRON_RUN_AS_NODE=1`,
3. waits for `/healthz`,
4. loads the packaged frontend,
5. and terminates the API cleanly on quit (SIGTERM, then SIGKILL fallback).

The renderer learns the API base URL through the sandboxed preload bridge
(`window.sentinelDesktop.apiBaseUrl` — static facts only, contextIsolation on,
nodeIntegration off, webSecurity on).

## Runtime configuration (external — never bundled)

Create `sentinel.config.json` in the app's user-data directory:

- **macOS:** `~/Library/Application Support/Sentinel/sentinel.config.json`
- **Windows:** `%APPDATA%/Sentinel/sentinel.config.json`

See `desktop/sentinel.config.example.json` for the whitelisted keys.

Without any configuration the app still works:

- Deterministic blockchain analysis needs `ETHERSCAN_API_KEY` and/or
  `ETHEREUM_RPC_URL`. Without them the engine runs in its **labeled**
  `DEMO` data mode (the UI shows a "DEMO DATA" badge) — real, arbitrary
  EVM addresses are analyzed once real provider keys are configured.
- AI explanations are optional. The grounded mock provider serves
  deterministic explanations by default. Ollama users can set
  `EXPLANATION_PROVIDER: "ollama"`, `OLLAMA_BASE_URL`, and
  `OLLAMA_MODEL: "llama3.1:8b"`; if Ollama is not running, evidence remains
  fully available and the explanation section reports the refusal. Ollama
  itself is never bundled.

## Build

```bash
npm install                 # root dev deps (electron, electron-builder, esbuild)
npm run desktop:build       # frontend build + sentinel-ai build + backend bundle
npm run desktop:mac         # macOS arm64 .dmg  → dist/
npm run desktop:win         # Windows x64 .exe   → dist/ (see note)
```

Windows note: the NSIS x64 installer is configured here, but unsigned Windows
artifacts are best produced on a Windows runner (GitHub Actions:
`.github/workflows/release.yml`). Building Windows targets from macOS may or
may not succeed depending on the local toolchain; CI is the supported path.

## Security model

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  `webSecurity` untouched.
- Preload exposes only a frozen object of static runtime facts.
- Production loads the packaged local frontend only; no remote content.
- No `.env` files, API keys, or secrets are packaged or committed.
