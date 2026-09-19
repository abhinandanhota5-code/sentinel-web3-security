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
    <div className="space-y-6 mb-12">
      
      {/* Header Banner */}
      <div className="liquid-glass rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#7dd3fc] mb-1">
              Coverage Transparency
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-[#7dd3fc]" />
              <span>Coverage & Epistemic Scope</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mt-0.5">
              Sentinel explicitly reports verifiable coverage bounds. We never declare an address "SAFE" simply because no threat was found.
            </p>
          </div>

          <div className="liquid-glass-subtle rounded-2xl p-3 px-4 text-right border border-white/15">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Verdict Standard</div>
            <div className="text-xs font-mono font-bold text-[#7dd3fc] mt-0.5">
              "No active finding detected"
            </div>
            <div className="text-[9px] text-slate-400">Strict Non-binary Posture</div>
          </div>
        </div>
      </div>

      {/* Epistemic Rule Callout */}
      <div className="liquid-glass rounded-3xl p-5 border-l-4 border-l-[#fde68a] flex items-start gap-3.5 border border-white/20">
        <div className="w-9 h-9 rounded-xl bg-[#fde68a]/15 border border-[#fde68a]/30 flex items-center justify-center text-[#fde68a] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-[#fde68a] font-mono uppercase tracking-wider">
            Rule: Absence of Evidence ≠ Evidence of Absence
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Web3 security, displaying a generic green "SAFE" badge creates dangerous false confidence. Sentinel strictly uses 
            <span className="text-[#7dd3fc] font-mono font-bold"> "No active finding detected within analyzed coverage"</span> to emphasize that safety guarantees only extend to the specific indexed vectors.
          </p>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Networks Checked */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
            <Server className="w-4 h-4 text-[#7dd3fc]" />
            <h3 className="text-sm font-bold text-[#fdfbf7]">Networks Checked</h3>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {coverage.networksChecked.map((net, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7dd3fc]" />
                  <span className="text-slate-200 font-bold">{net.chain}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-slate-400">#{net.latestBlockIndexed.toLocaleString()}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[9px] bg-[#7dd3fc]/15 text-[#7dd3fc] border border-[#7dd3fc]/30 font-medium">
                    {net.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Modules */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
            <Cpu className="w-4 h-4 text-[#bae6fd]" />
            <h3 className="text-sm font-bold text-[#fdfbf7]">Analysis Modules</h3>
          </div>

          <div className="space-y-2">
            {coverage.analysisModules.map((mod) => (
              <div key={mod.id} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-[#fdfbf7]">{mod.name}</span>
                  <span className="text-[10px] font-mono text-[#7dd3fc] font-bold">{mod.lastRunLatencyMs}ms</span>
                </div>
                <p className="text-[11px] text-slate-300">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ingestion Sources */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
            <Database className="w-4 h-4 text-[#7dd3fc]" />
            <h3 className="text-sm font-bold text-[#fdfbf7]">Ingestion Sources</h3>
          </div>

          <div className="space-y-2">
            {coverage.dataSources.map((ds, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#fdfbf7]">{ds.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{ds.provider}</div>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <div className="text-[#bae6fd] font-semibold">{ds.type}</div>
                  <div className="text-slate-400">{ds.freshness}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explicit Limitations */}
        <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
            <HelpCircle className="w-4 h-4 text-[#fde68a]" />
            <h3 className="text-sm font-bold text-[#fdfbf7]">Explicit Boundaries & Limitations</h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            {coverage.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2 liquid-glass-subtle p-3 rounded-xl border border-white/10">
                <span className="text-[#fde68a] font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed text-[11px] text-slate-300">{lim}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
