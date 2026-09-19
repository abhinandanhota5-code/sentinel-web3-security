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
          badge: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
          indicator: 'bg-rose-400',
        };
      case 'HIGH':
        return {
          badge: 'bg-rose-500/10 text-rose-300 border-rose-400/25',
          indicator: 'bg-rose-400/80',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-[#fef3c7]/20 text-[#fde68a] border-[#fde68a]/30',
          indicator: 'bg-[#fde68a]',
        };
      case 'LOW':
        return {
          badge: 'bg-[#7dd3fc]/15 text-[#7dd3fc] border-[#7dd3fc]/30',
          indicator: 'bg-[#7dd3fc]',
        };
      case 'INFORMATIONAL':
      default:
        return {
          badge: 'bg-[#cbd5e1]/15 text-[#cbd5e1] border-slate-400/30',
          indicator: 'bg-[#cbd5e1]',
        };
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (filterSeverity === 'ALL') return true;
    return f.severity === filterSeverity;
  });

  const displayedFindings = filteredFindings.slice(0, 100);

  return (
    <div className="mb-10">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#2dd4bf] mb-1 border border-[#2dd4bf]/30 bg-[#064e3b]/20">
            Verifiable Findings
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] flex items-center gap-2">
            <span>Diagnostic Findings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-300 border border-white/10">
              {findings.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Cryptographic state evidence decomposed into Observed facts, Inferred risks, and Epistemic bounds.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl self-start border border-white/15">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                filterSeverity === sev
                  ? 'liquid-pill text-[#fdfbf7] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-[#fdfbf7]'
              }`}
            >
              {sev === 'INFORMATIONAL' ? 'INFO' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Liquid Cards List */}
      <div className="space-y-4">
        {findings.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-8 sm:p-10 text-center border border-white/15">
            <div className="w-12 h-12 rounded-2xl bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 flex items-center justify-center text-[#2dd4bf] mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#fdfbf7] font-mono mb-1">
              Zero Active Findings Detected
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Target address has no high-risk token approvals, vulnerable proxy patterns, or compromised administrative permissions within the analyzed on-chain scope.
            </p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="liquid-glass-subtle rounded-2xl p-6 text-center border border-white/10">
            <HelpCircle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-[#fdfbf7] font-mono">No {filterSeverity} Findings</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              None of the {findings.length} analyzed findings match severity filter "{filterSeverity}".
            </p>
          </div>
        ) : (
          displayedFindings.map((f) => {
            const style = getSeverityStyle(f.severity);
            const isSelected = selectedFindingId === f.id;

            return (
            <div
              key={f.id}
              onClick={() => onSelectFinding(f)}
              className={`liquid-glass rounded-3xl p-5 sm:p-6 transition cursor-pointer relative overflow-hidden liquid-card-hover group border border-white/15 ${
                isSelected
                  ? 'border-[#2dd4bf]/60 shadow-2xl shadow-[#2dd4bf]/15'
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
                        ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/30' 
                        : f.confidence === 'INFERRED'
                        ? 'bg-[#fef3c7]/20 text-[#fde68a] border-[#fde68a]/30'
                        : 'bg-[#cbd5e1]/15 text-[#cbd5e1] border-slate-400/30'
                    }`}>
                      {f.confidence === 'OBSERVED' && <CheckCircle2 className="w-3 h-3 text-[#2dd4bf]" />}
                      {f.confidence === 'INFERRED' && <TrendingUp className="w-3 h-3 text-[#fde68a]" />}
                      {f.confidence === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-[#cbd5e1]" />}
                      <span>{f.confidence}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      // {f.category}
                    </span>

                    {f.dollarAtRisk && (
                      <span className="text-xs font-mono font-bold text-[#fde68a] bg-[#fde68a]/10 px-2.5 py-0.5 rounded-md border border-[#fde68a]/30 ml-auto lg:ml-0">
                        ${f.dollarAtRisk.toLocaleString()} blast radius
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-[#fdfbf7] group-hover:text-[#2dd4bf] transition">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {f.summary}
                  </p>

                  {/* Tripartite Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 text-[11px] font-mono">
                    <div className="liquid-glass-teal rounded-xl p-2.5 border-l-2 border-l-[#2dd4bf]">
                      <span className="text-[#2dd4bf] font-bold block text-[10px] uppercase mb-0.5">OBSERVED FACT</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.observed[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-[#fde68a]">
                      <span className="text-[#fde68a] font-bold block text-[10px] uppercase mb-0.5">INFERRED IMPACT</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.inferred[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-[#cbd5e1]">
                      <span className="text-[#cbd5e1] font-bold block text-[10px] uppercase mb-0.5">EPISTEMIC BOUND</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.unknown[0]}</span>
                    </div>
                  </div>

                  {/* Metadata Proof Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-300">
                    {f.evidence.transactionHash && (
                      <div className="flex items-center gap-1 bg-white/[0.08] backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                        <Hash className="w-3 h-3 text-[#bae6fd]" />
                        <span className="text-slate-200">Tx: {f.evidence.transactionHash.slice(0, 8)}...</span>
                      </div>
                    )}
                    {f.token && (
                      <div className="flex items-center gap-1 bg-white/[0.08] backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                        <Coins className="w-3 h-3 text-[#fde68a]" />
                        <span className="text-slate-200">Asset: {f.token.symbol}</span>
                      </div>
                    )}
                    {f.spender && (
                      <div className="flex items-center gap-1 bg-white/[0.08] backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                        <Layers className="w-3 h-3 text-[#fdfbf7]" />
                        <span className="text-slate-200">Spender: {f.spender.label || `${f.spender.address.slice(0, 6)}...`}</span>
                      </div>
                    )}
                    {f.evidence.blockNumber && (
                      <span className="text-slate-400">Block #{f.evidence.blockNumber}</span>
                    )}
                  </div>

                </div>

                {/* Inspect Trigger Button */}
                <div className="lg:self-center shrink-0">
                  <button
                    type="button"
                    className="w-full lg:w-auto px-4 py-2 rounded-xl liquid-pill text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 group-hover:border-[#2dd4bf]/50 group-hover:text-[#2dd4bf] transition shadow-lg"
                  >
                    <span>Inspect Evidence</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>
                </div>

              </div>

            </div>
          );
        }))}

        {filteredFindings.length > 100 && (
          <div className="text-center py-4 px-3 rounded-2xl liquid-glass-subtle border border-white/10 text-xs font-mono text-slate-300">
            Showing top 100 of {filteredFindings.length} findings. Use severity filters above to narrow your query.
          </div>
        )}
      </div>

    </div>
  );
};
