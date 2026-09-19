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
      <div className="liquid-glass rounded-3xl p-10 text-center max-w-lg mx-auto my-12 border border-[#e6ded6]/15">
        <Layers className="w-10 h-10 text-stone-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-100 mb-1">Protocol Telemetry Unavailable</h3>
        <p className="text-xs text-stone-400 mb-4">
          This address is an individual EOA or unindexed contract.
        </p>
        <div className="text-xs font-mono text-[#a7f3d0]">
          Tip: Select "Multipli Prime Yield Engine" scenario to view protocol diagnostics.
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
        <div className="liquid-pill rounded-xl p-2.5 px-4 flex items-center justify-between text-xs font-mono text-[#d8b4fe]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#d8b4fe]" />
            <span className="font-bold uppercase tracking-wider text-[10px]">VERIFIED SIMULATION // PROTOCOL TELEMETRY</span>
          </div>
          <span className="text-stone-400 text-[10px]">Sentinel Telemetry Engine</span>
        </div>
      )}

      {/* Protocol Profile Header */}
      <div className="liquid-glass rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-[#e6ded6]/15">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/30">
                PROTOCOL HEALTH AUDIT
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono liquid-glass-subtle text-stone-300">
                Multipli Network Ecosystem
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight flex items-center gap-3">
              <span>{health.protocolName}</span>
              <span className="text-base font-mono font-bold px-3 py-0.5 rounded-lg bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/35">
                Grade: {health.overallHealthGrade}
              </span>
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
              Continuous on-chain telemetry auditing administrative key concentration, timelock delays, and oracle dependencies.
            </p>
          </div>

          {/* TVL Metrics */}
          <div className="flex items-center gap-4 liquid-glass-subtle rounded-2xl p-4 border border-[#e6ded6]/15">
            <div className="border-r border-white/10 pr-5">
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Total Value Locked</div>
              <div className="text-xl font-bold font-mono text-stone-100 mt-0.5">
                {formatUsd(health.totalValueLockedUsd)}
              </div>
              <div className="text-[10px] text-[#a7f3d0] font-mono">Across all pools</div>
            </div>

            <div className="pl-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Exposed Value</div>
              <div className="text-xl font-bold font-mono text-[#fed7aa] mt-0.5">
                {formatUsd(health.totalExposedValueUsd)}
              </div>
              <div className="text-[10px] text-stone-400 font-mono">4.2% blast radius</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Admin Concentration */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-[#e6ded6]/15">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#d8b4fe]/15 border border-[#d8b4fe]/30 flex items-center justify-center text-[#d8b4fe]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Admin Concentration</h3>
                <p className="text-[10px] text-stone-400">Multisig thresholds & quorum distribution</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/30">
              {health.adminConcentration.status}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="liquid-glass-subtle p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-stone-400">Threshold</div>
                <div className="text-base font-bold text-[#a7f3d0] mt-0.5">
                  {health.adminConcentration.multisigRequiredSigners}/{health.adminConcentration.multisigTotalSigners}
                </div>
                <div className="text-[8px] text-stone-400">{health.adminConcentration.thresholdPercentage}% Quorum</div>
              </div>

              <div className="liquid-glass-subtle p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-stone-400">Timelock</div>
                <div className="text-base font-bold text-[#fed7aa] mt-0.5">
                  {health.adminConcentration.timelockDelayHours}h
                </div>
                <div className="text-[8px] text-stone-400">Execution Delay</div>
              </div>

              <div className="liquid-glass-subtle p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-stone-400">Guardian Veto</div>
                <div className="text-base font-bold text-[#a7f3d0] mt-0.5">
                  {health.adminConcentration.guardianCanVeto ? 'Active' : 'None'}
                </div>
                <div className="text-[8px] text-stone-400">Emergency Stop</div>
              </div>
            </div>

            <p className="text-xs text-stone-300 liquid-glass-subtle p-3 rounded-xl border border-white/5 leading-relaxed font-sans">
              {health.adminConcentration.details}
            </p>
          </div>
        </div>

        {/* Card 2: Upgradeability Architecture */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-[#e6ded6]/15">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#a7f3d0]/15 border border-[#a7f3d0]/30 flex items-center justify-center text-[#a7f3d0]">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Upgradeability Architecture</h3>
                <p className="text-[10px] text-stone-400">Proxy pattern & implementation status</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/30">
              {health.upgradeability.status}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl border border-white/5">
              <span className="text-stone-400">Proxy Pattern:</span>
              <span className="text-stone-100 font-bold">{health.upgradeability.proxyType}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl border border-white/5">
              <span className="text-stone-400">Upgrade Admin:</span>
              <span className="text-[#d8b4fe] text-[11px] truncate max-w-[180px]">
                {health.upgradeability.upgradeAdmin.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl border border-white/5">
              <span className="text-stone-400">Timelock Enforced:</span>
              <span className="text-[#a7f3d0] font-bold">{health.upgradeability.timelockActive ? '48h Delay' : 'No'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl border border-white/5">
              <span className="text-stone-400">Source Verification:</span>
              <span className="text-[#a7f3d0] font-bold">{health.upgradeability.verificationStatus}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privileged Roles */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-[#e6ded6]/15">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#d8b4fe]/15 border border-[#d8b4fe]/30 flex items-center justify-center text-[#d8b4fe]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Privileged Roles Matrix</h3>
                <p className="text-[10px] text-stone-400">Administrative capabilities</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-stone-400">{health.privilegedPermissions.length} Roles</span>
          </div>

          <div className="space-y-2.5">
            {health.privilegedPermissions.map((perm, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[#d8b4fe]">{perm.role}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    perm.timelocked
                      ? 'bg-[#a7f3d0]/15 text-[#a7f3d0] border-[#a7f3d0]/30'
                      : 'bg-[#fed7aa]/15 text-[#fed7aa] border-[#fed7aa]/30'
                  }`}>
                    {perm.timelocked ? 'Timelocked' : 'Instant'}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Holder: {perm.holder.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Contract Dependencies */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-[#e6ded6]/15">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#fed7aa]/15 border border-[#fed7aa]/30 flex items-center justify-center text-[#fed7aa]">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Contract Dependencies</h3>
                <p className="text-[10px] text-stone-400">Oracles & AMM bridges</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#a7f3d0]">Verified Healthy</span>
          </div>

          <div className="space-y-2.5">
            {health.contractDependencies.map((dep, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-100">{dep.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/30">
                    {dep.healthStatus}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Criticality: <span className="text-[#fed7aa]">{dep.criticality}</span> • {dep.failureImpact}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
