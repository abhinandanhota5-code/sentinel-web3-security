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
        return 'bg-white/[0.06] text-slate-200 border-white/15';
      case 'TOKEN':
        return 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30';
      case 'ALLOWANCE':
        return 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30';
      case 'SPENDER':
        return 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30';
      case 'UPGRADEABLE_CONTRACT':
        return 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30';
      case 'ADMIN':
        return 'bg-[#A45F5F]/15 text-[#d97f7f] border-[#A45F5F]/30';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <section className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#dfba82] mb-1.5 border border-[#9A7A4A]/30 bg-[#9A7A4A]/15">
            <DollarSign className="w-3 h-3 text-[#dfba82]" />
            <span>Cascading Blast Horizon</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span>CURRENT BLAST RADIUS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            End-to-end authorization chain connecting vulnerable assets to governing keys. Evaluates <strong className="text-slate-100">potential exposure</strong>, not guaranteed loss.
          </p>
        </div>

        {/* Aggregate Exposure Gauge */}
        <div className="liquid-glass-subtle rounded-xl p-3 px-4 border border-white/10 self-start sm:self-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 flex items-center justify-center text-[#dfba82]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Potential Liquid Exposure
            </div>
            <div className={`text-xl font-mono font-semibold ${totalBlastRadiusUsd > 0 ? 'text-[#d97f7f]' : 'text-slate-200'}`}>
              {totalBlastRadiusUsd > 0 ? formatUsd(totalBlastRadiusUsd) : '$0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. VISUAL AUTHORIZATION CHAIN (Flow Steps) */}
      <div className="mb-6">
        <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#88b0d8]" />
          <span>Cascading Authorization Pathway</span>
        </div>

        <div className="bg-[#12151b]/80 rounded-xl p-4 border border-white/10 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
            {blastRadius.flowSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 min-w-[130px] transition backdrop-blur-md shadow-sm ${getStepColor(step.type)}`}>
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono uppercase tracking-wider opacity-80">
                    <span>{step.type.replace('_', ' ')}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-white truncate">
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
                  <div className="text-slate-500 flex items-center justify-center p-1">
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
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
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#dfba82] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Assets Potentially Exposed</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9A7A4A]/15 text-[#dfba82]">
                {blastRadius.assetsPotentiallyExposed.length} Assets
              </span>
            </div>

            {blastRadius.assetsPotentiallyExposed.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No liquid assets currently exposed.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.assetsPotentiallyExposed.map((asset, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-semibold text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">{asset.status || 'Potential exposure'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-200">{asset.balance}</div>
                      {asset.potentialExposureUsd !== undefined && (
                        <div className="text-[10px] text-[#d97f7f] font-medium">
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
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#88b0d8]" />
                <span>Contracts Involved</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5B7FA6]/15 text-[#9ac2e8]">
                {blastRadius.contractsInvolved.length} Contracts
              </span>
            </div>

            {blastRadius.contractsInvolved.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No external contracts involved.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.contractsInvolved.map((contract, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-white truncate">{contract.name || 'Contract'}</span>
                      <span className="text-[10px] text-slate-400">{contract.role || 'Router/Proxy'}</span>
                    </div>
                    <div className="text-[11px] text-[#88b0d8] truncate mt-0.5">
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
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#d97f7f] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Permissions Involved</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A45F5F]/15 text-[#d97f7f]">
                {blastRadius.permissionsInvolved.length} Active
              </span>
            </div>

            {blastRadius.permissionsInvolved.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">Zero active permissions detected.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.permissionsInvolved.map((perm, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono">
                    <div className="font-semibold text-[#d97f7f]">{perm.name}</div>
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
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#d97f7f] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Privileged Actors</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A45F5F]/15 text-[#d97f7f]">
                {blastRadius.privilegedActors.length} Keys
              </span>
            </div>

            {blastRadius.privilegedActors.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No unconstrained administrative actors identified.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.privilegedActors.map((actor, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-white truncate">{actor.role}</span>
                      <span className="text-[10px] text-slate-400">{actor.keyType || 'Privileged Key'}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5">
                      {actor.address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Assesses multi-sig thresholds, EOA single points of failure, and timelocks.
          </div>
        </div>

        {/* Category 5: Chains Affected */}
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#88b0d8]" />
                <span>Cross-Chain Exposure</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5B7FA6]/15 text-[#9ac2e8]">
                {blastRadius.chains.length} Chains
              </span>
            </div>

            {blastRadius.chains.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">Single network scope; zero cross-chain exposure.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.chains.map((chain, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-white">{chain}</span>
                    <span className="text-[10px] text-slate-400">Monitored</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Evaluates bridged wrapped assets and cross-chain message passing.
          </div>
        </div>

        {/* Category 6: Unindexed Coverage Gaps */}
        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#dfba82] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Coverage Limitations</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9A7A4A]/15 text-[#dfba82]">
                {blastRadius.coverageGaps.length} Gaps
              </span>
            </div>

            {blastRadius.coverageGaps.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">Complete vector coverage verified.</p>
            ) : (
              <div className="space-y-2">
                {blastRadius.coverageGaps.map((gap, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#dfba82] font-semibold mt-0.5">•</span>
                      <span className="leading-snug">{gap}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/10">
            Epistemic boundaries: Sentinel explicitly states what cannot be proved.
          </div>
        </div>

      </div>

    </section>
  );
};
