/**
 * Sentinel desktop — preload script.
 *
 * Runs in a sandboxed, contextIsolated renderer context. Exposes ONLY static
 * runtime facts (the local API base URL, platform, app version) through a
 * frozen object. No Node APIs, no IPC handles, no arbitrary functions are
 * exposed to the React frontend.
 */

const { contextBridge, ipcRenderer } = require('electron');

const runtime = ipcRenderer.sendSync('sentinel:runtime') || {};

contextBridge.exposeInMainWorld(
  'sentinelDesktop',
  Object.freeze({
    apiBaseUrl: typeof runtime.apiBaseUrl === 'string' ? runtime.apiBaseUrl : null,
    platform: typeof runtime.platform === 'string' ? runtime.platform : null,
    appVersion: typeof runtime.appVersion === 'string' ? runtime.appVersion : null,
  })
);
