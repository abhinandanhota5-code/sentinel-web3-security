/**
 * Server entrypoint. Load secrets via --env-file or the process environment;
 * nothing here logs configuration values.
 */

import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = buildApp({ config });

const server = app.listen(config.port, () => {
  console.log(`sentinel-api listening on :${config.port} (provider: ${config.geminiApiKey ? "gemini" : "mock"})`);
});

function shutdown(signal: string): void {
  console.log(`received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
