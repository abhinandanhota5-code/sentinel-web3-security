import React from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Cpu, 
  Database, 
  HelpCircle
} from 'lucide-react';
import type { CoverageReport } from '../types/sentinel';

interface CoverageViewProps {
  coverage: CoverageReport;
}

export const CoverageView: React.FC<CoverageViewProps> = ({ coverage }) => {
  return (
    <div className="space-y-8 mb-12">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase bg-teal-950/60 border border-teal-500/40 text-teal-300 mb-1">
              Section 8 // Epistemic Scope
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-emerald-400" />
              <span>Coverage & Analytical Transparency</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Sentinel explicitly documents what was analyzed and what remains beyond verifiable coverage. We never declare an address "SAFE" simply because no threat was detected.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-teal-500/40 rounded-xl p-3 px-4 text-right">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Analysis Standard</div>
            <div className="text-sm font-mono font-bold text-teal-300">
              "No active finding detected"
            </div>
            <div className="text-[10px] text-slate-400">Strict Non-binary Verdict</div>
          </div>
        </div>
      </div>

      {/* Critical UX Principle Callout */}
      <div className="bg-amber-950/30 border-2 border-amber-600/40 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-300">
            The Fundamental Rule: Absence of Evidence ≠ Evidence of Absence
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Web3 security, displaying a green <strong>"SAFE"</strong> badge gives users false confidence. Sentinel strictly uses 
            <span className="text-teal-300 font-mono"> "No active finding detected within analyzed coverage"</span>. 
            This makes the epistemic boundary visible: an entity is only verified clean against the specific vectors, networks, and blocks inspected.
          </p>
        </div>
      </div>

      {/* 4 Pillars of Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Networks Checked */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Networks Checked</h3>
          </div>

          <div className="space-y-3">
            {coverage.networksChecked.map((net, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span className="font-bold text-white">{net.chain}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Indexed: Block #{net.latestBlockIndexed.toLocaleString()}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-teal-950 text-teal-300 border border-teal-600/40">
                    {net.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Modules */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Analysis Modules Active</h3>
          </div>

          <div className="space-y-3">
            {coverage.analysisModules.map((mod) => (
              <div key={mod.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{mod.name}</span>
                  <span className="text-[10px] font-mono text-teal-400">{mod.lastRunLatencyMs}ms</span>
                </div>
                <p className="text-[11px] text-slate-400">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
            <Database className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Data Ingestion Sources</h3>
          </div>

          <div className="space-y-3">
            {coverage.dataSources.map((ds, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{ds.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{ds.provider}</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-indigo-300">{ds.type}</div>
                  <div className="text-slate-400">{ds.freshness}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explicit Limitations */}
        <div className="glass-panel rounded-xl p-6 border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Explicit Coverage Limitations</h3>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {coverage.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{lim}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
