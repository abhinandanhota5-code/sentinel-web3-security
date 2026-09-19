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
  dataMode?: string;
  unknowns?: Array<{ field: string; reason: string; detail?: string }>;
  coverageGaps?: string[];
}

export const CoverageView: React.FC<CoverageViewProps> = ({ 
  coverage, 
  dataMode, 
  unknowns = [], 
  coverageGaps = [] 
}) => {
  return (
    <div className="space-y-6 mb-12">
      
      {/* Header Banner */}
      <div className="liquid-glass rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/15">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase bg-[#5B7FA6]/15 text-[#9ac2e8] border border-[#5B7FA6]/30">
                Coverage Transparency
              </span>
              {dataMode && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border ${
                  dataMode === 'REAL'
                    ? 'bg-[#5E806A]/15 border-[#5E806A]/30 text-[#8cc4a1]'
                    : dataMode === 'DEMO'
                    ? 'bg-[#9A7A4A]/15 border-[#9A7A4A]/30 text-[#dfba82]'
                    : dataMode === 'MIXED'
                    ? 'bg-[#5B7FA6]/15 border-[#5B7FA6]/30 text-[#9ac2e8]'
                    : 'bg-white/10 border-white/20 text-slate-300'
                }`}>
                  Mode: {dataMode}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-[#88b0d8]" />
              <span>Coverage & Epistemic Scope</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Sentinel explicitly reports verifiable coverage bounds. We never declare an address "SAFE" simply because no threat was found.
            </p>
          </div>

          <div className="liquid-glass-subtle rounded-2xl p-3 px-4 text-right border border-white/15">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Verdict Standard</div>
            <div className="text-xs font-mono font-semibold text-[#88b0d8] mt-0.5">
              "No active finding detected"
            </div>
            <div className="text-[9px] text-slate-400">Strict Non-binary Posture</div>
          </div>
        </div>
      </div>

      {/* Epistemic Rule Callout (Subtle Amber Glass) */}
      <div className="liquid-glass rounded-2xl p-5 border-l-4 border-l-[#9A7A4A] flex items-start gap-3.5 border border-white/15 bg-[#9A7A4A]/[0.05]">
        <div className="w-8 h-8 rounded-xl bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 flex items-center justify-center text-[#dfba82] shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-[#dfba82] font-mono uppercase tracking-wider">
            Rule: Absence of Evidence ≠ Evidence of Absence
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Web3 security, displaying a generic green "SAFE" badge creates dangerous false confidence. Sentinel strictly uses 
            <span className="text-white font-mono font-medium"> "No active finding detected within analyzed coverage"</span> to emphasize that safety guarantees only extend to the specific indexed vectors.
          </p>
        </div>
      </div>

      {/* 4 Pillars Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Networks Checked */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl border border-white/15">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
            <Server className="w-4 h-4 text-[#88b0d8]" />
            <h3 className="text-sm font-semibold text-white">Networks Checked</h3>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {coverage.networksChecked.map((net, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8cc4a1]" />
                  <span className="text-slate-200 font-medium">{net.chain}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-slate-400">#{net.latestBlockIndexed.toLocaleString()}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[9px] bg-[#5E806A]/15 text-[#8cc4a1] border border-[#5E806A]/30 font-medium">
                    {net.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Modules */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl border border-white/15">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
            <Cpu className="w-4 h-4 text-[#88b0d8]" />
            <h3 className="text-sm font-semibold text-white">Analysis Modules</h3>
          </div>

          <div className="space-y-2">
            {coverage.analysisModules.map((mod) => (
              <div key={mod.id} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-white">{mod.name}</span>
                  <span className="text-[10px] font-mono text-[#88b0d8] font-medium">{mod.lastRunLatencyMs}ms</span>
                </div>
                <p className="text-[11px] text-slate-300">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ingestion Sources */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl border border-white/15">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
            <Database className="w-4 h-4 text-[#88b0d8]" />
            <h3 className="text-sm font-semibold text-white">Ingestion Sources</h3>
          </div>

          <div className="space-y-2">
            {coverage.dataSources.map((ds, idx) => (
              <div key={idx} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-xs flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{ds.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{ds.provider}</div>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <div className="text-slate-200 font-medium">{ds.type}</div>
                  <div className="text-slate-400">{ds.freshness}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explicit Limitations */}
        <div className="liquid-glass rounded-2xl p-5 shadow-xl border border-white/15">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Explicit Boundaries & Limitations</h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            {coverage.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2 liquid-glass-subtle p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed text-[11px] text-slate-300">{lim}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Active Backend Epistemic Coverage Gaps & Unknowns */}
      {(coverageGaps.length > 0 || unknowns.length > 0) && (
        <div className="liquid-glass rounded-2xl p-5 shadow-xl border border-white/15">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
            <AlertTriangle className="w-4 h-4 text-[#dfba82]" />
            <h3 className="text-sm font-semibold text-white">Active Analysis Coverage Gaps & Epistemic Boundaries</h3>
          </div>

          <div className="space-y-2 text-xs">
            {coverageGaps.map((gap, idx) => (
              <div key={`gap-${idx}`} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-slate-200 flex items-start gap-2">
                <span className="text-[#dfba82] font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 shrink-0">
                  COVERAGE GAP
                </span>
                <span className="text-[11px] leading-relaxed text-slate-300">{gap}</span>
              </div>
            ))}
            {unknowns.map((u, idx) => (
              <div key={`unk-${idx}`} className="p-3 liquid-glass-subtle rounded-xl border border-white/10 text-slate-200 flex items-start gap-2">
                <span className="text-slate-400 font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 shrink-0">
                  {u.reason}
                </span>
                <div className="text-[11px] leading-relaxed">
                  <span className="font-mono text-white font-medium">{u.field}</span>: <span className="text-slate-300">{u.detail || 'Epistemic boundary; fact cannot be established on-chain.'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
