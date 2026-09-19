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
  activeSubView?: 'overview' | 'history_exposure' | 'findings' | 'graph' | 'protocol' | 'coverage';
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  report, 
  activeSubView = 'overview' 
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'history_exposure' | 'findings' | 'graph' | 'protocol' | 'coverage'>(activeSubView);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const handleSelectExposure = (exposure: CurrentExposureItem) => {
    const matchingFinding = report.findings.find(f => f.title.includes(exposure.vulnerableAsset?.symbol || '')) || report.findings[0];
    if (matchingFinding) {
      setSelectedFinding(matchingFinding);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header Card */}
      <InvestigationHeader report={report} />

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 pb-3 mb-8">
        <button
          onClick={() => setCurrentSubTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
            currentSubTab === 'overview'
              ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Full Overview</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('history_exposure')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
            currentSubTab === 'history_exposure'
              ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>History vs Exposure</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('findings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
            currentSubTab === 'findings'
              ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Findings ({report.findings.length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('graph')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
            currentSubTab === 'graph'
              ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span>Evidence Graph</span>
        </button>

        {report.protocolHealth && (
          <button
            onClick={() => setCurrentSubTab('protocol')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
              currentSubTab === 'protocol'
                ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Protocol Health</span>
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('coverage')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
            currentSubTab === 'coverage'
              ? 'bg-indigo-600/30 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Coverage Scope</span>
        </button>
      </div>

      {/* Main Tab Content Display */}
      {currentSubTab === 'overview' && (
        <div className="space-y-12">
          <HistoryVsExposure
            currentExposures={report.currentExposures}
            historicalActivities={report.historicalActivities}
            onSelectExposure={handleSelectExposure}
          />

          <FindingsList
            findings={report.findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            selectedFindingId={selectedFinding?.id}
          />

          <EvidenceGraph
            nodes={report.evidenceGraph.nodes}
            edges={report.evidenceGraph.edges}
          />

          {report.protocolHealth && (
            <ProtocolHealthView
              health={report.protocolHealth}
              coverage={report.coverage}
            />
          )}

          <CoverageView coverage={report.coverage} />
        </div>
      )}

      {currentSubTab === 'history_exposure' && (
        <HistoryVsExposure
          currentExposures={report.currentExposures}
          historicalActivities={report.historicalActivities}
          onSelectExposure={handleSelectExposure}
        />
      )}

      {currentSubTab === 'findings' && (
        <FindingsList
          findings={report.findings}
          onSelectFinding={(f) => setSelectedFinding(f)}
          selectedFindingId={selectedFinding?.id}
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

      {/* Expandable Evidence Detail Inspector */}
      {selectedFinding && (
        <EvidenceDetailPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}

    </div>
  );
};
