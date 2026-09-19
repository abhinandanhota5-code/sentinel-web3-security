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
    // Regex for [1], [2], etc.
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
            className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.2 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
              knowledge === 'OBSERVED'
                ? 'bg-ok/12 text-ok border-ok/25 hover:bg-ok/20'
                : knowledge === 'INFERRED'
                ? 'bg-warn/12 text-warn border-warn/25 hover:bg-warn/20'
                : 'bg-white/55 text-ink-2 border-[#171a1f]/10 hover:bg-white/80'
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
          <h4 key={idx} className="text-sm font-bold text-ink mt-3 mb-1.5 first:mt-0">
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
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden">
      
      {/* Top Banner & PRISM Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#171a1f]/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-soft border border-accent/25 flex items-center justify-center text-accent-deep">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-ink tracking-tight flex items-center gap-2">
                <span>AI Grounded Analysis</span>
              </h3>
              <span className="px-2 py-0.2 rounded text-[10px] tracking-wider text-ink-2 bg-white/55 border border-[#171a1f]/10 font-medium">
                Gemini + PRISM
              </span>
            </div>
            <p className="text-[11px] text-ink-2">
              Natural language explanation strictly verified against deterministic blockchain evidence
            </p>
          </div>
        </div>

        {/* PRISM Verification Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isRefused ? (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-warn bg-warn/12 border border-warn/25 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warn" />
              <span>REFUSED ({explanation.refused})</span>
            </span>
          ) : isClean ? (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-ok bg-ok/12 border border-ok/25 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              <span>PRISM VERIFIED: CLEAN</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-bad bg-bad/12 border border-bad/25 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-bad" />
              <span>SAFEGUARDS STRIPPED CLAIMS</span>
            </span>
          )}
        </div>
      </div>

      {/* Explanation Narrative */}
      <div className="text-xs sm:text-sm text-ink-2 leading-relaxed space-y-2.5 max-w-4xl">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="whitespace-pre-line">
            {renderTextWithCitations(p)}
          </p>
        ))}
      </div>

      {/* Citation Tracer Bar */}
      {Object.keys(explanation.citations).length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-[#171a1f]/8">
          <div className="text-[10px] uppercase tracking-wider text-ink-3 mb-2 flex items-center gap-1.5">
            <FileCheck className="w-3 h-3 text-accent" />
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
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    knowledge === 'OBSERVED'
                      ? 'bg-ok/10 text-ok border-ok/25 hover:bg-ok/18 hover:border-ok/40'
                      : knowledge === 'INFERRED'
                      ? 'bg-warn/10 text-warn border-warn/25 hover:bg-warn/18 hover:border-warn/40'
                      : 'bg-white/50 text-ink-2 border-[#171a1f]/10 hover:bg-white/75'
                  }`}
                >
                  <span className="font-bold">[{citationNum}]</span>
                  <span className={`text-[10px] uppercase px-1 py-0.2 rounded ${
                    knowledge === 'OBSERVED' ? 'bg-ok/15' : 'bg-warn/15'
                  }`}>
                    {knowledge}
                  </span>
                  <span className="text-ink-2 truncate max-w-[140px] sm:max-w-[200px]">
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
