import { useState } from 'react';
import type { NetworkChainId, InvestigationReport } from './types/sentinel';
import { SentinelService, PRESET_COMPROMISED_WALLET, PRESET_MULTIPLI_PROTOCOL } from './services/sentinelApi';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { EvidenceGraph } from './components/EvidenceGraph';
import { ProtocolHealthView } from './components/ProtocolHealthView';
import { CoverageView } from './components/CoverageView';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'graph' | 'protocol' | 'coverage'>('landing');
  const [selectedChain, setSelectedChain] = useState<NetworkChainId>('ethereum');
  const [report, setReport] = useState<InvestigationReport>(PRESET_COMPROMISED_WALLET);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [failedAddress, setFailedAddress] = useState<string | null>(null);

  const handleInvestigate = async (address: string, chain: NetworkChainId = selectedChain) => {
    setIsLoading(true);
    setApiError(null);
    setFailedAddress(null);
    try {
      const result = await SentinelService.investigateAddress(address, chain);
      setReport(result);
      setSelectedChain(chain);
      setCurrentView('dashboard');
    } catch (err: unknown) {
      console.error('Investigation error:', err);
      const msg = err instanceof Error ? err.message : 'Analysis request failed';
      setApiError(msg);
      setFailedAddress(address);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (addressKey: string, chainHint?: NetworkChainId) => {
    setApiError(null);
    let chain: NetworkChainId = chainHint || 'ethereum';
    if (addressKey.includes('44d9a518')) chain = 'multipli';
    if (addressKey.includes('deadbeef')) chain = 'base';

    const presetReport = SentinelService.getPreset(addressKey, chain);
    setReport(presetReport);
    setSelectedChain(chain);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#051314] text-slate-100 flex flex-col selection:bg-[#2dd4bf] selection:text-[#042f2e] relative overflow-x-hidden ambient-mesh">
      
      {/* Luminous Ambient Liquid Mesh (Mixed Dark Green, Oceanic Teal, Warm Cream & Soft Blue) */}
      <div className="fixed top-[-15%] left-[18%] w-[58rem] h-[58rem] bg-[#064e3b]/24 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="fixed top-[12%] right-[-5%] w-[52rem] h-[52rem] bg-[#0f766e]/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[-5%] right-[25%] w-[48rem] h-[48rem] bg-[#fdfbf7]/16 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[5%] left-[-10%] w-[48rem] h-[48rem] bg-[#2dd4bf]/14 rounded-full blur-[170px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed top-[45%] left-[25%] w-[46rem] h-[46rem] bg-[#efe4d0]/14 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[54rem] h-[54rem] bg-[#0d3836]/22 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed bottom-[15%] right-[5%] w-[44rem] h-[44rem] bg-[#fde68a]/12 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-[65%] left-[-5%] w-[38rem] h-[38rem] bg-[#7dd3fc]/12 rounded-full blur-[150px] pointer-events-none -z-10" />

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
        {/* Global Error Banner (visible across views when investigation fails) */}
        {apiError && currentView !== 'landing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold font-mono text-rose-300 mr-2 uppercase tracking-wider">
                    Investigation Failed:
                  </span>
                  <span className="text-xs text-rose-200 font-mono">
                    {apiError}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {failedAddress && (
                  <button
                    type="button"
                    onClick={() => handleInvestigate(failedAddress, selectedChain)}
                    className="px-3 py-1 rounded-xl text-xs font-mono font-medium bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/50 text-rose-100 transition cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="p-1 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                  title="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 z-50 bg-[#051314]/65 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-150">
            <div className="liquid-glass-teal rounded-3xl p-8 max-w-sm text-center shadow-2xl border border-white/30">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-white/20 border-t-[#2dd4bf] animate-spin" />
                <ShieldCheck className="w-5 h-5 text-[#2dd4bf] absolute inset-0 m-auto" />
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
            onSelectPreset={handleQuickPreset}
            errorMessage={apiError}
            onClearError={() => setApiError(null)}
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
