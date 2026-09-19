import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  ShieldAlert, 
  DollarSign,
  TrendingUp,
  Cpu
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
    <div className="glass-panel rounded-xl p-6 mb-8 border-slate-700/80 shadow-2xl relative overflow-hidden">
      
      {/* Background accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-500" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Entity Identification */}
        <div className="space-y-2">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Type Badge */}
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold tracking-wide uppercase bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
              {report.entityType.replace('_', ' ')}
            </span>

            {/* Network Chain Badge */}
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
              <span>{report.chain.icon}</span>
              <span>{report.chain.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">#{report.chain.latestBlock}</span>
            </span>

            {/* Investigation Timestamp */}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(report.investigatedAt).toLocaleTimeString()} UTC</span>
            </span>
          </div>

          {/* Target Address & Names */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              {report.ensName || report.contractName || `${report.targetAddress.slice(0, 10)}...${report.targetAddress.slice(-8)}`}
            </h2>

            {(report.ensName || report.contractName) && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                {report.targetAddress.slice(0, 6)}...{report.targetAddress.slice(-4)}
              </span>
            )}

            {/* Quick Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800/80 rounded transition"
              title="Copy EVM Address"
            >
              {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Explorer link */}
            <a
              href={`${report.chain.blockExplorer}/address/${report.targetAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800/80 rounded transition"
              title="View on Block Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Automated state reconstruction completed. 0x memory registers, allowance mappings, and delegate proxies verified.
          </p>

        </div>

        {/* Right: Blast Radius & Exposure Metric */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          
          <div className="border-r border-slate-800 pr-4">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Blast Radius</span>
            </div>
            <div className={`text-2xl font-mono font-bold mt-0.5 ${report.totalBlastRadiusUsd > 0 ? 'text-rose-400' : 'text-teal-300'}`}>
              {formatUsd(report.totalBlastRadiusUsd)}
            </div>
            <div className="text-[10px] text-slate-400">
              {report.totalBlastRadiusUsd > 0 ? 'Liquid assets currently drainable' : 'No liquid value exposed'}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Active Exposures</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white mt-0.5">
              {report.currentExposures.length}
            </div>
            <div className="text-[10px] text-slate-400">
              {report.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} high/critical findings
            </div>
          </div>

        </div>

      </div>

      {/* Epistemic Summary Bar: Observed vs Inferred vs Unknown */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Observed */}
        <div className="bg-slate-900/60 border border-teal-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400">Observed Facts</div>
            <div className="text-base font-bold font-mono text-white">
              {report.summary.observedFactsCount} Verified
            </div>
          </div>
        </div>

        {/* Inferred */}
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Inferred Hypotheses</div>
            <div className="text-base font-bold font-mono text-white">
              {report.summary.inferredHypothesesCount} Deduced
            </div>
          </div>
        </div>

        {/* Unknown */}
        <div className="bg-slate-900/60 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400">Unknown Boundaries</div>
            <div className="text-base font-bold font-mono text-white">
              {report.summary.unknownBoundariesCount} Bounds
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Analysis Engine</div>
            <div className="text-base font-bold font-mono text-white">
              Deterministic
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
