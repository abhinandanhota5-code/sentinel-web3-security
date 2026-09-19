import React, { useState } from 'react';
import { 
  ArrowRight, 
  Eye, 
  Compass, 
  Zap, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import type { NetworkChainId } from '../types/sentinel';

interface LandingPageProps {
  onInvestigate: (address: string, chain: NetworkChainId) => void;
  selectedChain: NetworkChainId;
  onSelectChain: (chain: NetworkChainId) => void;
  isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onInvestigate,
  selectedChain,
  onSelectChain,
  isLoading = false,
}) => {
  const [addressInput, setAddressInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      onInvestigate(addressInput.trim(), selectedChain);
    }
  };

  const handleSelectPreset = (addr: string, chain: NetworkChainId = 'ethereum') => {
    setAddressInput(addr);
    onSelectChain(chain);
    onInvestigate(addr, chain);
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden cyber-grid">
      
      {/* Dynamic Ambient Liquid Orbs in background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-10">
        
        {/* Track Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill mb-6">
          <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
          <span className="text-[11px] font-mono tracking-wider text-teal-300">
            MULTIPLI HACKATHON 2026 // WEB3 SECURITY & PROTOCOL HEALTH
          </span>
        </div>

        {/* Hero Title with Liquid Specular Accent */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
            SENTINEL
          </span>
          <span className="text-2xl sm:text-4xl lg:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-cyan-400 to-indigo-400 block mt-2">
            From Alert to Evidence.
          </span>
        </h1>

        {/* Concise Mission Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
          Stop relying on black-box risk scores and blind blockouts. Sentinel decomposes threats into verified on-chain state proofs, separating 
          <span className="text-teal-300 font-medium"> Observed Facts</span>, 
          <span className="text-amber-300 font-medium"> Inferred Hypotheses</span>, and 
          <span className="text-purple-300 font-medium"> Epistemic Bounds</span>.
        </p>

        {/* Liquid Glass Input Capsule */}
        <div className="max-w-2xl mx-auto mb-6">
          <form 
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2"
          >
            {/* Chain Selector */}
            <div className="sm:w-44">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-400/60 backdrop-blur-md cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Paste EVM address, ENS, or protocol contract..."
                className="w-full h-11 bg-black/30 border border-white/10 rounded-xl px-4 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/80 focus:ring-1 focus:ring-teal-400/40 transition backdrop-blur-md"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-600 hover:from-teal-300 hover:to-indigo-500 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Quick Presets for Evaluators */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-300" />
              Presets:
            </span>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono liquid-glass-subtle text-rose-300 hover:border-rose-400/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              alex-defi.eth (Unlimited Approval)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5', 'multipli')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono liquid-glass-subtle text-teal-300 hover:border-teal-400/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Multipli Prime Yield Engine
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0xdeadbeef0000000000000000000000000000beef', 'base')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono liquid-glass-subtle text-amber-300 hover:border-amber-400/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              ShadySwap (0s Timelock Backdoor)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x1010101010101010101010101010101010101010', 'ethereum')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono liquid-glass-subtle text-slate-300 hover:border-white/30 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Cold Multisig Safe (Clean)
            </button>
          </div>
        </div>

        {/* 3 Core Architecture Pillars (Liquid Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-12">
          
          {/* Card 1: Evidence Decompression */}
          <div className="liquid-glass rounded-2xl p-6 liquid-card-hover border-t border-t-teal-400/40">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-teal-300">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider mb-1">Pillar 1</div>
            <h3 className="text-base font-bold text-white mb-2">Evidence Decompression</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every finding is anchored strictly to verified EVM storage slots, decoded calldata, and transaction receipts — not an arbitrary opaque risk score.
            </p>
          </div>

          {/* Card 2: Confidence Classes */}
          <div className="liquid-glass rounded-2xl p-6 liquid-card-hover border-t border-t-indigo-400/40">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-indigo-300">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-1">Pillar 2</div>
            <h3 className="text-base font-semibold text-white mb-2">Confidence Classes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict epistemics: <span className="text-teal-300 font-medium">Observed facts</span> (on-chain truth) vs. <span className="text-amber-300 font-medium">Inferred risks</span> (deductions) vs. <span className="text-purple-300 font-medium">Unknowns</span> (bounds).
            </p>
          </div>

          {/* Card 3: History vs Current Exposure */}
          <div className="liquid-glass rounded-2xl p-6 liquid-card-hover border-t border-t-amber-400/40">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1">Pillar 3</div>
            <h3 className="text-base font-semibold text-white mb-2">History vs. Exposure</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Past transactions do not equal current danger. Sentinel calculates the exact liquid dollar blast radius currently drainable through active rights.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
