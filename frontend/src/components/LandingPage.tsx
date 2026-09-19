import React, { useState } from 'react';
import { 
  ArrowRight, 
  Eye, 
  Compass, 
  Zap, 
  Sparkles,
  ChevronDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import type { NetworkChainId } from '../types/sentinel';
import { HowItWorksTimeline } from './HowItWorksTimeline';

interface LandingPageProps {
  onInvestigate: (address: string, chain: NetworkChainId) => void;
  selectedChain: NetworkChainId;
  onSelectChain: (chain: NetworkChainId) => void;
  isLoading?: boolean;
  onSelectPreset?: (addressKey: string, chain: NetworkChainId) => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onInvestigate,
  selectedChain,
  onSelectChain,
  isLoading = false,
  onSelectPreset,
  errorMessage = null,
  onClearError,
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
    if (onSelectPreset) {
      onSelectPreset(addr, chain);
    } else {
      onInvestigate(addr, chain);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden ambient-mesh">
      
      {/* Dark Green / Oceanic Teal + Cream + Soft Blue Ambient Caustics in Background */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-[#064e3b]/22 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[38rem] h-[38rem] bg-[#0f766e]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[36rem] h-[36rem] bg-[#2dd4bf]/14 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] bg-[#fdfbf7]/14 rounded-full blur-[170px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-12">
        
        {/* Independent Enterprise Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill mb-6 border border-[#2dd4bf]/30 bg-[#064e3b]/20">
          <span className="flex h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse"></span>
          <span className="text-[11px] font-mono tracking-wider text-[#fdfbf7]">
            WEB3 SECURITY & PROTOCOL HEALTH INTELLIGENCE
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block font-mono tracking-tighter text-[#fdfbf7]">
            SENTINEL
          </span>
          <span className="text-2xl sm:text-4xl lg:text-5xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#fdfbf7] via-[#5eead4] to-[#fde68a] block mt-2">
            From Alert to Evidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed font-normal">
          Replace opaque risk scores and alarm fatigue with verifiable clarity. Sentinel decomposes on-chain threats into 
          <span className="text-[#2dd4bf] font-semibold"> Observed Facts</span>, 
          <span className="text-[#fde68a] font-semibold"> Inferred Hypotheses</span>, and 
          <span className="text-[#fdfbf7] font-semibold"> Epistemic Bounds</span>.
        </p>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 flex items-start gap-3 backdrop-blur-xl animate-in fade-in duration-200 text-left">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-bold font-mono text-rose-300 uppercase tracking-wider">
                Investigation Failed
              </div>
              <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="text-rose-400 hover:text-rose-200 transition p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Translucent Liquid Glass Search Box */}
        <div className="max-w-2xl mx-auto mb-6">
          <form 
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 border border-white/30"
          >
            {/* Chain Selector */}
            <div className="sm:w-44">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="w-full h-11 bg-white/[0.08] border border-white/20 rounded-xl px-3 text-xs font-mono text-[#fdfbf7] focus:outline-none focus:border-[#2dd4bf]/80 backdrop-blur-md cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#051314] text-slate-200">
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
                className="w-full h-11 bg-white/[0.06] border border-white/20 rounded-xl px-4 text-xs sm:text-sm font-mono text-[#fdfbf7] placeholder-slate-400 focus:outline-none focus:border-[#2dd4bf]/80 focus:ring-1 focus:ring-[#2dd4bf]/30 transition backdrop-blur-md"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#fdfbf7] via-[#5eead4] to-[#2dd4bf] hover:opacity-95 text-[#042f2e] font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-[#2dd4bf]/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-white/60"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4 text-[#042f2e]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Scenario Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#2dd4bf]" />
              Scenarios:
            </span>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono liquid-pill text-rose-300 hover:border-rose-400/40 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
              alex-defi.eth (Unlimited Approval)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5', 'multipli')}
              className="px-3 py-1 rounded-full text-[11px] font-mono liquid-pill text-[#2dd4bf] hover:border-[#2dd4bf]/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]"></span>
              Multipli Prime Yield Engine
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0xdeadbeef0000000000000000000000000000beef', 'base')}
              className="px-3 py-1 rounded-full text-[11px] font-mono liquid-pill text-[#fde68a] hover:border-[#fde68a]/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fde68a]"></span>
              ShadySwap (0s Timelock Backdoor)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x1010101010101010101010101010101010101010', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono liquid-pill text-[#fdfbf7] hover:border-white/40 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fdfbf7]"></span>
              Cold Multisig Safe (Clean)
            </button>
          </div>

          {/* Quick Scroll to How It Works */}
          <div className="mt-7">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-pill text-xs font-mono text-slate-300 hover:text-white hover:border-[#2dd4bf]/50 transition shadow-lg group"
            >
              <span>See How Sentinel Works in 3 Timelines</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#2dd4bf] group-hover:translate-y-0.5 transition" />
            </a>
          </div>
        </div>

        {/* 3 Core Pillars (Translucent Dark Teal + Light Beige + Cream Liquid Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-12">
          
          {/* Card 1: Evidence Decompression (Luminous Oceanic Teal) */}
          <div className="liquid-glass-teal rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#2dd4bf]">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#2dd4bf] uppercase tracking-wider mb-1 font-bold">Pillar 1</div>
            <h3 className="text-base font-bold text-[#fdfbf7] mb-2">Evidence Decompression</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every finding is anchored strictly to verified EVM storage slots, decoded calldata, and transaction receipts — eliminating black-box guesswork.
            </p>
          </div>

          {/* Card 2: Confidence Classes (Luminous Light Beige) */}
          <div className="liquid-glass-beige rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#fde68a]">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#fde68a] uppercase tracking-wider mb-1 font-bold">Pillar 2</div>
            <h3 className="text-base font-bold text-[#fdfbf7] mb-2">Confidence Classes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict epistemics: <span className="text-[#2dd4bf] font-medium">Observed facts</span> (on-chain truth) vs. <span className="text-[#fde68a] font-medium">Inferred risks</span> (deductions) vs. <span className="text-[#fdfbf7] font-medium">Unknowns</span> (bounds).
            </p>
          </div>

          {/* Card 3: History vs Current Exposure (Warm Cream) */}
          <div className="liquid-glass-cream rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#bae6fd]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#fdfbf7] uppercase tracking-wider mb-1 font-bold">Pillar 3</div>
            <h3 className="text-base font-bold text-[#fdfbf7] mb-2">History vs. Exposure</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Past transactions do not equal current danger. Sentinel isolates the exact liquid dollar blast radius currently drainable through active rights.
            </p>
          </div>

        </div>

      </div>

      {/* ==========================================================================
          DEVJAMS-STYLE HOW IT WORKS SECTION (ROLLING ANIMATIONS + 3 TIMELINES)
          ========================================================================== */}
      <div id="how-it-works" className="w-full">
        <HowItWorksTimeline onSelectPreset={(addr, chain) => handleSelectPreset(addr, chain)} />
      </div>

    </div>
  );
};
