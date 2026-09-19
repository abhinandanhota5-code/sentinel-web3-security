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
      <div className="flex flex-wrap items-center gap-1.5 liquid-glass-subtle p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => setCurrentSubTab('findings')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'findings'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
          <span>Findings & Evidence ({report.findings.length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('history_exposure')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'history_exposure'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>History vs Exposure</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('graph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'graph'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span>Evidence Graph</span>
        </button>

        {report.protocolHealth && (
          <button
            onClick={() => setCurrentSubTab('protocol')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
              currentSubTab === 'protocol'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Protocol Health</span>
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('coverage')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
            currentSubTab === 'coverage'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
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
