/**
 * Bundles the Sentinel API (sentinel-api/src/main.ts) — including express,
 * @sentinel/ai, and the TypeScript sources — into a single self-contained
 * ESM file at desktop/backend/backend.mjs.
 *
 * The CJS deterministic security engine (src/security-engine/**) is NOT
 * bundled: sentinel-api resolves it at runtime via createRequire from
 * `<bundle dir>/../../src/security-engine/index.js`. electron-builder packs
 * those files at exactly that relative position (see electron-builder.yml).
 *
 * Output is ESM because main.ts uses top-level await and import.meta.url.
 * The Electron main process runs it with ELECTRON_RUN_AS_NODE=1.
 */

import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outfile = path.join(root, 'desktop', 'backend', 'backend.mjs');

await mkdir(path.dirname(outfile), { recursive: true });

await build({
  entryPoints: [path.join(root, 'sentinel-api', 'src', 'main.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'bundle',
  sourcemap: 'inline',
  logLevel: 'info',
  legalComments: 'none',
  // Bundled CJS dependencies (express and friends) call require('tty'),
  // require('fs'), … at runtime. esbuild's ESM output cannot satisfy those
  // dynamically, so provide a real require backed by createRequire.
  banner: {
    js: [
      "import { createRequire as __sentinelCreateRequire } from 'node:module';",
      "const require = __sentinelCreateRequire(import.meta.url);",
    ].join('\n'),
  },
});

console.log(`backend bundle written: ${path.relative(root, outfile)}`);
