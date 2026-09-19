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
        return 'bg-bad/12 text-bad border-bad/25';
      case 'HIGH':
        return 'bg-bad/10 text-bad border-bad/20';
      case 'MEDIUM':
        return 'bg-warn/12 text-warn border-warn/25';
      case 'LOW':
        return 'bg-accent/12 text-accent border-accent/25';
      default:
        return 'bg-white/55 text-ink-2 border-[#171a1f]/10';
    }
  };

  return (
    <div className="mb-10">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-accent mb-1 font-medium">
            Epistemic Distinction
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            History vs. Current Exposure
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Past transactions do not endanger funds today unless active, unrevoked permissions remain in state.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center liquid-glass-subtle rounded-xl p-1 self-start">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1 rounded-lg text-xs transition ${
              activeTab === 'both'
                ? 'bg-white/80 text-ink font-semibold shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('exposure')}
            className={`px-3 py-1 rounded-lg text-xs transition flex items-center gap-1.5 ${
              activeTab === 'exposure'
                ? 'bg-accent-soft text-accent font-semibold border border-accent/30'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Zap className="w-3 h-3 text-accent" />
            <span>Exposure ({currentExposures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg text-xs transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white/80 text-ink font-semibold border border-[#171a1f]/10'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <History className="w-3 h-3 text-ink-2" />
            <span>History ({historicalActivities.length})</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Liquid Cards */}
      <div className={`grid gap-6 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* COLUMN 1: CURRENT EXPOSURE */}
        {(activeTab === 'both' || activeTab === 'exposure') && (
          <div className="liquid-glass rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#171a1f]/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-warn/12 border border-warn/25 flex items-center justify-center text-warn">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    CURRENT EXPOSURE
                  </h3>
                  <p className="text-[11px] text-warn">
                    Active rights capable of draining funds now
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg liquid-pill text-warn font-semibold">
                {currentExposures.length} Active
              </span>
            </div>

            {/* List */}
            {currentExposures.length === 0 ? (
              <div className="liquid-glass-subtle rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-ok mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-ink">Zero Active Exposures Detected</h4>
                <p className="text-[11px] text-ink-3 mt-0.5">
                  No active unlimited token allowances or 0-second timelock vulnerabilities found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentExposures.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectExposure && onSelectExposure(item)}
                    className="liquid-glass-subtle rounded-2xl p-4 transition liquid-card-hover cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border uppercase ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="text-[10px] text-ink-3">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {item.blastRadiusUsd > 0 && (
                        <span className="text-xs font-bold text-warn bg-warn/10 px-2 py-0.5 rounded-md border border-warn/20">
                          ${item.blastRadiusUsd.toLocaleString()} exposed
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-ink group-hover:text-accent transition mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-ink-2 leading-relaxed mb-2.5">
                      {item.description}
                    </p>

                    <div className="glass-well p-2.5 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-ink-3">
                        <span>Spender:</span>
                        <span className="text-ink-2 font-mono">{item.counterparty.label || item.counterparty.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-ink-3">
                        <span>State Proof:</span>
                        <span className="text-accent font-mono truncate max-w-[200px]" title={item.directEvidenceProof}>
                          {item.directEvidenceProof}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#171a1f]/[0.06] flex items-center justify-between text-[10px] text-ink-3">
                      <span>Since: {item.activeSince}</span>
                      <span className="text-accent group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
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
          <div className="liquid-glass rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#171a1f]/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/55 border border-[#171a1f]/10 flex items-center justify-center text-ink-2">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    HISTORICAL ACTIVITY
                  </h3>
                  <p className="text-[11px] text-ink-3">
                    Settled events that cannot affect funds today
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg liquid-pill text-ink-2 font-semibold">
                {historicalActivities.length} Settled
              </span>
            </div>

            {/* List */}
            {historicalActivities.length === 0 ? (
              <div className="liquid-glass-subtle rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-60" />
                <h4 className="text-xs font-semibold text-ink">No Settled Historical Transactions</h4>
                <p className="text-[11px] text-ink-3 mt-0.5">
                  No settled transfer or contract interaction events were indexed in this analysis window.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicalActivities.map((act) => (
                <div
                  key={act.id}
                  className="liquid-glass-subtle rounded-2xl p-3.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-white/55 text-ink-2 border border-[#171a1f]/10 uppercase">
                        {act.actionType}
                      </span>
                      <span className="text-ink-3 text-[10px] font-mono">
                        Block #{act.blockNumber}
                      </span>
                    </div>
                    <span className="text-ink-3 text-[10px]">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-ink-2 font-medium text-[11px] mb-2">
                    {act.description}
                  </p>

                  <div className="glass-well p-2 space-y-1 text-[10px] text-ink-3">
                    <div className="flex items-center justify-between">
                      <span>Tx:</span>
                      <span className="text-accent font-mono truncate max-w-[180px]" title={act.transactionHash}>
                        {act.transactionHash.slice(0, 10)}...{act.transactionHash.slice(-8)}
                      </span>
                    </div>
                    {act.valueUsd > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Settled Value:</span>
                        <span className="text-ink font-bold">${act.valueUsd.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 text-[10px] text-ink-3 border-t border-[#171a1f]/[0.06]">
                    <span className="text-ink-2 font-semibold">Analysis: </span>
                    {act.note}
                  </div>

                </div>
              ))}
            </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
