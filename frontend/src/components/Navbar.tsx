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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#040817]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('landing')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#070e24] rounded-[7px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">SENTINEL</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-teal-950/70 border border-teal-600/40 text-teal-300">
                  v1.0 Multipli
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">From Alert to Evidence</p>
            </div>
          </div>

          {/* Quick Search bar (visible in top nav) */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter 0x address, ENS, or contract..."
                className="w-full pl-9 pr-24 py-1.5 text-xs font-mono bg-slate-900/90 border border-slate-700/70 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition"
              />
              <button
                type="submit"
                disabled={isInvestigating}
                className="absolute inset-y-1 right-1 px-2.5 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-300 rounded text-[11px] font-medium transition flex items-center gap-1 disabled:opacity-50"
              >
                {isInvestigating ? 'Scanning...' : 'Investigate'}
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Investigation</span>
            </button>

            <button
              onClick={() => onSelectView('graph')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentView === 'graph'
                  ? 'bg-indigo-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Evidence Graph</span>
              <span className="sm:hidden">Graph</span>
            </button>

            <button
              onClick={() => onSelectView('protocol')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentView === 'protocol'
                  ? 'bg-indigo-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Protocol Health</span>
              <span className="sm:hidden">Health</span>
            </button>

            <button
              onClick={() => onSelectView('coverage')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentView === 'coverage'
                  ? 'bg-indigo-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coverage</span>
            </button>
          </nav>

          {/* Chain Selector & Presets Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="appearance-none bg-slate-900 border border-slate-700/80 rounded-md py-1.5 pl-3 pr-7 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((chain) => (
                  <option key={chain.id} value={chain.id} className="bg-slate-900 text-slate-200">
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Quick Demo Presets Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition flex items-center gap-1"
                title="Load hackathon test scenarios"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Presets</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>

              {showPresetsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 backdrop-blur-xl">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                    Hackathon Test Presets
                  </div>
                  <div className="mt-1 space-y-1">
                    <button
                      onClick={() => {
                        onQuickPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4');
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 transition group"
                    >
                      <div className="text-xs font-medium text-slate-200 group-hover:text-teal-300 flex items-center justify-between">
                        <span>alex-defi.eth (Unlimited Approval)</span>
                        <span className="text-[10px] text-rose-400 font-mono">$3.8k Risk</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Active MAX_UINT256 USDC spender</div>
                    </button>

                    <button
                      onClick={() => {
                        onQuickPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5');
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 transition group"
                    >
                      <div className="text-xs font-medium text-slate-200 group-hover:text-teal-300 flex items-center justify-between">
                        <span>Multipli Prime Yield Engine</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Grade A</span>
                      </div>
                      <div className="text-[10px] text-slate-400">48h Timelock, 3/5 Safe, Oracle TWAP</div>
                    </button>

                    <button
                      onClick={() => {
                        onQuickPreset('0xdeadbeef0000000000000000000000000000beef');
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 transition group"
                    >
                      <div className="text-xs font-medium text-slate-200 group-hover:text-teal-300 flex items-center justify-between">
                        <span>ShadySwap Router (Backdoor)</span>
                        <span className="text-[10px] text-rose-500 font-mono font-bold">Critical</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Zero-timelock emergencyDrain selector</div>
                    </button>

                    <button
                      onClick={() => {
                        onQuickPreset('0x1010101010101010101010101010101010101010');
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 transition group"
                    >
                      <div className="text-xs font-medium text-slate-200 group-hover:text-teal-300 flex items-center justify-between">
                        <span>treasury-cold.eth (Safe)</span>
                        <span className="text-[10px] text-teal-300 font-mono">Clean</span>
                      </div>
                      <div className="text-[10px] text-slate-400">No active findings detected</div>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
