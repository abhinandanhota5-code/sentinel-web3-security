import React, { useMemo, useState } from 'react';
import { Bookmark, BookmarkPlus, X, ExternalLink, Trash2, Search } from 'lucide-react';
import type { NetworkChainId } from '../types/sentinel';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isValidEthereumAddress,
  type WatchlistEntry,
} from '../services/watchlist';

interface WatchlistPanelProps {
  open: boolean;
  onClose: () => void;
  /** Open an investigation for the given address on the given chain. */
  onOpenAddress: (address: string, chain: NetworkChainId) => void;
  /** Contextual hint for the quick-add field (usually the current report subject). */
  contextAddress?: string;
  contextChain?: NetworkChainId;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  open,
  onClose,
  onOpenAddress,
  contextAddress,
  contextChain = 'ethereum',
}) => {
  const [entries, setEntries] = useState<WatchlistEntry[]>(() => getWatchlist());
  const [input, setInput] = useState('');
  const [selectedChain, setSelectedChain] = useState<NetworkChainId>(contextChain);
  const [error, setError] = useState<string | null>(null);

  const count = entries.length;

  const handleAdd = (raw: string, chain: NetworkChainId) => {
    const addr = raw.trim();
    if (!isValidEthereumAddress(addr)) {
      setError('Enter a valid 20-byte EVM address (0x…).');
      return;
    }
    setError(null);
    setEntries(addToWatchlist(addr, chain));
    setInput('');
  };

  const handleRemove = (address: string) => {
    setEntries(removeFromWatchlist(address));
  };

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [entries],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#040d1c]/35 backdrop-blur-[2px] flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md liquid-glass-strong border-l border-[var(--border-2)] shadow-2xl h-full flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-1)] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-4 h-4 text-accent" />
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-ink/8 text-ink-2 border border-[var(--border-1)]">
                Watchlist
              </span>
              <span className="text-[10px] font-mono text-ink-3">{count} saved</span>
            </div>
            <h3 className="text-lg font-bold text-ink leading-tight">Saved Addresses</h3>
            <p className="text-[11px] text-ink-3 mt-1">
              Stored locally in this browser (localStorage). No cloud sync. Re-analysis is
              on-demand only — there is no backend scheduler.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-3 hover:text-ink bg-ink/5 hover:bg-ink/10 rounded-xl border border-[var(--border-1)] transition"
            aria-label="Close watchlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick add */}
        <div className="px-5 py-4 border-b border-[var(--border-1)] bg-ink/5">
          <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-2">Add an address</div>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd(input, selectedChain);
                }}
                placeholder="0x…  (or current investigation — see header)"
                className="glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs w-full"
              />
            </div>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as NetworkChainId)}
              className="glass-input rounded-xl px-2 py-1.5 text-[11px] cursor-pointer"
              title="Chain for this entry"
            >
              {Object.values(SUPPORTED_CHAINS).map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-ink">
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleAdd(input, selectedChain)}
              className="px-3 rounded-xl text-[11px] font-semibold bg-accent hover:bg-[#4d6a8c] text-white transition flex items-center gap-1 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {contextAddress && (
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-ink-3 glass-well rounded-xl px-2.5 py-1.5">
              <span className="font-mono truncate">{contextAddress.slice(0, 10)}…{contextAddress.slice(-6)}</span>
              <button
                onClick={() => handleAdd(contextAddress, contextChain)}
                className="text-accent hover:underline font-semibold cursor-pointer"
              >
                add current
              </button>
            </div>
          )}
          {error && <div className="mt-2 text-[10px] text-bad font-semibold">{error}</div>}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-10">
              <Bookmark className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-ink-2 font-semibold">Watchlist is empty</p>
              <p className="text-[11px] text-ink-3 mt-0.5 max-w-[260px] mx-auto">
                Save addresses you want to re-check. Entries persist only in this browser.
              </p>
            </div>
          ) : (
            sorted.map((e) => {
              const chain = SUPPORTED_CHAINS[e.chain] ?? SUPPORTED_CHAINS.ethereum;
              return (
                <div
                  key={e.address}
                  className="liquid-glass-subtle rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink truncate">
                      {e.label || `${e.address.slice(0, 8)}…${e.address.slice(-6)}`}
                    </div>
                    <div className="text-[10px] font-mono text-technical truncate">{e.address}</div>
                    <div className="text-[9px] text-ink-3 mt-0.5">
                      {chain.icon} {chain.name} · added {new Date(e.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenAddress(e.address, e.chain)}
                      className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition cursor-pointer"
                      title="Open investigation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(e.address)}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-bad hover:bg-bad/10 transition cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistPanel;