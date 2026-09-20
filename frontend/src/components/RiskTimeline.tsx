import React, { useMemo } from 'react';
import {
  History,
  FileSearch,
  RadioTower,
  Clock,
  GitCommitVertical,
} from 'lucide-react';
import type {
  Finding,
  SeverityLevel,
  ConfidenceClass,
  InvestigationReport,
} from '../types/sentinel';

interface RiskTimelineProps {
  report: InvestigationReport;
  onOpenFinding?: (finding: Finding) => void;
  onOpenEvidence?: (evidenceId: string) => void;
}

/**
 * Risk Timeline — a REAL timeline of deterministic events, not a fabricated
 * "risk score over time". Every entry is an engine finding with evidence
 * (timestamp/block + tx hash when the engine captured them). Where an event
 * time cannot be established, Sentinel says so instead of inventing one.
 */

type EventGroup =
  | 'approval'
  | 'exposure'
  | 'privileged'
  | 'upgrade'
  | 'delegation'
  | 'interaction'
  | 'transfer'
  | 'activity'
  | 'state'
  | 'unknown';

interface TimelineEvent {
  key: string;
  at: string | null;
  atLabel: string;
  blockNumber?: number;
  group: EventGroup;
  label: string;
  title: string;
  summary: string;
  severity: SeverityLevel;
  knowledge: ConfidenceClass;
  temporal: 'ACTIVE' | 'HISTORICAL' | 'UNKNOWN' | 'CURRENT_STATE';
  txHash?: string;
  evidenceIds: string[];
  token?: string;
  /** Number of engine findings that share this exact on-chain identity. */
  mergedFrom?: number;
}

const GROUP_META: Record<EventGroup, { color: string; chip: string }> = {
  approval: { color: '#f87171', chip: 'Approval' },
  exposure: { color: '#f97316', chip: 'Exposure' },
  privileged: { color: '#fbbf24', chip: 'Privilege' },
  upgrade: { color: '#3b82f6', chip: 'Upgrade' },
  delegation: { color: '#22d3ee', chip: 'Delegation' },
  interaction: { color: '#60a5fa', chip: 'Interaction' },
  transfer: { color: '#38bdf8', chip: 'Transfer' },
  activity: { color: '#8fa3b8', chip: 'Activity' },
  state: { color: '#64748b', chip: 'State' },
  unknown: { color: '#94a3b8', chip: 'Unknown' },
};

const FINDING_GROUP: Record<string, EventGroup> = {
  UNLIMITED_ALLOWANCE: 'approval',
  ACTIVE_APPROVAL: 'approval',
  APPROVAL_WITHOUT_CURRENT_BALANCE: 'approval',
  TOKEN_APPROVALS: 'approval',
  CURRENT_TOKEN_EXPOSURE: 'exposure',
  PRIVILEGED_ADMIN: 'privileged',
  TIMELOCK_ABSENT: 'privileged',
  UPGRADE_AUTHORITY: 'privileged',
  ADMIN_CONCENTRATION: 'privileged',
  ZERO_TIMELOCK_PRIVILEGE: 'privileged',
  PROXY_DETECTED: 'upgrade',
  UPGRADEABLE_PROXY_RISK: 'upgrade',
  UNVERIFIED_IMPLEMENTATION: 'upgrade',
  EIP7702_DELEGATION: 'delegation',
  CONTRACT_INTERACTION: 'interaction',
  IMPORTANT_INTERACTION: 'interaction',
  TOKEN_TRANSFER: 'transfer',
  SUSPICIOUS_TRANSFER_BURST: 'transfer',
  CONTRACT_DEPENDENCY: 'interaction',
  FIRST_ACTIVITY: 'activity',
  LAST_ACTIVITY: 'activity',
  NATIVE_BALANCE: 'state',
};

const GROUP_LABEL: Record<string, string> = {
  UNLIMITED_ALLOWANCE: 'Unlimited Allowance',
  ACTIVE_APPROVAL: 'Active Approval',
  APPROVAL_WITHOUT_CURRENT_BALANCE: 'Approval · No Balance',
  TOKEN_APPROVALS: 'Approval Enumeration',
  CURRENT_TOKEN_EXPOSURE: 'Current Token Exposure',
  PRIVILEGED_ADMIN: 'Privileged Admin',
  TIMELOCK_ABSENT: 'Timelock Absent',
  UPGRADE_AUTHORITY: 'Upgrade Authority',
  ADMIN_CONCENTRATION: 'Admin Concentration',
  ZERO_TIMELOCK_PRIVILEGE: 'Zero-Timelock Privilege',
  PROXY_DETECTED: 'Upgradeable Proxy',
  UPGRADEABLE_PROXY_RISK: 'Proxy Upgrade Risk',
  UNVERIFIED_IMPLEMENTATION: 'Unverified Implementation',
  EIP7702_DELEGATION: 'EIP-7702 Delegation',
  CONTRACT_INTERACTION: 'Contract Interaction',
  IMPORTANT_INTERACTION: 'Important Interaction',
  TOKEN_TRANSFER: 'Token Transfer',
  SUSPICIOUS_TRANSFER_BURST: 'Suspicious Transfer Burst',
  CONTRACT_DEPENDENCY: 'Contract Dependency',
  FIRST_ACTIVITY: 'Earliest Activity',
  LAST_ACTIVITY: 'Most Recent Activity',
  NATIVE_BALANCE: 'Native Balance',
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  INFORMATIONAL: '#94a3b8',
  UNKNOWN: '#94a3b8',
};

function shortAddr(a: string | undefined, len = 8): string | undefined {
  if (!a) return undefined;
  if (a.length <= len + 6) return a;
  return `${a.slice(0, len)}…${a.slice(-4)}`;
}

function compactBig(value: string): string {
  try {
    const raw = BigInt(value);
    if (raw === 0n) return '0';
    const digits = raw.toString();
    if (digits.length > 12) {
      const exp = digits.length - 1;
      const lead = digits[0];
      const rest = digits.length > 2 ? digits.slice(1, 3) : '';
      return `${lead}.${rest}e${exp}`;
    }
    return digits;
  } catch {
    return value;
  }
}

/**
 * Build the timeline strictly from report.findings (deterministic engine
 * output) plus the current-state summary. No invented events, no invented
 * timestamps, no arbitrary "score" series.
 */
function buildTimeline(report: InvestigationReport): { current: TimelineEvent[]; settled: TimelineEvent[] } {
  const current: TimelineEvent[] = [];
  const settled: TimelineEvent[] = [];

  const seenKeys = new Set<string>();

  const keyOf = (e: TimelineEvent) =>
    `${e.group}:${e.txHash ?? 'no-tx'}:${e.blockNumber ?? 'no-block'}:${e.title}:${e.token ?? ''}`.toLowerCase();

const push = (e: TimelineEvent) => {
    const key = keyOf(e);
    if (seenKeys.has(key)) {
      // The engine can emit several findings with identical on-chain identity
      // (e.g. internal value sub-transfers sharing a parent tx hash). Keep one
      // row but say so instead of silently dropping the rest.
      const existing = current.find((c) => keyOf(c) === key) ?? settled.find((c) => keyOf(c) === key);
      if (existing) {
        existing.mergedFrom = (existing.mergedFrom ?? 1) + 1;
        existing.summary = `${existing.summary ?? ''} — this row aggregates ${existing.mergedFrom} engine findings sharing the same on-chain identity.`;
      }
      return;
    }
    seenKeys.add(key);
    if (e.temporal === 'CURRENT_STATE' || e.temporal === 'ACTIVE') {
      current.push(e);
    } else {
      settled.push(e);
    }
  };

  for (const f of report.findings ?? []) {
    // Summary/boundary records describe the whole investigation, not a
    // single dated event. They belong in Coverage, not on the timeline.
    if (['TRANSACTION_COUNT', 'ADDRESS_CLASSIFICATION', 'TOKEN_APPROVALS'].includes(f.findingType)) continue;

    const group = FINDING_GROUP[f.findingType] ?? 'unknown';
    const label = GROUP_LABEL[f.findingType] ?? f.findingType.replace(/_/g, ' ');
    const at = f.evidence?.timestamp ? String(f.evidence.timestamp) : null;
    const blockNumber = f.evidence?.blockNumber;
    const txHash = f.evidence?.transactionHash;
    const tokenAddr = (f.token?.address ?? f.evidence?.contractAddress)?.toLowerCase() ?? undefined;
    // One exposure per token must stay distinct even though the titles are
    // identical (e.g. 24 CURRENT_TOKEN_EXPOSURE records, zero timestamps).
    let title = f.title;
    if (group === 'exposure' && (f.token?.symbol ?? tokenAddr)) {
      title = `${title} · ${f.token?.symbol ?? shortAddr(tokenAddr)}`;
    }
    const temporal: TimelineEvent['temporal'] =
      f.status === 'ACTIVE'
        ? at || blockNumber
          ? 'ACTIVE'
          : 'CURRENT_STATE'
        : f.status === 'UNKNOWN'
          ? 'UNKNOWN'
          : 'HISTORICAL';

    // IMPORTANT_INTERACTION duplicates the underlying interaction/transfer.
    if (f.findingType === 'IMPORTANT_INTERACTION') {
      const dupExists = (report.findings ?? []).some(
        (o) =>
          o.id !== f.id &&
          (o.findingType === 'CONTRACT_INTERACTION' || o.findingType === 'TOKEN_TRANSFER') &&
          o.evidence?.transactionHash &&
          o.evidence?.transactionHash === txHash &&
          o.evidence?.blockNumber === blockNumber,
      );
      if (dupExists) continue; // the underlying record already represents this event
    }

    // Earliest/latest activity markers carry informational value; the real
    // per-event records form the timeline spine.
    let atLabel: string;
    if (at) {
      const d = new Date(at);
      atLabel = Number.isNaN(d.getTime())
        ? `timestamp UNKNOWN (${at.slice(0, 19)})`
        : d.toLocaleString();
    } else {
      atLabel = blockNumber ? `Block #${blockNumber} · timestamp UNKNOWN` : 'Current state';
    }

    push({
      key: `${f.id}-${f.findingType}`,
      at,
      atLabel,
      blockNumber,
      group,
      label,
      title,
      summary: f.summary,
      severity: f.severity,
      knowledge: f.confidence,
      temporal,
      txHash,
      evidenceIds: f.evidenceIds ?? [f.id],
      token: tokenAddr,
    });
  }

  // EIP-7702 delegation / native balance from the deterministic current-state
  // summary (unchanged after AI failure). Only if the engine didn't already
  // emit a finding-level record for the same delegation.
  const ces = report.currentExposureSummary;
  const delegationAlreadyShown = (report.findings ?? []).some((f) => f.findingType === 'EIP7702_DELEGATION');
  if (ces?.eip7702?.delegatedTo && !delegationAlreadyShown) {
    const d = ces.eip7702;
    const evidenceId = ces.eip7702.evidenceId;
    push({
      key: `delegation-current-${d.delegatedTo}`,
      at: null,
      atLabel: 'Current state',
      blockNumber: undefined,
      group: 'delegation',
      label: 'EIP-7702 Delegation',
      title: 'EIP-7702 delegation designator active',
      summary: d.delegatedToIsContract
        ? `Delegates to contract ${shortAddr(d.delegatedTo)} (${d.delegatedToCodeSizeBytes ?? '?'} bytes code). Observed relationship — not by itself a verdict.`
        : `Delegates to EOA ${shortAddr(d.delegatedTo)}. Observed relationship — not by itself a verdict.`,
      severity: 'UNKNOWN',
      knowledge: 'OBSERVED',
      temporal: 'CURRENT_STATE',
      evidenceIds: evidenceId ? [evidenceId] : [],
    });
  }

  const sortSettled = (a: TimelineEvent, b: TimelineEvent) => {
    if (a.at && b.at) {
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    }
    if (a.at) return -1;
    if (b.at) return 1;
    return (b.blockNumber ?? 0) - (a.blockNumber ?? 0);
  };

  return { current, settled: settled.sort(sortSettled) };
}

export function timelineCounts(report: InvestigationReport): { current: number; settled: number; total: number } {
  const { current, settled } = buildTimeline(report);
  return { current: current.length, settled: settled.length, total: current.length + settled.length };
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ report, onOpenFinding, onOpenEvidence }) => {
  const { current, settled } = useMemo(() => buildTimeline(report), [report]);

  const MAX_SHOWN = 120;
  const shownSettled = settled.slice(0, MAX_SHOWN);
  const hasMore = settled.length > MAX_SHOWN;

  if (current.length === 0 && settled.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-10 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-ink-3" />
        <h3 className="text-lg font-bold text-ink mb-1">No deterministic timeline events</h3>
        <p className="text-sm text-ink-2 max-w-md mx-auto">
          The engine returned no timestamped events for this entity. Check the Coverage section for
          what could not be established rather than assume nothing happened.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-1">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-ink-2 mb-1 font-medium">
            Deterministic Event Timeline
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <span>Risk Timeline</span>
            <span className="text-[11px] font-mono text-ink-3 font-normal">
              {current.length} current · {settled.length} settled
            </span>
          </h2>
          <p className="text-xs text-ink-2 max-w-2xl mt-0.5">
            Ordered by evidence timestamps/blocks captured by the deterministic engine. Sentinel
            does not plot a generic "risk score over time" — each entry is one real event. Where a
            timestamp could not be established, it is labeled UNKNOWN.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 mt-3 mb-6 text-[9.5px] text-ink-3">
        {Object.entries(GROUP_META).map(([g, meta]) => (
          <span key={g} className="flex items-center gap-1 capitalize">
            <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
            {meta.chip}
          </span>
        ))}
      </div>

      {/* CURRENT STATE band (top, pinned) */}
      {current.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <RadioTower className="w-3.5 h-3.5 text-cyan" />
            <span className="text-[10px] uppercase tracking-wider text-ink-2 font-bold">
              Current State &amp; Active Exposure — now
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-cyan/30" aria-hidden />
            <div className="space-y-3">
              {current.map((e) => (
                <TimelineItem key={e.key} event={e} onOpenFinding={onOpenFinding} onOpenEvidence={onOpenEvidence} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SETTLED HISTORY band */}
      {shownSettled.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-ink-3" />
            <span className="text-[10px] uppercase tracking-wider text-ink-2 font-bold">
              On-Chain History — settled events (newest first)
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-1)]" aria-hidden />
            <div className="space-y-3">
              {shownSettled.map((e) => (
                <TimelineItem key={e.key} event={e} onOpenFinding={onOpenFinding} onOpenEvidence={onOpenEvidence} />
              ))}
            </div>
          </div>
          {hasMore && (
            <div className="mt-4 px-4 py-3 rounded-2xl liquid-glass-subtle text-xs text-ink-2">
              Showing the most recent {MAX_SHOWN} of {settled.length} settled events. This is a
              completeness limit of the view, not a limit on the underlying evidence.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TimelineItem: React.FC<{
  event: TimelineEvent;
  onOpenFinding?: (finding: Finding) => void;
  onOpenEvidence?: (evidenceId: string) => void;
}> = ({ event, onOpenFinding, onOpenEvidence }) => {
  const meta = GROUP_META[event.group] ?? GROUP_META.unknown;
  const sevColor = SEVERITY_COLOR[event.severity] ?? '#94a3b8';
  const isActive = event.temporal === 'ACTIVE' || event.temporal === 'CURRENT_STATE';

  const temporalBadge = (() => {
    switch (event.temporal) {
      case 'ACTIVE':
        return {
          cls: 'bg-[#ef4444]/12 text-[#f87171] border-[#ef4444]/35',
          txt: 'ACTIVE NOW',
        };
      case 'CURRENT_STATE':
        return { cls: 'bg-cyan/12 text-cyan border-cyan/35', txt: 'CURRENT STATE' };
      case 'UNKNOWN':
        return { cls: 'bg-ink/8 text-ink-3 border-[var(--border-1)]', txt: 'UNKNOWN' };
      default:
        return { cls: 'bg-ink/6 text-ink-3 border-[var(--border-1)]', txt: 'HISTORICAL' };
    }
  })();

  return (
    <div className="relative pl-9 group">
      {/* Rail dot */}
      <span
        className="absolute left-0 top-2.5 w-[15px] h-[15px] rounded-full border-2"
        style={{
          background: meta.color,
          borderColor: meta.color,
          boxShadow: `0 0 0 3px ${meta.color}22`,
        }}
        aria-hidden
      />
      <div className={`liquid-glass-subtle rounded-2xl p-3.5 transition group-hover:border-${'ink'} ${isActive ? 'border-l-2' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border" style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}14` }}>
                {meta.chip}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border ${temporalBadge.cls}`}>
                {temporalBadge.txt}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border" style={{ color: sevColor, borderColor: `${sevColor}55`, background: `${sevColor}1f` }}>
                {event.severity}
              </span>
              {event.knowledge === 'OBSERVED' && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border bg-accent/12 text-accent border-accent/25">
                  OBSERVED
                </span>
              )}
              {event.knowledge === 'INFERRED' && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border bg-warn/12 text-warn border-warn/25">
                  INFERRED
                </span>
              )}
              {event.knowledge === 'UNKNOWN' && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border bg-ink/8 text-ink-2 border-[var(--border-1)]">
                  UNKNOWN
                </span>
              )}
            </div>
            <h4 className="text-[13px] font-bold text-ink leading-snug">{event.title}</h4>
            <p className="text-[11px] text-ink-2 leading-relaxed mt-0.5">{event.summary}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-ink-3 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.atLabel}
              </span>
              {event.txHash && (
                <span className="text-technical truncate" title={event.txHash}>
                  tx {shortAddr(event.txHash)}
                </span>
              )}
            </div>
          </div>

          {(onOpenFinding || onOpenEvidence) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {event.evidenceIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onOpenEvidence?.(id)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                >
                  <FileSearch className="w-3 h-3" /> {id}
                </button>
              ))}
              {event.evidenceIds.length === 0 && (
                <span className="flex items-center gap-1 text-[10px] text-ink-3">
                  <GitCommitVertical className="w-3 h-3" /> state-level
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskTimeline;