import React, { useState } from 'react';
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Zap, 
  Compass, 
  Sparkles
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
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden cyber-grid">
      
      {/* Ambient background glow spots */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 mb-6 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-teal-400"></span>
          <span className="text-xs font-mono tracking-wider text-slate-300">
            MULTIPLI HACKATHON 2026 // SECURITY & PROTOCOL HEALTH
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            SENTINEL
          </span>
          <span className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-teal-400 block mt-2">
            From Alert to Evidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
          Web3 security platforms produce opaque risk scores and alarm fatigue. 
          <span className="text-white font-medium"> Sentinel</span> decomposes every threat into 
          <span className="text-teal-400 font-medium"> verified on-chain evidence</span>, separating 
          <span className="text-teal-300"> Observed Facts</span>, <span className="text-amber-300"> Inferred Hypotheses</span>, 
          and <span className="text-slate-400"> Unknowns</span>.
        </p>

        {/* Search & Investigate Box */}
        <div className="max-w-2xl mx-auto mb-10">
          <form 
            onSubmit={handleSubmit}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/90 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-2"
          >
            {/* Chain Selector */}
            <div className="sm:w-48">
              <select
                value={selectedChain}
                onChange={(e) => onSelectChain(e.target.value as NetworkChainId)}
                className="w-full h-12 bg-slate-800/80 border border-slate-700 rounded-lg px-3 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
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
                placeholder="Paste EVM Address, ENS, or Protocol Contract..."
                className="w-full h-12 bg-slate-950/70 border border-slate-700/80 rounded-lg px-4 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition"
              />
            </div>

            {/* Investigate Button */}
            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="h-12 px-6 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Investigate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Try Hackathon Scenarios:
            </span>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition"
            >
              ⚠️ Compromised Wallet (USDC Unlimited Approval)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x44d9a51837f81b1e13d508f850b3e1c0154942e5', 'multipli')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-teal-950/40 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 transition"
            >
              ⚡ Multipli Prime Yield Protocol
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0xdeadbeef0000000000000000000000000000beef', 'base')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition"
            >
              🚨 Privileged Backdoor (Zero Timelock)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('0x1010101010101010101010101010101010101010', 'ethereum')}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
            >
              🛡️ Cold Multisig (No Active Findings)
            </button>
          </div>
        </div>

        {/* 3 Core Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-14">
          
          {/* Pillar 1: Evidence vs Risk Score */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden glass-card-hover border-t-2 border-t-teal-500">
            <div className="w-10 h-10 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center mb-4 text-teal-400">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-teal-400 tracking-wider uppercase mb-1">Pillar 1</div>
            <h3 className="text-base font-semibold text-white mb-2">Evidence Decompression</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No black-box hazard scores. Sentinel provides an immutable evidence trail linking every finding to exact storage slots, RPC state proofs, and transaction receipts.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Grounded Proof IDs
            </div>
          </div>

          {/* Pillar 2: Confidence Classes */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden glass-card-hover border-t-2 border-t-indigo-500">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-indigo-400 tracking-wider uppercase mb-1">Pillar 2</div>
            <h3 className="text-base font-semibold text-white mb-2">Confidence Classes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict separation of:
              <span className="text-teal-300 font-medium"> Observed Facts</span> (on-chain verified), 
              <span className="text-amber-300 font-medium"> Inferred Hypotheses</span> (technical deductions), and 
              <span className="text-slate-400 font-medium"> Unknowns</span> (off-chain bounds).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Epistemic Rigor
            </div>
          </div>

          {/* Pillar 3: History vs Exposure */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden glass-card-hover border-t-2 border-t-amber-500">
            <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-amber-400 tracking-wider uppercase mb-1">Pillar 3</div>
            <h3 className="text-base font-semibold text-white mb-2">History vs. Current Exposure</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Historical interactions do not equal current danger. Sentinel calculates the exact liquid dollar blast radius that can be drained <em>right now</em> through active unrevoked rights.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Live Blast Radius
            </div>
          </div>

        </div>

      </div>

      {/* Value Proposition Comparison Strip */}
      <div className="border-t border-slate-800 bg-[#070d24]/60 py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Why Traditional Security Alerts Fail
            </h2>
            <p className="text-xs text-slate-400">
              Detection systems sound the alarm. Sentinel conducts the investigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Old Way */}
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Legacy Web3 Security Verdicts</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Opaque "Risk Score: 85/100" with no breakdown of why.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Conflates old past transactions with present active exposure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Binary blockouts that cause user alarm fatigue and blind signing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Displays "SAFE" simply because no bot flagged an alert.</span>
                </li>
              </ul>
            </div>

            {/* Sentinel Way */}
            <div className="bg-teal-950/20 border border-teal-700/40 rounded-xl p-5">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sentinel Investigation Standard</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Exact liquid dollar blast radius ($3,840.00 USDC at risk).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Visual separation between historical events and current permissions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Full tripartite proof: Observed on-chain fact vs Inferred risk vs Unknown.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">✓</span>
                  <span>Explicit coverage transparency: "No active finding detected within analyzed coverage".</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
