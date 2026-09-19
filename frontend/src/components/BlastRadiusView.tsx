import React from 'react';
import { 
  DollarSign, 
  ArrowRight, 
  AlertTriangle, 
  Layers, 
  FileCheck2, 
  Key, 
  Globe, 
  ShieldAlert, 
  HelpCircle 
} from 'lucide-react';
import type { BlastRadiusModel } from '../types/sentinel';

interface BlastRadiusViewProps {
  blastRadius: BlastRadiusModel;
  totalBlastRadiusUsd?: number;
  blockExplorerUrl?: string;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({
  blastRadius,
  totalBlastRadiusUsd = 0,
  blockExplorerUrl = 'https://etherscan.io',
}) => {
  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'WALLET':
        return 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/40';
      case 'TOKEN':
        return 'bg-[#fef3c7]/20 text-[#fde68a] border-[#fde68a]/40';
      case 'ALLOWANCE':
        return 'bg-rose-500/15 text-rose-300 border-rose-400/40';
      case 'SPENDER':
        return 'bg-[#bae6fd]/15 text-[#bae6fd] border-[#bae6fd]/40';
      case 'UPGRADEABLE_CONTRACT':
        return 'bg-[#93c5fd]/15 text-[#93c5fd] border-[#93c5fd]/40';
      case 'ADMIN':
        return 'bg-[#fca5a5]/15 text-[#fca5a5] border-[#fca5a5]/40';
      default:
        return 'bg-white/10 text-slate-200 border-white/20';
    }
  };

  return (
    <section className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/20">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#fde68a] mb-1 border border-[#fde68a]/30 bg-[#fef3c7]/10">
            <DollarSign className="w-3 h-3 text-[#fde68a]" />
            <span>Cascading Blast Horizon</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] font-mono flex items-center gap-2">
            <span>CURRENT BLAST RADIUS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            End-to-end authorization chain connecting vulnerable assets to governing keys. Evaluates <strong className="text-slate-100">potential exposure</strong>, not guaranteed loss.
          </p>
        </div>

        {/* Aggregate Exposure Gauge */}
        <div className="liquid-glass-subtle rounded-2xl p-3 px-4 border border-white/15 self-start sm:self-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#fde68a]/15 border border-[#fde68a]/30 flex items-center justify-center text-[#fde68a]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Potential Liquid Exposure
            </div>
            <div className={`text-xl font-mono font-bold ${totalBlastRadiusUsd > 0 ? 'text-rose-300' : 'text-[#2dd4bf]'}`}>
              {totalBlastRadiusUsd > 0 ? formatUsd(totalBlastRadiusUsd) : '$0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. VISUAL AUTHORIZATION CHAIN (Flow Steps) */}
      <div className="mb-6">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#2dd4bf]" />
          <span>Cascading Authorization Pathway</span>
        </div>

        <div className="bg-black/30 rounded-2xl p-4 border border-white/15 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
            {blastRadius.flowSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 min-w-[130px] transition backdrop-blur-md shadow-md ${getStepColor(step.type)}`}>
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono uppercase tracking-wider opacity-80">
                    <span>{step.type.replace('_', ' ')}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#fdfbf7] truncate">
                    {step.label}
                  </div>
                  {step.sublabel && (
                    <div className="text-[10px] font-mono text-slate-300 truncate">
                      {step.sublabel}
                    </div>
                  )}
                  {step.note && (
                    <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                      {step.note}
                    </div>
                  )}
                </div>

                {idx < blastRadius.flowSteps.length - 1 && (
                  <div className="text-slate-400 flex items-center justify-center p-1">
                    <ArrowRight className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SIX STRUCTURED CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Category 1: Assets Potentially Exposed */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#fde68a] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Assets Potentially Exposed</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fef3c7]/15 text-[#fde68a]">
                {blastRadius.assetsPotentiallyExposed.length} Assets
              </span>
            </div>

            {blastRadius.assetsPotentiallyExposed.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No liquid assets currently exposed.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.assetsPotentiallyExposed.map((asset, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-bold text-[#fdfbf7]">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">{asset.status || 'Potential exposure'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#bae6fd]">{asset.balance}</div>
                      {asset.potentialExposureUsd !== undefined && (
                        <div className="text-[10px] text-rose-300 font-semibold">
                          ~{formatUsd(asset.potentialExposureUsd)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Note: Strictly labeled as potential exposure, not verified theft.
          </div>
        </div>

        {/* Category 2: Contracts Involved */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#bae6fd] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Contracts Involved</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#bae6fd]/15 text-[#bae6fd]">
                {blastRadius.contractsInvolved.length} Contracts
              </span>
            </div>

            {blastRadius.contractsInvolved.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No external contracts involved.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.contractsInvolved.map((contract, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs font-mono">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#fdfbf7] truncate">{contract.name || 'Contract'}</span>
                      <span className="text-[10px] text-slate-400">{contract.role || 'Router/Proxy'}</span>
                    </div>
                    <div className="text-[11px] text-[#93c5fd] truncate mt-0.5">
                      {contract.address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Verified across EIP-1967 proxy pointers & router bytecode.
          </div>
        </div>

        {/* Category 3: Permissions Involved */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Permissions Involved</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300">
                {blastRadius.permissionsInvolved.length} Active
              </span>
            </div>

            {blastRadius.permissionsInvolved.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">Zero active permissions detected.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.permissionsInvolved.map((perm, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs font-mono">
                    <div className="font-bold text-rose-200">{perm.name}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{perm.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Permissions remain live until explicit on-chain revocation.
          </div>
        </div>

        {/* Category 4: Privileged Actors */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#fca5a5] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Privileged Actors</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fca5a5]/15 text-[#fca5a5]">
                {blastRadius.privilegedActors.length} Keys
              </span>
            </div>

            {blastRadius.privilegedActors.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No privileged single keys observed.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.privilegedActors.map((actor, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs font-mono">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#fdfbf7]">{actor.role}</span>
                      <span className="text-[10px] text-slate-400">{actor.keyType || 'Single EOA'}</span>
                    </div>
                    <div className="text-[11px] text-[#fca5a5] truncate mt-0.5">
                      {actor.address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Actors with direct administrative authority over state or contracts.
          </div>
        </div>

        {/* Category 5: Chains */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2dd4bf] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Chains & Networks</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2dd4bf]/15 text-[#2dd4bf]">
                {blastRadius.chains.length} Chains
              </span>
            </div>

            <div className="space-y-2">
              {blastRadius.chains.map((chain, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#fdfbf7] font-bold">{chain}</span>
                  <span className="text-[10px] text-[#2dd4bf] font-semibold">Indexed & Monitored</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Cross-chain replay protections and bridged state bounds.
          </div>
        </div>

        {/* Category 6: Coverage Gaps */}
        <div className="liquid-glass-subtle rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#cbd5e1] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Coverage Gaps & Bounds</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                {blastRadius.coverageGaps.length} Gaps
              </span>
            </div>

            {blastRadius.coverageGaps.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No unindexed coverage gaps noted.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.coverageGaps.map((gap, i) => (
                  <div key={i} className="p-2 rounded-xl bg-black/25 border border-white/10 text-[11px] font-mono text-slate-300 flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">!</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Epistemic honesty: explicit disclosure of unindexed boundaries.
          </div>
        </div>

      </div>

    </section>
  );
};
