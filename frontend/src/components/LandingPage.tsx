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
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden">
      
      {/* Ambient environmental caustics — desaturated blue/slate */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-[#a8b8c8]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[38rem] h-[38rem] bg-[#b4c2d0]/22 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[36rem] h-[36rem] bg-[#c9cdd4]/18 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] bg-[#9fadbf]/16 rounded-full blur-[170px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-12">
        
        {/* Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill mb-6">
          <span className="flex h-2 w-2 rounded-full bg-ok"></span>
          <span className="text-[11px] tracking-wider text-ink-2 font-medium">
            WEB3 SECURITY & PROTOCOL HEALTH INTELLIGENCE
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-ink mb-3">
          SENTINEL
        </h1>
        <p className="text-xl sm:text-3xl lg:text-4xl font-medium text-ink-2 tracking-tight mb-6">
          From Alert to Evidence.
        </p>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-ink-2 mb-8 leading-relaxed">
          Replace opaque risk scores and alarm fatigue with verifiable clarity. Sentinel decomposes on-chain threats into 
          <span className="text-ink font-semibold"> Observed Facts</span>, 
          <span className="text-ink font-semibold"> Inferred Hypotheses</span>, and 
          <span className="text-ink font-semibold"> Epistemic Bounds</span>.
        </p>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-5 p-4 rounded-2xl bg-ink/5 border border-bad/25 text-ink-2 flex items-start gap-3 backdrop-blur-xl animate-in fade-in duration-200 text-left">
            <AlertTriangle className="w-5 h-5 text-bad shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-bold text-bad uppercase tracking-wider">
                Investigation Failed
              </div>
              <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="text-ink-3 hover:text-ink transition p-1"
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
            className="liquid-glass rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2"
          >
            {/* Chain Selector */}
            <div className="sm:w-44">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="glass-input w-full h-11 rounded-xl px-3 text-xs font-medium text-ink cursor-pointer"
              >
                {Object.values(SUPPORTED_CHAINS).map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-ink">
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
                placeholder="Paste address / ENS / protocol..."
                className="glass-input w-full h-11 rounded-xl px-4 text-xs sm:text-sm text-ink placeholder-ink-3"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-11 px-6 rounded-xl bg-accent hover:bg-[#4d6a8c] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Scenario Pills — neutral glass, severity dots carry the color */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-ink-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-ink-3" />
              Scenarios:
            </span>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] liquid-pill text-ink-2 hover:bg-ink/10 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-bad"></span>
              alex-defi.eth (Unlimited Approval)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5', 'multipli')}
              className="px-3 py-1 rounded-full text-[11px] liquid-pill text-ink-2 hover:bg-ink/10 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ok"></span>
              Multipli Prime Yield Engine
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0xdeadbeef0000000000000000000000000000beef', 'base')}
              className="px-3 py-1 rounded-full text-[11px] liquid-pill text-ink-2 hover:bg-ink/10 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warn"></span>
              ShadySwap (0s Timelock Backdoor)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x1010101010101010101010101010101010101010', 'ethereum')}
              className="px-3 py-1 rounded-full text-[11px] liquid-pill text-ink-2 hover:bg-ink/10 transition flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ok"></span>
              Cold Multisig Safe (Clean)
            </button>
          </div>

          {/* Quick Scroll to How It Works */}
          <div className="mt-7">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-pill text-xs text-ink-2 hover:text-ink transition group"
            >
              <span>See How Sentinel Works in 3 Timelines</span>
              <ChevronDown className="w-3.5 h-3.5 text-accent group-hover:translate-y-0.5 transition" />
            </a>
          </div>
        </div>

        {/* 3 Core Pillars — one quiet neutral glass material */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-12">
          
          {/* Card 1: Evidence Decompression */}
          <div className="liquid-glass rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-accent-deep">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-1 font-semibold">Pillar 1</div>
            <h3 className="text-base font-bold text-ink mb-2">Evidence Decompression</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Every finding is anchored strictly to verified EVM storage slots, decoded calldata, and transaction receipts — eliminating black-box guesswork.
            </p>
          </div>

          {/* Card 2: Confidence Classes */}
          <div className="liquid-glass rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-accent-deep">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-1 font-semibold">Pillar 2</div>
            <h3 className="text-base font-bold text-ink mb-2">Confidence Classes</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Strict epistemics: <span className="text-ink font-medium">Observed facts</span> (on-chain truth) vs. <span className="text-ink font-medium">Inferred risks</span> (deductions) vs. <span className="text-ink font-medium">Unknowns</span> (bounds).
            </p>
          </div>

          {/* Card 3: History vs Current Exposure */}
          <div className="liquid-glass rounded-3xl p-6 liquid-card-hover">
            <div className="w-10 h-10 rounded-xl liquid-pill flex items-center justify-center mb-4 text-accent-deep">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-1 font-semibold">Pillar 3</div>
            <h3 className="text-base font-bold text-ink mb-2">History vs. Exposure</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Past transactions do not equal current danger. Sentinel isolates the exact liquid dollar blast radius currently drainable through active rights.
            </p>
          </div>

        </div>

      </div>

      {/* How It Works section */}
      <div id="how-it-works" className="w-full">
        <HowItWorksTimeline onSelectPreset={(addr, chain) => handleSelectPreset(addr, chain)} />
      </div>

    </div>
  );
};
