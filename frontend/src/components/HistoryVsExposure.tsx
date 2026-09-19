import React, { useState } from 'react';
import { 
  History, 
  Zap, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react';
import type { CurrentExposureItem, HistoricalActivityItem } from '../types/sentinel';

interface HistoryVsExposureProps {
  currentExposures: CurrentExposureItem[];
  historicalActivities: HistoricalActivityItem[];
  onSelectExposure?: (exposure: CurrentExposureItem) => void;
}

export const HistoryVsExposure: React.FC<HistoryVsExposureProps> = ({
  currentExposures,
  historicalActivities,
  onSelectExposure,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'exposure' | 'history'>('both');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#A45F5F]/15 text-[#d97f7f] border-[#A45F5F]/30';
      case 'HIGH':
        return 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30';
      case 'MEDIUM':
        return 'bg-[#9A7A4A]/10 text-[#dfba82] border-[#9A7A4A]/20';
      case 'LOW':
        return 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <div className="mb-10">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#9ac2e8] mb-1.5 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
            Epistemic Distinction
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            History vs. Current Exposure
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Past transactions do not endanger funds today unless active, unrevoked permissions remain in state.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white/[0.05] rounded-xl p-1 self-start border border-white/10">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
              activeTab === 'both'
                ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('exposure')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
              activeTab === 'exposure'
                ? 'bg-[#9A7A4A]/15 text-[#dfba82] font-semibold border border-[#9A7A4A]/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-[#dfba82]" />
            <span>Exposure ({currentExposures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white/15 text-slate-200 font-semibold border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3 h-3 text-slate-400" />
            <span>History ({historicalActivities.length})</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Liquid Cards */}
      <div className={`grid gap-6 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* COLUMN 1: CURRENT EXPOSURE */}
        {(activeTab === 'both' || activeTab === 'exposure') && (
          <div className="liquid-glass rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden border border-white/15">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 flex items-center justify-center text-[#dfba82]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    CURRENT EXPOSURE
                  </h3>
                  <p className="text-[11px] text-[#dfba82] font-mono">
                    Active rights capable of draining funds now
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg liquid-pill text-[#dfba82] border-[#9A7A4A]/30 font-medium">
                {currentExposures.length} Active
              </span>
            </div>

            {/* List */}
            {currentExposures.length === 0 ? (
              <div className="liquid-glass-subtle rounded-xl p-6 text-center border border-white/10">
                <CheckCircle className="w-8 h-8 text-[#8cc4a1] mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-white font-mono">Zero Active Exposures Detected</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No active unlimited token allowances or 0-second timelock vulnerabilities found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentExposures.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectExposure && onSelectExposure(item)}
                    className="liquid-glass-subtle rounded-xl p-4 transition liquid-card-hover cursor-pointer group border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-semibold rounded-md border uppercase ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {item.blastRadiusUsd > 0 && (
                        <span className="text-xs font-mono font-semibold text-[#dfba82] bg-[#9A7A4A]/15 px-2.5 py-0.5 rounded-md border border-[#9A7A4A]/30">
                          ${item.blastRadiusUsd.toLocaleString()} exposed
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-white group-hover:text-white transition mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                      {item.description}
                    </p>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-2.5 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Spender:</span>
                        <span className="text-slate-200">{item.counterparty.label || item.counterparty.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>State Proof:</span>
                        <span className="text-slate-300 truncate max-w-[200px]" title={item.directEvidenceProof}>
                          {item.directEvidenceProof}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Since: {item.activeSince}</span>
                      <span className="text-[#88b0d8] group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
                        Inspect Evidence <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* COLUMN 2: HISTORICAL ACTIVITY */}
        {(activeTab === 'both' || activeTab === 'history') && (
          <div className="liquid-glass rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden border border-white/15">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-slate-300">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    HISTORICAL ACTIVITY
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Settled events that cannot affect funds today
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg liquid-pill text-slate-300 font-medium">
                {historicalActivities.length} Settled
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {historicalActivities.map((act) => (
                <div
                  key={act.id}
                  className="liquid-glass-subtle rounded-xl p-3.5 text-xs font-mono border border-white/10"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-white/10 text-slate-200 border border-white/15 uppercase">
                        {act.actionType}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Block #{act.blockNumber}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-200 font-medium text-[11px] mb-2 font-sans">
                    {act.description}
                  </p>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-2 space-y-1 text-[10px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Tx:</span>
                      <span className="text-[#88b0d8] truncate max-w-[180px]" title={act.transactionHash}>
                        {act.transactionHash.slice(0, 10)}...{act.transactionHash.slice(-8)}
                      </span>
                    </div>
                    {act.valueUsd > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Settled Value:</span>
                        <span className="text-white font-semibold">${act.valueUsd.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 text-[10px] text-slate-400 font-sans border-t border-white/10">
                    <span className="text-slate-200 font-medium font-mono">Analysis: </span>
                    {act.note}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
