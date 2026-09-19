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
  Key, 
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

      // Screen anchor: exactly at center of viewport (50% of screen height)
      // When scrolling, the dot stays locked at the viewport center (part of the screen)
      const screenAnchor = windowHeight * 0.5;

      // 1:1 distance from top of timeline to screen center
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
      // Direct synchronous update for zero lag, with RAF fallback
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

  // Curated core capabilities presented as square cards (DevJams icon box style)
  const squareFeatures = [
    {
      id: "facts",
      icon: <CheckCircle2 className="w-5 h-5 text-[#2dd4bf]" />,
      accent: "#2dd4bf",
      tag: "On-Chain Truth",
      title: "Observed Facts",
      description: "Direct EVM storage proofs proving mathematical facts with zero third-party heuristics.",
      metric: "Merkle Proofs"
    },
    {
      id: "blast",
      icon: <Flame className="w-5 h-5 text-[#fde68a]" />,
      accent: "#fde68a",
      tag: "Real Exposure",
      title: "Dollar Blast Radius",
      description: "Calculates the exact liquid dollar balance currently drainable through active rights.",
      metric: "Live $ Exposure"
    },
    {
      id: "revoke",
      icon: <Lock className="w-5 h-5 text-[#fdfbf7]" />,
      accent: "#fdfbf7",
      tag: "1-Click Fix",
      title: "Zero-Gas Calldata",
      description: "Generates deterministic zero-allowance transaction calldata to seal access instantly.",
      metric: "Instant Fix"
    },
    {
      id: "bounds",
      icon: <Eye className="w-5 h-5 text-[#cbd5e1]" />,
      accent: "#cbd5e1",
      tag: "Epistemic Honesty",
      title: "Zero Fake Badges",
      description: "Sentinel never issues generic green 'SAFE' badges for contracts code alone cannot prove.",
      metric: "Honest Limits"
    },
    {
      id: "decoder",
      icon: <Terminal className="w-5 h-5 text-[#5eead4]" />,
      accent: "#5eead4",
      tag: "State Inspector",
      title: "Slot Decompiler",
      description: "Inspects raw storage mappings like mapping(owner => spender) down to bytecode truth.",
      metric: "Storage Mapping"
    },
    {
      id: "governance",
      icon: <Key className="w-5 h-5 text-[#fef3c7]" />,
      accent: "#fef3c7",
      tag: "Quorum Telemetry",
      title: "Multisig & Timelock",
      description: "Verifies 48-hour emergency timelocks, multisig thresholds, and upgrade admin identities.",
      metric: "Safe Quorum"
    }
  ];

  return (
    <section className="relative w-full py-20 bg-transparent overflow-hidden px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
      
      {/* Ambient background glow mesh (Mixed Deep Emerald, Oceanic Teal, Warm Cream & Soft Blue Caustics) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[54rem] h-[32rem] bg-gradient-to-r from-[#064e3b]/22 via-[#0f766e]/18 via-[#fdfbf7]/14 to-[#2dd4bf]/14 rounded-full blur-[170px] pointer-events-none" />

      {/* ==========================================================================
          SECTION 1: DEVJAMS-STYLE SQUARE ICONS (MANUAL SLIDER)
          ========================================================================== */}
      <div className="max-w-7xl mx-auto mb-20 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#2dd4bf] mb-2 border border-[#2dd4bf]/30 bg-[#064e3b]/20">
              Verification Modules
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#fdfbf7] tracking-tight font-mono">
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
              className="w-9 h-9 rounded-xl liquid-pill border border-white/25 flex items-center justify-center text-slate-200 hover:text-white hover:border-[#fde68a]/50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
              title="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManualSlide('right')}
              disabled={!canScrollRight}
              className="w-9 h-9 rounded-xl liquid-pill border border-white/25 flex items-center justify-center text-slate-200 hover:text-white hover:border-[#fde68a]/50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
              title="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manual Horizontal Slider Track (Square Cards, No Auto-Movement) */}
        <div
          ref={sliderRef}
          onScroll={checkScrollability}
          className="w-full overflow-x-auto scroll-smooth flex gap-4 pb-4 pt-1 snap-x snap-mandatory select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {squareFeatures.map((feat) => (
            <div
              key={feat.id}
              className={`w-56 h-56 sm:w-60 sm:h-60 shrink-0 rounded-3xl p-5 flex flex-col justify-between snap-start border transition-all liquid-card-hover group ${
                feat.id === 'facts' 
                  ? 'liquid-glass-teal border-[#2dd4bf]/35 hover:border-[#2dd4bf]/70' 
                  : feat.id === 'blast' 
                  ? 'liquid-glass-beige border-[#fde68a]/30 hover:border-[#fde68a]/60' 
                  : 'liquid-glass-cream border-white/20 hover:border-[#2dd4bf]/50'
              }`}
            >
              {/* Card Top: Icon & Tag */}
              <div className="flex items-start justify-between gap-2">
                <div 
                  className="w-11 h-11 rounded-2xl liquid-pill flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ borderColor: `${feat.accent}50` }}
                >
                  {feat.icon}
                </div>
                <span className="text-[9px] font-mono text-[#fdfbf7] bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/15 truncate max-w-[125px]">
                  {feat.tag}
                </span>
              </div>

              {/* Card Middle: Title & Layman Explanation */}
              <div className="my-auto py-1.5">
                <h3 className="text-sm font-bold font-mono text-[#fdfbf7] group-hover:text-[#2dd4bf] transition">
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
                  className="font-bold px-2 py-0.5 rounded-md"
                  style={{ color: feat.accent, backgroundColor: `${feat.accent}18` }}
                >
                  {feat.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==========================================================================
          SECTION 2: 3 TIMELINES ONE BELOW THE OTHER (LAYMAN'S GUIDE)
          ========================================================================== */}
      <div className="max-w-6xl mx-auto relative">
        
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#fde68a] mb-3">
            Architecture In Plain English
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#fdfbf7] tracking-tight">
            How Sentinel Works
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto mt-3 leading-relaxed">
            No confusing computer science jargon or fake safety badges. Here is exactly what happens behind the scenes in 3 simple chronological steps.
          </p>
        </div>

        {/* The Timeline Container with Center Spine & Dynamic Rolling Dot */}
        <div ref={timelineRef} className="relative w-full flex flex-col items-center mt-6 sm:mt-10">
          
          {/* Subtle Hairline Spine Track Rail */}
          <div 
            className="absolute left-4 sm:left-6 md:left-1/2 top-4 bottom-4 w-[2.5px] sm:w-[3px] -translate-x-1/2 rounded-full bg-white/15 pointer-events-none"
          />

          {/* Subtle Elapsed Track Fill Line (Mixed Oceanic Teal, Mint & Warm Cream, tracks dot 1:1 with zero lag) */}
          <div 
            ref={fillRef}
            className="absolute left-4 sm:left-6 md:left-1/2 w-[2.5px] sm:w-[3px] -translate-x-1/2 rounded-full pointer-events-none z-20 bg-gradient-to-b from-[#2dd4bf]/80 via-[#5eead4]/70 to-[#fdfbf7]/60 shadow-[0_0_12px_rgba(45,212,191,0.5)]"
            style={{
              top: '16px',
              height: '0px'
            }}
          />

          {/* Dull Tabular Dot (Anchored to screen center as user moves it, 1:1 ultra-smooth) */}
          <div 
            ref={dotRef}
            className="absolute left-4 sm:left-6 md:left-1/2 z-30 pointer-events-none will-change-transform"
            style={{
              top: 0,
              transform: 'translate3d(-50%, 16px, 0)'
            }}
          >
            {/* 20px-24px diameter: Centered on dot position, tactile, luminous cream pearl with deep teal core */}
            <div className="w-5 h-5 sm:w-6 sm:h-6 -translate-y-1/2 rounded-full bg-[#fdfbf7] border-2 border-[#5eead4] shadow-[0_2px_14px_rgba(45,212,191,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#0f766e] shadow-[0_0_6px_#2dd4bf]" />
            </div>
          </div>

          {/* Timeline Nodes Container */}
          <div className="w-full flex flex-col gap-24 sm:gap-28 md:gap-36 relative z-10">

            {/* ================================================================
                TIMELINE 1: THE INCOMING WARNING
                (Left Visual Mockup / Right Plain-English Explanation)
                ================================================================ */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* LEFT: Visual Snapshot Card (DevJams historical image aesthetic) */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass-teal rounded-3xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-[#2dd4bf]/30">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] animate-pulse" />
                      <span className="font-bold text-[#fdfbf7]">SCANNER DETECTED // ON-CHAIN TRIGGER</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30 font-medium">
                      Block #19,402,118
                    </span>
                  </div>

                  {/* Visual Simulation Graphic */}
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="p-3 bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">Target Wallet:</span>
                        <span className="text-[#fdfbf7] font-bold">alex-defi.eth</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">Transaction:</span>
                        <span className="text-[#bae6fd]">0x4f82...3e9a</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">Granted Right:</span>
                        <span className="text-rose-300 font-bold bg-rose-500/15 px-2 py-0.5 rounded border border-rose-400/20">
                          USDC (UNLIMITED ALLOWANCE)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-950/20 backdrop-blur-md rounded-2xl border border-rose-400/25 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-200">
                        <span className="font-bold text-rose-300 block mb-0.5">Vulnerable Permission Found:</span>
                        Contract <span className="text-[#fdfbf7] underline">0x68b...Fc45</span> has full authority to withdraw tokens without further permission.
                      </div>
                    </div>
                  </div>

                  {/* Interactive Button */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Simulated Investigation</span>
                    {onSelectPreset && (
                      <button
                        onClick={() => onSelectPreset('0x71c8fb8172f19e9efea17c76b93f783309a632b4', 'ethereum')}
                        className="text-[11px] font-mono text-[#2dd4bf] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
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
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-[#2dd4bf] uppercase tracking-wider mb-2 border border-[#2dd4bf]/30 bg-[#064e3b]/20">
                  Timeline 01 • The Trigger
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#fdfbf7] tracking-tight mb-2">
                  You Connect or Swap — But What Did You Actually Sign?
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-2xl liquid-glass-beige border-l-3 border-l-[#2dd4bf] mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-[#fdfbf7] block mb-1">💡 The Everyday Analogy:</strong>
                  "Think of it like valet parking your car: you intended to hand the valet a single key to park it today, but the paperwork secretly gave them a master key to your entire garage forever."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>When you interact with a crypto website, you frequently click "Approve". Most apps quietly ask for <strong>"Unlimited Allowance"</strong> so you never have to click approve again.</span>
                  <span className="block mt-2">
                    Sentinel immediately scans the blockchain’s official storage slots to uncover every active master key connected to your wallet — before anyone abuses it.
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#2dd4bf]">✓ No black-box scores</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#fdfbf7]">✓ Direct RPC storage proof</span>
                </div>
              </div>

            </div>


            {/* ================================================================
                TIMELINE 2: SEPARATING PROOF FROM GUESSWORK
                (Left Plain-English Explanation / Right Visual Mockup)
                ================================================================ */}
            <div className="w-full flex flex-col md:flex-row-reverse items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* RIGHT: Visual Snapshot Card (Interactive Tripartite decomposition) */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass-cream rounded-3xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-white/25">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fde68a]" />
                      <span className="font-bold text-[#fdfbf7]">TRIPARTITE REASONING MATRIX</span>
                    </div>
                    <span className="text-[#fde68a] text-[9px] font-mono">Epistemic Clarity</span>
                  </div>

                  {/* Interactive Tripartite Tabs */}
                  <div className="flex gap-1 mb-3 bg-white/[0.08] backdrop-blur-md p-1 rounded-xl border border-white/15">
                    <button
                      onClick={() => setActiveTabT2('observed')}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                        activeTabT2 === 'observed' ? 'bg-[#2dd4bf]/25 text-[#2dd4bf] border border-[#2dd4bf]/40' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      1. Observed
                    </button>
                    <button
                      onClick={() => setActiveTabT2('inferred')}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                        activeTabT2 === 'inferred' ? 'bg-[#fef3c7]/25 text-[#fde68a] border border-[#fde68a]/40' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2. Inferred
                    </button>
                    <button
                      onClick={() => setActiveTabT2('unknown')}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                        activeTabT2 === 'unknown' ? 'bg-[#fdfbf7]/20 text-[#fdfbf7] border border-white/30' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      3. Unknown
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="p-4 bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/15 min-h-[140px] flex flex-col justify-center">
                    {activeTabT2 === 'observed' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#2dd4bf] font-mono font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OBSERVED: Mathematical Facts</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-200 leading-relaxed">
                          "Storage Slot [0x02] in USDC token contract holds value 0xffffff... for Spender 0x68b...Fc45."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#2dd4bf] bg-[#2dd4bf]/15 px-2 py-0.5 rounded border border-[#2dd4bf]/30 font-medium">
                          Verified by EVM Merkle Patricia Proof
                        </span>
                      </div>
                    )}

                    {activeTabT2 === 'inferred' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#fde68a] font-mono font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                          <span>INFERRED: Deductions & Attack Vectors</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-200 leading-relaxed">
                          "If that unverified spender contract is compromised, the attacker can drain up to your entire 3,840 USDC balance."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#fde68a] bg-[#fde68a]/15 px-2 py-0.5 rounded border border-[#fde68a]/30 font-medium">
                          Logical deduction from bytecode authority
                        </span>
                      </div>
                    )}

                    {activeTabT2 === 'unknown' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#fdfbf7] font-mono font-bold text-xs">
                          <HelpCircle className="w-4 h-4 text-slate-300" />
                          <span>UNKNOWN: Our Honest Limits</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-200 leading-relaxed">
                          "We cannot prove off-chain identity. Whether the counterparty is evil or well-intentioned cannot be proven by code alone."
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#fdfbf7] bg-white/10 px-2 py-0.5 rounded border border-white/20 font-medium">
                          Never a fake green 'SAFE' badge
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <span>Click tabs above to preview how Sentinel separates evidence</span>
                  </div>
                </div>
              </div>

              {/* LEFT: Layman's Explanation */}
              <div className="w-full md:w-[46%] text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-[#fde68a] uppercase tracking-wider mb-2">
                  Timeline 02 • Evidence Separation
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#fdfbf7] tracking-tight mb-2">
                  We Never Guess. We Split Reality Into 3 Honest Truths.
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-2xl liquid-glass-beige border-l-3 border-l-[#fde68a] mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-[#fdfbf7] block mb-1">⚖️ The Courtroom Analogy:</strong>
                  "A real courtroom strictly separates security camera footage (undeniable facts), detective hypotheses (deductions), and things no one witnessed (unknowns). Sentinel does the exact same thing for Web3."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>Most security scanners spit out an opaque number like "Risk: 85%". That causes panic and tells you nothing useful.</span>
                  <span className="block mt-2">
                    Sentinel strictly separates <strong>Observed Facts</strong> (verified on-chain with math), <strong>Inferred Risks</strong> (what the code allows), and <strong>Unknowns</strong> (what no algorithm can verify).
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#2dd4bf]">🟢 Facts Proved</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#fde68a]">🟡 Deductions</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#fdfbf7]">⚪ Honest Limits</span>
                </div>
              </div>

            </div>


            {/* ================================================================
                TIMELINE 3: EXACT DOLLARS IN DANGER & 1-CLICK RESOLUTION
                (Left Visual Mockup / Right Plain-English Explanation)
                ================================================================ */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pl-8 sm:pl-10 md:pl-0 relative">
              
              {/* LEFT: Visual Snapshot Card (Blast radius dollar meter & revoke button) */}
              <div className="w-full md:w-[46%] group">
                <div className="liquid-glass-beige rounded-3xl p-5 shadow-2xl relative overflow-hidden liquid-card-hover border border-white/25">
                  
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#fde68a]" />
                      <span className="font-bold text-[#fdfbf7]">VERIFIABLE BLAST RADIUS METER</span>
                    </div>
                    <span className="text-[#fde68a] font-bold text-[9px] bg-[#fde68a]/15 px-2 py-0.5 rounded border border-[#fde68a]/30">
                      Calculated Down to the Penny
                    </span>
                  </div>

                  {/* Big Dollar Blast Radius Display */}
                  <div className="p-4 bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md rounded-2xl border border-white/20 text-center mb-3">
                    <div className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                      Liquid Cash Drainable Right Now:
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-[#fde68a] my-1">
                      {simulatedRevoked ? '$0.00' : '$3,840.00'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-200">
                      {simulatedRevoked ? '✅ Permission Revoked • Vault 100% Sealed' : '3,840 USDC in alex-defi.eth'}
                    </div>
                  </div>

                  {/* 1-Click Revoke Simulation Box */}
                  <div className="p-3.5 bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/15 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span>Generated Zero-Allowance Calldata:</span>
                      <button
                        onClick={handleCopyCode}
                        className="text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-2 bg-white/[0.08] backdrop-blur-md rounded-xl font-mono text-[10px] text-[#2dd4bf] break-all border border-white/15">
                      0x095ea7b3...0000000000000000000000000000000000000000
                    </div>

                    <button
                      onClick={() => setSimulatedRevoked(!simulatedRevoked)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black font-mono transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        simulatedRevoked
                          ? 'bg-[#2dd4bf] text-[#042f2e] hover:bg-[#2dd4bf]/90'
                          : 'bg-gradient-to-r from-[#fdfbf7] via-[#5eead4] to-[#2dd4bf] text-[#042f2e] hover:opacity-95 border border-[#2dd4bf]/40 shadow-[0_4px_20px_rgba(45,212,191,0.25)]'
                      }`}
                    >
                      <span>{simulatedRevoked ? 'Vault Sealed (Click to Reset)' : 'Simulate Revoke Tx (Zero Gas)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2 text-[10px] font-mono text-center text-slate-300">
                    Try clicking the button above to simulate how Sentinel neutralizes threats instantly.
                  </div>
                </div>
              </div>

              {/* RIGHT: Layman's Explanation */}
              <div className="w-full md:w-[46%] text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono text-[#fdfbf7] uppercase tracking-wider mb-2">
                  Timeline 03 • Action & Fix
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#fdfbf7] tracking-tight mb-2">
                  Exact Cash in Danger + A 1-Click Button to Lock the Door.
                </h3>
                
                {/* Layman Analogy Callout */}
                <div className="p-3.5 rounded-2xl liquid-glass-beige border-l-3 border-l-[#efe4d0] mb-4 text-xs text-slate-200 leading-relaxed font-sans">
                  <strong className="text-[#fdfbf7] block mb-1">🚒 The Fire Extinguisher Analogy:</strong>
                  "If your house is in danger, you don't want someone to tell you 'Threat Level 7'. You want to know exactly what is at risk, and you want someone to hand you the fire extinguisher immediately."
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  <span>Sentinel calculates your exact <strong>Liquid Blast Radius</strong> down to the penny (e.g. <strong>$3,840.00</strong>) — not an abstract rating.</span>
                  <span className="block mt-2">
                    Then, Sentinel generates the exact zero-allowance transaction calldata required to revoke that permission forever. You click one button, and the dangerous access is sealed shut before any hacker can exploit it.
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#fde68a] font-bold">Exact Dollar Exposure</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#2dd4bf] font-bold">1-Click Revoke</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-[#fdfbf7]">Zero Guesswork</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
