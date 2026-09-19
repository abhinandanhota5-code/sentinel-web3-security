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
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
          indicator: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          badge: 'bg-rose-900/60 text-rose-200 border-rose-600/40',
          indicator: 'bg-rose-400',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          indicator: 'bg-amber-400',
        };
      case 'LOW':
        return {
          badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
          indicator: 'bg-blue-400',
        };
      case 'INFORMATIONAL':
      default:
        return {
          badge: 'bg-slate-800 text-teal-300 border-teal-500/40',
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
      
      {/* Findings Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 mb-1">
            Section 4 // Verifiable Diagnostics
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Security Findings</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {findings.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Every finding includes verified state observations, derived inferences, and known limits. Click any card to inspect the full evidence drawer.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg self-start">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                filterSeverity === sev
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev === 'INFORMATIONAL' ? 'INFO' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-4">
        {filteredFindings.map((f) => {
          const style = getSeverityStyle(f.severity);
          const isSelected = selectedFindingId === f.id;

          return (
            <div
              key={f.id}
              onClick={() => onSelectFinding(f)}
              className={`glass-panel rounded-xl p-5 transition cursor-pointer border relative overflow-hidden group ${
                isSelected
                  ? 'border-teal-400 bg-slate-900/90 shadow-2xl shadow-teal-500/10'
                  : 'border-slate-800/90 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              {/* Left indicator bar */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${style.indicator}`} />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Finding Details */}
                <div className="space-y-2 flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}>
                      {f.severity}
                    </span>

                    {/* Epistemic Confidence Tag */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 border ${
                      f.confidence === 'OBSERVED' 
                        ? 'bg-teal-950/70 text-teal-300 border-teal-500/40' 
                        : f.confidence === 'INFERRED'
                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                        : 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                    }`}>
                      {f.confidence === 'OBSERVED' && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                      {f.confidence === 'INFERRED' && <TrendingUp className="w-3 h-3 text-amber-400" />}
                      {f.confidence === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-purple-400" />}
                      <span>{f.confidence} EVIDENCE</span>
                    </span>

                    {/* Category */}
                    <span className="text-[11px] font-mono text-slate-400">
                      // {f.category}
                    </span>

                    {/* Dollar at risk if present */}
                    {f.dollarAtRisk && (
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 ml-auto lg:ml-0">
                        ${f.dollarAtRisk.toLocaleString()} at risk
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

                  {/* Concise Tripartite Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                    <div className="bg-slate-950/60 border border-teal-900/30 rounded p-2">
                      <span className="text-teal-400 font-bold block mb-0.5">OBSERVED:</span>
                      <span className="text-slate-300 line-clamp-2">{f.tripartite.observed[0]}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-amber-900/30 rounded p-2">
                      <span className="text-amber-400 font-bold block mb-0.5">INFERRED:</span>
                      <span className="text-slate-300 line-clamp-2">{f.tripartite.inferred[0]}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-purple-900/30 rounded p-2">
                      <span className="text-purple-400 font-bold block mb-0.5">UNKNOWN:</span>
                      <span className="text-slate-300 line-clamp-2">{f.tripartite.unknown[0]}</span>
                    </div>
                  </div>

                  {/* Evidence Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-slate-400">
                    {f.evidence.transactionHash && (
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        <span>Tx: {f.evidence.transactionHash.slice(0, 8)}...{f.evidence.transactionHash.slice(-6)}</span>
                      </div>
                    )}
                    {f.token && (
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>Token: {f.token.symbol}</span>
                      </div>
                    )}
                    {f.spender && (
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Spender: {f.spender.label || `${f.spender.address.slice(0, 6)}...`}</span>
                      </div>
                    )}
                    {f.evidence.blockNumber && (
                      <span className="text-slate-400">Block #{f.evidence.blockNumber}</span>
                    )}
                    {f.evidence.timestamp && (
                      <span className="text-slate-400">{new Date(f.evidence.timestamp).toLocaleDateString()}</span>
                    )}
                  </div>

                </div>

                {/* Right: Inspect Evidence Button */}
                <div className="lg:self-center shrink-0">
                  <button
                    type="button"
                    className="w-full lg:w-auto px-4 py-2 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 group-hover:border-teal-400 transition shadow-lg"
                  >
                    <span>Inspect Evidence</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
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
