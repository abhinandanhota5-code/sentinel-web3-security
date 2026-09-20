import React from 'react';
import {
  Globe2,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import type { InvestigationReport } from '../types/sentinel';

interface CrossChainIdentityProps {
  report: InvestigationReport;
}

/**
 * Cross-Chain Identity — the same 0x string is NOT automatically the same
 * real-world entity. This card only displays what the current investigation
 * actually observed; activity on other chains is reported as UNKNOWN instead
 * of implying it does not exist.
 */
export const CrossChainIdentity: React.FC<CrossChainIdentityProps> = ({ report }) => {
  const ces = report.currentExposureSummary;
  const delegated = ces?.eip7702?.delegatedTo;
  const observedChains = [report.chain];

  return (
    <section className="liquid-glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-accent" />
            Cross-Chain Identity
          </h3>
          <p className="text-xs text-ink-3 mt-0.5">
            Same address string ≠ same entity. Sentinel only asserts identity across chains
            where it has evidence.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Observed on this chain */}
        <div className="liquid-glass-subtle rounded-2xl p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
            <span className="text-[10px] uppercase tracking-wider text-ok font-bold">
              Observed — investigated chain
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
            <span className="font-mono text-ink">
              {report.chain.icon} {report.chain.name}
            </span>
            <span className="font-mono text-ink-3">
              {report.targetAddress.slice(0, 8)}…{report.targetAddress.slice(-6)}
            </span>
            <span className="text-[10px] text-ink-3">{report.entityType.replace('_', ' ')}</span>
          </div>
          <p className="text-[11px] text-ink-3 leading-relaxed mt-1.5">
            This investigation queried state for this address on {report.chain.name} only. The
            engine produced observations that are specific to this chain.
          </p>
        </div>

        {/* Delegation nuance */}
        {delegated ? (
          <div className="liquid-glass-subtle rounded-2xl p-3.5 border-l-2 border-l-cyan">
            <div className="flex items-center gap-2 mb-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan" />
              <span className="text-[10px] uppercase tracking-wider text-cyan font-bold">
                EIP-7702 Delegation — chain-scoped
              </span>
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              This entity delegates to{' '}
              <span className="font-mono text-technical">
                {delegated.slice(0, 10)}…{delegated.slice(-6)}
              </span>{' '}
              on {report.chain.name}. A delegation designator is a per-chain attribute; it does
              not reveal the true controller of {report.targetAddress.slice(0, 8)}… on other
              chains.
            </p>
          </div>
        ) : (
          <div className="liquid-glass-subtle rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-ink-3" />
              <span className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                No EIP-7702 delegation observed here
              </span>
            </div>
            <p className="text-[11px] text-ink-3 leading-relaxed">
              No 7702 delegation designator was observed on {report.chain.name}. This says nothing
              about other chains, which were not part of this investigation.
            </p>
          </div>
        )}

        {/* UNKNOWN boundaries */}
        <div className="rounded-2xl border border-warn/30 bg-warn/10 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-warn" />
            <span className="text-[10px] uppercase tracking-wider text-warn font-bold">
              UNKNOWN — other chains not queried
            </span>
          </div>
          <p className="text-[11px] text-ink-2 leading-relaxed">
            Whether {report.targetAddress.slice(0, 8)}… has activity, approvals, or delegation on
            Arbitrum, Base, Optimism, Polygon, or elsewhere is{' '}
            <span className="text-warn font-bold">UNKNOWN</span> for this report. Sentinel reports
            this gap instead of merging L1/L2 addresses into a "global identity".
          </p>
        </div>

        <p className="text-[10px] text-ink-3 flex items-center gap-1.5 leading-relaxed">
          <Globe2 className="w-3 h-3 shrink-0" />
          {observedChains.length} chain in evidence scope. To extend identity, run a separate
          investigation on each chain.
        </p>
      </div>
    </section>
  );
};

export default CrossChainIdentity;