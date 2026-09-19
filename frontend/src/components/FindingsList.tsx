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
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          indicator: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          badge: 'bg-rose-900/40 text-rose-200 border-rose-600/40',
          indicator: 'bg-rose-400',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          indicator: 'bg-amber-400',
        };
      case 'LOW':
        return {
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          indicator: 'bg-blue-400',
        };
      case 'INFORMATIONAL':
      default:
        return {
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          indicator: 'bg-teal-400',
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
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-teal-300 mb-1">
            Verifiable Findings
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Diagnostic Findings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-300">
              {findings.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic state evidence decomposed into Observed facts, Inferred risks, and Epistemic bounds.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl self-start">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                filterSeverity === sev
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className={`liquid-glass rounded-2xl p-5 sm:p-6 transition cursor-pointer relative overflow-hidden liquid-card-hover group ${
                isSelected
                  ? 'border-teal-400 shadow-2xl shadow-teal-500/20'
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
                        ? 'bg-teal-950/70 text-teal-300 border-teal-500/40' 
                        : f.confidence === 'INFERRED'
                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                        : 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                    }`}>
                      {f.confidence === 'OBSERVED' && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                      {f.confidence === 'INFERRED' && <TrendingUp className="w-3 h-3 text-amber-400" />}
                      {f.confidence === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-purple-400" />}
                      <span>{f.confidence}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      // {f.category}
                    </span>

                    {f.dollarAtRisk && (
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40 ml-auto lg:ml-0">
                        ${f.dollarAtRisk.toLocaleString()} blast radius
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {f.summary}
                  </p>

                  {/* Tripartite Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 text-[11px] font-mono">
                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-teal-400">
                      <span className="text-teal-400 font-bold block text-[10px] uppercase mb-0.5">OBSERVED FACT</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.observed[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-amber-400">
                      <span className="text-amber-400 font-bold block text-[10px] uppercase mb-0.5">INFERRED IMPACT</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.inferred[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-purple-400">
                      <span className="text-purple-400 font-bold block text-[10px] uppercase mb-0.5">EPISTEMIC BOUND</span>
                      <span className="text-slate-300 line-clamp-2 leading-relaxed">{f.tripartite.unknown[0]}</span>
                    </div>
                  </div>

                  {/* Metadata Proof Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                    {f.evidence.transactionHash && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        <span>Tx: {f.evidence.transactionHash.slice(0, 8)}...</span>
                      </div>
                    )}
                    {f.token && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>Asset: {f.token.symbol}</span>
                      </div>
                    )}
                    {f.spender && (
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Spender: {f.spender.label || `${f.spender.address.slice(0, 6)}...`}</span>
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
                    className="w-full lg:w-auto px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 group-hover:border-teal-400 transition shadow-lg"
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
