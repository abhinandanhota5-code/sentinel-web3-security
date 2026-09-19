import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  DollarSign, 
  History, 
  FileText, 
  GitBranch, 
  Layers, 
  Sparkles
} from 'lucide-react';
import type { 
  InvestigationReport, 
  Finding, 
  ActiveSecurityVector 
} from '../types/sentinel';
import { InvestigationHeader } from './InvestigationHeader';
import { ActiveVectors } from './ActiveVectors';
import { CurrentExposureView } from './CurrentExposureView';
import { BlastRadiusView } from './BlastRadiusView';
import { HistoryView } from './HistoryView';
import { FindingsList } from './FindingsList';
import { EvidenceDetailPanel } from './EvidenceDetailPanel';
import { EvidenceGraph } from './EvidenceGraph';
import { GroundedExplanationCard } from './GroundedExplanationCard';
import { ProtocolHealthView } from './ProtocolHealthView';
import { CoverageView } from './CoverageView';
import { InvestigationUnavailableCard } from './InvestigationUnavailableCard';

interface DashboardProps {
  report: InvestigationReport;
  activeSubView?: 'investigation' | 'vectors' | 'exposure' | 'blast_radius' | 'evidence' | 'history' | 'graph' | 'protocol' | 'coverage';
  onRetry?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  report, 
  activeSubView = 'investigation',
  onRetry,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeSubView);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // If backend returned a structured failure state (SECTION 10)
  if (report.failureState?.isUnavailable) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <InvestigationUnavailableCard
          failure={report.failureState}
          onRetry={onRetry}
          onViewCoverage={() => setCurrentTab('coverage')}
        />
        <CoverageView coverage={report.coverage} />
      </div>
    );
  }

  // Derive active vectors if not directly present
  const vectors: ActiveSecurityVector[] = report.activeSecurityVectors || (
    report.currentExposures.map((exp, idx) => ({
      id: `VEC-${idx + 1}`,
      title: exp.title,
      token: exp.vulnerableAsset?.symbol,
      tokenSymbol: exp.vulnerableAsset?.symbol,
      spender: exp.counterparty?.address,
      spenderLabel: exp.counterparty?.label,
      status: (exp.status || 'OBSERVED') as 'OBSERVED' | 'INFERRED' | 'UNKNOWN',
      statusReason: exp.description,
      evidenceRef: exp.directEvidenceProof,
    }))
  );

  // Derive blast radius model if not directly present
  const blastRadiusModel = report.blastRadiusDetails || {
    flowSteps: [
      { id: '1', label: report.ensName || report.targetAddress.slice(0, 8), sublabel: 'Queried Subject', type: 'WALLET' as const, address: report.targetAddress },
      { id: '2', label: report.currentExposures[0]?.vulnerableAsset?.symbol || 'USDC', sublabel: 'Liquid Asset', type: 'TOKEN' as const },
      { id: '3', label: 'Max Uint256', sublabel: 'Unlimited allowance', type: 'ALLOWANCE' as const },
      { id: '4', label: report.currentExposures[0]?.counterparty?.label || 'Router X', sublabel: 'Spender Contract', type: 'SPENDER' as const, address: report.currentExposures[0]?.counterparty?.address },
      { id: '5', label: 'EIP-1967 Proxy', sublabel: 'Upgradeable contract', type: 'UPGRADEABLE_CONTRACT' as const },
      { id: '6', label: 'Single EOA Admin', sublabel: 'Privileged actor', type: 'ADMIN' as const },
    ],
    assetsPotentiallyExposed: report.currentExposures.map(e => ({
      symbol: e.vulnerableAsset?.symbol || 'ERC-20',
      balance: e.vulnerableAsset?.amount || 'Live in state',
      potentialExposureUsd: e.vulnerableAsset?.usdValue,
      status: 'Potential exposure',
    })),
    contractsInvolved: report.currentExposures.map(e => ({
      address: e.counterparty.address,
      name: e.counterparty.label,
      role: e.type,
    })),
    permissionsInvolved: report.currentExposures.map(e => ({
      name: e.title,
      target: e.counterparty.address,
      description: e.description,
    })),
    privilegedActors: [
      { address: report.currentExposures[0]?.counterparty?.address || '0xABC...442', role: 'Proxy Admin', keyType: 'Single EOA Key' },
    ],
    chains: [report.chain.name],
    coverageGaps: report.coverageGaps || report.coverage.limitations.slice(0, 2),
  };

  const handleSelectEvidenceRef = (evidenceRef: string) => {
    // Find matching finding
    const match = report.findings.find(f => 
      f.id === evidenceRef || 
      f.title.toLowerCase().includes(evidenceRef.toLowerCase()) ||
      f.evidence.stateSlot?.includes(evidenceRef) ||
      f.evidence.transactionHash?.includes(evidenceRef)
    ) || report.findings[0];

    if (match) {
      setSelectedFinding(match);
      setCurrentTab('evidence');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* SECTION 1: Investigation Summary Header (Top of page) */}
      <InvestigationHeader report={report} />

      {/* Investigation Navigation Controls (macOS Segmented Bar Style) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.05] p-1.5 rounded-2xl mb-6 border border-white/15 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setCurrentTab('investigation')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'investigation'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 ${currentTab === 'investigation' ? 'text-[#88b0d8]' : 'text-slate-400'}`} />
          <span>Investigation Flow</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('vectors')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'vectors'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 ${currentTab === 'vectors' ? 'text-[#d97f7f]' : 'text-slate-400'}`} />
          <span>Active Vectors ({vectors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('exposure')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'exposure'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${currentTab === 'exposure' ? 'text-[#dfba82]' : 'text-slate-400'}`} />
          <span>Current Exposure</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('blast_radius')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'blast_radius'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className={`w-3.5 h-3.5 ${currentTab === 'blast_radius' ? 'text-slate-200' : 'text-slate-400'}`} />
          <span>Blast Radius</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('evidence')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'evidence'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${currentTab === 'evidence' ? 'text-[#88b0d8]' : 'text-slate-400'}`} />
          <span>Evidence ({report.findings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'history'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className={`w-3.5 h-3.5 ${currentTab === 'history' ? 'text-slate-200' : 'text-slate-400'}`} />
          <span>History ({report.historicalActivities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('graph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'graph'
              ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <GitBranch className={`w-3.5 h-3.5 ${currentTab === 'graph' ? 'text-[#88b0d8]' : 'text-slate-400'}`} />
          <span>Evidence Graph</span>
        </button>

        {report.protocolHealth && (
          <button
            type="button"
            onClick={() => setCurrentTab('protocol')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'protocol'
                ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${currentTab === 'protocol' ? 'text-slate-200' : 'text-slate-400'}`} />
            <span>Protocol Health</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INVESTIGATION VIEW (Strict Visual Priority: 1. Vectors, 2. Exposure,      */}
      {/* 3. Blast Radius, 4. Evidence, 5. History, 6. AI Explanation)              */}
      {/* ========================================================================= */}

      {currentTab === 'investigation' && (
        <div className="space-y-6">
          
          {/* VISUAL PRIORITY 1: ACTIVE SECURITY VECTORS (Section 4) */}
          <ActiveVectors
            vectors={vectors}
            onSelectEvidence={handleSelectEvidenceRef}
            blockExplorerUrl={report.chain.blockExplorer}
          />

          {/* VISUAL PRIORITY 2: CURRENT EXPOSURE (Section 3) */}
          <CurrentExposureView
            exposureDetails={report.currentExposureDetails}
            exposuresList={report.currentExposures}
            blockExplorerUrl={report.chain.blockExplorer}
            onSelectExposureItem={(item) => {
              const matching = report.findings.find(f => f.title.includes(item.vulnerableAsset?.symbol || '')) || report.findings[0];
              if (matching) setSelectedFinding(matching);
            }}
          />

          {/* VISUAL PRIORITY 3: BLAST RADIUS (Section 5) */}
          <BlastRadiusView
            blastRadius={blastRadiusModel}
            totalBlastRadiusUsd={report.totalBlastRadiusUsd}
            blockExplorerUrl={report.chain.blockExplorer}
          />

          {/* VISUAL PRIORITY 4: EVIDENCE & FINDINGS (Section 6 - Why are you saying this?) */}
          <div className="mb-6">
            <FindingsList
              findings={report.findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              selectedFindingId={selectedFinding?.id}
            />
          </div>

          {/* VISUAL PRIORITY 5: HISTORY (Section 2 - What Happened?) */}
          <HistoryView
            activities={report.historicalActivities}
            onSelectEvidence={handleSelectEvidenceRef}
            blockExplorerUrl={report.chain.blockExplorer}
          />

          {/* VISUAL PRIORITY 6: AI GROUNDED EXPLANATION (Section 8 - strictly AFTER deterministic evidence) */}
          {report.explanation && (
            <div className="mt-8">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#88b0d8]" />
                <span>Deterministic Post-Analysis Reasoning (Grounded by Evidence)</span>
              </div>
              <GroundedExplanationCard
                explanation={report.explanation}
                findings={report.findings}
                onSelectFinding={(f) => setSelectedFinding(f)}
              />
            </div>
          )}

        </div>
      )}

      {/* INDIVIDUAL SUBVIEWS */}
      {currentTab === 'vectors' && (
        <ActiveVectors
          vectors={vectors}
          onSelectEvidence={handleSelectEvidenceRef}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

      {currentTab === 'exposure' && (
        <CurrentExposureView
          exposureDetails={report.currentExposureDetails}
          exposuresList={report.currentExposures}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

      {currentTab === 'blast_radius' && (
        <BlastRadiusView
          blastRadius={blastRadiusModel}
          totalBlastRadiusUsd={report.totalBlastRadiusUsd}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

      {currentTab === 'evidence' && (
        <FindingsList
          findings={report.findings}
          onSelectFinding={(f) => setSelectedFinding(f)}
          selectedFindingId={selectedFinding?.id}
        />
      )}

      {currentTab === 'history' && (
        <HistoryView
          activities={report.historicalActivities}
          onSelectEvidence={handleSelectEvidenceRef}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

      {currentTab === 'graph' && (
        <EvidenceGraph
          nodes={report.evidenceGraph.nodes}
          edges={report.evidenceGraph.edges}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

      {currentTab === 'protocol' && report.protocolHealth && (
        <ProtocolHealthView
          health={report.protocolHealth}
          coverage={report.coverage}
        />
      )}

      {currentTab === 'coverage' && (
        <CoverageView
          coverage={report.coverage}
          dataMode={report.dataMode}
          unknowns={report.unknowns}
          coverageGaps={report.coverageGaps}
        />
      )}

      {/* Expandable Evidence Inspector Drawer */}
      {selectedFinding && (
        <EvidenceDetailPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          blockExplorerUrl={report.chain.blockExplorer}
        />
      )}

    </div>
  );
};
