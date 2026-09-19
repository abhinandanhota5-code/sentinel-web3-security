import React, { useState } from 'react';
import { 
  History, 
  Zap, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
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
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-rose-900/60 text-rose-200 border-rose-600/40';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="mb-10">
      
      {/* Section Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase bg-teal-950/60 border border-teal-500/40 text-teal-300 mb-1">
            Core Distinction // Epistemic Clarity
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            History vs. Current Exposure
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Legacy tools confuse past interactions with current risk. Sentinel separates historical settled actions from live permissions capable of draining assets right now.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 self-start">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              activeTab === 'both'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('exposure')}
            className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'exposure'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Current Exposure ({currentExposures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3 h-3" />
            <span>History ({historicalActivities.length})</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Container */}
      <div className={`grid gap-6 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ======================================================== */}
        {/* COLUMN 1: CURRENT EXPOSURE ("What can affect this entity RIGHT NOW?") */}
        {/* ======================================================== */}
        {(activeTab === 'both' || activeTab === 'exposure') && (
          <div className="glass-panel rounded-xl p-5 border-rose-500/30 shadow-xl relative overflow-hidden bg-gradient-to-b from-rose-950/10 via-[#0a1128]/80 to-[#040817]">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-rose-900/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    CURRENT EXPOSURE
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Active Threat Surface
                    </span>
                  </h3>
                  <p className="text-[11px] text-rose-300 font-medium">
                    What can affect this entity RIGHT NOW?
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-rose-950/60 border border-rose-700/40 text-rose-300">
                {currentExposures.length} Active Vector{currentExposures.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Explanatory Banner */}
            <div className="bg-rose-950/30 border border-rose-700/30 rounded-lg p-3 mb-4 text-xs text-rose-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                These are <strong>active on-chain permissions or dependencies</strong> still in state. They have continuous technical access to drain or alter assets without future signature confirmation.
              </span>
            </div>

            {/* List of Current Exposures */}
            {currentExposures.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-8 text-center">
                <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">No active exposure vectors detected</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No unrevoked unlimited allowances, unverified proxy implementations, or zero-timelock admin doors are actively open.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentExposures.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectExposure && onSelectExposure(item)}
                    className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-lg p-4 transition glass-card-hover cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {item.blastRadiusUsd > 0 && (
                        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                          ${item.blastRadiusUsd.toLocaleString()} at risk
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Counterparty & Evidence proof */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded p-2.5 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Counterparty Spender:</span>
                        <span className="text-slate-200">
                          {item.counterparty.label || `${item.counterparty.address.slice(0, 8)}...${item.counterparty.address.slice(-6)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Direct Proof in State:</span>
                        <span className="text-teal-300 text-[10px] truncate max-w-xs" title={item.directEvidenceProof}>
                          {item.directEvidenceProof}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Active since: {item.activeSince}</span>
                      <span className="text-rose-400 group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
                        Inspect Evidence <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* COLUMN 2: HISTORY ("What has this entity done?") */}
        {/* ======================================================== */}
        {(activeTab === 'both' || activeTab === 'history') && (
          <div className="glass-panel rounded-xl p-5 border-slate-700/60 shadow-xl relative overflow-hidden bg-gradient-to-b from-slate-900/40 via-[#0a1128]/80 to-[#040817]">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    HISTORICAL ACTIVITY
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Settled Events
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    What has this entity done?
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {historicalActivities.length} Activity Log{historicalActivities.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Explanatory Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-4 text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Historical events are <strong>already settled and immutable</strong>. An interaction with a high-risk entity in the past does <em>not</em> endanger the wallet today unless unrevoked permissions remain.
              </span>
            </div>

            {/* List of Historical Activities */}
            <div className="space-y-4">
              {historicalActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                        {act.actionType}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        Block #{act.blockNumber}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-200 font-medium text-xs mb-2">
                    {act.description}
                  </p>

                  <div className="bg-slate-950/60 border border-slate-800 rounded p-2.5 space-y-1 font-mono text-[11px] mb-2.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Tx Hash:</span>
                      <span className="text-indigo-300 truncate max-w-[200px]" title={act.transactionHash}>
                        {act.transactionHash.slice(0, 10)}...{act.transactionHash.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Counterparty:</span>
                      <span className="text-slate-300">
                        {act.counterparty.label || `${act.counterparty.address.slice(0, 8)}...${act.counterparty.address.slice(-6)}`}
                      </span>
                    </div>
                    {act.valueUsd > 0 && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Value Settled:</span>
                        <span className="text-slate-200">${act.valueUsd.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Epistemic note */}
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border-l-2 border-slate-600">
                    <span className="font-semibold text-slate-300">Analysis: </span>
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
