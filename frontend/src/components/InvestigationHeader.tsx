import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import type { InvestigationReport } from '../types/sentinel';

interface InvestigationHeaderProps {
  report: InvestigationReport;
}

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report.targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 relative overflow-hidden shadow-2xl border border-white/20">
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Entity Profile */}
        <div className="space-y-2.5">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase bg-white/10 border border-white/20 text-[#bae6fd]">
              {report.entityType.replace('_', ' ')}
            </span>

            {/* Network Chain Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium liquid-glass-subtle text-slate-300 flex items-center gap-1.5 border border-white/10">
              <span>{report.chain.icon}</span>
              <span>{report.chain.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">#{report.chain.latestBlock}</span>
            </span>

            {/* Timestamp */}
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{new Date(report.investigatedAt).toLocaleTimeString()} UTC</span>
            </span>
          </div>

          {/* Target Address & Names */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#fdfbf7] flex items-center gap-2">
              {report.ensName || report.contractName || `${report.targetAddress.slice(0, 10)}...${report.targetAddress.slice(-8)}`}
            </h2>

            {(report.ensName || report.contractName) && (
              <span className="text-xs font-mono text-slate-400 bg-black/30 px-2 py-0.5 rounded-lg border border-white/10">
                {report.targetAddress.slice(0, 6)}...{report.targetAddress.slice(-4)}
              </span>
            )}

            {/* Quick Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-[#7dd3fc] hover:bg-white/10 rounded-lg transition"
              title="Copy EVM Address"
            >
              {copied ? <Check className="w-4 h-4 text-[#7dd3fc]" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Explorer link */}
            <a
              href={`${report.chain.blockExplorer}/address/${report.targetAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-[#7dd3fc] hover:bg-white/10 rounded-lg transition"
              title="View on Block Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Right: Blast Radius Liquid Gauge */}
        <div className="flex flex-wrap items-center gap-4 liquid-glass-subtle rounded-2xl p-4 self-stretch lg:self-auto justify-between lg:justify-end border border-white/15">
          
          <div className="border-r border-white/10 pr-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#fde68a]" />
              <span>Current Blast Radius</span>
            </div>
            <div className={`text-2xl font-mono font-bold mt-0.5 ${report.totalBlastRadiusUsd > 0 ? 'text-rose-300' : 'text-[#7dd3fc]'}`}>
              {formatUsd(report.totalBlastRadiusUsd)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {report.totalBlastRadiusUsd > 0 ? 'Liquid funds exposed' : 'Zero liquid funds exposed'}
            </div>
          </div>

          <div className="pl-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
              <span>Active Vectors</span>
            </div>
            <div className="text-2xl font-mono font-bold text-[#fdfbf7] mt-0.5">
              {report.currentExposures.length}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {report.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} critical/high
            </div>
          </div>

        </div>

      </div>

      {/* Epistemic Status Strip in Soft Blue, Cream, and Soft Gray */}
      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center sm:text-left">
        
        {/* Observed */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-[#7dd3fc]">
          <CheckCircle2 className="w-4 h-4 text-[#7dd3fc] shrink-0" />
          <div className="truncate">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#7dd3fc]">Observed Facts</div>
            <div className="text-xs font-bold font-mono text-[#fdfbf7] truncate">
              {report.summary.observedFactsCount} State Truths
            </div>
          </div>
        </div>

        {/* Inferred */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-[#fde68a]">
          <TrendingUp className="w-4 h-4 text-[#fde68a] shrink-0" />
          <div className="truncate">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#fde68a]">Inferred Risks</div>
            <div className="text-xs font-bold font-mono text-[#fdfbf7] truncate">
              {report.summary.inferredHypothesesCount} Deduced Impacts
            </div>
          </div>
        </div>

        {/* Unknown */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-[#cbd5e1]">
          <HelpCircle className="w-4 h-4 text-[#cbd5e1] shrink-0" />
          <div className="truncate">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#cbd5e1]">Unknown Bounds</div>
            <div className="text-xs font-bold font-mono text-[#fdfbf7] truncate">
              {report.summary.unknownBoundariesCount} Epistemic Bounds
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
