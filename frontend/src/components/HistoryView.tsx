import React, { useState } from 'react';
import { 
  History, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  Layers 
} from 'lucide-react';
import type { HistoricalActivityItem } from '../types/sentinel';

interface HistoryViewProps {
  activities: HistoricalActivityItem[];
  onSelectEvidence?: (evidenceId: string) => void;
  blockExplorerUrl?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  activities,
  onSelectEvidence,
  blockExplorerUrl = 'https://etherscan.io',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'APPROVAL':
        return 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30';
      case 'SWAP':
        return 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30';
      case 'TRANSFER':
        return 'bg-[#5E806A]/15 text-[#8cc4a1] border-[#5E806A]/30';
      case 'CONTRACT_INTERACTION':
        return 'bg-white/[0.06] text-slate-200 border-white/15';
      case 'CONTRACT_DEPLOY':
        return 'bg-white/[0.06] text-slate-200 border-white/15';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <section className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#9ac2e8] mb-1.5 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
            <History className="w-3 h-3 text-[#88b0d8]" />
            <span>1. WHAT HAPPENED?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span>TRANSACTION & INTERACTION HISTORY</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-300 border border-white/10">
              {activities.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Verified chronological events on-chain. Every claim links directly to immutable block receipts and event logs.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          <span className="text-[#88b0d8] font-medium">Epistemic Rule:</span> Historical transactions do not drain funds today without lingering active state.
        </div>
      </div>

      {/* History Items List */}
      {activities.length === 0 ? (
        <div className="liquid-glass-subtle rounded-xl p-8 text-center border border-white/10">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-white font-mono">No historical anomalies recorded</h3>
          <p className="text-xs text-slate-400 mt-1">
            Zero suspicious transactions or anomalous contract interactions found within queried block ranges.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, idx) => {
            const isSuspicious = activity.threatSignificance === 'PRIOR_ANOMALY' || activity.threatSignificance === 'CRITICAL_INTERACTION';

            return (
              <div
                key={activity.id || idx}
                className={`liquid-glass-subtle rounded-xl p-5 border transition flex flex-col justify-between shadow-lg backdrop-blur-xl relative overflow-hidden ${
                  isSuspicious ? 'border-[#9A7A4A]/40' : 'border-white/10'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tracking-wider uppercase border ${getActionBadge(activity.actionType)}`}>
                      {activity.actionType.replace('_', ' ')}
                    </span>

                    {isSuspicious && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-[#A45F5F]/15 text-[#d97f7f] border border-[#A45F5F]/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-[#d97f7f]" />
                        <span>Suspicious Interaction</span>
                      </span>
                    )}

                    <span className="text-xs font-mono font-semibold text-white">
                      {activity.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono bg-black/30 rounded-lg p-3.5 border border-white/10 mb-3">
                  
                  {/* Transaction Hash */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Transaction Hash:</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[#88b0d8] truncate">
                        {activity.transactionHash.slice(0, 10)}...{activity.transactionHash.slice(-8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activity.transactionHash, `tx-${idx}`)}
                        className="p-1 hover:text-white"
                        title="Copy Tx Hash"
                      >
                        {copiedId === `tx-${idx}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={`${blockExplorerUrl}/tx/${activity.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-white"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Block Number */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Block Number:</span>
                    <span className="text-white font-medium block mt-0.5">
                      #{activity.blockNumber.toLocaleString()}
                    </span>
                  </div>

                  {/* From Address */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">From:</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-slate-200">
                        {activity.fromAddress 
                          ? `${activity.fromAddress.slice(0, 6)}...${activity.fromAddress.slice(-4)}` 
                          : 'Indexed Sender'}
                      </span>
                      {activity.fromAddress && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activity.fromAddress!, `from-${idx}`)}
                          className="p-1 hover:text-white"
                        >
                          {copiedId === `from-${idx}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* To Address */}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">To / Contract:</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-slate-200">
                        {activity.toAddress 
                          ? `${activity.toAddress.slice(0, 6)}...${activity.toAddress.slice(-4)}`
                          : activity.counterparty?.address 
                          ? `${activity.counterparty.address.slice(0, 6)}...${activity.counterparty.address.slice(-4)}`
                          : 'Recipient'}
                      </span>
                      {(activity.toAddress || activity.counterparty?.address) && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activity.toAddress || activity.counterparty!.address, `to-${idx}`)}
                          className="p-1 hover:text-white"
                        >
                          {copiedId === `to-${idx}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Token Transfers and Contract Interaction Breakdown */}
                {((activity.tokenTransfers && activity.tokenTransfers.length > 0) || activity.contractInteraction) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs font-mono">
                    {activity.tokenTransfers && activity.tokenTransfers.length > 0 && (
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/10">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                          Token Transfers ({activity.tokenTransfers.length})
                        </span>
                        <div className="space-y-1">
                          {activity.tokenTransfers.map((tt, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-100 font-medium">{tt.amount} {tt.symbol || 'Tokens'}</span>
                              <div className="flex items-center gap-1 text-slate-400">
                                <span>{tt.from.slice(0, 4)}...</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span>{tt.to.slice(0, 4)}...</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activity.contractInteraction && (
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/10">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                          Contract Interaction
                        </span>
                        <div className="space-y-1 text-[11px]">
                          {activity.contractInteraction.method && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Method:</span>
                              <span className="text-slate-200 font-medium">{activity.contractInteraction.method}</span>
                            </div>
                          )}
                          {activity.contractInteraction.selector && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Selector:</span>
                              <span className="text-slate-300">{activity.contractInteraction.selector}</span>
                            </div>
                          )}
                          {activity.contractInteraction.calldata && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Calldata:</span>
                              <span className="text-slate-400 truncate max-w-[150px]">{activity.contractInteraction.calldata}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Row: Note & Evidence Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-300 font-mono leading-relaxed max-w-2xl">
                    {activity.note}
                  </p>

                  {onSelectEvidence && (
                    <button
                      type="button"
                      onClick={() => onSelectEvidence(activity.evidenceId || activity.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#5B7FA6]/15 hover:bg-[#5B7FA6]/25 border border-[#5B7FA6]/30 text-[#9ac2e8] text-xs font-mono font-semibold transition flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shrink-0"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Link to Evidence</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
