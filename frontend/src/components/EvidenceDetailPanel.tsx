import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Layers,
  ArrowRight,
  Database,
  Eye,
  AlertTriangle
} from 'lucide-react';
import type { Finding, SeverityLevel } from '../types/sentinel';

interface EvidenceDetailPanelProps {
  finding: Finding | null;
  onClose: () => void;
  /** Subject under investigation (the wallet/contract this finding affects). */
  targetAddress?: string;
  /** Chain the investigation ran on. */
  chainName?: string;
  /** Jump to the Evidence section for a given engine evidence record id. */
  onOpenEvidence?: (evidenceId: string) => void;
  /** Block explorer base URL for external links (never an internal action). */
  blockExplorerUrl?: string;
}

const UNESTABLISHED = 'Not established from available evidence.';

/** Display a missing value honestly instead of hiding it. */
function displayValue(value: string | number | null | undefined): string {
  if (value === undefined || value === null || String(value).trim() === '') return UNESTABLISHED;
  return String(value);
}

const SEVERITY_TONE: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-bad/12 text-bad border-bad/30',
  HIGH: 'bg-bad/12 text-bad border-bad/30',
  MEDIUM: 'bg-warn/12 text-warn border-warn/30',
  LOW: 'bg-accent/12 text-accent border-accent/25',
  INFORMATIONAL: 'bg-ok/12 text-ok border-ok/25',
  UNKNOWN: 'bg-ink/8 text-ink-3 border-[var(--border-1)]',
};

type RemediationKind =
  | 'REVOKE_APPROVAL'
  | 'DELEGATION'
  | 'PRIVILEGED_CONTROL'
  | 'UPGRADE_AUTHORITY'
  | 'MONITOR_ONLY'
  | 'EXPOSURE_REVIEW'
  | 'GENERIC';

/**
 * Evidence-first remediation. Each plan is derived from the finding's own
 * fields — never from a hallucinated scenario. Sentinel documents; it never
 * signs, simulates, broadcasts, or estimates gas.
 */
function findRemediation(
  finding: Finding,
): { kind: RemediationKind; title: string; steps: string[]; note: string; implication: string } {
  const t = finding.findingType.toUpperCase();

  // Authorization findings only — "review authorizations" is never offered
  // for a finding that is not actually about an allowance/approval.
  if (t.includes('ALLOWANCE') || t.includes('APPROVAL')) {
    const token = finding.token?.address ?? finding.evidence.contractAddress;
    const spender = finding.spender?.address;
    return {
      kind: 'REVOKE_APPROVAL',
      title: 'Review and revoke the allowance',
      steps: [
        `Token: ${finding.token?.symbol ? `${finding.token.symbol} · ` : ''}${displayValue(token)}`,
        `Spender: ${displayValue(spender)}`,
        `Allowance record: ${displayValue(finding.evidence.formattedAllowance ?? finding.allowance ?? finding.evidence.allowanceAmount)}`,
        'Before acting, verify the allowance against the live chain state — re-run this investigation after any change so the slot is re-read.',
        'To revoke, the controlling (owner) account signs approve(spender, 0); that transaction must be submitted from the owner wallet. Only the address that granted the allowance can revoke it.',
      ],
      note: 'Sentinel is an investigation layer, not a wallet. It does not sign, simulate, broadcast, or estimate gas for transactions, and it never revokes approvals itself.',
      implication:
        'A live allowance authorizes the spender to move funds up to the granted amount. It is observed chain state — verify it against the token contract before acting, not after.',
    };
  }

  if (t.includes('7702') || t.includes('DELEGATION')) {
    const target =
      finding.evidence.stateSlot ??
      finding.tripartite.observed.find((o) => /0x[0-9a-fA-F]{40}/.test(o))?.split(' ').find((w) => /^0x[0-9a-fA-F]{40}$/.test(w));
    return {
      kind: 'DELEGATION',
      title: 'Review the EIP-7702 delegation designator',
      steps: [
        target ? `Delegation target referenced in evidence: ${target}` : 'Delegation target is present in the finding evidence.',
        'A delegation designator is set per account and per chain; only the controlling account can change it, via an authorized transaction.',
        'Verify whether the delegation is intentional before considering any change. A delegation is not inherently malicious.',
        'Re-run this investigation after any change so the delegation slot is read again from live chain state.',
      ],
      note: 'Sentinel reports the delegation because it is observed chain state. It does not imply the target is malicious and never issues the removal transaction.',
      implication:
        'An EIP-7702 delegation redirects this account\u2019s execution to the delegated contract. It changes which code runs for this account and is set per account, per chain.',
    };
  }

  if (t.includes('CURRENT_TOKEN_EXPOSURE')) {
    const token = finding.token?.symbol;
    return {
      kind: 'EXPOSURE_REVIEW',
      title: 'Verify the observed token balances against live chain state',
      steps: [
        token ? `Tracked token: ${token}` : 'Tracked token: Not established from available evidence.',
        'This is the current token balance the engine observed for this account — it is not an authorization and not a revocable allowance.',
        'Correlate the reading against the token contract\u2019s balanceOf state to confirm it matches the engine snapshot.',
        'Re-run the investigation after any transaction to refresh the snapshot.',
      ],
      note: 'Sentinel does not freeze, move, or revoke token balances. This finding is a balance, not an allowance — any corrective transaction must be executed by the controlling account.',
      implication:
        'Exposed balances are the tokens the engine observed on this account. Risk only materializes when those balances are paired with stale authorizations — this finding alone is not an allowance.',
    };
  }

  if (t.includes('NATIVE_BALANCE')) {
    return {
      kind: 'MONITOR_ONLY',
      title: 'Note the observed native balance',
      steps: [
        'This is the ETH/native balance read from the chain for this account at investigation time.',
        'Re-run the investigation when a change is expected so the latest block state is re-read.',
        'A native balance carries no authorization semantics — it is straightforward, verifiable state.',
      ],
      note: 'Sentinel only reports the observed balance. It never sends or receives funds on the account\u2019s behalf.',
      implication: 'Current native balance of the account, directly observed from chain state.',
    };
  }

  if (t.includes('ADMIN') || t.includes('PRIVILEG') || t.includes('TIMELOCK')) {
    return {
      kind: 'PRIVILEGED_CONTROL',
      title: 'Reduce privileged control',
      steps: [
        'Identify who holds each privileged role and whether it is timelocked.',
        'Rotate or remove privileged signer(s) from the authority set.',
        'Enforce or extend a timelock on capability-changing calls, and re-check thresholds so no single key can drain funds or change logic.',
      ],
      note: 'Changes to governance roles must be proposed through the protocol itself. Sentinel only documents the observed authority, never modifies it.',
      implication:
        'A privileged account can change critical protocol parameters or move funds. The exact capabilities come from the evidence set, not from this panel.',
    };
  }

  if (t.includes('UPGRADE') || t.includes('PROXY') || t.includes('IMPLEMENTATION') || t.includes('CONCENTRATION')) {
    return {
      kind: 'UPGRADE_AUTHORITY',
      title: 'Constrain upgrade authority',
      steps: [
        'Identify who holds the upgrade role and whether it is timelocked.',
        'Verify the implementation is verified and bytecode matches the published source.',
        'Restrict implementation changes behind the highest-security control available.',
      ],
      note: 'Upgrade authority is a capability, not an incident. Sentinel documents the exposed capability and its evidence.',
      implication: 'An upgrade path lets an authority replace the implementation behind this contract.',
    };
  }

  if (t.includes('TRANSFER') || t.includes('BURST') || t.includes('ANOMAL')) {
    return {
      kind: 'MONITOR_ONLY',
      title: 'Monitor and investigate the pattern',
      steps: [
        'This is a settled or ongoing transfer pattern, not a controllable knob.',
        'Correlate the involved counterparties with the rest of the Activity section.',
        'Set on-chain alerts for further activity from the same counterparties.',
      ],
      note: 'No direct remediation exists for a transfer pattern. Continue observing — Sentinel does not freeze or reverse transfers.',
      implication: 'An unusual transfer pattern worth correlating with the rest of the investigation.',
    };
  }

  return {
    kind: 'GENERIC',
    title: 'Review the evidence against live chain state',
    steps: [
      'Open each OBSERVED fact and verify it against the live chain state (block explorer, RPC calls, or a re-run of this investigation).',
      ...(finding.status === 'HISTORICAL'
        ? ['This is a settled historical event — no immediate action is required; keep it for context.']
        : finding.status === 'ACTIVE'
          ? ['This reflects current chain state — confirm it is expected before proceeding.']
          : ['Confirm each UNKNOWN boundary before taking any action.']),
      'Any corrective transaction must be executed by the controlling account — this panel only documents evidence.',
    ],
    note: 'Sentinel is an investigation layer, not a wallet. It never signs, simulates, broadcasts, or estimates gas for transactions.',
    implication: 'An on-chain event worth correlating with the rest of the investigation. It is evidence, not a verdict.',
  };
}

const STEPS_TO_KIND: Record<RemediationKind, string> = {
  REVOKE_APPROVAL: 'Allowance control is the actionable surface — revoke from the owner wallet.',
  DELEGATION: 'Delegation is account state — change it from the controlling account.',
  PRIVILEGED_CONTROL: 'Authority reduction must be proposed through the protocol governance.',
  UPGRADE_AUTHORITY: 'Capability, not incident — constrain it through existing governance.',
  MONITOR_ONLY: 'No direct remediation exists — continue observing the evidence.',
  EXPOSURE_REVIEW: 'A balance is evidence, not a knob — verify against live chain state.',
  GENERIC: 'Evidence review — correlate with the wider investigation before concluding.',
};

function isCriticalTone(severity: SeverityLevel): boolean {
  return severity === 'CRITICAL' || severity === 'HIGH';
}

export const EvidenceDetailPanel: React.FC<EvidenceDetailPanelProps> = ({
  finding,
  onClose,
  targetAddress,
  chainName,
  onOpenEvidence,
  blockExplorerUrl,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tripartite' | 'raw_proof' | 'remediation'>('tripartite');

  if (!finding) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const critical = isCriticalTone(finding.severity);

  // What-was-detected rows for the Action & Remediation tab (from the finding
  // only — nothing is invented; missing values render as UNESTABLISHED).
  const detectionRows: Array<{ label: string; value: string; copyKey?: string; explorer?: string }> = [];
  if (finding.token?.address) {
    const explorer = blockExplorerUrl ? `${blockExplorerUrl}/token/${finding.token.address}` : undefined;
    detectionRows.push({
      label: 'Token',
      value: finding.token.symbol ? `${finding.token.symbol} · ${finding.token.address}` : finding.token.address,
      copyKey: 'token',
      explorer,
    });
  }
  const ev = finding.evidence;
  if (ev.contractAddress) {
    detectionRows.push({
      label: 'Contract',
      value: ev.contractAddress,
      copyKey: 'contract',
      explorer: blockExplorerUrl ? `${blockExplorerUrl}/address/${ev.contractAddress}` : undefined,
    });
  }
  if (finding.spender?.address) {
    detectionRows.push({
      label: 'Spender',
      value: finding.spender.address,
      copyKey: 'spender',
      explorer: blockExplorerUrl ? `${blockExplorerUrl}/address/${finding.spender.address}` : undefined,
    });
  }
  const allowance = ev.formattedAllowance ?? finding.allowance ?? ev.allowanceAmount;
  if (allowance) detectionRows.push({ label: 'Allowance', value: allowance, copyKey: 'allowance' });
  if (ev.transactionHash) detectionRows.push({ label: 'Tx Hash', value: ev.transactionHash, copyKey: 'tx' });
  if (ev.blockNumber) detectionRows.push({ label: 'Block', value: `#${ev.blockNumber}` });
  if (ev.verificationMethod) detectionRows.push({ label: 'Verified Via', value: ev.verificationMethod });
  if (ev.timestamp) detectionRows.push({ label: 'Timestamp', value: ev.timestamp });

  const tripartiteTab = (
    <div className="space-y-4">
      {/* Section 1: OBSERVED */}
      <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-accent">
        <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-ink font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-ok" />
            <span>OBSERVED // VERIFIED FACTS</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-ink/5 text-ink-3 border border-[var(--border-1)] font-medium">
            Deterministic RPC Truth
          </span>
        </div>

        <ul className="space-y-2">
          {finding.tripartite.observed.map((obs, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
              <span className="text-ink-3 font-bold shrink-0 mt-0.5">[{i + 1}]</span>
              <span className="leading-relaxed min-w-0">{obs}</span>
            </li>
          ))}
        </ul>

        {/* Evidence Details */}
        {(ev.transactionHash || ev.blockNumber || allowance) && (
          <div className="mt-3 pt-3 border-t border-[var(--border-1)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            {ev.transactionHash && (
              <div className="glass-well p-2 flex items-center justify-between gap-2 min-w-0">
                <span className="text-ink-3 shrink-0">Tx Hash:</span>
                <div className="flex items-center gap-1 font-mono min-w-0">
                  <span className="text-ink-2 truncate max-w-[150px]">{`${ev.transactionHash.slice(0, 10)}…${ev.transactionHash.slice(-6)}`}</span>
                  <button
                    onClick={() => handleCopy(ev.transactionHash!, 'tx')}
                    className="text-ink-3 hover:text-ink shrink-0"
                    aria-label="Copy transaction hash"
                  >
                    {copiedField === 'tx' ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {ev.blockNumber && (
              <div className="glass-well p-2 flex items-center justify-between gap-2 min-w-0">
                <span className="text-ink-3 shrink-0">Block:</span>
                <span className="text-ink-2 font-mono">#{ev.blockNumber}</span>
              </div>
            )}

            {allowance && (
              <div className="glass-well p-2 flex items-center justify-between gap-2 sm:col-span-2 min-w-0">
                <span className="text-ink-3 shrink-0">Allowance:</span>
                <span className="text-warn font-bold truncate min-w-0">{allowance}</span>
              </div>
            )}
          </div>
        )}

        {/* Evidence record links -> Evidence section (interactive) */}
        {(finding.evidenceIds?.length ?? 0) > 0 && onOpenEvidence && (
          <div className="mt-3 pt-3 border-t border-[var(--border-1)] flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-ink-3 uppercase tracking-wider font-semibold">
              Engine records supporting this finding:
            </span>
            {finding.evidenceIds!.map((id) => (
              <button
                key={id}
                onClick={() => onOpenEvidence!(id)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
              >
                <Database className="w-3 h-3" /> {id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: INFERRED */}
      <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-warn">
        <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-ink font-bold text-xs">
            <TrendingUp className="w-4 h-4 shrink-0 text-warn" />
            <span>INFERRED // DERIVED HYPOTHESIS</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-ink/5 text-ink-3 border border-[var(--border-1)] font-medium">
            Logical Deduction
          </span>
        </div>

        <ul className="space-y-2">
          {finding.tripartite.inferred.map((inf, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
              <span className="text-ink-3 font-bold shrink-0 mt-0.5">↳</span>
              <span className="leading-relaxed min-w-0">{inf}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 3: UNKNOWN */}
      <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-ink-3">
        <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-ink-2 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-ink-3 shrink-0" />
            <span>UNKNOWN // EXPLICIT BOUNDARIES</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-ink/5 text-ink-2 border border-[var(--border-1)] font-medium">
            Epistemic Bound
          </span>
        </div>

        {finding.tripartite.unknown.length > 0 ? (
          <ul className="space-y-2">
            {finding.tripartite.unknown.map((unk, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
                <span className="text-ink-2 font-bold shrink-0 mt-0.5">?</span>
                <span className="leading-relaxed min-w-0">{unk}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-2 glass-well p-2.5">{UNESTABLISHED}</p>
        )}
      </div>
    </div>
  );

  const remediationTab = (
    <div className="space-y-4">
      {(() => {
        const plan = findRemediation(finding);

        return (
          <>
            {/* WHAT WAS DETECTED */}
            <section className="liquid-glass-subtle rounded-2xl p-4 border-l-4 border-l-accent">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-ink font-bold text-xs">
                  <Eye className="w-4 h-4 shrink-0 text-ink-3" />
                  <span>WHAT WAS DETECTED</span>
                </div>
                {finding.status && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border ${
                      finding.status === 'ACTIVE'
                        ? 'bg-bad/12 text-bad border-bad/30'
                        : finding.status === 'HISTORICAL'
                          ? 'bg-ink/8 text-ink-3 border-[var(--border-1)]'
                          : 'bg-warn/12 text-warn border-warn/30'
                    }`}
                  >
                    {finding.status}
                  </span>
                )}
              </div>

              {detectionRows.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectionRows.map((row) => (
                    <div key={row.label + (row.value ?? '')} className="glass-well p-2 flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[10px] text-ink-3 shrink-0 uppercase tracking-wider">{row.label}</span>
                      <span className="text-[11px] text-ink-2 font-mono truncate min-w-0 text-right" title={row.value}>
                        {row.value}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        {row.copyKey && (
                          <button
                            onClick={() => handleCopy(row.value, row.copyKey!)}
                            className="p-1 text-ink-3 hover:text-ink cursor-pointer"
                            aria-label={`Copy ${row.label}`}
                          >
                            {copiedField === row.copyKey ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                        {row.explorer && (
                          <a
                            href={row.explorer}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-ink-3 hover:text-accent"
                            title="Open in block explorer"
                            aria-label={`Open ${row.label} in block explorer`}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-ink-2 glass-well p-2.5">{UNESTABLISHED}</p>
              )}

              {(finding.evidenceIds?.length ?? 0) > 0 && onOpenEvidence && (
                <div className="mt-3 pt-3 border-t border-[var(--border-1)] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-ink-3 uppercase tracking-wider font-semibold">
                    Engine records supporting this finding:
                  </span>
                  {finding.evidenceIds!.map((id) => (
                    <button
                      key={id}
                      onClick={() => onOpenEvidence!(id)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" /> {id}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* WHY IT MATTERS */}
            <section className="liquid-glass-subtle rounded-2xl p-4 border-l-4 border-l-warn">
              <div className="flex items-center gap-2 text-ink font-bold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-warn" />
                <span>WHY IT MATTERS</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">{plan.implication}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border ${
                    finding.confidence === 'OBSERVED'
                      ? 'bg-ok/12 text-ok border-ok/25'
                      : finding.confidence === 'INFERRED'
                        ? 'bg-warn/12 text-warn border-warn/30'
                        : 'bg-ink/8 text-ink-3 border-[var(--border-1)]'
                  }`}
                >
                  {finding.confidence}
                </span>
                <span className="text-[10px] text-ink-3">
                  {finding.confidence === 'OBSERVED'
                    ? 'Directly read from chain state — verify, do not re-derive.'
                    : finding.confidence === 'INFERRED'
                      ? 'Derived from observed evidence — treat as a hypothesis, not ground truth.'
                      : 'Not resolvable from available evidence — treat as a boundary.'}
                </span>
              </div>
            </section>

            {/* RECOMMENDED NEXT STEP */}
            <section className="liquid-glass-subtle rounded-2xl p-4 border-l-4 border-l-accent">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-ink font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-ink-3" />
                  <span>RECOMMENDED NEXT STEP</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-ink/8 text-ink-3 border border-[var(--border-1)]">
                  {plan.kind.replace(/_/g, ' ')}
                </span>
              </div>

              <h4 className="mt-2.5 text-sm font-bold text-ink mb-2">{plan.title}</h4>

              <ol className="space-y-1.5">
                {plan.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-2 leading-relaxed min-w-0">
                    <span className="text-ink-3 font-bold shrink-0 mt-0.5">[{i + 1}]</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {STEPS_TO_KIND[plan.kind] && (
                <p className="mt-2.5 text-[10px] text-ink-3">{STEPS_TO_KIND[plan.kind]}</p>
              )}

              {/* Suggested calldata, when the engine established it — otherwise never shown. */}
              {finding.remediation?.suggestedCalldata && (
                <div className="mt-3">
                  <label className="text-[10px] text-ink-3 block mb-1">
                    Established payload from the engine (copy, do not trust a renderer) — still sign from the controlling wallet:
                  </label>
                  <div className="glass-well p-3 font-mono text-xs text-accent break-all flex items-start justify-between gap-2">
                    <span className="min-w-0 break-all">{finding.remediation.suggestedCalldata}</span>
                    <button
                      onClick={() => handleCopy(finding.remediation!.suggestedCalldata!, 'calldata')}
                      className="p-1 text-ink-3 hover:text-ink shrink-0 cursor-pointer"
                      aria-label="Copy suggested calldata"
                    >
                      {copiedField === 'calldata' ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Honest execution boundary — Sentinel never executes anything */}
              <div className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-3.5 py-2.5 text-[11px] text-ink-2 leading-relaxed">
                <span className="text-warn font-bold">Note:</span> {plan.note}
              </div>
              <div className="mt-2 rounded-xl border border-[var(--border-1)] bg-ink/5 px-3.5 py-2.5 text-[11px] text-ink-2 leading-relaxed">
                <span className="text-ink font-semibold">Who executes this? Not Sentinel.</span>
                <span className="block mt-1">
                  Sentinel is an investigation layer, not a wallet. It does not sign, simulate, broadcast, or estimate gas
                  for transactions, and it will never move funds or call contract functions on your behalf. Review this
                  evidence against the live chain state, then take any corrective transaction to the controlling account
                  and execute it from there.
                </span>
              </div>
            </section>

            {/* LIMITATIONS */}
            {finding.tripartite.unknown.length > 0 && (
              <section className="liquid-glass-subtle rounded-2xl p-4 border-l-4 border-l-ink-3">
                <div className="flex items-center gap-2 text-ink-2 font-bold text-xs mb-2">
                  <HelpCircle className="w-4 h-4 text-ink-3 shrink-0" />
                  <span>LIMITATIONS // UNKNOWN BOUNDARIES</span>
                </div>
                <ul className="space-y-2">
                  {finding.tripartite.unknown.map((unk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5 leading-relaxed">
                      <span className="text-ink-2 font-bold shrink-0 mt-0.5">?</span>
                      <span>{unk}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-[10px] text-ink-3">
                  Where a field is unavailable, it reads “{UNESTABLISHED}” rather than being guessed.
                </p>
              </section>
            )}
          </>
        );
      })()}
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={`Evidence Inspector — ${finding.title}`}>
      {/* Subtle dark overlay: keeps the underlying investigation recognizable (no heavy blur). */}
      <div className="fixed inset-0 z-40 bg-[#040d1c]/35 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />

      {/* Integrated investigation side panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full min-w-0 flex-col overflow-hidden liquid-glass-strong border-l border-[var(--border-2)] shadow-2xl animate-in slide-in-from-right duration-300 sm:w-[min(46vw,760px)] sm:min-w-[560px] sm:max-w-[760px] ${
          critical ? 'ring-1 ring-bad/25' : ''
        }`}
      >
        {critical && <div className="h-[2px] shrink-0 bg-gradient-to-r from-bad/70 via-bad/25 to-transparent" />}

        {/* Sticky header */}
        <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-[var(--border-1)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                  SEVERITY_TONE[finding.severity] ?? SEVERITY_TONE.UNKNOWN
                }`}
              >
                {finding.severity}
              </span>
              <span className="hidden sm:inline text-[10px] text-ink-3 font-semibold uppercase tracking-[0.18em]">
                Evidence Inspector
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Evidence Inspector"
              className="shrink-0 p-2 text-ink-3 hover:text-ink bg-ink/5 hover:bg-ink/10 rounded-xl border border-[var(--border-1)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="mt-2 text-lg font-bold text-ink leading-snug">{finding.title}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-ink-3">
            <span className="liquid-glass-subtle rounded-md px-2 py-0.5 text-ink-2">{chainName ?? UNESTABLISHED}</span>
            {targetAddress && (
              <span className="liquid-glass-subtle rounded-md px-2 py-0.5 font-mono text-technical" title={targetAddress}>
                {targetAddress.slice(0, 6)}…{targetAddress.slice(-4)}
              </span>
            )}
            <span className="liquid-glass-subtle rounded-md px-2 py-0.5 font-mono text-technical">
              {finding.findingType}
            </span>
            <span>investigation subject</span>
          </div>
        </div>

        {/* Sticky responsive tab bar — scrolls horizontally when narrow, never truncates labels */}
        <div className="shrink-0 flex items-stretch border-b border-[var(--border-1)] bg-ink/5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tripartite')}
            className={`shrink-0 whitespace-nowrap py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tripartite'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Observed / Inferred / Unknown</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_proof')}
            className={`shrink-0 whitespace-nowrap py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'raw_proof'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span>Raw RPC Proofs & Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('remediation')}
            className={`shrink-0 whitespace-nowrap py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'remediation'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Action & Remediation</span>
          </button>
        </div>

        {/* Scrollable content only — header and tabs stay pinned */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 min-w-0">
          {activeTab === 'tripartite' && tripartiteTab}
          {activeTab === 'raw_proof' && (
            <div className="space-y-4">
              <div className="liquid-glass-subtle rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-ink-2 mb-3 gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <Database className="w-3.5 h-3.5 text-ink-3" />
                    Method: {finding.evidence.verificationMethod}
                  </span>
                  <span className="text-ink-3 text-[10px]">EVM State Grounded</span>
                </div>

                {finding.evidence.contractAddress && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">Contract Address Under Audit</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-ink-2 break-all flex items-center justify-between">
                      <span>{finding.evidence.contractAddress}</span>
                      <button 
                        onClick={() => handleCopy(finding.evidence.contractAddress!, 'contract')}
                        className="text-ink-3 hover:text-ink"
                      >
                        {copiedField === 'contract' ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {finding.evidence.stateSlot && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">EVM Storage Slot / Mapping</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-technical break-all">
                      {finding.evidence.stateSlot}
                    </div>
                  </div>
                )}

                {finding.evidence.rawCalldata && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">Raw Calldata Payload</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-ink-2 break-all max-h-28 overflow-y-auto">
                      {finding.evidence.rawCalldata}
                    </div>
                  </div>
                )}

                {finding.allowance && (
                  <div>
                    <label className="text-[10px] text-ink-3 block mb-1">Decoded Raw Allowance (uint256)</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-warn break-all">
                      {finding.allowance}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON export */}
              <div className="liquid-glass-subtle rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-ink-2">Structured Backend JSON Payload</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(finding, null, 2), 'json')}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'json' ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-ink-2 glass-well p-3 overflow-x-auto max-h-52">
                  {JSON.stringify({
                    findingType: finding.findingType,
                    status: finding.confidence,
                    severity: finding.severity,
                    token: finding.token,
                    spender: finding.spender,
                    allowance: finding.allowance,
                    evidence: finding.evidence,
                    tripartite: finding.tripartite
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ACTION & REMEDIATION */}
          {activeTab === 'remediation' && remediationTab}
        </div>

      </div>
    </div>
  );
};
