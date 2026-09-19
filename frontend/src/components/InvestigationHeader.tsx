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
  ShieldAlert,
  History,
  Zap,
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

  const isTx = report.targetType === 'TRANSACTION' || report.targetAddress.length === 66;

  // Derive concise state labels
  const historicalCount = report.historicalActivities.length;
  const historicalStatus = historicalCount > 0 
    ? `${historicalCount} Historical Event${historicalCount > 1 ? 's' : ''}` 
    : 'No historical anomalies';

  const exposureCount = report.currentExposures.length;
  const exposureStatus = exposureCount > 0 
    ? `${exposureCount} Active Exposure${exposureCount > 1 ? 's' : ''}` 
    : 'No active exposure';

  const vectorCount = report.activeSecurityVectors?.length ?? (report.currentExposures.length + (report.findings.filter(f => f.findingType !== 'NO_ACTIVE_FINDINGS').length > 0 ? 1 : 0));
  const vectorStatus = vectorCount > 0 
    ? `${vectorCount} Active Vector${vectorCount > 1 ? 's' : ''}` 
    : '0 Active Vectors';

  const blastRadiusUsd = report.totalBlastRadiusUsd;
  const blastRadiusStatus = blastRadiusUsd > 0 
    ? `${formatUsd(blastRadiusUsd)} Exposed` 
    : 'No liquid funds exposed';

  const hasAnyThreat = report.findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM') || report.currentExposures.length > 0;

  return (
    <div className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden shadow-2xl border border-white/15">
      
      {/* SECTION 1: Top of Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-5 border-b border-white/10">
        
        {/* Left: Investigation Entity / Transaction */}
        <div className="space-y-2.5">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Investigation Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-semibold bg-[#5B7FA6]/15 border border-[#5B7FA6]/30 text-[#9ac2e8]">
              Investigation
            </span>

            {/* Target Type Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase bg-white/[0.06] border border-white/15 text-slate-300">
              {isTx ? 'Transaction' : report.entityType.replace('_', ' ')}
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

          {/* Target Address / Tx & Names */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              {report.ensName || report.contractName || `${report.targetAddress.slice(0, 10)}...${report.targetAddress.slice(-8)}`}
            </h2>

            {(report.ensName || report.contractName || isTx) && (
              <span className="text-xs font-mono text-slate-300 bg-white/[0.06] backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/15">
                {report.targetAddress.slice(0, 8)}...{report.targetAddress.slice(-6)}
              </span>
            )}

            {/* Quick Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title={isTx ? 'Copy Transaction Hash' : 'Copy EVM Address'}
            >
              {copied ? <Check className="w-4 h-4 text-[#8cc4a1]" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Explorer link */}
            <a
              href={`${report.chain.blockExplorer}/${isTx ? 'tx' : 'address'}/${report.targetAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="View on Block Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Primary Conclusion (NEVER display SAFE when no finding detected) */}
          <div className="text-xs font-mono">
            {!hasAnyThreat ? (
              <span className="inline-flex items-center gap-1.5 text-[#88b0d8] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8cc4a1]" />
                <span>No active finding detected</span>
                <span className="text-slate-400 font-normal text-[11px]">— all queried allowance & proxy vectors cleared</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#d97f7f] font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-[#d97f7f]" />
                <span>Active attack / exposure surfaces detected</span>
                <span className="text-slate-400 font-normal text-[11px]">— examine active vectors & blast radius below</span>
              </span>
            )}
          </div>

        </div>

        {/* Right: Concise State Summary Bar (Historical Finding, Current Exposure, Active Vectors, Blast Radius) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          
          {/* 1. Historical Finding */}
          <div className="liquid-glass-subtle rounded-xl p-3 border border-white/10 flex flex-col justify-between min-w-[130px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-[#88b0d8]" />
              <span>Historical Finding</span>
            </div>
            <div className="text-sm font-mono font-semibold text-white mt-1 truncate">
              {historicalStatus}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Settled on-chain
            </div>
          </div>

          {/* 2. Current Exposure */}
          <div className="liquid-glass-subtle rounded-xl p-3 border border-white/10 flex flex-col justify-between min-w-[130px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#dfba82]" />
              <span>Current Exposure</span>
            </div>
            <div className={`text-sm font-mono font-semibold mt-1 truncate ${exposureCount > 0 ? 'text-[#dfba82]' : 'text-slate-300'}`}>
              {exposureStatus}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Live in state
            </div>
          </div>

          {/* 3. Active Vectors */}
          <div className="liquid-glass-subtle rounded-xl p-3 border border-white/10 flex flex-col justify-between min-w-[130px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#d97f7f]" />
              <span>Active Vectors</span>
            </div>
            <div className={`text-sm font-mono font-semibold mt-1 truncate ${vectorCount > 0 ? 'text-[#d97f7f]' : 'text-slate-300'}`}>
              {vectorStatus}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Attack pathways
            </div>
          </div>

          {/* 4. Blast Radius */}
          <div className="liquid-glass-subtle rounded-xl p-3 border border-white/10 flex flex-col justify-between min-w-[130px]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Blast Radius</span>
            </div>
            <div className={`text-sm font-mono font-semibold mt-1 truncate ${blastRadiusUsd > 0 ? 'text-[#d97f7f]' : 'text-slate-300'}`}>
              {blastRadiusStatus}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Potential exposure
            </div>
          </div>

        </div>

      </div>

      {/* Epistemic Verification Strip */}
      <div className="mt-3.5 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#8cc4a1]" />
            <span>Observed Facts: {report.summary.observedFactsCount}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-[#dfba82]" />
            <span>Inferred Risks: {report.summary.inferredHypothesesCount}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Unknown Bounds: {report.summary.unknownBoundariesCount}</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Source: <strong className="text-slate-200">Deterministic Blockchain Storage Engine</strong>
        </div>
      </div>

    </div>
  );
};
