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
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col selection:bg-[#fde68a] selection:text-[#0c1220] relative overflow-x-hidden ambient-mesh">
      
      {/* Luminous Ambient Liquid Mesh (Mixed Soft Blue, Warm Cream, Light Beige & Pearlescent Gray) */}
      <div className="fixed top-[-15%] left-[20%] w-[58rem] h-[58rem] bg-[#fdfbf7]/18 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="fixed top-[15%] right-[-5%] w-[52rem] h-[52rem] bg-[#efe4d0]/16 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[5%] left-[-10%] w-[48rem] h-[48rem] bg-[#7dd3fc]/14 rounded-full blur-[170px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed top-[45%] left-[25%] w-[46rem] h-[46rem] bg-[#f7f1e4]/14 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[54rem] h-[54rem] bg-[#93c5fd]/12 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed bottom-[15%] right-[5%] w-[44rem] h-[44rem] bg-[#fde68a]/12 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-[65%] left-[-5%] w-[38rem] h-[38rem] bg-[#cbd5e1]/10 rounded-full blur-[150px] pointer-events-none -z-10" />

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
          <div className="fixed inset-0 z-50 bg-[#080c16]/60 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-150">
            <div className="liquid-glass-beige rounded-3xl p-8 max-w-sm text-center shadow-2xl border border-white/30">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-white/20 border-t-[#7dd3fc] animate-spin" />
                <ShieldCheck className="w-5 h-5 text-[#7dd3fc] absolute inset-0 m-auto" />
              </div>
              <h3 className="text-base font-bold text-[#fdfbf7] mb-1 font-mono">Reconstructing State...</h3>
              <p className="text-xs text-slate-300 font-mono">
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
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-2xl py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7dd3fc]" />
            <span className="font-bold text-[#fdfbf7] font-mono tracking-wider">SENTINEL</span>
            <span className="text-slate-600">—</span>
            <span className="text-slate-300">Evidence-first investigation layer for Web3</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="text-slate-400">Autonomous Protocol Security</span>
            <span>•</span>
            <span className="text-[#7dd3fc]">From Alert to Evidence</span>
            <span>•</span>
            <button onClick={() => setCurrentView('coverage')} className="hover:text-[#fdfbf7] transition underline">
              Coverage & Scope
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
