/**
 * Sentinel desktop — Electron main process.
 *
 * Responsibilities:
 *  - Start the bundled local Sentinel API (deterministic security engine +
 *    grounded explanation layer) as a child process on an available port.
 *  - Shut the API down cleanly when the app exits.
 *  - Load the packaged React frontend (frontend/dist) — never remote content.
 *  - Expose only the local API base URL to the renderer via the preload
 *    bridge. No Node APIs are exposed to the renderer.
 *
 * Runtime configuration is EXTERNAL and never bundled: an optional flat JSON
 * file at <userData>/sentinel.config.json supplies whitelisted provider keys
 * (e.g. ETHERSCAN_API_KEY, ETHEREUM_RPC_URL, Ollama settings). Without any
 * configuration the app still runs: deterministic evidence stays available,
 * explanations use the grounded mock provider, and the engine's labeled DEMO
 * data mode applies until real provider keys are configured.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');

/** Whitelisted runtime-config keys forwarded to the API child process. */
const ALLOWED_ENV_KEYS = [
  'ETHERSCAN_API_KEY',
  'ETHEREUM_RPC_URL',
  'EXPLANATION_PROVIDER',
  'EXPLANATION_TIMEOUT_MS',
  'OLLAMA_BASE_URL',
  'OLLAMA_MODEL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
];

/** Resolve the real on-disk path for a resource that electron-builder unpacked from app.asar. */
function resolveUnpacked(p) {
  const unpacked = p.split('app.asar').join('app.asar.unpacked');
  try {
    fs.accessSync(unpacked);
    return unpacked;
  } catch {
    return p;
  }
}

/** Ask the OS for an available loopback port (no hardcoded port). */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/** Load external runtime config. Never bundled; keys are whitelisted. */
function loadExternalEnv() {
  const resolved = {};
  const configPath = path.join(app.getPath('userData'), 'sentinel.config.json');
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [key, value] of Object.entries(raw)) {
        if (ALLOWED_ENV_KEYS.includes(key) && typeof value === 'string' && value.trim().length > 0) {
          resolved[key] = value.trim();
        }
      }
    }
  } catch {
    // No config file (or unreadable) — defaults apply. This is normal.
  }
  // Advanced users may also export the same whitelisted keys in their shell
  // environment before launching the app. Config-file values win.
  for (const key of ALLOWED_ENV_KEYS) {
    if (resolved[key] === undefined && typeof process.env[key] === 'string' && process.env[key].length > 0) {
      resolved[key] = process.env[key];
    }
  }
  return resolved;
}

let backendProcess = null;
let forceQuit = false;

function stopBackend() {
  if (!backendProcess || backendProcess.exitCode !== null || backendProcess.signalCode) return;
  const child = backendProcess;
  console.log('[sentinel-desktop] stopping local Sentinel API…');
  child.kill('SIGTERM');
  const killer = setTimeout(() => {
    if (child.exitCode === null && !child.signalCode) {
      console.warn('[sentinel-desktop] API did not exit on SIGTERM; forcing SIGKILL');
      child.kill('SIGKILL');
    }
  }, 3000);
  killer.unref();
}

function startBackend(port, externalEnv) {
  const backendEntry = resolveUnpacked(path.join(__dirname, '..', 'desktop', 'backend', 'backend.mjs'));
  const childEnv = {
    ...process.env,
    ...externalEnv,
    PORT: String(port),
    SENTINEL_DESKTOP: '1',
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1',
  };
  const child = spawn(process.execPath, [backendEntry], {
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  backendProcess = child;

  child.stdout.on('data', (chunk) => process.stdout.write(`[sentinel-api] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[sentinel-api] ${chunk}`));
  child.on('exit', (code, signal) => {
    backendProcess = null;
    if (!forceQuit) {
      console.error(`[sentinel-desktop] local Sentinel API exited unexpectedly (code=${code} signal=${signal})`);
    }
  });
  return child;
}

/** Poll the API health endpoint until it responds (or time out). */
function waitForBackend(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/healthz', timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve(true);
        retry();
      });
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

let mainWindow = null;
let apiBaseUrl = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sentinel',
    backgroundColor: '#07111f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // webSecurity stays enabled (default). No remote content is loaded.
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  // The packaged app loads ONLY the local packaged frontend.
  mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance: one app, one local API.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const port = await findFreePort();
    apiBaseUrl = `http://127.0.0.1:${port}`;

    const externalEnv = loadExternalEnv();
    const providerConfigured = externalEnv.ETHERSCAN_API_KEY || externalEnv.ETHEREUM_RPC_URL;
    if (!providerConfigured) {
      console.warn(
        '[sentinel-desktop] No blockchain provider keys configured. Deterministic analysis will run in the engine\'s labeled DEMO data mode until keys are added to:',
      );
      console.warn(`[sentinel-desktop]   ${path.join(app.getPath('userData'), 'sentinel.config.json')}`);
    }
    if (externalEnv.EXPLANATION_PROVIDER === 'ollama') {
      console.log('[sentinel-desktop] Ollama explanations enabled via external config (optional; deterministic evidence works without it).');
    }

    startBackend(port, externalEnv);
    const ready = await waitForBackend(port);
    if (!ready) {
      console.error('[sentinel-desktop] local Sentinel API did not become healthy in time — opening the UI anyway.');
    }

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// Renderer bridge: static runtime facts only. No functions, no Node APIs.
ipcMain.on('sentinel:runtime', (event) => {
  event.returnValue = {
    apiBaseUrl,
    platform: process.platform,
    appVersion: app.getVersion(),
  };
});

app.on('window-all-closed', () => {
  // Quit on every platform so the local API child never outlives the UI.
  app.quit();
});

app.on('before-quit', () => {
  forceQuit = true;
  stopBackend();
});

app.on('quit', () => {
  forceQuit = true;
  stopBackend();
});
