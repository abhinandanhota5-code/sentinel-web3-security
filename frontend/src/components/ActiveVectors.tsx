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
          container: 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/35 shadow-sm shadow-[#2dd4bf]/10',
          dot: 'bg-[#2dd4bf]',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />,
          description: 'Direct on-chain observation confirmed in EVM state',
        };
      case 'INFERRED':
        return {
          container: 'bg-[#fef3c7]/20 text-[#fde68a] border-[#fde68a]/35 shadow-sm shadow-[#fde68a]/10',
          dot: 'bg-[#fde68a]',
          icon: <TrendingUp className="w-3.5 h-3.5 text-[#fde68a]" />,
          description: 'Deductive risk pathway derived from active permissions',
        };
      case 'UNKNOWN':
      default:
        return {
          container: 'bg-[#cbd5e1]/15 text-[#cbd5e1] border-slate-400/35 shadow-sm shadow-slate-400/10',
          dot: 'bg-[#cbd5e1]',
          icon: <HelpCircle className="w-3.5 h-3.5 text-[#cbd5e1]" />,
          description: 'Unobservable off-chain intent, mempool state, or coverage boundary',
        };
    }
  };

  const observedCount = vectors.filter(v => v.status === 'OBSERVED').length;
  const inferredCount = vectors.filter(v => v.status === 'INFERRED').length;
  const unknownCount = vectors.filter(v => v.status === 'UNKNOWN').length;

  return (
    <section className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/20">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-rose-300 mb-1 border border-rose-400/30 bg-rose-500/15">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Attack & Exposure Surfaces</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] font-mono flex items-center gap-2">
            <span>ACTIVE SECURITY VECTORS</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-300 border border-white/10">
              {vectors.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Real attack pathways and active authorization vectors capable of impacting assets right now.
          </p>
        </div>

        {/* Confidence Legend Strip */}
        <div className="flex items-center gap-2 liquid-glass-subtle p-1.5 rounded-2xl border border-white/15">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 text-[11px] font-mono text-[#2dd4bf] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf]" />
            <span>OBSERVED ({observedCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#fef3c7]/15 border border-[#fde68a]/30 text-[11px] font-mono text-[#fde68a] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#fde68a]" />
            <span>INFERRED ({inferredCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-slate-400/30 text-[11px] font-mono text-[#cbd5e1] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#cbd5e1]" />
            <span>UNKNOWN ({unknownCount})</span>
          </div>
        </div>
      </div>

      {/* Vectors Card Grid */}
      {vectors.length === 0 ? (
        <div className="liquid-glass-subtle rounded-2xl p-8 text-center border border-white/10">
          <CheckCircle2 className="w-10 h-10 text-[#2dd4bf] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#fdfbf7] font-mono">No active finding detected</h3>
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
                className="liquid-glass-subtle rounded-2xl p-4 sm:p-5 border border-white/15 hover:border-[#2dd4bf]/40 transition flex flex-col justify-between group shadow-lg backdrop-blur-xl relative overflow-hidden"
              >
                {/* Left status accent strip */}
                <div 
                  className={`absolute top-0 bottom-0 left-0 w-1 ${
                    vector.status === 'OBSERVED' 
                      ? 'bg-[#2dd4bf]' 
                      : vector.status === 'INFERRED' 
                      ? 'bg-[#fde68a]' 
                      : 'bg-slate-400'
                  }`} 
                />

                <div className="pl-1">
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-[#fdfbf7] truncate max-w-[200px]">
                      {vector.id}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${badge.container}`}>
                      {badge.icon}
                      <span>{vector.status}</span>
                    </span>
                  </div>

                  {/* Vector Title */}
                  <h3 className="text-sm font-bold text-[#fdfbf7] font-mono leading-snug mb-3">
                    {vector.title}
                  </h3>

                  {/* Attributes list */}
                  <div className="space-y-2 text-xs font-mono bg-black/25 rounded-xl p-3 border border-white/10 mb-3">
                    {vector.token && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Token:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#bae6fd] font-bold">{vector.tokenSymbol || 'Token'}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({vector.token.slice(0, 6)}...{vector.token.slice(-4)})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.token!, `tok-${vector.id}`)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy token address"
                          >
                            {copiedId === `tok-${vector.id}` ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {vector.spender && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Spender:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#fdfbf7] font-mono">
                            {vector.spenderLabel ? `${vector.spenderLabel} ` : ''}
                            <span className="text-[#bae6fd]">{vector.spender.slice(0, 6)}...{vector.spender.slice(-4)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.spender!, `sp-${vector.id}`)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy spender address"
                          >
                            {copiedId === `sp-${vector.id}` ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {vector.implementation && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Implementation:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#93c5fd]">{vector.implementation.slice(0, 6)}...{vector.implementation.slice(-4)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.implementation!, `impl-${vector.id}`)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy implementation address"
                          >
                            {copiedId === `impl-${vector.id}` ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {vector.admin && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Admin:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#fca5a5]">{vector.admin.slice(0, 6)}...{vector.admin.slice(-4)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(vector.admin!, `adm-${vector.id}`)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy admin address"
                          >
                            {copiedId === `adm-${vector.id}` ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confidence explanation */}
                  {vector.statusReason && (
                    <div className="text-[11px] text-slate-300 leading-relaxed font-mono mb-3">
                      {vector.statusReason}
                    </div>
                  )}
                </div>

                {/* Evidence link / inspector action */}
                {vector.evidenceRef && onSelectEvidence && (
                  <button
                    type="button"
                    onClick={() => onSelectEvidence(vector.evidenceRef!)}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-[#2dd4bf]/20 border border-white/10 hover:border-[#2dd4bf]/40 text-[#2dd4bf] text-xs font-mono font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Inspect Evidence Proof</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
