import React from 'react';
import { 
  Layers, 
  Key, 
  GitFork, 
  Lock, 
  Activity, 
  Share2,
  Sparkles
} from 'lucide-react';
import type { ProtocolHealth, CoverageReport } from '../types/sentinel';

interface ProtocolHealthViewProps {
  health?: ProtocolHealth;
  coverage?: CoverageReport;
}

export const ProtocolHealthView: React.FC<ProtocolHealthViewProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="liquid-glass rounded-2xl p-10 text-center max-w-lg mx-auto my-12">
        <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Protocol Telemetry Unavailable</h3>
        <p className="text-xs text-slate-400 mb-4">
          This address is an individual EOA or unindexed contract.
        </p>
        <div className="text-xs font-mono text-teal-400">
          Tip: Select "Multipli Prime Yield" preset to view protocol diagnostics.
        </div>
      </div>
    );
  }

  const formatUsd = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6 mb-12">
      
      {/* Demo Data Banner */}
      {health.isDemoData && (
        <div className="liquid-pill rounded-xl p-2.5 px-4 flex items-center justify-between text-xs font-mono text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold uppercase tracking-wider text-[10px]">DEMO DATA // SIMULATED PROTOCOL TELEMETRY</span>
          </div>
          <span className="text-slate-400 text-[10px]">Multipli Hackathon 2026</span>
        </div>
      )}

      {/* Protocol Profile Header */}
      <div className="liquid-glass rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                PROTOCOL HEALTH AUDIT
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono liquid-glass-subtle text-slate-300">
                Multipli Ecosystem
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{health.protocolName}</span>
              <span className="text-base font-mono font-bold px-3 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Grade: {health.overallHealthGrade}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Continuous on-chain telemetry auditing administrative key concentration, timelock delays, and oracle dependencies.
            </p>
          </div>

          {/* TVL Metrics */}
          <div className="flex items-center gap-4 liquid-glass-subtle rounded-2xl p-4">
            <div className="border-r border-white/10 pr-5">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Value Locked</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {formatUsd(health.totalValueLockedUsd)}
              </div>
              <div className="text-[10px] text-teal-400 font-mono">Across all pools</div>
            </div>

            <div className="pl-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Exposed Value</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {formatUsd(health.totalExposedValueUsd)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">4.2% blast radius</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Admin Concentration */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Admin Concentration</h3>
                <p className="text-[10px] text-slate-400">Multisig thresholds & distribution</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
              {health.adminConcentration.status}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] text-slate-400">Threshold</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {health.adminConcentration.multisigRequiredSigners}/{health.adminConcentration.multisigTotalSigners}
                </div>
                <div className="text-[8px] text-slate-400">{health.adminConcentration.thresholdPercentage}% Quorum</div>
              </div>

              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] text-slate-400">Timelock</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {health.adminConcentration.timelockDelayHours}h
                </div>
                <div className="text-[8px] text-slate-400">Execution Delay</div>
              </div>

              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-[9px] text-slate-400">Guardian Veto</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {health.adminConcentration.guardianCanVeto ? 'Active' : 'None'}
                </div>
                <div className="text-[8px] text-slate-400">Emergency Stop</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed font-sans">
              {health.adminConcentration.details}
            </p>
          </div>
        </div>

        {/* Card 2: Upgradeability Architecture */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Upgradeability Architecture</h3>
                <p className="text-[10px] text-slate-400">Proxy pattern & implementation status</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
              {health.upgradeability.status}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-400">Proxy Pattern:</span>
              <span className="text-white font-bold">{health.upgradeability.proxyType}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-400">Upgrade Admin:</span>
              <span className="text-teal-300 text-[11px] truncate max-w-[180px]">
                {health.upgradeability.upgradeAdmin.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-400">Timelock Enforced:</span>
              <span className="text-teal-400 font-bold">{health.upgradeability.timelockActive ? '48h Delay' : 'No'}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-400">Source Verification:</span>
              <span className="text-emerald-400 font-bold">{health.upgradeability.verificationStatus}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privileged Roles */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Privileged Roles Matrix</h3>
                <p className="text-[10px] text-slate-400">Administrative capabilities</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{health.privilegedPermissions.length} Roles</span>
          </div>

          <div className="space-y-2.5">
            {health.privilegedPermissions.map((perm, idx) => (
              <div key={idx} className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-indigo-300">{perm.role}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    perm.timelocked
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {perm.timelocked ? 'Timelocked' : 'Instant'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Holder: {perm.holder.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Contract Dependencies */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Contract Dependencies</h3>
                <p className="text-[10px] text-slate-400">Oracles & AMM bridges</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-teal-400">Healthy</span>
          </div>

          <div className="space-y-2.5">
            {health.contractDependencies.map((dep, idx) => (
              <div key={idx} className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{dep.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {dep.healthStatus}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Criticality: <span className="text-amber-300">{dep.criticality}</span> • {dep.failureImpact}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
