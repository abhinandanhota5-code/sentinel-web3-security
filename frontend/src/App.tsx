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
    <div className="min-h-screen bg-[#07080d] text-stone-100 flex flex-col selection:bg-[#a7f3d0] selection:text-black relative overflow-x-hidden cyber-grid">
      
      {/* Persistent Ambient Pastel & Nude Liquid Mesh behind all views */}
      <div className="fixed top-[-10%] left-[15%] w-[45rem] h-[45rem] bg-[#a7f3d0]/6 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[5%] w-[40rem] h-[40rem] bg-[#fed7aa]/7 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[20%] w-[48rem] h-[48rem] bg-[#d8b4fe]/6 rounded-full blur-[170px] pointer-events-none -z-10" />

      {/* Liquid Floating Navigation */}
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
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-150">
            <div className="liquid-glass rounded-3xl p-8 max-w-sm text-center shadow-2xl border border-white/20">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-[#a7f3d0] animate-spin" />
                <ShieldCheck className="w-5 h-5 text-[#a7f3d0] absolute inset-0 m-auto" />
              </div>
              <h3 className="text-base font-bold text-stone-100 mb-1 font-mono">Reconstructing State...</h3>
              <p className="text-xs text-stone-400 font-mono">
                Querying EVM storage slots, allowance mappings, and delegate proxies.
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
            activeSubView="findings"
          />
        )}

        {currentView === 'graph' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <EvidenceGraph
              nodes={report.evidenceGraph.nodes}
              edges={report.evidenceGraph.edges}
            />
          </div>
        )}

        {currentView === 'protocol' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ProtocolHealthView
              health={report.protocolHealth || PRESET_MULTIPLI_PROTOCOL.protocolHealth}
              coverage={report.coverage}
            />
          </div>
        )}

        {currentView === 'coverage' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CoverageView coverage={report.coverage} />
          </div>
        )}
      </main>

      {/* Floating Liquid Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-6 text-xs text-stone-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#a7f3d0]" />
            <span className="font-bold text-stone-200 font-mono tracking-wider">SENTINEL</span>
            <span className="text-stone-600">—</span>
            <span className="text-stone-400">Evidence-first investigation layer for Web3</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
            <span className="text-stone-400">Autonomous Protocol Security</span>
            <span>•</span>
            <span className="text-[#a7f3d0]">From Alert to Evidence</span>
            <span>•</span>
            <button onClick={() => setCurrentView('coverage')} className="hover:text-stone-200 underline">
              Coverage & Scope
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
