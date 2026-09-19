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
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.08] border border-white/20 shadow-md">
            <ShieldCheck className="w-5 h-5 text-[#88b0d8] group-hover:scale-105 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B7FA6]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-wider text-slate-100 font-mono">SENTINEL</span>
              <span className="px-2 py-0.5 text-[9px] font-mono tracking-wider rounded-full bg-[#5B7FA6]/15 text-[#9ac2e8] border border-[#5B7FA6]/30">
                Security Suite
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-mono tracking-tight">From Alert to Evidence</p>
          </div>
        </div>

        {/* Global Transparent Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Query address, ENS, or contract..."
              className="w-full pl-8 pr-20 py-1.5 text-xs font-mono bg-white/[0.05] border border-white/15 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#5B7FA6]/80 focus:ring-1 focus:ring-[#5B7FA6]/30 transition backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={isInvestigating}
              className="absolute inset-y-1 right-1 px-2.5 bg-white/10 hover:bg-[#5B7FA6]/20 hover:border-[#5B7FA6]/40 border border-white/20 text-slate-200 hover:text-white rounded-lg text-[10px] font-mono font-medium transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {isInvestigating ? 'Scanning' : 'Inspect'}
            </button>
          </div>
        </form>

        {/* Navigation Tabs (macOS Floating Toolbar Style) */}
        <nav className="flex items-center gap-1 bg-white/[0.05] backdrop-blur-xl border border-white/15 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => {
              onSelectView('landing');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-white/15 text-white font-semibold border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${currentView === 'dashboard' ? 'text-[#9ac2e8]' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectView('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'graph'
                ? 'bg-white/15 text-white font-semibold border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <GitBranch className={`w-3.5 h-3.5 ${currentView === 'graph' ? 'text-[#9ac2e8]' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Evidence Graph</span>
            <span className="sm:hidden">Graph</span>
          </button>

          <button
            onClick={() => onSelectView('protocol')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'protocol'
                ? 'bg-white/15 text-white font-semibold border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${currentView === 'protocol' ? 'text-[#9ac2e8]' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Protocol Health</span>
            <span className="sm:hidden">Protocol</span>
          </button>

          <button
            onClick={() => onSelectView('coverage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'coverage'
                ? 'bg-white/15 text-white font-semibold border border-white/25 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileCheck2 className={`w-3.5 h-3.5 ${currentView === 'coverage' ? 'text-[#9ac2e8]' : 'text-slate-400'}`} />
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
              className="appearance-none bg-white/[0.06] border border-white/15 rounded-xl py-1.5 pl-3 pr-7 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#5B7FA6]/60 cursor-pointer backdrop-blur-md"
            >
              {Object.values(SUPPORTED_CHAINS).map((chain) => (
                <option key={chain.id} value={chain.id} className="bg-[#12151b] text-slate-200">
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Inspection Presets Menu (macOS Floating Glass Panel) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium liquid-pill text-slate-200 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              title="Load audit inspection scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9ac2e8]" />
              <span className="hidden sm:inline font-mono text-[11px]">Scenarios</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPresetsDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#12151b]/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 border border-white/15">
                <div className="text-[10px] font-mono font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-white/10">
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
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white flex items-center justify-between">
                      <span>alex-defi.eth</span>
                      <span className="text-[10px] text-[#dfba82] font-mono font-medium px-1.5 py-0.5 rounded bg-[#9A7A4A]/15 border border-[#9A7A4A]/30">$3.8k Exposed</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Unlimited USDC approval spender</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white flex items-center justify-between">
                      <span>Multipli Prime Yield</span>
                      <span className="text-[10px] text-[#8cc4a1] font-mono font-medium px-1.5 py-0.5 rounded bg-[#5E806A]/15 border border-[#5E806A]/30">Grade A</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">48h Timelock, 3/5 Multi-sig</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0xdeadbeef0000000000000000000000000000beef');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white flex items-center justify-between">
                      <span>ShadySwap Router</span>
                      <span className="text-[10px] text-[#d97f7f] font-mono font-medium px-1.5 py-0.5 rounded bg-[#A45F5F]/15 border border-[#A45F5F]/30">Critical</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Zero-timelock emergencyDrain</div>
                  </button>

                  <button
                    onClick={() => {
                      onQuickPreset('0x1010101010101010101010101010101010101010');
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-medium text-slate-200 group-hover:text-white flex items-center justify-between">
                      <span>treasury-cold.eth</span>
                      <span className="text-[10px] text-[#8cc4a1] font-mono font-medium px-1.5 py-0.5 rounded bg-[#5E806A]/15 border border-[#5E806A]/30">Clean</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">No active findings detected</div>
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
