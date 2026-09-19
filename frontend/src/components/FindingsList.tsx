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
          badge: 'bg-bad/12 text-bad border-bad/25',
          indicator: 'bg-bad',
        };
      case 'HIGH':
        return {
          badge: 'bg-bad/10 text-bad border-bad/20',
          indicator: 'bg-bad/70',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-warn/12 text-warn border-warn/25',
          indicator: 'bg-warn',
        };
      case 'LOW':
        return {
          badge: 'bg-accent/12 text-accent border-accent/25',
          indicator: 'bg-accent',
        };
      case 'INFORMATIONAL':
      default:
        return {
          badge: 'bg-white/55 text-ink-2 border-[#171a1f]/10',
          indicator: 'bg-ink-3',
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
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-accent mb-1 font-medium">
            Verifiable Findings
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>Diagnostic Findings</span>
            <span className="text-xs px-2 py-0.5 rounded-full liquid-glass-subtle text-ink-2">
              {findings.length}
            </span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Cryptographic state evidence decomposed into Observed facts, Inferred risks, and Epistemic bounds.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl self-start">
          <Filter className="w-3.5 h-3.5 text-ink-3 ml-2 mr-1" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                filterSeverity === sev
                  ? 'bg-white/80 text-ink font-semibold shadow-sm'
                  : 'text-ink-3 hover:text-ink'
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
          <div className="liquid-glass rounded-3xl p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-ok/12 border border-ok/25 flex items-center justify-center text-ok mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">
              Zero Active Findings Detected
            </h3>
            <p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
              Target address has no high-risk token approvals, vulnerable proxy patterns, or compromised administrative permissions within the analyzed on-chain scope.
            </p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="liquid-glass-subtle rounded-2xl p-6 text-center">
            <HelpCircle className="w-7 h-7 text-ink-3 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-ink">No {filterSeverity} Findings</h4>
            <p className="text-[11px] text-ink-3 mt-0.5">
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
              className={`liquid-glass rounded-3xl p-5 sm:p-6 transition cursor-pointer relative overflow-hidden liquid-card-hover group ${
                isSelected
                  ? 'border-accent/50 shadow-lg shadow-accent/10'
                  : ''
              }`}
            >
              {/* Left severity indicator */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${style.indicator}`} />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Finding Details */}
                <div className="space-y-2.5 flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${style.badge}`}>
                      {f.severity}
                    </span>

                    {/* Confidence Tag */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 border ${
                      f.confidence === 'OBSERVED' 
                        ? 'bg-ok/12 text-ok border-ok/25' 
                        : f.confidence === 'INFERRED'
                        ? 'bg-warn/12 text-warn border-warn/25'
                        : 'bg-white/55 text-ink-2 border-[#171a1f]/10'
                    }`}>
                      {f.confidence === 'OBSERVED' && <CheckCircle2 className="w-3 h-3 text-ok" />}
                      {f.confidence === 'INFERRED' && <TrendingUp className="w-3 h-3 text-warn" />}
                      {f.confidence === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-ink-3" />}
                      <span>{f.confidence}</span>
                    </span>

                    <span className="text-[10px] text-ink-3">
                      // {f.category}
                    </span>

                    {f.dollarAtRisk && (
                      <span className="text-xs font-bold text-warn bg-warn/10 px-2.5 py-0.5 rounded-md border border-warn/20 ml-auto lg:ml-0">
                        ${f.dollarAtRisk.toLocaleString()} blast radius
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-ink group-hover:text-accent transition">
                    {f.title}
                  </h3>
                  <p className="text-xs text-ink-2 leading-relaxed max-w-3xl">
                    {f.summary}
                  </p>

                  {/* Tripartite Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 text-[11px]">
                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-accent">
                      <span className="text-accent font-semibold block text-[10px] uppercase mb-0.5">Observed Fact</span>
                      <span className="text-ink-2 line-clamp-2 leading-relaxed">{f.tripartite.observed[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-warn">
                      <span className="text-warn font-semibold block text-[10px] uppercase mb-0.5">Inferred Impact</span>
                      <span className="text-ink-2 line-clamp-2 leading-relaxed">{f.tripartite.inferred[0]}</span>
                    </div>

                    <div className="liquid-glass-subtle rounded-xl p-2.5 border-l-2 border-l-ink-3">
                      <span className="text-ink-2 font-semibold block text-[10px] uppercase mb-0.5">Epistemic Bound</span>
                      <span className="text-ink-2 line-clamp-2 leading-relaxed">{f.tripartite.unknown[0]}</span>
                    </div>
                  </div>

                  {/* Metadata Proof Chips — glass wells, mono for identifiers */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-ink-2">
                    {f.evidence.transactionHash && (
                      <div className="flex items-center gap-1 glass-well px-2 py-0.5">
                        <Hash className="w-3 h-3 text-ink-3" />
                        <span className="font-mono">Tx: {f.evidence.transactionHash.slice(0, 8)}...</span>
                      </div>
                    )}
                    {f.token && (
                      <div className="flex items-center gap-1 glass-well px-2 py-0.5">
                        <Coins className="w-3 h-3 text-ink-3" />
                        <span>Asset: {f.token.symbol}</span>
                      </div>
                    )}
                    {f.spender && (
                      <div className="flex items-center gap-1 glass-well px-2 py-0.5">
                        <Layers className="w-3 h-3 text-ink-3" />
                        <span>Spender: {f.spender.label || `${f.spender.address.slice(0, 6)}...`}</span>
                      </div>
                    )}
                    {f.evidence.blockNumber && (
                      <span className="text-ink-3 font-mono">Block #{f.evidence.blockNumber}</span>
                    )}
                  </div>

                </div>

                {/* Inspect Trigger Button */}
                <div className="lg:self-center shrink-0">
                  <button
                    type="button"
                    className="w-full lg:w-auto px-4 py-2 rounded-xl liquid-pill text-ink-2 text-xs font-semibold flex items-center justify-center gap-2 group-hover:text-accent transition"
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
          <div className="text-center py-4 px-3 rounded-2xl liquid-glass-subtle text-xs text-ink-2">
            Showing top 100 of {filteredFindings.length} findings. Use severity filters above to narrow your query.
          </div>
        )}
      </div>

    </div>
  );
};
