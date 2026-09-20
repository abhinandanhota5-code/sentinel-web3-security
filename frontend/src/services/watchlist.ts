// Sentinel Watchlist — local, client-side persistence only.
// There is no cloud synchronization store for the Watchlist in the current
// runtime; entries live in localStorage and are clearly labeled as local.
// Re-analysis is NOT scheduled by the backend; the client may re-run an
// investigation on demand only.

import type { NetworkChainId } from '../types/sentinel';

export interface WatchlistEntry {
  address: string;
  chain: NetworkChainId;
  label?: string;
  addedAt: string;
}

const STORAGE_KEY = 'sentinel.watchlist.v1';

export function isValidEthereumAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

function readAll(): WatchlistEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is WatchlistEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as WatchlistEntry).address === 'string' &&
          isValidEthereumAddress((e as WatchlistEntry).address),
      )
      .map((e) => ({
        address: e.address.toLowerCase(),
        chain: e.chain ?? 'ethereum',
        label: e.label,
        addedAt: e.addedAt ?? new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function writeAll(entries: WatchlistEntry[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage can be unavailable (private mode); the Watchlist is a
    // best-effort local convenience, never a source of truth.
  }
}

export function getWatchlist(): WatchlistEntry[] {
  return readAll();
}

export function addToWatchlist(address: string, chain: NetworkChainId, label?: string): WatchlistEntry[] {
  const normalized = address.trim().toLowerCase();
  if (!isValidEthereumAddress(normalized)) return readAll();
  const entries = readAll();
  const existing = entries.find((e) => e.address === normalized);
  if (existing) {
    writeAll(
      entries.map((e) =>
        e.address === normalized
          ? { ...e, chain, label: label ?? e.label, addedAt: new Date().toISOString() }
          : e,
      ),
    );
  } else {
    writeAll([
      { address: normalized, chain, label: label?.trim() || undefined, addedAt: new Date().toISOString() },
      ...entries,
    ]);
  }
  return readAll();
}

export function removeFromWatchlist(address: string): WatchlistEntry[] {
  const normalized = address.trim().toLowerCase();
  writeAll(readAll().filter((e) => e.address !== normalized));
  return readAll();
}

export function isWatchlisted(address: string): boolean {
  return readAll().some((e) => e.address === address.trim().toLowerCase());
}