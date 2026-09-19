import React, { useState } from 'react';
import { 
  ArrowRight, 
  Eye, 
  Compass, 
  Zap, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '../services/sentinelApi';
import type { NetworkChainId } from '../types/sentinel';
import { HowItWorksTimeline } from './HowItWorksTimeline';

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
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden ambient-mesh">
      
      {/* Soft Blue + Cream + Light Beige Ambient Caustics in Background (Seamless, no rigid boundaries) */}
      <div className="absolute top-1/4 left-1/4 w-[38rem] h-[38rem] bg-[#fdfbf7]/16 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[36rem] h-[36rem] bg-[#efe4d0]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[34rem] h-[34rem] bg-[#7dd3fc]/14 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-[#f7f1e4]/14 rounded-full blur-[170px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-12">
        
        {/* Independent Enterprise Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill mb-6 border border-[#efe4d0]/30 bg-[#fdfbf7]/10">
          <span className="flex h-2 w-2 rounded-full bg-[#fde68a]"></span>
          <span className="text-[11px] font-mono tracking-wider text-[#fdfbf7]">
            WEB3 SECURITY & PROTOCOL HEALTH INTELLIGENCE
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block font-mono tracking-tighter text-[#fdfbf7]">
            SENTINEL
          </span>
          <span className="text-2xl sm:text-4xl lg:text-5xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#fdfbf7] via-[#fde68a] to-[#bae6fd] block mt-2">
            From Alert to Evidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed font-normal">
          Replace opaque risk scores and alarm fatigue with verifiable clarity. Sentinel decomposes on-chain threats into 
          <span className="text-[#7dd3fc] font-medium"> Observed Facts</span>, 
          <span className="text-[#fde68a] font-medium"> Inferred Hypotheses</span>, and 
          <span className="text-[#fdfbf7] font-medium"> Epistemic Bounds</span>.
        </p>

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
                className="w-full h-11 bg-white/[0.08] border border-white/20 rounded-xl px-3 text-xs font-mono text-[#fdfbf7] focus:outline-none focus:border-[#fde68a]/80 backdrop-blur-md cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0e1424] text-slate-200">
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
                className="w-full h-11 bg-white/[0.06] border border-white/20 rounded-xl px-4 text-xs sm:text-sm font-mono text-[#fdfbf7] placeholder-slate-400 focus:outline-none focus:border-[#fde68a]/80 focus:ring-1 focus:ring-[#fde68a]/30 transition backdrop-blur-md"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#fdfbf7] via-[#f7efe1] to-[#e8d7be] hover:opacity-95 text-[#14120f] font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#fde68a]/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-white/60"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4 text-[#14120f]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Scenario Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#fde68a]" />
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
              className="px-3 py-1 rounded-full text-[11px] font-mono liquid-pill text-[#7dd3fc] hover:border-[#7dd3fc]/50 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3fc]"></span>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-pill text-xs font-mono text-slate-300 hover:text-white hover:border-[#fde68a]/50 transition shadow-lg group"
            >
              <span>See How Sentinel Works in 3 Timelines</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#fde68a] group-hover:translate-y-0.5 transition" />
            </a>
          </div>
        </div>

        {/* 3 Core Pillars (Translucent Soft Blue + Light Beige + Cream Liquid Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-12">
          
          {/* Card 1: Evidence Decompression (Soft Blue) */}
          <div className="liquid-glass-blue rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#7dd3fc]">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#7dd3fc] uppercase tracking-wider mb-1">Pillar 1</div>
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
            <div className="text-[10px] font-mono text-[#fde68a] uppercase tracking-wider mb-1">Pillar 2</div>
            <h3 className="text-base font-bold text-[#fdfbf7] mb-2">Confidence Classes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict epistemics: <span className="text-[#7dd3fc] font-medium">Observed facts</span> (on-chain truth) vs. <span className="text-[#fde68a] font-medium">Inferred risks</span> (deductions) vs. <span className="text-[#fdfbf7] font-medium">Unknowns</span> (bounds).
            </p>
          </div>

          {/* Card 3: History vs Current Exposure (Warm Cream) */}
          <div className="liquid-glass-cream rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#fdfbf7]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#fdfbf7] uppercase tracking-wider mb-1">Pillar 3</div>
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
