import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  Coins,
  TrendingUp,
  ShieldAlert,
  HelpCircle as UnknownIcon
} from 'lucide-react';
import type { InvestigationReport } from '../types/sentinel';

interface InvestigationHeaderProps {
  report: InvestigationReport;
}

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const ces = report.currentExposureSummary;
  const nativeEth = (() => {
    try {
      return (Number(BigInt(ces?.nativeBalanceWei ?? '0') / 10n ** 15n) / 1000).toFixed(4);
    } catch {
      return '0.0000';
    }
  })();
  const positiveTokens = ces ? ces.tokens.filter((t) => t.positive).length : 0;
  const totalTokens = ces ? ces.tokens.length : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 relative overflow-hidden shadow-2xl">
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Entity Profile */}
        <div className="space-y-2.5">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase bg-ink/5 border border-[var(--border-1)] text-ink-2">
              {report.entityType.replace('_', ' ')}
            </span>

            {/* Data Provenance Indicator */}
            {report.dataMode === 'REAL' ? (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase bg-ok/12 border border-ok/25 text-ok font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse"></span>
                <span>LIVE RPC / ETHERSCAN (REAL)</span>
              </span>
            ) : report.dataMode === 'DEMO' ? (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase bg-warn/12 border border-warn/25 text-warn font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warn"></span>
                <span>DEMO DATA (LOCAL FIXTURES)</span>
              </span>
            ) : report.dataMode === 'MIXED' ? (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase bg-accent/12 border border-accent/25 text-accent font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                <span>MIXED PROVENANCE</span>
              </span>
            ) : report.dataMode === 'PRESET' ? (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase bg-ink/5 border border-[var(--border-1)] text-ink-2 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-3"></span>
                <span>PRESET SCENARIO</span>
              </span>
            ) : null}

            {/* Network Chain Badge */}
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium liquid-glass-subtle text-ink-2 flex items-center gap-1.5">
              <span>{report.chain.icon}</span>
              <span>{report.chain.name}</span>
              <span className="text-[10px] text-ink-3 font-mono">#{report.chain.latestBlock}</span>
            </span>

            {/* Timestamp */}
            <span className="text-[11px] text-ink-3 flex items-center gap-1">
              <Clock className="w-3 h-3 text-ink-3" />
              <span>{new Date(report.investigatedAt).toLocaleTimeString()} UTC</span>
            </span>
          </div>

          {/* Target Address & Names */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
              {report.ensName || report.contractName || `${report.targetAddress.slice(0, 10)}...${report.targetAddress.slice(-8)}`}
            </h2>

            {(report.ensName || report.contractName) && (
              <span className="text-xs font-mono text-ink-2 glass-well px-2 py-0.5">
                {report.targetAddress.slice(0, 6)}...{report.targetAddress.slice(-4)}
              </span>
            )}

            {/* Quick Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-ink-3 hover:text-accent hover:bg-ink/10 rounded-lg transition"
              title="Copy EVM Address"
            >
              {copied ? <Check className="w-4 h-4 text-ok" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Explorer link */}
            <a
              href={`${report.chain.blockExplorer}/address/${report.targetAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-ink-3 hover:text-accent hover:bg-ink/10 rounded-lg transition"
              title="View on Block Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Right: Structured Current Exposure (NOT a single $ figure) */}
        <div className="flex flex-wrap items-center gap-4 liquid-glass-subtle rounded-2xl p-4 self-stretch lg:self-auto justify-between lg:justify-end">
          <div className="border-r border-[var(--border-1)] pr-5">
            <div className="text-[10px] uppercase tracking-wider text-ink-3 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span>Native Balance</span>
            </div>
            <div className="text-2xl font-mono font-bold text-ink mt-0.5">
              {nativeEth} <span className="text-sm text-ink-3 font-sans">ETH</span>
            </div>
            <div className="text-[10px] text-ink-3 font-mono">
              {ces?.nativeBalanceWei === '0' ? 'zero balance ≠ zero exposure' : ces ? 'observed via eth_getBalance' : '—'}
            </div>
          </div>

          <div className="border-r border-[var(--border-1)] pr-5">
            <div className="text-[10px] uppercase tracking-wider text-ink-3 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan" />
              <span>Token Exposure</span>
            </div>
            <div className="text-2xl font-mono font-bold text-ink mt-0.5">
              {positiveTokens}
              <span className="text-sm text-ink-3 font-sans"> / {totalTokens}</span>
            </div>
            <div className="text-[10px] text-ink-3 font-mono truncate max-w-[140px]" title={ces?.blastRadius.note}>
              {ces ? 'raw balances, no USD pricing' : '—'}
            </div>
          </div>

          <div className="pl-1">
            <div className="text-[10px] uppercase tracking-wider text-ink-3 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-bad" />
              <span>Active Vectors</span>
            </div>
            <div className={`text-2xl font-mono font-bold mt-0.5 ${report.currentExposures.length > 0 ? 'text-bad' : 'text-ink'}`}>
              {report.currentExposures.length}
            </div>
            <div className="text-[10px] text-ink-3">
              {report.currentExposures.length === 0
                ? 'No active finding detected'
                : `${report.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} critical/high`}
            </div>
          </div>

        </div>

      </div>

      {/* Coverage uncertainty strip — UNKNOWN is reported honestly, never hidden */}
      {(report.coverageGaps?.length ?? 0) > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3.5 py-2">
          <UnknownIcon className="w-3.5 h-3.5 text-warn shrink-0" />
          <span className="text-[11px] text-ink-2">
            <span className="text-warn font-bold">UNKNOWN:</span> {report.coverageGaps![0]}
            {(report.coverageGaps?.length ?? 0) > 1 && ` (+${(report.coverageGaps?.length ?? 0) - 1} more — see Coverage)`}
          </span>
        </div>
      )}

      {/* Epistemic Status Strip — blue / amber / grey accents */}
      <div className="mt-5 pt-4 border-t border-[var(--border-1)] grid grid-cols-3 gap-3 text-center sm:text-left">
        
        {/* Observed */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-accent">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
          <div className="truncate">
            <div className="text-[9px] uppercase tracking-wider text-accent font-medium">Observed Facts</div>
            <div className="text-xs font-bold text-ink truncate">
              {report.summary.observedFactsCount} State Truths
            </div>
          </div>
        </div>

        {/* Inferred */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-warn">
          <TrendingUp className="w-4 h-4 text-warn shrink-0" />
          <div className="truncate">
            <div className="text-[9px] uppercase tracking-wider text-warn font-medium">Inferred Risks</div>
            <div className="text-xs font-bold text-ink truncate">
              {report.summary.inferredHypothesesCount} Deduced Impacts
            </div>
          </div>
        </div>

        {/* Unknown */}
        <div className="liquid-glass-subtle rounded-xl p-2.5 px-3 flex items-center gap-2.5 border-l-2 border-l-ink-3">
          <HelpCircle className="w-4 h-4 text-ink-2 shrink-0" />
          <div className="truncate">
            <div className="text-[9px] uppercase tracking-wider text-ink-2 font-medium">Unknown Bounds</div>
            <div className="text-xs font-bold text-ink truncate">
              {report.summary.unknownBoundariesCount} Epistemic Bounds
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
