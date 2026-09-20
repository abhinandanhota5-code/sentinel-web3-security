import React, { useMemo, useState } from 'react';
import { FileSearch, Filter, Search } from 'lucide-react';
import type { EvidenceRecordView, ConfidenceClass } from '../types/sentinel';

interface EvidenceTableProps {
  records: EvidenceRecordView[];
  /** Evidence id to scroll to + highlight (arriving from graph edges etc.). */
  highlightId?: string | null;
  onClearHighlight?: () => void;
  onOpenFinding?: (findingId: string) => void;
}

const KIND_FILTERS = ['ALL', 'WALLET', 'TOKEN', 'CONTRACT', 'TRANSACTION', 'PERMISSION', 'DELEGATION'] as const;
type KindFilter = (typeof KIND_FILTERS)[number];

/** Coarse bucket for the optional entity filter (Phase 13). */
function kindBucket(r: EvidenceRecordView): KindFilter {
  const t = (r.findingType ?? '') + ' ' + (r.kind ?? '');
  if (/EIP7702|DELEGAT/i.test(t)) return 'DELEGATION';
  if (/ALLOWANCE|APPROVAL|ADMIN|PRIVILEG|OWNER|TIMELOCK/i.test(t)) return 'PERMISSION';
  if (/TRANSACTION|INTERACTION/i.test(t)) return 'TRANSACTION';
  if (/TOKEN|TRANSFER|BALANCE/i.test(t)) return 'TOKEN';
  if (/CLASSIFICATION|ADDRESS/i.test(t)) return 'WALLET';
  return 'CONTRACT';
}

const KNOWLEDGE_STYLE: Record<ConfidenceClass, string> = {
  OBSERVED: 'bg-accent/12 text-accent border-accent/30',
  INFERRED: 'bg-warn/12 text-warn border-warn/30',
  UNKNOWN: 'bg-ink-3/12 text-ink-3 border-ink-3/30',
};

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  records,
  highlightId,
  onClearHighlight,
  onOpenFinding,
}) => {
  const [knowledge, setKnowledge] = useState<'ALL' | ConfidenceClass>('ALL');
  const [bucket, setBucket] = useState<KindFilter>('ALL');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(highlightId ?? null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (knowledge !== 'ALL' && r.knowledgeType !== knowledge) return false;
      if (bucket !== 'ALL' && kindBucket(r) !== bucket) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${r.id} ${r.findingType ?? ''} ${r.title ?? ''} ${r.summary ?? ''} ${JSON.stringify(r.detail ?? {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, knowledge, bucket, query]);

  if (records.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-10 text-center">
        <FileSearch className="w-10 h-10 mx-auto mb-3 text-ink-3" />
        <h3 className="text-lg font-bold text-ink mb-1">No evidence records</h3>
        <p className="text-sm text-ink-2 max-w-md mx-auto">
          The deterministic engine returned no evidence for this investigation.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6">
      {/* Header + filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-accent" />
            Evidence Records
            <span className="text-xs font-mono text-ink-3">({filtered.length}/{records.length})</span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Every record is a deterministic engine observation. OBSERVED = verified on-chain fact · INFERRED = derived · UNKNOWN = could not be established.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search evidence…"
              className="glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs w-48"
            />
          </div>
          <Filter className="w-3.5 h-3.5 text-ink-3" />
          <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl">
            {(['ALL', 'OBSERVED', 'INFERRED', 'UNKNOWN'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKnowledge(k)}
                className={`px-2 py-1 text-[10px] rounded-lg font-semibold transition ${
                  knowledge === k
                    ? k === 'OBSERVED'
                      ? 'bg-accent/15 text-accent'
                      : k === 'INFERRED'
                        ? 'bg-warn/15 text-warn'
                        : k === 'UNKNOWN'
                          ? 'bg-ink-3/20 text-ink-2'
                          : 'bg-ink/10 text-ink'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entity-kind chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {KIND_FILTERS.map((k) => (
          <button
            key={k}
            onClick={() => setBucket(k)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide transition border ${
              bucket === k
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'text-ink-3 border-transparent hover:text-ink liquid-glass-subtle'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {filtered.map((r) => {
          const isExpanded = expanded === r.id;
          const isHighlighted = highlightId === r.id;
          return (
            <div
              key={r.id}
              id={`evidence-${r.id}`}
              className={`liquid-glass-subtle rounded-2xl transition ${
                isHighlighted ? 'border-cyan/60 ring-1 ring-cyan/40' : ''
              }`}
              onClick={() => {
                setExpanded(isExpanded ? null : r.id);
                if (isHighlighted) onClearHighlight?.();
              }}
            >
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider border shrink-0 w-fit ${KNOWLEDGE_STYLE[r.knowledgeType]}`}>
                  {r.knowledgeType}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-ink truncate">
                    {r.title ?? r.findingType ?? r.kind}
                  </div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {r.summary ?? r.sourceTool}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-ink-3">{r.id}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    r.knowledgeType === 'OBSERVED' ? 'bg-accent' : r.knowledgeType === 'INFERRED' ? 'bg-warn' : 'bg-ink-3'
                  }`} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[var(--border-1)] space-y-2 text-[11px]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-ink-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-ink-3">Source</div>
                      <div className="font-mono text-technical truncate">{r.sourceTool ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-ink-3">Locator</div>
                      <div className="font-mono text-technical truncate">{r.sourceLocator ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-ink-3">Captured</div>
                      <div className="font-mono text-technical truncate">{r.capturedAt?.slice(0, 19) ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-ink-3">Chain</div>
                      <div className="font-mono text-technical truncate">{r.chain ?? '—'}</div>
                    </div>
                  </div>

                  {r.coverageGaps && r.coverageGaps.length > 0 && (
                    <div className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-warn">
                      <span className="font-bold text-[9px] uppercase tracking-wider mr-1">Coverage gap:</span>
                      {r.coverageGaps[0]}
                    </div>
                  )}

                  <details>
                    <summary className="cursor-pointer text-ink-3 hover:text-ink text-[10px] uppercase tracking-wider">
                      Raw record
                    </summary>
                    <pre className="glass-well p-3 mt-1 text-[10px] leading-relaxed overflow-x-auto text-technical">
                      {JSON.stringify(r.detail ?? {}, null, 2).slice(0, 4000)}
                    </pre>
                  </details>

                  {onOpenFinding && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFinding(r.id);
                      }}
                      className="text-[10px] text-accent hover:text-accent-deep underline cursor-pointer"
                    >
                      open related finding →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-xs text-ink-3 py-8">No evidence matches the current filters.</div>
        )}
      </div>
    </div>
  );
};

export default EvidenceTable;
