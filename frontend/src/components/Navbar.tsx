import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Layers, 
  Activity, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import type { NetworkChainId } from '../types/sentinel';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'protocol';
  onSelectView: (view: 'landing' | 'dashboard' | 'protocol') => void;
  selectedChain: NetworkChainId;
  onSelectChain: (chain: NetworkChainId) => void;
  onSearch: (address: string) => void;
  onQuickPreset: (addressKey: string) => void;
  isInvestigating?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  selectedChain,
  onSelectChain,
  onSearch,
  onQuickPreset,
  isInvestigating = false,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-3.5 pb-2">
      <div className="max-w-7xl mx-auto liquid-glass rounded-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none" 
          onClick={() => onSelectView('landing')}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-ink/8 border border-ink/15 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-accent-deep group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-50"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ok"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-ink">SENTINEL</span>
              <span className="px-2 py-0.5 text-[9px] tracking-wider rounded-full liquid-pill text-ink-2 font-medium">
                Security Suite
              </span>
            </div>
            <p className="text-[10px] text-ink-3 hidden sm:block tracking-tight">From Alert to Evidence</p>
          </div>
        </div>

        {/* Global search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-ink-3" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Query address, ENS, or contract..."
              className="glass-input w-full pl-8 pr-20 py-1.5 text-xs rounded-xl text-ink placeholder-ink-3"
            />
            <button
              type="submit"
              disabled={isInvestigating}
              className="absolute inset-y-1 right-1 px-2.5 bg-accent hover:bg-[#4d6a8c] text-white rounded-lg text-[11px] font-medium transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {isInvestigating ? 'Scanning' : 'Inspect'}
            </button>
          </div>
        </form>

        {/* Navigation Tabs (Liquid Glass Pills) */}
        <nav className="flex items-center gap-1 bg-ink/5 backdrop-blur-md border border-ink/12 p-1 rounded-xl">
          <button
            onClick={() => {
              onSelectView('landing');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-ink-2 hover:text-ink hover:bg-ink/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-ink-3" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-accent/15 text-accent font-semibold'
                : 'text-ink-2 hover:text-ink hover:bg-ink/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectView('protocol')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'protocol'
                ? 'bg-accent/15 text-accent font-semibold'
                : 'text-ink-2 hover:text-ink hover:bg-ink/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Protocol Health</span>
            <span className="sm:hidden">Protocol</span>
          </button>
        </nav>

        {/* Chain & Presets Controls */}
        <div className="flex items-center gap-2">
          
          {/* Chain Selector */}
          <div className="relative hidden sm:block">
            <select
              value={selectedChain}
              onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
              className="glass-input appearance-none rounded-xl py-1.5 pl-3 pr-7 text-xs text-ink cursor-pointer"
            >
              {Object.values(SUPPORTED_CHAINS).map((chain) => (
                <option key={chain.id} value={chain.id} className="bg-white text-ink">
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-ink-3 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Inspection Presets Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium liquid-pill text-ink hover:bg-ink/10 transition flex items-center gap-1.5"
              title="Load audit inspection scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink-3" />
              <span className="hidden sm:inline text-[11px]">Scenarios</span>
              <ChevronDown className="w-3 h-3 text-ink-3" />
            </button>

            {showPresetsDropdown && (
              <div className="absolute right-0 mt-2 w-80 liquid-glass-strong rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-semibold text-ink-3 px-2 py-1.5 uppercase tracking-wider border-b border-[var(--border-1)]">
                  Inspection Scenarios
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      onQuickPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-ink/8 transition group"
                  >
                    <div className="text-xs font-medium text-ink flex items-center justify-between">
                      <span>alex-defi.eth</span>
                      <span className="text-[10px] text-bad font-bold">$3.8k Exposed</span>
                    </div>
                    <div className="text-[10px] text-ink-3">Unlimited USDC approval spender</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-ink/8 transition group"
                  >
                    <div className="text-xs font-medium text-ink flex items-center justify-between">
                      <span>Multipli Prime Yield</span>
                      <span className="text-[10px] text-ok font-bold">Grade A</span>
                    </div>
                    <div className="text-[10px] text-ink-3">48h Timelock, 3/5 Multi-sig</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0xdeadbeef0000000000000000000000000000beef');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-ink/8 transition group"
                  >
                    <div className="text-xs font-medium text-ink flex items-center justify-between">
                      <span>ShadySwap Router</span>
                      <span className="text-[10px] text-bad font-bold">Critical</span>
                    </div>
                    <div className="text-[10px] text-ink-3">Zero-timelock emergencyDrain</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x1010101010101010101010101010101010101010');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-ink/8 transition group"
                  >
                    <div className="text-xs font-medium text-ink flex items-center justify-between">
                      <span>treasury-cold.eth</span>
                      <span className="text-[10px] text-ok font-bold">Clean</span>
                    </div>
                    <div className="text-[10px] text-ink-3">No active findings detected</div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
