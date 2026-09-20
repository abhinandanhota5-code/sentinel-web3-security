import React, { useMemo } from 'react';
import {
  Target,
  Coins,
  KeyRound,
  Link2,
  TrendingUp,
  HelpCircle,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { InvestigationReport, Finding, SeverityLevel } from '../types/sentinel';

interface BlastRadiusViewProps {
  report: InvestigationReport;
  onOpenFinding?: (finding: Finding) => void;
  onOpenEvidence?: (evidenceId: string) => void;
}

/**
 * Blast Radius — evidence-backed. Shows current exposure, affected assets,
 * permissions, contracts, possible impact, and confidence. USD impact is only
 * shown when a real price source established it (never in REAL investigations);
 * otherwise Sentinel reports UNKNOWN instead of inventing a $0 or a market guess.
 */

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  INFORMATIONAL: '#94a3b8',
  UNKNOWN: '#94a3b8',
};

function fmtWeiEth(wei: string | null | undefined): string {
  try {
    const raw = BigInt(wei ?? '0');
    return (Number(raw / 10n ** 15n) / 1000).toLocaleString('en-US', { maximumFractionDigits: 6 });
  } catch {
    return '0';
  }
}

function compactBig(value: string): string {
  try {
    const raw = BigInt(value);
    if (raw === 0n) return '0';
    const digits = raw.toString();
    if (digits.length > 12) {
      const exp = digits.length - 1;
      return `${digits[0]}.${digits.slice(1, 3)}e${exp}`;
    }
    return digits;
  } catch {
    return value;
  }
}

function short(addr: string | undefined, len = 8): string {
  if (!addr) return '—';
  return addr.length <= len + 6 ? addr : `${addr.slice(0, len)}…${addr.slice(-4)}`;
}

interface Collateral {
  severity: SeverityLevel;
  knowledge: string;
  title: string;
  summary: string;
  token?: string;
  tokenSymbol?: string;
  spender?: string;
  admin?: string;
  contract?: string;
  evidenceIds: string[];
  inferredImpact: string[];
  unknownBasis: string[];
}

function collectCollateral(report: InvestigationReport): Collateral[] {
  const ces = report.currentExposureSummary;
  const list: Collateral[] = [];

  for (const f of report.findings ?? []) {
    const isExposure =
      (f.status === 'ACTIVE' || f.confidence !== 'UNKNOWN') &&
      [
        'UNLIMITED_ALLOWANCE',
        'ACTIVE_APPROVAL',
        'CURRENT_TOKEN_EXPOSURE',
        'APPROVAL_WITHOUT_CURRENT_BALANCE',
        'PRIVILEGED_ADMIN',
        'TIMELOCK_ABSENT',
        'UPGRADE_AUTHORITY',
        'ADMIN_CONCENTRATION',
        'PROXY_DETECTED',
        'UPGRADEABLE_PROXY_RISK',
        'ZERO_TIMELOCK_PRIVILEGE',
        'UNVERIFIED_IMPLEMENTATION',
        'EIP7702_DELEGATION',
      ].includes(f.findingType);
    if (!isExposure) continue;

    list.push({
      severity: f.severity,
      knowledge: f.confidence,
      title: f.title,
      summary: f.summary,
      token: f.token?.address ?? f.evidence?.contractAddress,
      tokenSymbol: f.token?.symbol,
      spender: f.spender?.address,
      admin: f.evidence?.contractAddress,
      contract: f.evidence?.contractAddress,
      evidenceIds: f.evidenceIds ?? [f.id],
      inferredImpact: f.tripartite?.inferred ?? [],
      unknownBasis: f.tripartite?.unknown ?? [],
    });
  }

  return list;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({ report, onOpenFinding, onOpenEvidence }) => {
  const ces = report.currentExposureSummary;
  const isCuratedDemo = report.dataMode === 'PRESET' || report.dataMode === 'DEMO';

  const collateral = useMemo(() => collectCollateral(report), [report]);
  const tokenAssets = (ces?.tokens ?? []).filter((t) => t.positive && t.token);
  const exposureItems = report.currentExposures ?? [];
  const permissions = collateral.filter((c) =>
    /ALLOWANCE|APPROVAL|ADMIN|PRIVILEG|TIMELOCK|UPGRADE/i.test(c.title),
  );
  const unknownItems = [
    ...(report.coverageGaps ?? []),
    ...((report.unknowns ?? []).map((u) => `${u.field}: ${u.detail || u.reason}`)),
  ];

  const nativeEth = fmtWeiEth(ces?.nativeBalanceWei);
  const blastNote = ces?.blastRadius.note ?? 'Raw observed balances; no USD pricing.';

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-ink-2 mb-1 font-medium">
              Evidence-backed Impact
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <span>Blast Radius</span>
            </h2>
            <p className="text-xs text-ink-2 max-w-2xl mt-0.5">
              What could affect <span className="font-mono text-technical">{(report.targetAddress ?? '').slice(0, 10)}…</span> right now, and what evidence supports it.
              USD impact is never invented — where it cannot be priced it is UNKNOWN.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-ink-3 shrink-0">
            <span className="glass-well px-2.5 py-1 font-mono">
              ETH {nativeEth}
            </span>
            <span className="glass-well px-2.5 py-1 font-mono">
              {tokenAssets.length} token assets
            </span>
          </div>
        </div>
      </section>

      {/* Current Exposure snapshot */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Current Exposure</h3>
            <p className="text-xs text-ink-3">
              {exposureItems.length > 0
                ? 'Active rights/authorizations capable of affecting this entity now.'
                : 'No active authorization-based exposure detected within analyzed coverage.'}
            </p>
          </div>
          <span className="text-[10px] font-mono text-ink-3">{exposureItems.length} active</span>
        </div>

        {exposureItems.length === 0 ? (
          <div className="liquid-glass-subtle rounded-xl px-4 py-4 text-sm text-ok flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            No active finding detected within analyzed coverage.
          </div>
        ) : (
          <div className="space-y-3">
            {exposureItems.map((exp) => {
              const color = SEVERITY_COLOR[exp.severity] ?? '#94a3b8';
              return (
                <div key={exp.id} className="liquid-glass-subtle rounded-2xl p-4 border-l-2" style={{ borderLeftColor: color }}>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border" style={{ color, borderColor: `${color}55`, background: `${color}1f` }}>
                      {exp.severity}
                    </span>
                    <span className="text-[10px] text-ink-3 uppercase tracking-wider">{exp.type.replace(/_/g, ' ')}</span>
                    {exp.revocable ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ok/12 text-ok border border-ok/25">Revocable</span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-warn/12 text-warn border border-warn/25">Not revocable by owner alone</span>
                    )}
                  </div>
                  <h4 className="text-[13px] font-bold text-ink">{exp.title}</h4>
                  <p className="text-[11px] text-ink-2 leading-relaxed mt-0.5">{exp.description}</p>

                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {exp.vulnerableAsset && (
                      <div className="glass-well p-2 flex items-center justify-between">
                        <span className="text-ink-3 flex items-center gap-1">
                          <Coins className="w-3 h-3" /> Affected asset
                        </span>
                        <span className="text-ink font-bold font-mono">
                          {exp.vulnerableAsset.symbol} · {exp.vulnerableAsset.amount}
                        </span>
                      </div>
                    )}
                    <div className="glass-well p-2 flex items-center justify-between">
                      <span className="text-ink-3">Active since</span>
                      <span className="text-ink-2 font-mono">{exp.activeSince}</span>
                    </div>
                    <div className="glass-well p-2 flex items-center justify-between">
                      <span className="text-ink-3">Counterparty</span>
                      <span className="text-ink-2 font-mono" title={exp.counterparty.address}>{short(exp.counterparty.address)}</span>
                    </div>
                    <div className="glass-well p-2 flex items-center justify-between">
                      <span className="text-ink-3">Governing entity</span>
                      <span className="text-ink-2 font-mono" title={exp.governingEntity.address}>{exp.governingEntity.label || short(exp.governingEntity.address)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px]">
                    <span className="text-accent font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Evidence proof
                    </span>
                    <div className="glass-well px-2.5 py-1.5 font-mono text-technical mt-1 break-all">{exp.directEvidenceProof}</div>
                  </div>

                  {/* USD honesty */}
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    {isCuratedDemo && exp.blastRadiusUsd > 0 ? (
                      <span className="text-warn font-semibold">
                        Demo scenario exposure: ${exp.blastRadiusUsd.toLocaleString()} (curated demo value, labeled PRESET)
                      </span>
                    ) : (
                      <span className="text-ink-3">
                        USD value: <span className="text-warn font-bold">UNKNOWN</span> — Sentinel has no price source for this asset in this investigation.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Affected assets */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Affected Assets (observed token balances)</h3>
            <p className="text-xs text-ink-3">Positive on-chain balances held by this entity right now. Raw base units, no USD.</p>
          </div>
        </div>

        {tokenAssets.length === 0 ? (
          <div className="liquid-glass-subtle rounded-xl px-4 py-4 text-xs text-ink-3">
            No positive token balances were observed for the tokens the engine tracked.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tokenAssets.map((t) => (
              <div key={t.token ?? t.symbol ?? 't'} className="liquid-glass-subtle rounded-xl px-3 py-2.5">
                <div className="text-xs font-bold text-ink">{t.symbol || short(t.token ?? undefined)}</div>
                <div className="text-[10px] font-mono text-technical mt-0.5">
                  raw = {compactBig(t.balance ?? '0')}
                </div>
                <div className="text-[9px] text-ink-3 mt-0.5">
                  base units (token decimals not in evidence set → human display UNKNOWN)
                </div>
              </div>
            ))}
          </div>
        )}

        {ces?.nativeBalanceWei != null && (
          <div className="mt-3 liquid-glass-subtle rounded-xl px-3 py-2.5 flex items-center justify-between text-xs">
            <span className="text-ink-2 font-semibold">Native balance (ETH)</span>
            <span className="font-mono text-ink font-bold">{nativeEth} ETH</span>
          </div>
        )}

        {ces?.blastRadius && (
          <div className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-[11px] text-ink-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0 mt-0.5" />
            <span className="leading-relaxed">{blastNote}</span>
          </div>
        )}
      </section>

      {/* Permissions & privileged controls */}
      <section className="liquid-glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-warn" /> Permissions &amp; Privileged Controls
            </h3>
            <p className="text-xs text-ink-3">Allowances, admins, upgrade authorities — every row is an engine-derived permission.</p>
          </div>
        </div>

        {permissions.length === 0 ? (
          <div className="liquid-glass-subtle rounded-xl px-4 py-4 text-xs text-ink-3">
            No permission/authorization findings were produced by the engine. Check Coverage for what could not be established.
          </div>
        ) : (
          <div className="space-y-2.5">
            {permissions.map((p, i) => (
              <div key={i} className="liquid-glass-subtle rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-ink">{p.title}</span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border" style={{ color: SEVERITY_COLOR[p.severity], borderColor: `${SEVERITY_COLOR[p.severity]}55`, background: `${SEVERITY_COLOR[p.severity]}1f` }}>
                    {p.severity}
                  </span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border bg-ink/8 text-ink-2 border-[var(--border-1)]">
                    {p.knowledge}
                  </span>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed">{p.summary}</p>
                {p.inferredImpact.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[10.5px] text-ink-2">
                    {p.inferredImpact.slice(0, 4).map((imp, j) => (
                      <li key={j} className="flex items-start gap-1.5">
                        <TrendingUp className="w-3 h-3 text-warn shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{imp}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {p.unknownBasis.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 text-[10.5px] text-ink-3">
                    <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{p.unknownBasis[0]}</span>
                  </div>
                )}
                {(onOpenEvidence || onOpenFinding) && p.evidenceIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {p.evidenceIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => onOpenEvidence?.(id)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileSearch className="w-3 h-3" /> {id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UNKNOWN limitations */}
      {unknownItems.length > 0 && (
        <section className="liquid-glass rounded-3xl p-5 sm:p-6 border-warn/20">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-warn" />
            <h3 className="text-sm font-bold text-ink">Blast Radius — UNKNOWN Boundaries</h3>
          </div>
          <p className="text-xs text-ink-2 leading-relaxed mb-3">
            Everything below could not be established from the available evidence. Sentinel reports
            these instead of guessing — UNKNOWN is preferable to a fabricated estimate.
          </p>
          <ul className="space-y-2 text-[11px]">
            {unknownItems.slice(0, 12).map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-2 liquid-glass-subtle rounded-xl p-2.5">
                <AlertTriangle className="w-3 h-3 text-warn shrink-0 mt-0.5" />
                <span className="leading-relaxed">{u}</span>
              </li>
            ))}
          </ul>
          {unknownItems.length > 12 && (
            <div className="text-[10px] text-ink-3 mt-2">+{unknownItems.length - 12} more limits (see Coverage)</div>
          )}
        </section>
      )}

      <div className="flex items-center gap-2 text-[10px] text-ink-3">
        <Link2 className="w-3 h-3" />
        Cross-referenced with Findings, Evidence, and Coverage sections. No relationship in this view exists without an engine record behind it.
      </div>
    </div>
  );
};

export default BlastRadiusView;