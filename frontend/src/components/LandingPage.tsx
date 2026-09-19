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
      
      {/* Subtle Atmospheric Caustics (Low Saturation Slate & Apple Blue) */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-[#5B7FA6]/[0.05] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[38rem] h-[38rem] bg-[#334155]/[0.06] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[36rem] h-[36rem] bg-[#5B7FA6]/[0.04] rounded-full blur-[150px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-12">
        
        {/* Independent Enterprise Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill mb-6 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
          <span className="flex h-2 w-2 rounded-full bg-[#5B7FA6]"></span>
          <span className="text-[11px] font-mono tracking-wider text-slate-200">
            WEB3 SECURITY & PROTOCOL HEALTH INTELLIGENCE
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block font-mono tracking-tighter text-white">
            SENTINEL
          </span>
          <span className="text-2xl sm:text-4xl lg:text-5xl font-medium text-slate-200 block mt-2">
            From Alert to Evidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed font-normal">
          Replace opaque risk scores and alarm fatigue with verifiable clarity. Sentinel decomposes on-chain threats into 
          <span className="text-white font-semibold"> Observed Facts</span>, 
          <span className="text-slate-200 font-semibold"> Inferred Hypotheses</span>, and 
          <span className="text-slate-300 font-semibold"> Epistemic Bounds</span>.
        </p>

        {/* Translucent Liquid Glass Search Box */}
        <div className="max-w-2xl mx-auto mb-6">
          <form 
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 border border-white/20"
          >
            {/* Chain Selector */}
            <div className="sm:w-44">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="w-full h-11 bg-white/[0.06] border border-white/15 rounded-xl px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#5B7FA6]/80 backdrop-blur-md cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#12151b] text-slate-200">
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
                placeholder="Paste EVM address, transaction hash, or protocol contract..."
                className="w-full h-11 bg-white/[0.04] border border-white/15 rounded-xl px-4 text-xs sm:text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:border-[#5B7FA6]/80 focus:ring-1 focus:ring-[#5B7FA6]/30 transition backdrop-blur-md"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-11 px-6 rounded-xl bg-[#5B7FA6] hover:bg-[#6d92b8] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-white/20"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Quick Scenario Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#88b0d8]" />
              Scenarios:
            </span>

            <button
              type="button"
              onClick={() => handleSelectPreset('0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#5B7FA6]/10 hover:bg-[#5B7FA6]/20 border border-[#5B7FA6]/25 text-[#9ac2e8] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B7FA6]"></span>
              vitalik.eth (0xd8dA6BF...)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x8f3c7e42d91b8a53e62f0a1c794bb3d1a89c2e47f05b816a39d2c4179e51a8c2', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#A45F5F]/10 hover:bg-[#A45F5F]/20 border border-[#A45F5F]/25 text-[#d97f7f] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A45F5F]"></span>
              Reviewer Test Tx (Suspicious Interaction)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#9A7A4A]/10 hover:bg-[#9A7A4A]/20 border border-[#9A7A4A]/25 text-[#dfba82] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9A7A4A]"></span>
              alex-defi.eth (Unlimited Approval)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x1010101010101010101010101010101010101010', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#5E806A]/10 hover:bg-[#5E806A]/20 border border-[#5E806A]/25 text-[#8cc4a1] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#5E806A]"></span>
              Cold Multisig Safe (Clean)
            </button>
          </div>

          {/* Quick Scroll to How It Works */}
          <div className="mt-7">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-pill text-xs font-mono text-slate-300 hover:text-white hover:border-white/30 transition shadow-lg group"
            >
              <span>See How Sentinel Works in 3 Timelines</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition" />
            </a>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-12">
          
          {/* Card 1: Evidence Decompression */}
          <div className="liquid-glass-subtle rounded-2xl p-6 liquid-card-hover border border-white/10">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#88b0d8]">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#88b0d8] uppercase tracking-wider mb-1 font-semibold">Pillar 1</div>
            <h3 className="text-base font-semibold text-white mb-2">Evidence Decompression</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every finding is anchored strictly to verified EVM storage slots, decoded calldata, and transaction receipts — eliminating black-box guesswork.
            </p>
          </div>

          {/* Card 2: Confidence Classes */}
          <div className="liquid-glass-subtle rounded-2xl p-6 liquid-card-hover border border-white/10">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#dfba82]">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#dfba82] uppercase tracking-wider mb-1 font-semibold">Pillar 2</div>
            <h3 className="text-base font-semibold text-white mb-2">Confidence Classes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict epistemics: <span className="text-[#8cc4a1] font-medium">Observed facts</span> (on-chain truth) vs. <span className="text-[#dfba82] font-medium">Inferred risks</span> (deductions) vs. <span className="text-slate-300 font-medium">Unknowns</span> (bounds).
            </p>
          </div>

          {/* Card 3: History vs Current Exposure */}
          <div className="liquid-glass-subtle rounded-2xl p-6 liquid-card-hover border border-white/10">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-[#9ac2e8]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1 font-semibold">Pillar 3</div>
            <h3 className="text-base font-semibold text-white mb-2">History vs. Exposure</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Past transactions do not equal current danger. Sentinel isolates the exact liquid dollar blast radius currently drainable through active rights.
            </p>
          </div>

        </div>

      </div>

      {/* HOW IT WORKS SECTION */}
      <div id="how-it-works" className="w-full">
        <HowItWorksTimeline onSelectPreset={(addr, chain) => handleSelectPreset(addr, chain)} />
      </div>

    </div>
  );
};
