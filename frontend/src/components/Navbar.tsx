import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Layers, 
  Activity, 
  GitBranch, 
  FileCheck2, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import type { NetworkChainId } from '../types/sentinel';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'graph' | 'protocol' | 'coverage';
  onSelectView: (view: 'landing' | 'dashboard' | 'graph' | 'protocol' | 'coverage') => void;
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
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-stone-200/20 via-emerald-300/15 to-amber-200/20 p-[1px] border border-white/20 shadow-lg shadow-black/40">
            <div className="w-full h-full bg-[#0b0d14]/80 rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300 group-hover:scale-105 transition-transform" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-[#fafaf9] font-mono">SENTINEL</span>
              <span className="px-2 py-0.2 text-[9px] font-mono tracking-wider rounded-full liquid-pill text-stone-300">
                Security Suite
              </span>
            </div>
            <p className="text-[10px] text-stone-400 hidden sm:block font-mono tracking-tight">From Alert to Evidence</p>
          </div>
        </div>

        {/* Global Transparent Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Query address, ENS, or contract..."
              className="w-full pl-8 pr-20 py-1.5 text-xs font-mono bg-black/25 border border-white/10 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-300/60 focus:ring-1 focus:ring-stone-300/30 transition backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={isInvestigating}
              className="absolute inset-y-1 right-1 px-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 rounded-lg text-[10px] font-mono font-medium transition flex items-center gap-1 disabled:opacity-50"
            >
              {isInvestigating ? 'Scanning' : 'Inspect'}
            </button>
          </div>
        </form>

        {/* Navigation Tabs (Liquid Glass Pills) */}
        <nav className="flex items-center gap-1 bg-black/20 border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => {
              onSelectView('landing');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-stone-400 hover:text-stone-200 hover:bg-white/5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fed7aa]" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentView === 'dashboard'
                ? 'bg-white/12 text-stone-100 border border-white/20 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectView('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentView === 'graph'
                ? 'bg-white/12 text-stone-100 border border-white/20 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Evidence Graph</span>
            <span className="sm:hidden">Graph</span>
          </button>

          <button
            onClick={() => onSelectView('protocol')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentView === 'protocol'
                ? 'bg-white/12 text-stone-100 border border-white/20 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Protocol Health</span>
            <span className="sm:hidden">Protocol</span>
          </button>

          <button
            onClick={() => onSelectView('coverage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentView === 'coverage'
                ? 'bg-white/12 text-stone-100 border border-white/20 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Coverage</span>
          </button>
        </nav>

        {/* Chain & Presets Controls */}
        <div className="flex items-center gap-2">
          
          {/* Chain Selector */}
          <div className="relative hidden sm:block">
            <select
              value={selectedChain}
              onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
              className="appearance-none bg-black/25 border border-white/10 rounded-xl py-1.5 pl-3 pr-7 text-xs font-mono text-stone-200 focus:outline-none focus:border-stone-300/50 cursor-pointer backdrop-blur-md"
            >
              {Object.values(SUPPORTED_CHAINS).map((chain) => (
                <option key={chain.id} value={chain.id} className="bg-[#0e1017] text-stone-200">
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Inspection Presets Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium liquid-pill text-stone-200 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              title="Load audit inspection scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline font-mono text-[11px]">Scenarios</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showPresetsDropdown && (
              <div className="absolute right-0 mt-2 w-72 liquid-glass rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-mono font-semibold text-stone-400 px-2 py-1 uppercase tracking-wider border-b border-white/10">
                  Inspection Scenarios
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      onQuickPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-stone-200 group-hover:text-amber-200 flex items-center justify-between">
                      <span>alex-defi.eth</span>
                      <span className="text-[10px] text-rose-300 font-mono font-bold">$3.8k Exposed</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">Unlimited USDC approval spender</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-stone-200 group-hover:text-emerald-300 flex items-center justify-between">
                      <span>Multipli Prime Yield</span>
                      <span className="text-[10px] text-emerald-300 font-mono font-bold">Grade A</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">48h Timelock, 3/5 Multi-sig</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0xdeadbeef0000000000000000000000000000beef');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-stone-200 group-hover:text-rose-300 flex items-center justify-between">
                      <span>ShadySwap Router</span>
                      <span className="text-[10px] text-rose-300 font-mono font-bold">Critical</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">Zero-timelock emergencyDrain</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x1010101010101010101010101010101010101010');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-stone-200 group-hover:text-teal-300 flex items-center justify-between">
                      <span>treasury-cold.eth</span>
                      <span className="text-[10px] text-teal-300 font-mono font-bold">Clean</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">No active findings detected</div>
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
