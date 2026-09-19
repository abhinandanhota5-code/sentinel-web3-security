import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  Lock, 
  Flame, 
  ArrowRight, 
  Terminal, 
  Copy, 
  Check, 
  Eye, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface HowItWorksTimelineProps {
  onSelectPreset?: (address: string, chain?: any) => void;
}

export const HowItWorksTimeline: React.FC<HowItWorksTimelineProps> = ({ onSelectPreset }) => {
  const [activeTabT2, setActiveTabT2] = useState<'observed' | 'inferred' | 'unknown'>('observed');
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulatedRevoked, setSimulatedRevoked] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;

    const updatePosition = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const screenAnchor = windowHeight * 0.5;
      const targetY = screenAnchor - rect.top;

      const minY = 16;
      const maxY = Math.max(minY, rect.height - 16);
      const clampedY = Math.max(minY, Math.min(maxY, targetY));

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(-50%, ${clampedY}px, 0)`;
      }
      if (fillRef.current) {
        fillRef.current.style.height = `${clampedY - minY}px`;
      }
    };

    const onScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updatePosition();

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("approve(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45, 0)");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleManualSlide = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = 280;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Curated core capabilities
  const squareFeatures = [
    {
      id: "facts",
      icon: <CheckCircle2 className="w-5 h-5 text-[#8cc4a1]" />,
      accent: "#5E806A",
      tag: "On-Chain Truth",
      title: "Observed Facts",
      description: "Direct EVM storage proofs proving mathematical facts with zero third-party heuristics.",
      metric: "Merkle Proofs"
    },
    {
      id: "blast",
      icon: <Flame className="w-5 h-5 text-[#dfba82]" />,
      accent: "#9A7A4A",
      tag: "Real Exposure",
      title: "Dollar Blast Radius",
      description: "Calculates the exact liquid dollar balance currently drainable through active rights.",
      metric: "Live $ Exposure"
    },
    {
      id: "revoke",
      icon: <Lock className="w-5 h-5 text-slate-200" />,
      accent: "#5B7FA6",
      tag: "1-Click Fix",
      title: "Zero-Gas Calldata",
      description: "Generates deterministic zero-allowance transaction calldata to seal access instantly.",
      metric: "Instant Fix"
    },
    {
      id: "bounds",
      icon: <Eye className="w-5 h-5 text-slate-300" />,
      accent: "#64748b",
      tag: "Epistemic Honesty",
      title: "Zero Fake Badges",
      description: "Sentinel never issues generic green 'SAFE' badges for contracts code alone cannot prove.",
      metric: "Strict Bounds"
    },
    {
      id: "calldata",
      icon: <Terminal className="w-5 h-5 text-[#88b0d8]" />,
      accent: "#5B7FA6",
      tag: "Deterministic Calldata",
      title: "Payload Verification",
      description: "Decodes and decompiles calldata directly against Solidity ABIs and function selectors.",
      metric: "ABI Decoded"
    }
  ];

  return (
    <section className="relative w-full py-20 bg-transparent overflow-hidden px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
      
      {/* Subtle Atmospheric Glow (Low Saturation) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[54rem] h-[32rem] bg-gradient-to-r from-[#5B7FA6]/[0.05] via-[#334155]/[0.05] to-[#5B7FA6]/[0.04] rounded-full blur-[170px] pointer-events-none" />

      {/* SECTION 1: SQUARE CAPABILITY CARDS */}
      <div className="max-w-7xl mx-auto mb-20 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#9ac2e8] mb-2 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
              Verification Modules
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              CORE CAPABILITIES
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mt-1 font-sans">
              Sentinel's verifiable diagnostic suite. Slide through features at your own pace.
            </p>
          </div>

          {/* Manual Slide Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleManualSlide('left')}
              disabled={!canScrollLeft}
              className="w-9 h-9 rounded-xl liquid-pill border border-white/15 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
              title="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManualSlide('right')}
              disabled={!canScrollRight}
              className="w-9 h-9 rounded-xl liquid-pill border border-white/15 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
              title="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manual Horizontal Slider Track */}
        <div
          ref={sliderRef}
          onScroll={checkScrollability}
          className="w-full overflow-x-auto scroll-smooth flex gap-4 pb-4 pt-1 snap-x snap-mandatory select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {squareFeatures.map((feat) => (
            <div
              key={feat.id}
              className="w-56 h-56 sm:w-60 sm:h-60 shrink-0 rounded-2xl p-5 flex flex-col justify-between snap-start border border-white/10 hover:border-white/25 transition-all liquid-glass-subtle liquid-card-hover group"
            >
              {/* Card Top: Icon & Tag */}
              <div className="flex items-start justify-between gap-2">
                <div 
                  className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/15 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  {feat.icon}
                </div>
                <span className="text-[9px] font-mono text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10 truncate max-w-[125px]">
                  {feat.tag}
                </span>
              </div>

              {/* Card Middle: Title & Explanation */}
              <div className="my-auto py-1.5">
                <h3 className="text-sm font-semibold font-mono text-white group-hover:text-white transition">
                  {feat.title}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3 mt-1.5 font-sans">
                  {feat.description}
                </p>
              </div>

              {/* Card Bottom: Metric Tag */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Standard</span>
                <span 
                  className="font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-200 border border-white/10"
                >
                  {feat.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: 3 TIMELINES */}
      <div className="max-w-6xl mx-auto relative">
        
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-slate-300 mb-3 border border-white/15">
            Architecture In Plain English
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            How Sentinel Works
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto mt-3 leading-relaxed">
            No confusing computer science jargon or fake safety badges. Here is exactly what happens behind the scenes in 3 simple chronological steps.
          </p>
        </div>

        {/* Timeline Container with Center Spine */}
        <div ref={timelineRef} className="relative w-full flex flex-col items-center mt-6 sm:mt-10">
          
          {/* Subtle Hairline Spine Track Rail */}
          <div 
            className="absolute left-4 sm:left-6 md:left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 rounded-full bg-white/15 pointer-events-none"
          />

          {/* Subtle Elapsed Track Fill Line */}
          <div 
            ref={fillRef}
            className="absolute left-4 sm:left-6 md:left-1/2 w-[2px] -translate-x-1/2 rounded-full pointer-events-none z-20 bg-gradient-to-b from-[#5B7FA6] via-[#88b0d8] to-slate-200"
            style={{
              top: '16px',
              height: '0px'
            }}
          />

          {/* Tabular Dot */}
          <div 
            ref={dotRef}
            className="absolute left-4 sm:left-6 md:left-1/2 z-30 pointer-events-none will-change-transform"
            style={{
              top: 0,
              transform: 'translate3d(-50%, 16px, 0)'
            }}
          >
            <div className="w-5 h-5 -translate-y-1/2 rounded-full bg-white border-2 border-[#5B7FA6] shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#5B7FA6]" />
            </div>
          </div>

          {/* Timeline Nodes Container */}
          <div className="w-full flex flex-col gap-24 sm:gap-28 md:gap-36 relative z-10">

            {/* TIMELINE 1: THE INCOMING WARNING */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* LEFT: Visual Snapshot Card */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass rounded-2xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-white/15">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5B7FA6]" />
                      <span className="font-semibold text-white">SCANNER DETECTED // ON-CHAIN TRIGGER</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-white/[0.06] text-slate-300 border border-white/15 font-medium">
                      Block #19,402,118
                    </span>
                  </div>

                  {/* Visual Simulation Graphic */}
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Target Wallet:</span>
                        <span className="text-white font-medium">alex-defi.eth</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Transaction:</span>
                        <span className="text-[#88b0d8]">0x4f82...3e9a</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Granted Right:</span>
                        <span className="text-[#d97f7f] font-semibold bg-[#A45F5F]/15 px-2 py-0.5 rounded border border-[#A45F5F]/30">
                          USDC (UNLIMITED ALLOWANCE)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-[#d97f7f] shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-300">
                        <span className="font-semibold text-[#d97f7f] block mb-0.5">Vulnerable Permission Found:</span>
                        Contract <span className="text-white underline">0x68b...Fc45</span> has full authority to withdraw tokens without further permission.
                      </div>
                    </div>
                  </div>

                  {/* Interactive Button */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Simulated Investigation</span>
                    {onSelectPreset && (
                      <button
                        onClick={() => onSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
                        className="text-[11px] font-mono text-[#88b0d8] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Test This Scenario</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Layman's Explanation */}
              <div className="w-full md:w-[46%] text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-[#9ac2e8] uppercase tracking-wider mb-2 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
                  Timeline 01 • The Trigger
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                  You Connect or Swap — But What Did You Actually Sign?
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border-l-3 border-l-[#5B7FA6] border border-white/10 mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-white block mb-1">💡 The Everyday Analogy:</strong>
                  "Think of it like valet parking your car: you intended to hand the valet a single key to park it today, but the paperwork secretly gave them a master key to your entire garage forever."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>When you interact with a crypto website, you frequently click "Approve". Most apps quietly ask for <strong>"Unlimited Allowance"</strong> so you never have to click approve again.</span>
                  <span className="block mt-2">
                    Sentinel immediately scans the blockchain’s official storage slots to uncover every active master key connected to your wallet — before anyone abuses it.
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-[#8cc4a1]">✓ No black-box scores</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-slate-200">✓ Direct RPC storage proof</span>
                </div>
              </div>

            </div>


            {/* TIMELINE 2: SEPARATING PROOF FROM GUESSWORK */}
            <div className="w-full flex flex-col md:flex-row-reverse items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* RIGHT: Visual Snapshot Card */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass rounded-2xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-white/15">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#dfba82]" />
                      <span className="font-semibold text-white">TRIPARTITE REASONING MATRIX</span>
                    </div>
                    <span className="text-slate-400 text-[9px] font-mono">Epistemic Clarity</span>
                  </div>

                  {/* Interactive Tripartite Tabs */}
                  <div className="flex gap-1 mb-3 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setActiveTabT2('observed')}
                      className={`flex-1 py-1 text-[10px] font-mono font-medium rounded-lg transition ${
                        activeTabT2 === 'observed' ? 'bg-[#5E806A]/20 text-[#8cc4a1] border border-[#5E806A]/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1. Observed
                    </button>
                    <button
                      onClick={() => setActiveTabT2('inferred')}
                      className={`flex-1 py-1 text-[10px] font-mono font-medium rounded-lg transition ${
                        activeTabT2 === 'inferred' ? 'bg-[#9A7A4A]/20 text-[#dfba82] border border-[#9A7A4A]/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      2. Inferred
                    </button>
                    <button
                      onClick={() => setActiveTabT2('unknown')}
                      className={`flex-1 py-1 text-[10px] font-mono font-medium rounded-lg transition ${
                        activeTabT2 === 'unknown' ? 'bg-white/15 text-white border border-white/25' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      3. Unknown
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10 min-h-[140px] flex flex-col justify-center">
                    {activeTabT2 === 'observed' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#8cc4a1] font-mono font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OBSERVED: Mathematical Facts</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                          "Storage Slot [0x02] in USDC token contract holds value 0xffffff... for Spender 0x68b...Fc45."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#8cc4a1] bg-[#5E806A]/15 px-2 py-0.5 rounded border border-[#5E806A]/30 font-medium">
                          Verified by EVM Merkle Patricia Proof
                        </span>
                      </div>
                    )}

                    {activeTabT2 === 'inferred' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#dfba82] font-mono font-semibold text-xs">
                          <TrendingUp className="w-4 h-4" />
                          <span>INFERRED: Deductions & Attack Vectors</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                          "If that unverified spender contract is compromised, the attacker can drain up to your entire 3,840 USDC balance."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#dfba82] bg-[#9A7A4A]/15 px-2 py-0.5 rounded border border-[#9A7A4A]/30 font-medium">
                          Logical deduction from bytecode authority
                        </span>
                      </div>
                    )}

                    {activeTabT2 === 'unknown' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-slate-300 font-mono font-semibold text-xs">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          <span>UNKNOWN: Our Honest Limits</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                          "We cannot prove off-chain identity. Whether the counterparty is evil or well-intentioned cannot be proven by code alone."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/15 font-medium">
                          Never a fake green 'SAFE' badge
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Click tabs above to preview how Sentinel separates evidence</span>
                  </div>
                </div>
              </div>

              {/* LEFT: Layman's Explanation */}
              <div className="w-full md:w-[46%] text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-[#dfba82] uppercase tracking-wider mb-2 border border-[#9A7A4A]/30 bg-[#9A7A4A]/15">
                  Timeline 02 • Evidence Separation
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                  We Never Guess. We Split Reality Into 3 Honest Truths.
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border-l-3 border-l-[#9A7A4A] border border-white/10 mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-white block mb-1">⚖️ The Courtroom Analogy:</strong>
                  "A real courtroom strictly separates security camera footage (undeniable facts), detective hypotheses (deductions), and things no one witnessed (unknowns). Sentinel does the exact same thing for Web3."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>Most security scanners spit out an opaque number like "Risk: 85%". That causes panic and tells you nothing useful.</span>
                  <span className="block mt-2">
                    Sentinel strictly separates <strong>Observed Facts</strong> (verified on-chain with math), <strong>Inferred Risks</strong> (what the code allows), and <strong>Unknowns</strong> (what no algorithm can verify).
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-[#8cc4a1]">🟢 Facts Proved</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-[#dfba82]">🟡 Deductions</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-slate-300">⚪ Honest Limits</span>
                </div>
              </div>

            </div>


            {/* TIMELINE 3: EXACT DOLLARS IN DANGER & 1-CLICK RESOLUTION */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* LEFT: Visual Snapshot Card */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass rounded-2xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-white/15">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#dfba82]" />
                      <span className="font-semibold text-white">VERIFIABLE BLAST RADIUS METER</span>
                    </div>
                    <span className="text-[#dfba82] font-semibold text-[9px] bg-[#9A7A4A]/15 px-2 py-0.5 rounded border border-[#9A7A4A]/30">
                      Calculated Down to the Penny
                    </span>
                  </div>

                  {/* Big Dollar Blast Radius Display */}
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10 text-center mb-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Liquid Cash Drainable Right Now:
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold font-mono text-[#dfba82] my-1">
                      {simulatedRevoked ? '$0.00' : '$3,840.00'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      {simulatedRevoked ? '✅ Permission Revoked • Vault 100% Sealed' : '3,840 USDC in alex-defi.eth'}
                    </div>
                  </div>

                  {/* 1-Click Revoke Simulation Box */}
                  <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Generated Zero-Allowance Calldata:</span>
                      <button
                        onClick={handleCopyCode}
                        className="text-[#88b0d8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-2 bg-black/40 rounded-lg font-mono text-[10px] text-slate-300 break-all border border-white/10">
                      0x095ea7b3...0000000000000000000000000000000000000000
                    </div>

                    <button
                      onClick={() => setSimulatedRevoked(!simulatedRevoked)}
                      className={`w-full py-2 px-4 rounded-xl text-xs font-semibold font-mono transition flex items-center justify-center gap-2 shadow-md cursor-pointer border ${
                        simulatedRevoked
                          ? 'bg-[#5E806A] text-white border-[#5E806A]/50 hover:bg-[#5E806A]/90'
                          : 'bg-[#5B7FA6] text-white border-white/20 hover:bg-[#6b93c0]'
                      }`}
                    >
                      <span>{simulatedRevoked ? 'Vault Sealed (Click to Reset)' : 'Simulate Revoke Tx (Zero Gas)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2 text-[10px] font-mono text-center text-slate-400">
                    Try clicking the button above to simulate how Sentinel neutralizes threats instantly.
                  </div>
                </div>
              </div>

              {/* RIGHT: Layman's Explanation */}
              <div className="w-full md:w-[46%] text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-2 border border-white/15">
                  Timeline 03 • Action & Fix
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                  Exact Cash in Danger + A 1-Click Button to Lock the Door.
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border-l-3 border-l-[#A45F5F] border border-white/10 mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-white block mb-1">🚒 The Fire Extinguisher Analogy:</strong>
                  "If your house is in danger, you don't want someone to tell you 'Threat Level 7'. You want to know exactly what is at risk, and you want someone to hand you the fire extinguisher immediately."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>Sentinel calculates your exact <strong>Liquid Blast Radius</strong> down to the penny (e.g. <strong>$3,840.00</strong>) — not an abstract rating.</span>
                  <span className="block mt-2">
                    Then, Sentinel generates the exact zero-allowance transaction calldata required to revoke that permission forever. You click one button, and the dangerous access is sealed shut before any hacker can exploit it.
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-[#dfba82] font-semibold">Exact Dollar Exposure</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-[#8cc4a1] font-semibold">1-Click Revoke</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/15 text-slate-300">Zero Guesswork</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
