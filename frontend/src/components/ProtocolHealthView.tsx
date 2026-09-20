import React from 'react';
import { 
  Layers, 
  Key, 
  GitFork, 
  Lock, 
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
      <div className="liquid-glass rounded-3xl p-10 text-center max-w-lg mx-auto my-12">
        <Layers className="w-10 h-10 text-ink-3 mx-auto mb-3" />
        <h3 className="text-base font-bold text-ink mb-1">Protocol Telemetry Unavailable</h3>
        <p className="text-xs text-ink-2 mb-4">
          This address is an individual EOA or unindexed contract.
        </p>
        <div className="text-xs font-mono text-ink-2">
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
        <div className="liquid-pill rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs font-mono text-ink-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-ink-3" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Verified Simulation // Protocol Telemetry</span>
          </div>
          <span className="text-ink-3 text-[10px]">Sentinel Telemetry Engine</span>
        </div>
      )}

      {/* Protocol Profile Header */}
      <div className="liquid-glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-ink/8 text-ink-2 border border-[var(--border-1)]">
                Protocol Health Audit
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono liquid-glass-subtle text-ink-2">
                Multipli Network Ecosystem
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-3">
              <span>{health.protocolName}</span>
              <span className="text-base font-mono font-bold px-3 py-0.5 rounded-lg bg-ink/8 text-ink-2 border border-[var(--border-1)]">
                Grade: {health.overallHealthGrade}
              </span>
            </h2>
            <p className="text-xs text-ink-2 mt-1 max-w-xl leading-relaxed">
              Continuous on-chain telemetry auditing administrative key concentration, timelock delays, and oracle dependencies.
            </p>
          </div>

          {/* TVL Metrics */}
          <div className="flex items-center gap-4 liquid-glass-subtle rounded-2xl p-4">
            <div className="border-r border-[var(--border-1)] pr-5">
              <div className="text-[10px] uppercase font-mono tracking-wider text-ink-3">Total Value Locked</div>
              <div className="text-xl font-bold font-mono text-ink mt-0.5">
                {formatUsd(health.totalValueLockedUsd)}
              </div>
              <div className="text-[10px] text-ink-3 font-mono">Across all pools</div>
            </div>

            <div className="pl-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-ink-3">Exposed Value</div>
              <div className="text-xl font-bold font-mono text-warn mt-0.5">
                {formatUsd(health.totalExposedValueUsd)}
              </div>
              <div className="text-[10px] text-ink-3 font-mono">4.2% blast radius</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Admin Concentration */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ink/8 border border-[var(--border-1)] flex items-center justify-center text-ink-3">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Admin Concentration</h3>
                <p className="text-[10px] text-ink-3">Multisig thresholds & quorum distribution</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-ink/8 text-ink-2 border border-[var(--border-1)]">
              {health.adminConcentration.status}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="liquid-glass-subtle p-2.5 rounded-xl">
                <div className="text-[9px] text-ink-3">Threshold</div>
                <div className="text-base font-bold text-ink mt-0.5">
                  {health.adminConcentration.multisigRequiredSigners}/{health.adminConcentration.multisigTotalSigners}
                </div>
                <div className="text-[8px] text-ink-3">{health.adminConcentration.thresholdPercentage}% Quorum</div>
              </div>

              <div className="liquid-glass-subtle p-2.5 rounded-xl">
                <div className="text-[9px] text-ink-3">Timelock</div>
                <div className="text-base font-bold text-warn mt-0.5">
                  {health.adminConcentration.timelockDelayHours}h
                </div>
                <div className="text-[8px] text-ink-3">Execution Delay</div>
              </div>

              <div className="liquid-glass-subtle p-2.5 rounded-xl">
                <div className="text-[9px] text-ink-3">Guardian Veto</div>
                <div className="text-base font-bold text-ink mt-0.5">
                  {health.adminConcentration.guardianCanVeto ? 'Active' : 'None'}
                </div>
                <div className="text-[8px] text-ink-3">Emergency Stop</div>
              </div>
            </div>

            <p className="text-xs text-ink-2 liquid-glass-subtle p-3 rounded-xl leading-relaxed font-sans">
              {health.adminConcentration.details}
            </p>
          </div>
        </div>

        {/* Card 2: Upgradeability Architecture */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ink/8 border border-[var(--border-1)] flex items-center justify-center text-ink-3">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Upgradeability Architecture</h3>
                <p className="text-[10px] text-ink-3">Proxy pattern & implementation status</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-ink/8 text-ink-2 border border-[var(--border-1)]">
              {health.upgradeability.status}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl">
              <span className="text-ink-3">Proxy Pattern:</span>
              <span className="text-ink font-bold">{health.upgradeability.proxyType}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl">
              <span className="text-ink-3">Upgrade Admin:</span>
              <span className="text-ink-2 text-[11px] truncate max-w-[180px]">
                {health.upgradeability.upgradeAdmin.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl">
              <span className="text-ink-3">Timelock Enforced:</span>
              <span className="text-ink-2 font-bold">{health.upgradeability.timelockActive ? '48h Delay' : 'No'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 liquid-glass-subtle rounded-xl">
              <span className="text-ink-3">Source Verification:</span>
              <span className="text-ok font-bold">{health.upgradeability.verificationStatus}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privileged Roles */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ink/8 border border-ink/12 flex items-center justify-center text-ink-2">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Privileged Roles Matrix</h3>
                <p className="text-[10px] text-ink-3">Administrative capabilities</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-ink-3">{health.privilegedPermissions.length} Roles</span>
          </div>

          <div className="space-y-2.5">
            {health.privilegedPermissions.map((perm, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-ink">{perm.role}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    perm.timelocked
                      ? 'bg-ok/12 text-ok border-ok/25'
                      : 'bg-warn/12 text-warn border-warn/25'
                  }`}>
                    {perm.timelocked ? 'Timelocked' : 'Instant'}
                  </span>
                </div>
                <div className="text-[10px] text-ink-3 font-mono">
                  Holder: {perm.holder.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Contract Dependencies */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-1)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-warn/12 border border-warn/25 flex items-center justify-center text-warn">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Contract Dependencies</h3>
                <p className="text-[10px] text-ink-3">Oracles & AMM bridges</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-ok">Verified Healthy</span>
          </div>

          <div className="space-y-2.5">
            {health.contractDependencies.map((dep, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-ink">{dep.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-ok/12 text-ok border border-ok/25">
                    {dep.healthStatus}
                  </span>
                </div>
                <div className="text-[10px] text-ink-3 font-mono">
                  Criticality: <span className="text-warn">{dep.criticality}</span> • {dep.failureImpact}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
