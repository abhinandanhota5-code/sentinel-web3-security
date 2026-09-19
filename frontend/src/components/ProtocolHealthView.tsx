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
      <div className="glass-panel rounded-xl p-12 text-center max-w-2xl mx-auto my-12">
        <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Protocol Telemetry Unavailable</h3>
        <p className="text-xs text-slate-400 mb-6">
          The investigated address is an EOA wallet or individual contract rather than an indexed DeFi protocol suite.
        </p>
        <div className="text-xs font-mono text-teal-400">
          Tip: Select the "Multipli Prime Yield Engine" preset from the top bar to inspect live protocol health telemetry.
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
    <div className="space-y-8 mb-12">
      
      {/* Required Hackathon Transparency Banner */}
      {health.isDemoData && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3 px-4 flex items-center justify-between text-xs font-mono text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold uppercase tracking-wider">DEMO DATA // SIMULATED PROTOCOL TELEMETRY</span>
          </div>
          <span className="text-slate-400 text-[11px]">Multipli Hackathon 2026 Evaluation Suite</span>
        </div>
      )}

      {/* Protocol Header Card */}
      <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wider uppercase bg-teal-950/80 border border-teal-500/40 text-teal-300">
                PROTOCOL HEALTH AUDIT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                Multipli Ecosystem
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{health.protocolName}</span>
              <span className="text-lg font-mono font-bold px-3 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Grade: {health.overallHealthGrade}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Continuous on-chain telemetry auditing administrative key concentration, proxy upgradeability timelocks, and oracle dependency health.
            </p>
          </div>

          {/* TVL & Exposed Gauge */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="border-r border-slate-800 pr-4">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Value Locked</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {formatUsd(health.totalValueLockedUsd)}
              </div>
              <div className="text-[10px] text-teal-400">Across all vault pools</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Exposed Value</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {formatUsd(health.totalExposedValueUsd)}
              </div>
              <div className="text-[10px] text-slate-400">4.2% blast radius</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Core Pillars of Protocol Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Admin Concentration */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin Concentration</h3>
                <p className="text-[11px] text-slate-400">Multisig thresholds & key distribution</p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
              health.adminConcentration.status === 'OPTIMAL'
                ? 'bg-teal-950 text-teal-300 border-teal-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}>
              {health.adminConcentration.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Threshold</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {health.adminConcentration.multisigRequiredSigners}/{health.adminConcentration.multisigTotalSigners}
                </div>
                <div className="text-[9px] text-slate-400">{health.adminConcentration.thresholdPercentage}% Quorum</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Timelock</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {health.adminConcentration.timelockDelayHours}h
                </div>
                <div className="text-[9px] text-slate-400">Execution Delay</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Guardian Veto</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {health.adminConcentration.guardianCanVeto ? 'Enabled' : 'None'}
                </div>
                <div className="text-[9px] text-slate-400">Anti-compromise</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {health.adminConcentration.details}
            </p>
          </div>
        </div>

        {/* Card 2: Upgradeability Posture */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Upgradeability Architecture</h3>
                <p className="text-[11px] text-slate-400">Proxy pattern & implementation provenance</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-teal-950 text-teal-300 border border-teal-500/40">
              {health.upgradeability.status}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Proxy Pattern:</span>
              <span className="text-white font-bold">{health.upgradeability.proxyType} Standard</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Upgrade Admin:</span>
              <span className="text-teal-300 text-[11px] truncate max-w-[200px]" title={health.upgradeability.upgradeAdmin.address}>
                {health.upgradeability.upgradeAdmin.label || health.upgradeability.upgradeAdmin.address}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Timelock Enforced:</span>
              <span className="text-teal-400 font-bold">{health.upgradeability.timelockActive ? 'Yes (48h Queue)' : 'No'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Bytecode Verification:</span>
              <span className="text-emerald-400 font-bold">{health.upgradeability.verificationStatus}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privileged Permissions */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Privileged Roles Matrix</h3>
                <p className="text-[11px] text-slate-400">Special administrative capabilities</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{health.privilegedPermissions.length} Defined Roles</span>
          </div>

          <div className="space-y-3">
            {health.privilegedPermissions.map((perm, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-indigo-300">{perm.role}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    perm.timelocked
                      ? 'bg-teal-950 text-teal-300 border-teal-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {perm.timelocked ? 'Timelocked' : 'Instant Execution'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mb-1">
                  Holder: <span className="font-mono text-slate-200">{perm.holder.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-1.5 rounded">
                  Capabilities: {perm.capabilities.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Contract Dependencies */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Contract Dependencies</h3>
                <p className="text-[11px] text-slate-400">Oracles, AMMs, and liquidity routers</p>
              </div>
            </div>
            <span className="text-xs font-mono text-teal-400">All Active</span>
          </div>

          <div className="space-y-3">
            {health.contractDependencies.map((dep, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{dep.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {dep.healthStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>Category: {dep.category}</span>
                  <span className="text-amber-400">Criticality: {dep.criticality}</span>
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded">
                  Failure Impact: {dep.failureImpact}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Activity Anomalies Feed */}
      <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Telemetry & Activity Anomalies</h3>
              <p className="text-[11px] text-slate-400">Forta and Hypernative real-time deviation signals</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Normal Range</span>
        </div>

        <div className="space-y-3">
          {health.activityAnomalies.map((anom, idx) => (
            <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-200 mb-0.5">{anom.type}</div>
                <p className="text-slate-400 text-xs">{anom.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono text-teal-400 font-bold">{anom.deviationScore}</div>
                <div className="text-[10px] font-mono text-slate-400">{anom.source}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
