/**
 * Server entrypoint. Load secrets via --env-file or the process environment;
 * nothing here logs configuration values.
 */

import { buildApp, configuredProviderName, type SecurityEnginePort } from "./app.js";
import { loadConfig } from "./config.js";
import type { EngineBundle } from "./engine-adapter.js";

const config = loadConfig();

// Real deterministic engine: load the CJS module relative to dist/ and wire
// the existing createEthereumProvider() so env-driven provider selection
// (ETHERSCAN_API_KEY / ETHEREUM_RPC_URL) applies unchanged.
let securityEngine: SecurityEnginePort | undefined;
let blockchainProvider: unknown;
try {
  const { createRequire } = await import("node:module");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const here = fileURLToPath(new URL(".", import.meta.url));
  const enginePath = path.resolve(here, "..", "..", "src", "security-engine", "index.js");
  const engine = createRequire(import.meta.url)(enginePath) as {
    createEthereumProvider: () => unknown;
    analyzeAddressSecurity: SecurityEnginePort["analyzeAddressSecurity"];
  };
  securityEngine = {
    analyzeAddressSecurity: (args: {
      provider: unknown;
      address: string;
      chain: string;
    }) => engine.analyzeAddressSecurity(args) as Promise<EngineBundle>,
  };
  blockchainProvider = engine.createEthereumProvider();
} catch {
  // Engine unavailable: AI-only endpoints (/explain, /evaluate) still serve.
  securityEngine = undefined;
}

const app = buildApp({ config, securityEngine, blockchainProvider });

const server = app.listen(config.port, () => {
  console.log(
    `sentinel-api listening on :${config.port} (provider: ${configuredProviderName(config)}, engine: ${securityEngine ? "real" : "unavailable"})`,
  );
});

function shutdown(signal: string): void {
  console.log(`received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
