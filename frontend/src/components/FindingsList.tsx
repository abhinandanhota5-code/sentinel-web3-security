import React, { useState } from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  ChevronRight, 
  Coins, 
  Hash, 
  Layers, 
  Filter
} from 'lucide-react';
import type { Finding, SeverityLevel } from '../types/sentinel';

interface FindingsListProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  selectedFindingId?: string;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onSelectFinding,
  selectedFindingId,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const getSeverityStyle = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          badge: 'bg-[#fca5a5]/15 text-[#fca5a5] border-[#fca5a5]/30',
          indicator: 'bg-[#fca5a5]',
        };
      case 'HIGH':
        return {
          badge: 'bg-[#fda4af]/15 text-[#fda4af] border-[#fda4af]/30',
          indicator: 'bg-[#fda4af]',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-[#fed7aa]/15 text-[#fed7aa] border-[#fed7aa]/30',
          indicator: 'bg-[#fed7aa]',
        };
      case 'LOW':
        return {
          badge: 'bg-[#a7f3d0]/15 text-[#a7f3d0] border-[#a7f3d0]/30',
          indicator: 'bg-[#a7f3d0]',
        };
      case 'INFORMATIONAL':
      default:
        return {
          badge: 'bg-[#d8b4fe]/15 text-[#d8b4fe] border-[#d8b4fe]/30',
          indicator: 'bg-[#d8b4fe]',
        };
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (filterSeverity === 'ALL') return true;
    return f.severity === filterSeverity;
  });

  return (
    <div className="mb-10">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#a7f3d0] mb-1">
            Verifiable Findings
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <span>Diagnostic Findings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-stone-300">
              {findings.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Cryptographic state evidence decomposed into Observed facts, Inferred risks, and Epistemic bounds.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl self-start border border-[#e6ded6]/15">
          <Filter className="w-3.5 h-3.5 text-stone-400 ml-2 mr-1" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                filterSeverity === sev
                  ? 'bg-stone-100/15 text-stone-100 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {sev === 'INFORMATIONAL' ? 'INFO' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Liquid Cards List */}
      <div className="space-y-4">
        {filteredFindings.map((f) => {
          const style = getSeverityStyle(f.severity);
          const isSelected = selectedFindingId === f.id;

          return (
            <div
              key={f.id}
              onClick={() => onSelectFinding(f)}
              className={`liquid-glass rounded-3xl p-5 sm:p-6 transition cursor-pointer relative overflow-hidden liquid-card-hover group border border-[#e6ded6]/15 ${
                isSelected
                  ? 'border-[#a7f3d0]/50 shadow-2xl shadow-[#a7f3d0]/10'
                  : ''
              }`}
            >
              {/* Left indicator glow */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${style.indicator}`} />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Finding Details */}
                <div className="space-y-2.5 flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}>
                      {f.severity}
                    </span>

                    {/* Confidence Tag */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 border ${
                      f.confidence === 'OBSERVED' 
                        ? 'bg-[#a7f3d0]/15 text-[#a7f3d0] border-[#a7f3d0]/30' 
                        : f.confidence === 'INFERRED'
                        ? 'bg-[#fed7aa]/15 text-[#fed7aa] border-[#fed7aa]/30'
                        : 'bg-[#d8b4fe]/15 text-[#d8b4fe] border-[#d8b4fe]/30'
                    }`}>
                      {f.confidence === 'OBSERVED' && <CheckCircle2 className="w-3 h-3 text-[#a7f3d0]" />}
                      {f.confidence === 'INFERRED' && <TrendingUp className="w-3 h-3 text-[#fed7aa]" />}
                      {f.confidence === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-[#d8b4fe]" />}
                      <span>{f.confidence}</span>
                    </span>

                    <span className="text-[10px] font-mono text-stone-400">
                      // {f.category}
                    </span>

                    {f.dollarAtRisk && (
                      <span className="text-xs font-mono font-bold text-[#fca5a5] bg-[#fca5a5]/10 px-2.5 py-0.5 rounded-md border border-[#fca5a5]/30 ml-auto lg:ml-0">
                        ${f.dollarAtRisk.toLocaleString()} blast radius
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-stone-100 group-hover:text-[#a7f3d0] transition">
                    {f.title}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
                    {f.summary}
                  </p>

                  {/* Tripartite Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 text-[11px] font-mono">
                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-[#a7f3d0]">
                      <span className="text-[#a7f3d0] font-bold block text-[10px] uppercase mb-0.5">OBSERVED FACT</span>
                      <span className="text-stone-300 line-clamp-2 leading-relaxed">{f.tripartite.observed[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-[#fed7aa]">
                      <span className="text-[#fed7aa] font-bold block text-[10px] uppercase mb-0.5">INFERRED IMPACT</span>
                      <span className="text-stone-300 line-clamp-2 leading-relaxed">{f.tripartite.inferred[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-[#d8b4fe]">
                      <span className="text-[#d8b4fe] font-bold block text-[10px] uppercase mb-0.5">EPISTEMIC BOUND</span>
                      <span className="text-stone-300 line-clamp-2 leading-relaxed">{f.tripartite.unknown[0]}</span>
                    </div>
                  </div>

                  {/* Metadata Proof Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-stone-400">
                    {f.evidence.transactionHash && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Hash className="w-3 h-3 text-[#d8b4fe]" />
                        <span>Tx: {f.evidence.transactionHash.slice(0, 8)}...</span>
                      </div>
                    )}
                    {f.token && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Coins className="w-3 h-3 text-[#fed7aa]" />
                        <span>Asset: {f.token.symbol}</span>
                      </div>
                    )}
                    {f.spender && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Layers className="w-3 h-3 text-[#d8b4fe]" />
                        <span>Spender: {f.spender.label || `${f.spender.address.slice(0, 6)}...`}</span>
                      </div>
                    )}
                    {f.evidence.blockNumber && (
                      <span className="text-stone-400">Block #{f.evidence.blockNumber}</span>
                    )}
                  </div>

                </div>

                {/* Inspect Trigger Button */}
                <div className="lg:self-center shrink-0">
                  <button
                    type="button"
                    className="w-full lg:w-auto px-4 py-2 rounded-xl bg-stone-50/5 hover:bg-stone-50/10 border border-[#e6ded6]/25 text-stone-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 group-hover:border-[#a7f3d0]/40 group-hover:text-[#a7f3d0] transition shadow-lg"
                  >
                    <span>Inspect Evidence</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
