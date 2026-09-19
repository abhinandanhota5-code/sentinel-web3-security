import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Key, 
  GitBranch 
} from 'lucide-react';
import type { CurrentExposureDetails, CurrentExposureItem } from '../types/sentinel';

interface CurrentExposureViewProps {
  exposureDetails?: CurrentExposureDetails;
  exposuresList?: CurrentExposureItem[];
  blockExplorerUrl?: string;
  onSelectExposureItem?: (item: CurrentExposureItem) => void;
}

export const CurrentExposureView: React.FC<CurrentExposureViewProps> = ({
  exposureDetails,
  exposuresList = [],
  blockExplorerUrl = 'https://etherscan.io',
  onSelectExposureItem,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allowances = exposureDetails?.activeAllowances || [];
  const permissions = exposureDetails?.activePermissions || [];
  const upgradeability = exposureDetails?.upgradeability;
  const adminControl = exposureDetails?.adminControl;
  const exposedAssets = exposureDetails?.exposedAssets || [];
  const relationships = exposureDetails?.contractRelationships || [];
  const unknowns = exposureDetails?.unknowns || [];

  return (
    <section className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#dfba82] mb-1.5 border border-[#9A7A4A]/30 bg-[#9A7A4A]/15">
            <Zap className="w-3 h-3 text-[#dfba82]" />
            <span>2. WHAT IS ACTIVE NOW?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span>CURRENT EXPOSURE</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Live allowances, active permissions, proxy upgradeability, administrative keys, and current contract relationships.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-3 py-1 rounded-xl liquid-pill text-slate-200 font-semibold border-white/15 shadow-sm">
            {allowances.length + permissions.length + (upgradeability?.isUpgradeable ? 1 : 0)} Active Rights
          </span>
        </div>
      </div>

      {/* Grid of Active Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* CARD 1: ACTIVE ALLOWANCES */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#88b0d8]" />
                <span>Active Allowances</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5B7FA6]/15 text-[#9ac2e8] border border-[#5B7FA6]/30 font-medium">
                {allowances.length} Active
              </span>
            </div>

            {allowances.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-[#8cc4a1] mx-auto mb-1 opacity-80" />
                <p className="text-xs text-slate-400 font-mono">Zero active allowances detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allowances.map((allowance, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">{allowance.symbol}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A45F5F]/15 text-[#d97f7f] border border-[#A45F5F]/30">
                        {allowance.isUnlimited ? 'Unlimited' : allowance.allowance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Observed Balance:</span>
                      <span className="text-slate-100 font-medium">{allowance.balance}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Spender:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300">
                          {allowance.spender.slice(0, 6)}...{allowance.spender.slice(-4)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(allowance.spender, `sp-all-${idx}`)}
                          className="p-1 hover:text-white"
                          title="Copy spender"
                        >
                          {copiedId === `sp-all-${idx}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`${blockExplorerUrl}/address/${allowance.spender}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-white"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {allowance.spenderLabel && (
                      <div className="text-[10px] text-slate-400 italic">
                        {allowance.spenderLabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Cryptographic storage slot validation via eth_getStorageAt.
          </div>
        </div>

        {/* CARD 2: UPGRADEABILITY & PROXY STATE */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#88b0d8]" />
                <span>Contract Upgradeability</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                upgradeability?.isUpgradeable 
                  ? 'bg-[#9A7A4A]/15 text-[#dfba82] border border-[#9A7A4A]/30' 
                  : 'bg-[#5E806A]/15 text-[#8cc4a1] border border-[#5E806A]/30'
              }`}>
                {upgradeability?.isUpgradeable ? 'Upgradeable: YES' : 'Upgradeable: NO'}
              </span>
            </div>

            {upgradeability?.isUpgradeable ? (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Proxy Architecture:</span>
                  <span className="text-white font-medium">{upgradeability.proxyType || 'EIP-1967 Transparent'}</span>
                </div>

                {upgradeability.implementation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Implementation:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#88b0d8]">
                        {upgradeability.implementation.slice(0, 6)}...{upgradeability.implementation.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upgradeability.implementation!, 'impl-upg')}
                        className="p-1 hover:text-white"
                      >
                        {copiedId === 'impl-upg' ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {upgradeability.admin && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Proxy Admin:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#d97f7f]">
                        {upgradeability.admin.slice(0, 6)}...{upgradeability.admin.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upgradeability.admin!, 'adm-upg')}
                        className="p-1 hover:text-white"
                      >
                        {copiedId === 'adm-upg' ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {upgradeability.timelockDelay && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Timelock Delay:</span>
                    <span className={upgradeability.timelockDelay === '0 seconds' ? 'text-[#d97f7f] font-semibold' : 'text-[#dfba82]'}>
                      {upgradeability.timelockDelay}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-[#dfba82]/90 leading-snug pt-1">
                  Warning: Code logic can be swapped atomically if the proxy admin key is compromised.
                </div>
              </div>
            ) : upgradeability?.status === 'UNKNOWN' ? (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>UNKNOWN</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {upgradeability.unknownReason || 'Bytecode decompilation incomplete; proxy slot unverified.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono space-y-1 text-slate-300">
                <div className="font-semibold text-[#8cc4a1]">Immutable Bytecode</div>
                <p className="text-[11px] text-slate-400">
                  Contract contains no delegatecall dispatchers or proxy storage slots. Code cannot be modified.
                </p>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Slot 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc checked.
          </div>
        </div>

        {/* CARD 3: ADMIN CONTROL & GOVERNANCE */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#d97f7f] flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-[#d97f7f]" />
                <span>Admin Control</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A45F5F]/15 text-[#d97f7f] border border-[#A45F5F]/30 font-medium">
                {adminControl?.isMultisig ? 'Multisig Governed' : 'Single Key'}
              </span>
            </div>

            {adminControl?.adminAddress ? (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admin Key:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#d97f7f] font-semibold">
                      {adminControl.adminAddress.slice(0, 6)}...{adminControl.adminAddress.slice(-4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(adminControl.adminAddress!, 'adm-ctrl')}
                      className="p-1 hover:text-white"
                    >
                      {copiedId === 'adm-ctrl' ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Key Concentration:</span>
                  <span className={adminControl.isMultisig ? 'text-[#8cc4a1]' : 'text-[#d97f7f] font-semibold'}>
                    {adminControl.isMultisig ? `Multisig (${adminControl.threshold || 'Quorum'})` : 'Single EOA Key (High Risk)'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 leading-snug pt-1">
                  {adminControl.isMultisig 
                    ? 'Requires M-of-N threshold signatures to execute privileged admin operations.'
                    : 'Single EOA holds full discretionary authority over contract parameters.'}
                </div>
              </div>
            ) : adminControl?.status === 'UNKNOWN' ? (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>UNKNOWN</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {adminControl.unknownReason || 'Owner/admin getter not standard or reverted.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono text-slate-300">
                <p className="text-[11px] text-slate-400">No external administrative owner role assigned in state.</p>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Ownership roles verified via EIP-173 owner() and AccessControl records.
          </div>
        </div>

        {/* CARD 4: EXPOSED ASSETS */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#dfba82] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#dfba82]" />
                <span>Exposed Assets</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9A7A4A]/15 text-[#dfba82] border border-[#9A7A4A]/30 font-medium">
                {exposedAssets.length} Assets
              </span>
            </div>

            {exposedAssets.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No assets currently exposed.</p>
            ) : (
              <div className="space-y-2">
                {exposedAssets.map((asset, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">
                        {asset.allowanceText || 'Unlimited Approval'}
                      </div>
                    </div>

                    <div className="text-right">
                      {asset.status === 'UNKNOWN' ? (
                        <div className="text-xs font-semibold text-slate-400">
                          UNKNOWN
                          {asset.unknownReason && (
                            <div className="text-[9px] text-slate-500 font-normal">{asset.unknownReason}</div>
                          )}
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-100">{asset.balance}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Zero fake financial loss calculation; real token balance queries only.
          </div>
        </div>

        {/* CARD 5: ACTIVE PERMISSIONS */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#d97f7f] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d97f7f]" />
                <span>Active Permissions</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A45F5F]/15 text-[#d97f7f] border border-[#A45F5F]/30 font-medium">
                {permissions.length} Roles
              </span>
            </div>

            {permissions.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No unconstrained permission roles.</p>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#d97f7f]">{perm.role}</span>
                      <span className="text-[10px] text-slate-400">{perm.holder.slice(0, 6)}...{perm.holder.slice(-4)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {perm.capabilities.map((cap, cIdx) => (
                        <span key={cIdx} className="px-1.5 py-0.5 text-[9px] bg-white/5 border border-white/10 rounded text-slate-300">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Enforced by bytecode role modifiers.
          </div>
        </div>

        {/* CARD 6: CURRENT CONTRACT RELATIONSHIPS */}
        <div className="liquid-glass-subtle rounded-xl p-5 border border-white/10 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-[#88b0d8]" />
                <span>Current Contract Relationships</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5B7FA6]/15 text-[#9ac2e8] border border-[#5B7FA6]/30 font-medium">
                {relationships.length} Links
              </span>
            </div>

            {relationships.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No external relationships mapped.</p>
            ) : (
              <div className="space-y-2">
                {relationships.map((rel, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white font-medium">{rel.source}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-[#5B7FA6]/15 text-[#9ac2e8] border border-[#5B7FA6]/30 font-medium">
                        {rel.relationship}
                      </span>
                      <span className="text-slate-300">{rel.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Structured state links derived from verified blockchain interactions.
          </div>
        </div>

      </div>

      {/* UNKNOWN Disclosures Banner */}
      {unknowns.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>EXPLICIT UNKNOWN BOUNDS (Epistemic Honesty)</span>
          </div>
          <div className="space-y-1.5">
            {unknowns.map((u, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-[#dfba82] font-semibold shrink-0">UNKNOWN // {u.field}:</span>
                <span>{u.detail || u.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
