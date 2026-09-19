import React, { useState } from 'react';
import { 
  Activity, 
  Zap, 
  ShieldAlert, 
  GitBranch, 
  Layers, 
  FileCheck2 
} from 'lucide-react';
import type { InvestigationReport, Finding, CurrentExposureItem } from '../types/sentinel';
import { InvestigationHeader } from './InvestigationHeader';
import { HistoryVsExposure } from './HistoryVsExposure';
import { FindingsList } from './FindingsList';
import { EvidenceGraph } from './EvidenceGraph';
import { ProtocolHealthView } from './ProtocolHealthView';
import { CoverageView } from './CoverageView';
import { EvidenceDetailPanel } from './EvidenceDetailPanel';

interface DashboardProps {
  report: InvestigationReport;
  activeSubView?: 'findings' | 'history_exposure' | 'graph' | 'protocol' | 'coverage';
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  report, 
  activeSubView = 'findings' 
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'findings' | 'history_exposure' | 'graph' | 'protocol' | 'coverage'>(activeSubView);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const handleSelectExposure = (exposure: CurrentExposureItem) => {
    const matchingFinding = report.findings.find(f => f.title.includes(exposure.vulnerableAsset?.symbol || '')) || report.findings[0];
    if (matchingFinding) {
      setSelectedFinding(matchingFinding);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Liquid Glass Header Cockpit */}
      <InvestigationHeader report={report} />

      {/* Liquid Glass Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 liquid-glass-subtle p-1.5 rounded-2xl mb-6 border border-white/15">
        <button
          onClick={() => setCurrentSubTab('findings')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'findings'
              ? 'liquid-pill text-[#7dd3fc] font-bold border-[#7dd3fc]/50 shadow-sm'
              : 'text-slate-400 hover:text-[#fdfbf7] hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#7dd3fc]" />
          <span>Findings & Evidence ({report.findings.length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('history_exposure')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'history_exposure'
              ? 'liquid-pill text-[#fde68a] font-bold border-[#fde68a]/50 shadow-sm'
              : 'text-slate-400 hover:text-[#fdfbf7] hover:bg-white/5'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#fde68a]" />
          <span>History vs Exposure</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('graph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'graph'
              ? 'liquid-pill text-[#93c5fd] font-bold border-[#93c5fd]/50 shadow-sm'
              : 'text-slate-400 hover:text-[#fdfbf7] hover:bg-white/5'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-[#93c5fd]" />
          <span>Evidence Graph</span>
        </button>

        {report.protocolHealth && (
          <button
            onClick={() => setCurrentSubTab('protocol')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
              currentSubTab === 'protocol'
                ? 'liquid-pill text-[#fef3c7] font-bold border-[#fef3c7]/50 shadow-sm'
                : 'text-slate-400 hover:text-[#fdfbf7] hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#fef3c7]" />
            <span>Protocol Health</span>
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('coverage')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'coverage'
              ? 'liquid-pill text-[#bae6fd] font-bold border-[#bae6fd]/50 shadow-sm'
              : 'text-slate-400 hover:text-[#fdfbf7] hover:bg-white/5'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-[#bae6fd]" />
          <span>Coverage Scope</span>
        </button>
      </div>

      {/* Tab Panels */}
      {currentSubTab === 'findings' && (
        <FindingsList
          findings={report.findings}
          onSelectFinding={(f) => setSelectedFinding(f)}
          selectedFindingId={selectedFinding?.id}
        />
      )}

      {currentSubTab === 'history_exposure' && (
        <HistoryVsExposure
          currentExposures={report.currentExposures}
          historicalActivities={report.historicalActivities}
          onSelectExposure={handleSelectExposure}
        />
      )}

      {currentSubTab === 'graph' && (
        <EvidenceGraph
          nodes={report.evidenceGraph.nodes}
          edges={report.evidenceGraph.edges}
        />
      )}

      {currentSubTab === 'protocol' && (
        <ProtocolHealthView
          health={report.protocolHealth}
          coverage={report.coverage}
        />
      )}

      {currentSubTab === 'coverage' && (
        <CoverageView coverage={report.coverage} />
      )}

      {/* Expandable Evidence Detail Inspector Drawer */}
      {selectedFinding && (
        <EvidenceDetailPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}

    </div>
  );
};
