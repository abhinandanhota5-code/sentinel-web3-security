import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Coins,
  Hash,
  Layers,
  GitBranch,
  FileSearch,
  Zap,
  History,
} from 'lucide-react';
import type { Finding, SeverityLevel } from '../types/sentinel';

interface FindingsListProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  selectedFindingId?: string;
  /** Jump to the Evidence section for a given evidence record id. */
  onOpenEvidence?: (evidenceId: string) => void;
  /** Jump to the Evidence Graph focused on this finding's relationships. */
  onOpenGraph?: (findingId: string) => void;
}

/** Severity palette — how serious. Distinct from knowledge type — how certain. */
const SEVERITY_ACCENT: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  INFORMATIONAL: '#94a3b8',
  UNKNOWN: '#94a3b8',
};

const STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  ACTIVE: {
    cls: 'bg-[#ef4444]/12 text-[#f87171] border-[#ef4444]/35',
    icon: <Zap className="w-2.5 h-2.5" />,
  },
  HISTORICAL: {
    cls: 'bg-ink/8 text-ink-3 border-[var(--border-1)]',
    icon: <History className="w-2.5 h-2.5" />,
  },
  UNKNOWN: {
    cls: 'bg-[#94a3b8]/12 text-[#cbd5e1] border-[#94a3b8]/30',
    icon: <HelpCircle className="w-2.5 h-2.5" />,
  },
};

/** Filter buckets. INFORMATIONAL folds into LOW for counting/filtering. */
function bucketOf(severity: SeverityLevel): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' {
  if (severity === 'INFORMATIONAL') return 'LOW';
  if (severity === 'UNKNOWN') return 'UNKNOWN';
  return severity;
}

const BUCKETS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] as const;

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onSelectFinding,
  selectedFindingId,
  onOpenEvidence,
  onOpenGraph,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    for (const f of findings) c[bucketOf(f.severity)]++;
    return c;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    const list = findings.filter((f) => {
      if (filterSeverity === 'ALL') return true;
      return bucketOf(f.severity) === filterSeverity;
    });
    // Deterministic order: active danger first, then severity rank, then id.
    const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFORMATIONAL: 3, UNKNOWN: 4 };
    const statusRank: Record<string, number> = { ACTIVE: 0, UNKNOWN: 1, HISTORICAL: 2 };
    return [...list].sort(
      (a, b) =>
        (statusRank[a.status ?? 'HISTORICAL'] - statusRank[b.status ?? 'HISTORICAL']) ||
        (rank[a.severity] - rank[b.severity]) ||
        a.id.localeCompare(b.id),
    );
  }, [findings, filterSeverity]);

  const displayedFindings = filteredFindings.slice(0, 80);

  const severityBadge = (severity: SeverityLevel): React.CSSProperties => {
    const color = SEVERITY_ACCENT[severity] ?? '#94a3b8';
    return { color, borderColor: `${color}55`, background: `${color}1f` };
  };

  return (
    <div className="space-y-5">
      {/* SECURITY OVERVIEW — severity summary (deterministic, from engine) */}
      <section className="liquid-glass rounded-3xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Severity Summary</h3>
            <p className="text-[11px] text-ink-3">
              Severity = how serious. Knowledge type (OBSERVED / INFERRED / UNKNOWN) = how certain. Two different axes.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-mono">
            {findings.length} findings · engine-derived
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {BUCKETS.map((sev) => {
            const color = SEVERITY_ACCENT[sev]!;
            const active = filterSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setFilterSeverity(active ? 'ALL' : sev)}
                className={`rounded-2xl px-3 py-3 text-center border transition cursor-pointer liquid-card-hover ${
                  active ? 'ring-1 ring-cyan/50' : ''
                }`}
                style={{ borderColor: `${color}44`, background: `${color}14` }}
                title={`Filter findings by ${sev}`}
              >
                <div className="text-xl font-mono font-bold" style={{ color }}>
                  {counts[sev]}
                </div>
                <div className="text-[9px] font-bold tracking-wider" style={{ color }}>
                  {sev}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-3 mr-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Filter
        </span>
        {(['ALL', ...BUCKETS] as const).map((sev) => {
          const active = filterSeverity === sev;
          const color = sev === 'ALL' ? '#3b82f6' : SEVERITY_ACCENT[sev]!;
          return (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                active ? '' : 'text-ink-3 border-transparent hover:text-ink liquid-glass-subtle'
              }`}
              style={active ? { color, borderColor: `${color}66`, background: `${color}1a` } : undefined}
            >
              {sev}
              {sev !== 'ALL' && <span className="ml-1 font-mono text-[9px] opacity-70">{counts[sev]}</span>}
            </button>
          );
        })}
      </div>

      {/* Finding cards */}
      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-ok/12 border border-ok/25 flex items-center justify-center text-ok mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">No active finding detected</h3>
            <p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
              No security findings were produced by the deterministic engine within the analyzed
              coverage. See the Coverage section for what was and was not verified — absence of
              findings is not evidence of absence.
            </p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="liquid-glass-subtle rounded-2xl p-6 text-center">
            <HelpCircle className="w-7 h-7 text-ink-3 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-ink">No {filterSeverity} findings</h4>
            <p className="text-[11px] text-ink-3 mt-0.5">
              None of the {findings.length} findings match severity filter "{filterSeverity}".
            </p>
          </div>
        ) : (
          displayedFindings.map((f) => {
            const accent = SEVERITY_ACCENT[f.severity] ?? '#94a3b8';
            const status = STATUS_STYLE[f.status ?? 'HISTORICAL'] ?? STATUS_STYLE.HISTORICAL;
            const isExpanded = expandedId === f.id;
            const isSelected = selectedFindingId === f.id;

            return (
              <div
                key={f.id}
                className={`liquid-glass rounded-2xl overflow-hidden transition ${isSelected ? 'border-cyan/40' : ''}`}
              >
                {/* Card head — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  className="w-full text-left px-5 py-4 cursor-pointer hover:bg-ink/[0.03] transition relative"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: accent }} />
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border"
                        style={severityBadge(f.severity)}
                      >
                        {f.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border flex items-center gap-1 ${status.cls}`}>
                        {status.icon}
                        {f.status ?? 'HISTORICAL'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-ink leading-snug">{f.title}</h3>
                      <p className="text-[11px] text-ink-2 line-clamp-1 mt-0.5">{f.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-ink-3">
                      {(f.token?.symbol || f.spender) && (
                        <span className="glass-well px-2 py-0.5 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {f.token?.symbol ?? (f.spender ? `${f.spender.address.slice(0, 6)}…` : '')}
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded: WHY AM I SEEING THIS? */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-[var(--border-1)] space-y-3 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-ink-2">
                        Why am I seeing this?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFinding(f);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold liquid-pill text-ink-2 hover:text-ink transition cursor-pointer"
                        >
                          Full inspector
                        </button>
                        {onOpenGraph && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenGraph(f.id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer flex items-center gap-1"
                          >
                            <GitBranch className="w-3 h-3" /> Graph
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Affected entity */}
                    <div className="text-[11px] text-ink-2">
                      <span className="text-ink-3 uppercase text-[9px] tracking-wider mr-2">Affected:</span>
                      {f.spender ? (
                        <span className="font-mono">{f.spender.address}</span>
                      ) : f.token ? (
                        <span className="font-mono">
                          {f.token.symbol} · {f.token.address}
                        </span>
                      ) : (
                        <span>{f.category}</span>
                      )}
                    </div>

                    {/* Tripartite */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="liquid-glass-subtle rounded-xl p-3 border-l-2 border-l-accent">
                        <span className="text-ink-2 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-ok" /> Observed
                        </span>
                        <ul className="text-[10.5px] text-ink-2 space-y-1">
                          {f.tripartite.observed.slice(0, 3).map((o, i) => (
                            <li key={i} className="leading-relaxed">{o}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="liquid-glass-subtle rounded-xl p-3 border-l-2 border-l-warn">
                        <span className="text-warn font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3" /> Inferred
                        </span>
                        <ul className="text-[10.5px] text-ink-2 space-y-1">
                          {f.tripartite.inferred.slice(0, 3).map((o, i) => (
                            <li key={i} className="leading-relaxed">{o}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="liquid-glass-subtle rounded-xl p-3 border-l-2 border-l-ink-3">
                        <span className="text-ink-2 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 mb-1">
                          <HelpCircle className="w-3 h-3" /> Unknown
                        </span>
                        <ul className="text-[10.5px] text-ink-2 space-y-1">
                          {f.tripartite.unknown.slice(0, 3).map((o, i) => (
                            <li key={i} className="leading-relaxed">{o}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Evidence + metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="text-ink-3 uppercase tracking-wider text-[9px] font-bold">Evidence:</span>
                      {(f.evidenceIds ?? []).map((id) => (
                        <button
                          key={id}
                          onClick={() => onOpenEvidence?.(id)}
                          className="px-2 py-0.5 rounded-md font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileSearch className="w-3 h-3" /> {id}
                        </button>
                      ))}
                      {f.evidence.transactionHash && (
                        <span className="glass-well px-2 py-0.5 flex items-center gap-1 text-ink-2 font-mono">
                          <Hash className="w-3 h-3 text-ink-3" />
                          {f.evidence.transactionHash.slice(0, 10)}…
                        </span>
                      )}
                      {f.evidence.blockNumber ? (
                        <span className="text-ink-3 font-mono">Block #{f.evidence.blockNumber}</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {filteredFindings.length > 80 && (
          <div className="text-center py-4 px-3 rounded-2xl liquid-glass-subtle text-xs text-ink-2">
            Showing top 80 of {filteredFindings.length} findings. Use the severity filters above to narrow the list.
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingsList;
