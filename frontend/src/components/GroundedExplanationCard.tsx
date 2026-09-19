import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileCheck 
} from 'lucide-react';
import type { GroundedExplanation, Finding } from '../types/sentinel';

interface GroundedExplanationCardProps {
  explanation: GroundedExplanation;
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
}

export const GroundedExplanationCard: React.FC<GroundedExplanationCardProps> = ({
  explanation,
  findings,
  onSelectFinding,
}) => {
  if (!explanation || !explanation.text) {
    return null;
  }

  const isClean = explanation.validation?.clean !== false;
  const isRefused = Boolean(explanation.refused);

  // Render text with clickable citation pills like [1], [2]
  const renderTextWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citationNum = match[1];
        const findingId = explanation.citations[citationNum];
        const knowledge = explanation.knowledgeByCitation[citationNum] || 'OBSERVED';
        const targetFinding = findings.find(f => f.id === findingId);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => targetFinding && onSelectFinding(targetFinding)}
            className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.2 rounded-md text-[11px] font-mono font-medium transition cursor-pointer border ${
              knowledge === 'OBSERVED'
                ? 'bg-[#5E806A]/15 text-[#8cc4a1] border-[#5E806A]/30 hover:bg-[#5E806A]/25'
                : knowledge === 'INFERRED'
                ? 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30 hover:bg-[#9A7A4A]/25'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={`Evidence citation [${citationNum}] -> Finding ${findingId}: ${targetFinding?.title || 'Inspect evidence'}`}
          >
            <span>[{citationNum}]</span>
            <span className="text-[9px] uppercase opacity-75">{knowledge.slice(0, 3)}</span>
          </button>
        );
      }

      // Format markdown-like headings
      if (part.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-semibold font-mono text-white mt-3 mb-1.5 first:mt-0">
            {part.replace(/^###\s+/, '')}
          </h4>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  // Group paragraphs
  const paragraphs = explanation.text.split('\n\n').filter(p => p.trim().length > 0);

  return (
    <div className="liquid-glass rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Top Banner & PRISM Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-[#88b0d8] shadow-sm">
            <Sparkles className="w-4 h-4 text-[#88b0d8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-white font-mono tracking-tight flex items-center gap-2">
                <span>AI Grounded Explanation</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider text-slate-300 bg-white/10 border border-white/15">
                Gemini + PRISM
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Natural language explanation strictly derived from and bounded by deterministic blockchain evidence (SECTION 8).
            </p>
          </div>
        </div>

        {/* PRISM Verification Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isRefused ? (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium text-[#dfba82] bg-[#9A7A4A]/15 border border-[#9A7A4A]/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#dfba82]" />
              <span>REFUSED ({explanation.refused})</span>
            </span>
          ) : isClean ? (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium text-[#8cc4a1] bg-[#5E806A]/15 border border-[#5E806A]/30 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8cc4a1]" />
              <span>PRISM VERIFIED: CLEAN</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium text-[#d97f7f] bg-[#A45F5F]/15 border border-[#A45F5F]/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#d97f7f]" />
              <span>SAFEGUARDS STRIPPED CLAIMS</span>
            </span>
          )}
        </div>
      </div>

      {/* Explanation Narrative */}
      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2.5 max-w-4xl">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="whitespace-pre-line">
            {renderTextWithCitations(p)}
          </p>
        ))}
      </div>

      {/* Citation Tracer Bar */}
      {Object.keys(explanation.citations).length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-white/10">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <FileCheck className="w-3 h-3 text-[#88b0d8]" />
            <span>Click any verified citation to inspect raw blockchain proof:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(explanation.citations).map(([citationNum, findingId]) => {
              const knowledge = explanation.knowledgeByCitation[citationNum] || 'OBSERVED';
              const targetFinding = findings.find(f => f.id === findingId);

              return (
                <button
                  key={citationNum}
                  type="button"
                  onClick={() => targetFinding && onSelectFinding(targetFinding)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-2 border ${
                    knowledge === 'OBSERVED'
                      ? 'bg-[#5E806A]/10 text-[#8cc4a1] border-[#5E806A]/30 hover:bg-[#5E806A]/20'
                      : knowledge === 'INFERRED'
                      ? 'bg-[#9A7A4A]/10 text-[#dfba82] border-[#9A7A4A]/30 hover:bg-[#9A7A4A]/20'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold">[{citationNum}]</span>
                  <span className={`text-[10px] uppercase px-1 py-0.2 rounded ${
                    knowledge === 'OBSERVED' ? 'bg-[#5E806A]/20' : 'bg-[#9A7A4A]/20'
                  }`}>
                    {knowledge}
                  </span>
                  <span className="text-slate-300 truncate max-w-[140px] sm:max-w-[200px]">
                    {targetFinding?.title || findingId}
                  </span>
                  <ArrowRight className="w-3 h-3 opacity-60 ml-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
