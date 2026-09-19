import React from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';
import type { ActiveSecurityVector, ConfidenceClass } from '../types/sentinel';

interface ActiveVectorsProps {
  vectors: ActiveSecurityVector[];
  onSelectEvidence?: (evidenceRef: string) => void;
  blockExplorerUrl?: string;
}

export const ActiveVectors: React.FC<ActiveVectorsProps> = ({
  vectors,
  onSelectEvidence,
  blockExplorerUrl = 'https://etherscan.io',
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: ConfidenceClass) => {
    switch (status) {
      case 'OBSERVED':
        return {
          container: 'bg-[#5E806A]/15 text-[#8cc4a1] border-[#5E806A]/30',
          dot: 'bg-[#5E806A]',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#8cc4a1]" />,
          description: 'Direct on-chain observation confirmed in EVM state',
        };
      case 'INFERRED':
        return {
          container: 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30',
          dot: 'bg-[#9A7A4A]',
          icon: <TrendingUp className="w-3.5 h-3.5 text-[#dfba82]" />,
          description: 'Deductive risk pathway derived from active permissions',
        };
      case 'UNKNOWN':
      default:
        return {
          container: 'bg-white/5 text-slate-300 border-white/10',
          dot: 'bg-slate-400',
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
          description: 'Unobservable off-chain intent, mempool state, or coverage boundary',
        };
    }
  };

  const observedCount = vectors.filter(v => v.status === 'OBSERVED').length;
  const inferredCount = vectors.filter(v => v.status === 'INFERRED').length;
  const unknownCount = vectors.filter(v => v.status === 'UNKNOWN').length;

  return (
    <section className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#d97f7f] mb-1.5 border border-[#A45F5F]/30 bg-[#A45F5F]/15">
            <ShieldAlert className="w-3 h-3 text-[#d97f7f]" />
            <span>Attack & Exposure Surfaces</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span>ACTIVE SECURITY VECTORS</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-300 border border-white/10">
              {vectors.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real attack pathways and active authorization vectors capable of impacting assets right now.
          </p>
        </div>

        {/* Confidence Legend Strip */}
        <div className="flex items-center gap-2 liquid-glass-subtle p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#5E806A]/15 border border-[#5E806A]/30 text-[11px] font-mono text-[#8cc4a1] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#5E806A]" />
            <span>OBSERVED ({observedCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 text-[11px] font-mono text-[#dfba82] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#9A7A4A]" />
            <span>INFERRED ({inferredCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>UNKNOWN ({unknownCount})</span>
          </div>
        </div>
      </div>

      {/* Vectors Card Grid */}
      {vectors.length === 0 ? (
        <div className="liquid-glass-subtle rounded-xl p-8 text-center border border-white/10">
          <CheckCircle2 className="w-10 h-10 text-[#8cc4a1] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white font-mono">No active finding detected</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Zero active unlimited allowances, upgradeable backdoor proxies, or unconstrained administrative roles were detected within analyzed coverage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vectors.map((vector) => {
            const badge = getStatusBadge(vector.status);

            return (
              <div
                key={vector.id}
                className="liquid-glass-subtle rounded-xl p-4 sm:p-5 border border-white/10 hover:border-white/25 transition flex flex-col justify-between group shadow-lg backdrop-blur-xl relative overflow-hidden"
              >
                {/* Left status accent strip */}
                <div 
                  className={`absolute top-0 bottom-0 left-0 w-1 ${
                    vector.status === 'OBSERVED' 
                      ? 'bg-[#5E806A]' 
                      : vector.status === 'INFERRED' 
                      ? 'bg-[#9A7A4A]' 
                      : 'bg-slate-500'
                  }`} 
                />

                <div className="pl-1">
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-semibold text-white truncate max-w-[200px]">
                      {vector.id}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 border ${badge.container}`}>
                      {badge.icon}
                      <span>{vector.status}</span>
                    </span>
                  </div>

                  {/* Vector title */}
                  <h3 className="text-sm font-semibold text-white mb-1 leading-snug">
                    {vector.title}
                  </h3>

                  {/* Description */}
                  {vector.statusReason && (
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {vector.statusReason}
                    </p>
                  )}

                  {/* Key metadata badges */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs font-mono">
                    {vector.token && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px]">Token:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-200">
                            {vector.tokenSymbol ? `${vector.tokenSymbol} (${vector.token.slice(0, 6)}...${vector.token.slice(-4)})` : `${vector.token.slice(0, 6)}...${vector.token.slice(-4)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.token!, `vec-tok-${vector.id}`)}
                            className="p-1 hover:text-white"
                            title="Copy token address"
                          >
                            {copiedId === `vec-tok-${vector.id}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {vector.implementation && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px]">Implementation:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-200">
                            {vector.implementation.slice(0, 6)}...{vector.implementation.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.implementation!, `vec-imp-${vector.id}`)}
                            className="p-1 hover:text-white"
                            title="Copy implementation"
                          >
                            {copiedId === `vec-imp-${vector.id}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={`${blockExplorerUrl}/address/${vector.implementation}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {vector.admin && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px]">Admin:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-200">
                            {vector.admin.slice(0, 6)}...{vector.admin.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.admin!, `vec-adm-${vector.id}`)}
                            className="p-1 hover:text-white"
                            title="Copy admin address"
                          >
                            {copiedId === `vec-adm-${vector.id}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {vector.spender && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px]">Spender:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-200">
                            {vector.spenderLabel ? `${vector.spenderLabel} (${vector.spender.slice(0, 6)}...${vector.spender.slice(-4)})` : `${vector.spender.slice(0, 6)}...${vector.spender.slice(-4)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.spender!, `vec-sp-${vector.id}`)}
                            className="p-1 hover:text-white"
                            title="Copy spender"
                          >
                            {copiedId === `vec-sp-${vector.id}` ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence tracer footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono pl-1">
                  <div className="text-slate-400 truncate max-w-[170px]" title={badge.description}>
                    {badge.description}
                  </div>

                  {vector.evidenceRef && (
                    <button
                      type="button"
                      onClick={() => onSelectEvidence && onSelectEvidence(vector.evidenceRef!)}
                      className="px-2 py-1 rounded bg-[#5B7FA6]/15 hover:bg-[#5B7FA6]/25 border border-[#5B7FA6]/30 text-[#9ac2e8] flex items-center gap-1 text-[10px] transition cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Trace Evidence</span>
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
