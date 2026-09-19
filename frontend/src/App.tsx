import { useState } from 'react';
import type { NetworkChainId, InvestigationReport } from './types/sentinel';
import { SentinelService, PRESET_COMPROMISED_WALLET, PRESET_MULTIPLI_PROTOCOL } from './services/sentinelApi';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { EvidenceGraph } from './components/EvidenceGraph';
import { ProtocolHealthView } from './components/ProtocolHealthView';
import { CoverageView } from './components/CoverageView';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'graph' | 'protocol' | 'coverage'>('landing');
  const [selectedChain, setSelectedChain] = useState<NetworkChainId>('ethereum');
  const [report, setReport] = useState<InvestigationReport>(PRESET_COMPROMISED_WALLET);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInvestigate = async (address: string, chain: NetworkChainId = selectedChain) => {
    setIsLoading(true);
    try {
      const result = await SentinelService.investigateAddress(address, chain);
      setReport(result);
      setSelectedChain(chain);
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Investigation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = async (addressKey: string) => {
    setIsLoading(true);
    try {
      // Determine chain based on preset
      let chain: NetworkChainId = 'ethereum';
      if (addressKey.includes('44d9a518')) chain = 'multipli';
      if (addressKey.includes('deadbeef')) chain = 'base';

      const result = await SentinelService.investigateAddress(addressKey, chain);
      setReport(result);
      setSelectedChain(chain);
      setCurrentView('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040714] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        selectedChain={selectedChain}
        onSelectChain={(c) => {
          setSelectedChain(c);
          if (report) {
            handleInvestigate(report.targetAddress, c);
          }
        }}
        onSearch={(addr) => handleInvestigate(addr, selectedChain)}
        onQuickPreset={handleQuickPreset}
        isInvestigating={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-teal-400 animate-spin" />
                <ShieldCheck className="w-6 h-6 text-teal-400 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Reconstructing State...</h3>
              <p className="text-xs text-slate-400 font-mono">
                Querying EVM storage slots, ERC-20 allowances, and proxy implementation pointers.
              </p>
            </div>
          </div>
        )}

        {currentView === 'landing' && (
          <LandingPage
            onInvestigate={handleInvestigate}
            selectedChain={selectedChain}
            onSelectChain={setSelectedChain}
            isLoading={isLoading}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            report={report}
            activeSubView="overview"
          />
        )}

        {currentView === 'graph' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EvidenceGraph
              nodes={report.evidenceGraph.nodes}
              edges={report.evidenceGraph.edges}
            />
          </div>
        )}

        {currentView === 'protocol' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProtocolHealthView
              health={report.protocolHealth || PRESET_MULTIPLI_PROTOCOL.protocolHealth}
              coverage={report.coverage}
            />
          </div>
        )}

        {currentView === 'coverage' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CoverageView coverage={report.coverage} />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-[#02050e] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300 font-mono">SENTINEL</span>
            <span>— Evidence-first investigation layer for Web3</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-400">Multipli Hackathon 2026</span>
            <span>•</span>
            <span className="text-teal-400">From Alert to Evidence</span>
            <span>•</span>
            <button onClick={() => setCurrentView('coverage')} className="hover:text-slate-200 underline">
              Coverage & Bounds
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
