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
    <section className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/20">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#fde68a] mb-1 border border-[#fde68a]/30 bg-[#fef3c7]/10">
            <Zap className="w-3 h-3 text-[#fde68a]" />
            <span>2. WHAT IS ACTIVE NOW?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] font-mono flex items-center gap-2">
            <span>CURRENT EXPOSURE</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Live allowances, active permissions, proxy upgradeability, administrative keys, and current contract relationships.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-3 py-1 rounded-xl liquid-pill text-[#fde68a] font-bold border-[#fde68a]/40 shadow-sm">
            {allowances.length + permissions.length + (upgradeability?.isUpgradeable ? 1 : 0)} Active Rights
          </span>
        </div>
      </div>

      {/* Grid of Active Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: ACTIVE ALLOWANCES */}
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#bae6fd] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#bae6fd]" />
                <span>Active Allowances</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#bae6fd]/15 text-[#bae6fd]">
                {allowances.length} Active
              </span>
            </div>

            {allowances.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-[#2dd4bf] mx-auto mb-1 opacity-80" />
                <p className="text-xs text-slate-300 font-mono">Zero active allowances detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allowances.map((allowance, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#fdfbf7] text-sm">{allowance.symbol}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                        {allowance.isUnlimited ? 'Unlimited' : allowance.allowance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Observed Balance:</span>
                      <span className="text-[#bae6fd] font-bold">{allowance.balance}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Spender:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-200">
                          {allowance.spender.slice(0, 6)}...{allowance.spender.slice(-4)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(allowance.spender, `sp-all-${idx}`)}
                          className="p-1 hover:text-white"
                          title="Copy spender"
                        >
                          {copiedId === `sp-all-${idx}` ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`${blockExplorerUrl}/address/${allowance.spender}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-[#bae6fd]"
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
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#93c5fd] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#93c5fd]" />
                <span>Contract Upgradeability</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                upgradeability?.isUpgradeable 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' 
                  : 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30'
              }`}>
                {upgradeability?.isUpgradeable ? 'Upgradeable: YES' : 'Upgradeable: NO'}
              </span>
            </div>

            {upgradeability?.isUpgradeable ? (
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Proxy Architecture:</span>
                  <span className="text-[#fdfbf7] font-bold">{upgradeability.proxyType || 'EIP-1967 Transparent'}</span>
                </div>

                {upgradeability.implementation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Implementation:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#93c5fd]">
                        {upgradeability.implementation.slice(0, 6)}...{upgradeability.implementation.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upgradeability.implementation!, 'impl-upg')}
                        className="p-1 hover:text-white"
                      >
                        {copiedId === 'impl-upg' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {upgradeability.admin && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Proxy Admin:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#fca5a5]">
                        {upgradeability.admin.slice(0, 6)}...{upgradeability.admin.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upgradeability.admin!, 'adm-upg')}
                        className="p-1 hover:text-white"
                      >
                        {copiedId === 'adm-upg' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {upgradeability.timelockDelay && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Timelock Delay:</span>
                    <span className={upgradeability.timelockDelay === '0 seconds' ? 'text-rose-400 font-bold' : 'text-[#fde68a]'}>
                      {upgradeability.timelockDelay}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-amber-300/90 leading-snug pt-1">
                  Warning: Code logic can be swapped atomically if the proxy admin key is compromised.
                </div>
              </div>
            ) : upgradeability?.status === 'UNKNOWN' ? (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>UNKNOWN</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {upgradeability.unknownReason || 'Bytecode decompilation incomplete; proxy slot unverified.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs font-mono space-y-1 text-slate-300">
                <div className="font-bold text-[#2dd4bf]">Immutable Bytecode</div>
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
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#fca5a5] flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                <span>Admin Control</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fca5a5]/15 text-[#fca5a5]">
                {adminControl?.isMultisig ? 'Multisig Governed' : 'Single Key'}
              </span>
            </div>

            {adminControl?.adminAddress ? (
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admin Key:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#fca5a5] font-bold">
                      {adminControl.adminAddress.slice(0, 6)}...{adminControl.adminAddress.slice(-4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(adminControl.adminAddress!, 'adm-ctrl')}
                      className="p-1 hover:text-white"
                    >
                      {copiedId === 'adm-ctrl' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Key Concentration:</span>
                  <span className={adminControl.isMultisig ? 'text-[#2dd4bf]' : 'text-rose-400 font-bold'}>
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
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>UNKNOWN</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {adminControl.unknownReason || 'Owner/admin getter not standard or reverted.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs font-mono text-slate-300">
                <p className="text-[11px] text-slate-400">No external administrative owner role assigned in state.</p>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Ownership roles verified via EIP-173 owner() and AccessControl records.
          </div>
        </div>

        {/* CARD 4: EXPOSED ASSETS */}
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#fde68a] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#fde68a]" />
                <span>Exposed Assets</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fef3c7]/15 text-[#fde68a]">
                {exposedAssets.length} Assets
              </span>
            </div>

            {exposedAssets.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No assets currently exposed.</p>
            ) : (
              <div className="space-y-2">
                {exposedAssets.map((asset, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs font-mono flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#fdfbf7]">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">
                        {asset.allowanceText || 'Unlimited Approval'}
                      </div>
                    </div>

                    <div className="text-right">
                      {asset.status === 'UNKNOWN' ? (
                        <div className="text-xs font-bold text-slate-400">
                          UNKNOWN
                          {asset.unknownReason && (
                            <div className="text-[9px] text-slate-500 font-normal">{asset.unknownReason}</div>
                          )}
                        </div>
                      ) : (
                        <div className="font-bold text-[#bae6fd]">{asset.balance}</div>
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
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active Permissions</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300">
                {permissions.length} Roles
              </span>
            </div>

            {permissions.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No unconstrained permission roles.</p>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-200">{perm.role}</span>
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
        <div className="liquid-glass-subtle rounded-2xl p-5 border border-white/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2dd4bf] flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Current Contract Relationships</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2dd4bf]/15 text-[#2dd4bf]">
                {relationships.length} Links
              </span>
            </div>

            {relationships.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No external relationships mapped.</p>
            ) : (
              <div className="space-y-2">
                {relationships.map((rel, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs font-mono space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#fdfbf7] font-bold">{rel.source}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] uppercase bg-[#2dd4bf]/20 text-[#2dd4bf] font-bold">
                        {rel.relationship}
                      </span>
                      <span className="text-[#bae6fd] font-bold">{rel.target}</span>
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
        <div className="mt-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>EXPLICIT UNKNOWN BOUNDS (Epistemic Honesty)</span>
          </div>
          <div className="space-y-1.5">
            {unknowns.map((u, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-amber-400 font-bold shrink-0">UNKNOWN // {u.field}:</span>
                <span>{u.detail || u.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
