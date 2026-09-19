import React from 'react';
import { 
  AlertOctagon, 
  RefreshCw, 
  FileCheck2, 
  Server, 
  HelpCircle, 
  ShieldAlert 
} from 'lucide-react';
import type { InvestigationFailure } from '../types/sentinel';

interface InvestigationUnavailableCardProps {
  failure: InvestigationFailure;
  onRetry?: () => void;
  onViewCoverage?: () => void;
}

export const InvestigationUnavailableCard: React.FC<InvestigationUnavailableCardProps> = ({
  failure,
  onRetry,
  onViewCoverage,
}) => {
  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden border border-amber-400/30 bg-black/40 backdrop-blur-2xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-amber-300 mb-0.5 border border-amber-400/30 bg-amber-500/10">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Epistemic Honesty</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] font-mono">
              Investigation unavailable
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#fdfbf7] text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          {onViewCoverage && (
            <button
              type="button"
              onClick={onViewCoverage}
              className="px-3.5 py-1.5 rounded-xl liquid-pill text-[#bae6fd] hover:text-white border-[#bae6fd]/40 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Coverage Scope</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured Honest Failure Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs font-mono">
        
        {/* Provider */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] tracking-wider">
            <Server className="w-3.5 h-3.5 text-[#bae6fd]" />
            <span>Provider</span>
          </div>
          <div className="text-sm font-bold text-[#fdfbf7]">
            {failure.provider || 'Ethereum RPC'}
          </div>
          <div className="text-[11px] text-slate-400">
            Target provider returned non-definitive state.
          </div>
        </div>

        {/* Reason */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Reason</span>
          </div>
          <div className="text-sm font-bold text-amber-300">
            {failure.reason || 'Rate limit / RPC error / insufficient coverage'}
          </div>
          <div className="text-[11px] text-slate-400">
            Upstream node throttle or timeout encountered.
          </div>
        </div>

        {/* Coverage Gap */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] tracking-wider">
            <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Coverage Gap</span>
          </div>
          <div className="text-sm font-bold text-rose-200">
            {failure.coverageGap || 'Current allowance could not be verified.'}
          </div>
          <div className="text-[11px] text-slate-400">
            Sentinel refuses to synthesize fake security results.
          </div>
        </div>

      </div>

      {/* Explanatory Footer */}
      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 leading-relaxed">
        <strong className="text-[#2dd4bf]">Why this matters:</strong> Other tools show generic "Investigation failed" or hallucinate safe status when RPC endpoints degrade. Sentinel explicitly reports unreachable telemetry and precise coverage bounds so you never mistake a missing provider response for safety.
      </div>

    </div>
  );
};
