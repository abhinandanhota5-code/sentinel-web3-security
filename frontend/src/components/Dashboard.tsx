import React, { useState } from 'react';
import {
  LayoutDashboard,
  History,
  ShieldAlert,
  GitBranch,
  FileSearch,
  Grid3X3,
  Sparkles,
} from 'lucide-react';
import type { InvestigationReport, Finding, CurrentExposureItem } from '../types/sentinel';
import { InvestigationHeader } from './InvestigationHeader';
import { HistoryVsExposure } from './HistoryVsExposure';
import { FindingsList } from './FindingsList';
import { EvidenceGraph } from './EvidenceGraph';
import { CoverageView } from './CoverageView';
import { EvidenceDetailPanel } from './EvidenceDetailPanel';
import { GroundedExplanationCard } from './GroundedExplanationCard';
import { EvidenceTable } from './EvidenceTable';

/**
 * Information architecture — ONE source of truth per concept:
 *   OVERVIEW  summarizes  ·  ACTIVITY shows history  ·  SECURITY shows current state
 *   EVIDENCE GRAPH visualizes relationships  ·  EVIDENCE lists records
 *   COVERAGE explains what could/could not be established  ·  AI ANALYSIS explains
 */
export type DashboardSection =
  | 'overview'
  | 'activity'
  | 'security'
  | 'graph'
  | 'evidence'
  | 'coverage'
  | 'ai';

interface DashboardProps {
  report: InvestigationReport;
  initialSection?: DashboardSection;
}

const SECTIONS: Array<{ id: DashboardSection; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <History className="w-3.5 h-3.5" /> },
  { id: 'security', label: 'Security', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: 'graph', label: 'Evidence Graph', icon: <GitBranch className="w-3.5 h-3.5" /> },
  { id: 'evidence', label: 'Evidence', icon: <FileSearch className="w-3.5 h-3.5" /> },
  { id: 'coverage', label: 'Coverage', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
  { id: 'ai', label: 'AI Analysis', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const Dashboard: React.FC<DashboardProps> = ({ report, initialSection = 'overview' }) => {
  const [section, setSection] = useState<DashboardSection>(initialSection);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [highlightEvidenceId, setHighlightEvidenceId] = useState<string | null>(null);

  const openEvidence = (evidenceId: string) => {
    setHighlightEvidenceId(evidenceId);
    setSection('evidence');
  };

  const handleSelectExposure = (_exposure: CurrentExposureItem) => {
    const match = report.findings[0];
    if (match) {
      setSelectedFinding(match);
    }
  };

  const counts: Partial<Record<DashboardSection, string>> = {
    security: String(report.findings.length),
    evidence: String(report.evidenceRecords?.length ?? report.findings.length),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <InvestigationHeader report={report} />

      {/* Section navigation — normal layout flow. No sticky/fixed/negative
          margins: a sticky bar floating over the translucent navbar was the
          root cause of content overlapping. In-flow can never overlap. */}
      <nav
        aria-label="Investigation sections"
        className="mb-6 rounded-2xl liquid-glass px-2 py-1.5"
      >
        <div className="flex flex-wrap items-center gap-1">
          {SECTIONS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                section === id
                  ? 'bg-accent/15 text-accent font-semibold border border-accent/30'
                  : 'text-ink-3 hover:text-ink border border-transparent'
              }`}
            >
              {icon}
              <span>{label}</span>
              {counts[id] !== undefined && (
                <span className="text-[9px] font-mono bg-ink/10 rounded px-1">{counts[id]}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Section panels — each concept appears exactly once */}
      {section === 'overview' && (
        <OverviewSection report={report} onOpenSection={setSection} />
      )}

      {section === 'activity' && (
        <HistoryVsExposure
          currentExposures={report.currentExposures}
          historicalActivities={report.historicalActivities}
          onSelectExposure={handleSelectExposure}
          historyOnly
        />
      )}

      {section === 'security' && (
        <div className="space-y-5">
          <FindingsList
            findings={report.findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            selectedFindingId={selectedFinding?.id}
            onOpenEvidence={openEvidence}
            onOpenGraph={() => setSection('graph')}
          />
        </div>
      )}

      {section === 'graph' && (
        <EvidenceGraph
          key={`${report.targetAddress}-${report.investigatedAt}`}
          nodes={report.evidenceGraph.nodes}
          edges={report.evidenceGraph.edges}
          onOpenEvidence={openEvidence}
        />
      )}

      {section === 'evidence' && (
        <EvidenceTable
          records={report.evidenceRecords ?? []}
          highlightId={highlightEvidenceId}
          onClearHighlight={() => setHighlightEvidenceId(null)}
          onOpenFinding={(fid) => {
            const f = report.findings.find((x) => x.id === fid);
            if (f) setSelectedFinding(f);
          }}
        />
      )}

      {section === 'coverage' && (
        <CoverageView
          coverage={report.coverage}
          dataMode={report.dataMode}
          unknowns={report.unknowns}
          coverageGaps={report.coverageGaps}
        />
      )}

      {section === 'ai' && (
        <GroundedExplanationCard
          explanation={report.explanation}
          findings={report.findings}
          onSelectFinding={(f) => {
            setSelectedFinding(f);
            setSection('security');
          }}
          onOpenEvidence={openEvidence}
        />
      )}

      {/* Evidence detail drawer */}
      {selectedFinding && (
        <EvidenceDetailPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          targetAddress={report.targetAddress}
          chainName={report.chain.name}
          onOpenEvidence={openEvidence}
        />
      )}
    </div>
  );
};

/** OVERVIEW: summary only — details live in their dedicated sections. */
const OverviewSection: React.FC<{
  report: InvestigationReport;
  onOpenSection: (s: DashboardSection) => void;
}> = ({ report, onOpenSection }) => {
  const ces = report.currentExposureSummary;
  const eth = ces ? Number(BigInt(ces.nativeBalanceWei || '0') / 10n ** 15n) / 1000 : 0;
  const vectors = ces?.activeVectors ?? [];
  const highSeverity = report.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');

  const fmtWei = (wei: string): string => {
    try {
      const v = BigInt(wei || '0');
      return (Number(v / 10n ** 15n) / 1000).toLocaleString('en-US', { maximumFractionDigits: 6 });
    } catch {
      return '0';
    }
  };

  return (
    <div className="space-y-5">
      {/* Deterministic current exposure snapshot (Phase 6/7) */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Current Exposure</h3>
            <p className="text-xs text-ink-3">What is active right now — distinct from historical activity.</p>
          </div>
          <button
            onClick={() => onOpenSection('activity')}
            className="text-[11px] text-accent hover:text-accent-deep underline cursor-pointer"
          >
            view history →
          </button>
        </div>

        {ces ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="liquid-glass-subtle rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">Native Balance</div>
              <div className="text-xl font-mono font-bold text-ink">{eth} ETH</div>
              <div className="text-[10px] text-ink-3 mt-0.5">
                {ces.nativeBalanceWei === '0' ? 'Zero balance — not zero exposure' : 'Observed via eth_getBalance'}
              </div>
            </div>

            <div className="liquid-glass-subtle rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">Token Balances</div>
              <div className="text-xl font-mono font-bold text-ink">
                {ces.tokens.filter((t) => t.positive).length}
                <span className="text-sm text-ink-3 font-sans"> / {ces.tokens.length} tracked</span>
              </div>
              <div className="text-[10px] text-ink-3 mt-0.5 truncate">
                {ces.tokens.filter((t) => t.positive).slice(0, 3).map((t) => t.symbol ?? '?').join(', ') || 'none observed'}
              </div>
            </div>

            <div className="liquid-glass-subtle rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">EIP-7702 Delegation</div>
              {ces.eip7702?.delegatedTo ? (
                <>
                  <div className="text-xs font-mono font-bold text-cyan break-all">
                    → {ces.eip7702.delegatedTo.slice(0, 10)}…{ces.eip7702.delegatedTo.slice(-6)}
                  </div>
                  <div className="text-[10px] text-ink-3 mt-0.5">
                    {ces.eip7702.delegatedToIsContract
                      ? `Delegated target is a contract (${ces.eip7702.delegatedToCodeSizeBytes ?? '?'} bytes)`
                      : 'Delegated target is an EOA'}
                  </div>
                </>
              ) : (
                <div className="text-sm text-ink-2">No delegation observed</div>
              )}
            </div>

            <div className="liquid-glass-subtle rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">Blast Radius (raw)</div>
              <div className="text-xl font-mono font-bold text-ink">
                {fmtWei(ces.blastRadius.tokenWeiTotal)}
                <span className="text-sm text-ink-3 font-sans"> tokens</span>
              </div>
              <div className="text-[10px] text-ink-3 mt-0.5">{ces.blastRadius.note ?? 'Raw observed balances; no USD pricing.'}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-2">Current-state data unavailable for this report (preset scenario).</p>
        )}
      </section>

      {/* Active vectors + warnings */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Active Vectors</h3>
            <p className="text-xs text-ink-3">
              {vectors.length > 0
                ? 'Genuine current exposures derived from observed state.'
                : 'No active finding detected — see Coverage for what was verified.'}
            </p>
          </div>
          <button
            onClick={() => onOpenSection('security')}
            className="text-[11px] text-accent hover:text-accent-deep underline cursor-pointer"
          >
            all findings →
          </button>
        </div>

        {vectors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vectors.slice(0, 6).map((v, i) => (
              <div key={`${v.type}-${v.token ?? i}`} className="liquid-glass-subtle rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink truncate">{v.symbol ?? v.token ?? v.type}</span>
                <span className="text-[10px] font-mono text-ink-3">{v.balance ?? v.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="liquid-glass-subtle rounded-xl px-4 py-3 text-sm text-ok flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            No active finding detected within analyzed coverage.
          </div>
        )}

        {highSeverity.length > 0 && (
          <div className="mt-3 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-bad font-bold mb-1">Important Warnings</div>
            <ul className="text-xs text-ink-2 space-y-1">
              {highSeverity.slice(0, 3).map((f) => (
                <li key={f.id}>
                  <span className="text-bad font-semibold">{f.severity}</span> — {f.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
