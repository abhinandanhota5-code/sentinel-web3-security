import React, { useState } from 'react';
import { 
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
import { GroundedExplanationCard } from './GroundedExplanationCard';

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

      {/* AI Grounded Analysis Section */}
      {report.explanation && (
        <GroundedExplanationCard
          explanation={report.explanation}
          findings={report.findings}
          onSelectFinding={(f) => {
            setSelectedFinding(f);
            setCurrentSubTab('findings');
          }}
        />
      )}

      {/* Liquid Glass Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 liquid-glass-subtle p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => setCurrentSubTab('findings')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
            currentSubTab === 'findings'
              ? 'bg-[rgba(91,120,160,0.12)] text-[#405a78] font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-white/55'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Findings & Evidence ({report.findings.length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('history_exposure')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
            currentSubTab === 'history_exposure'
              ? 'bg-[rgba(91,120,160,0.12)] text-[#405a78] font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-white/55'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>History vs Exposure</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('graph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
            currentSubTab === 'graph'
              ? 'bg-[rgba(91,120,160,0.12)] text-[#405a78] font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-white/55'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Evidence Graph</span>
        </button>

        {report.protocolHealth && (
          <button
            onClick={() => setCurrentSubTab('protocol')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              currentSubTab === 'protocol'
                ? 'bg-[rgba(91,120,160,0.12)] text-[#405a78] font-semibold'
                : 'text-ink-3 hover:text-ink hover:bg-white/55'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Protocol Health</span>
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('coverage')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
            currentSubTab === 'coverage'
              ? 'bg-[rgba(91,120,160,0.12)] text-[#405a78] font-semibold'
              : 'text-ink-3 hover:text-ink hover:bg-white/55'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
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
        <CoverageView
          coverage={report.coverage}
          dataMode={report.dataMode}
          unknowns={report.unknowns}
          coverageGaps={report.coverageGaps}
        />
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
