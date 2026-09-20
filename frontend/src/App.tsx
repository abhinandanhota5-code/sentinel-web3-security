import { useState } from 'react';
import type { NetworkChainId, InvestigationReport } from './types/sentinel';
import { SentinelService, PRESET_COMPROMISED_WALLET } from './services/sentinelApi';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isWatchlisted,
} from './services/watchlist';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ProtocolHealthView } from './components/ProtocolHealthView';
import { WatchlistPanel } from './components/WatchlistPanel';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'protocol'>('landing');
  const [selectedChain, setSelectedChain] = useState<NetworkChainId>('ethereum');
  const [report, setReport] = useState<InvestigationReport>(PRESET_COMPROMISED_WALLET);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [failedAddress, setFailedAddress] = useState<string | null>(null);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlistRev, setWatchlistRev] = useState(0);
  void watchlistRev;

  const isWatched = isWatchlisted(report.targetAddress);
  const watchCount = getWatchlist().length;

  const toggleWatch = () => {
    const target = report.targetAddress;
    if (isWatchlisted(target)) {
      removeFromWatchlist(target);
    } else {
      addToWatchlist(target, report.chain.id, report.ensName || report.contractName);
    }
    setWatchlistRev((v) => v + 1);
  };

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

  const handleWatchAddress = (address: string, chain: NetworkChainId) => {
    setWatchlistOpen(false);
    handleInvestigate(address, chain);
  };

  return (
    <div className="min-h-screen text-ink flex flex-col relative overflow-x-hidden ambient-mesh">
      
      {/* Ambient environmental depth — deep blue/slate, very subtle (dark console) */}
      <div className="fixed top-[-15%] left-[18%] w-[58rem] h-[58rem] bg-[#3b82f6]/[0.05] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="fixed top-[12%] right-[-5%] w-[52rem] h-[52rem] bg-[#38bdf8]/[0.04] rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[45%] left-[25%] w-[46rem] h-[46rem] bg-[#1a2d47]/40 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[54rem] h-[54rem] bg-[#3b82f6]/[0.04] rounded-full blur-[170px] pointer-events-none -z-10" />

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
        onOpenWatchlist={() => setWatchlistOpen(true)}
        watchCount={watchCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Global Error Banner (visible across views when investigation fails) */}
        {apiError && currentView !== 'landing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 rounded-2xl bg-ink/5 border border-bad/25 text-ink-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-bad shrink-0" />
                <div>
                  <span className="text-xs font-bold text-bad mr-2 uppercase tracking-wider">
                    Investigation Failed:
                  </span>
                  <span className="text-xs text-ink-2">
                    {apiError}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {failedAddress && (
                  <button
                    type="button"
                    onClick={() => handleInvestigate(failedAddress, selectedChain)}
                    className="px-3 py-1 rounded-xl text-xs font-medium bg-bad/12 hover:bg-bad/20 border border-bad/30 text-bad transition cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="p-1 text-ink-3 hover:text-ink transition cursor-pointer"
                  title="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 z-50 bg-[#07111f]/70 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-150">
            <div className="liquid-glass rounded-3xl p-8 max-w-sm text-center">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--border-1)] border-t-accent animate-spin" />
                <ShieldCheck className="w-5 h-5 text-accent absolute inset-0 m-auto" />
              </div>
              <h3 className="text-base font-bold text-ink mb-1">Reconstructing State...</h3>
              <p className="text-xs text-ink-2">
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
            initialSection="overview"
            isWatched={isWatched}
            onToggleWatch={toggleWatch}
          />
        )}

        {currentView === 'protocol' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ProtocolHealthView
              health={report.protocolHealth}
              coverage={report.coverage}
            />
          </div>
        )}
      </main>

      {/* Global Watchlist drawer (local, client-side only) */}
      <WatchlistPanel
        open={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        onOpenAddress={handleWatchAddress}
        contextAddress={report?.targetAddress}
        contextChain={report?.chain.id}
      />

      {/* Floating Liquid Footer */}
      <footer className="border-t border-[var(--border-1)] bg-ink/5 py-6 text-xs text-ink-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="font-bold text-ink tracking-wider">SENTINEL</span>
            <span className="text-ink-3">—</span>
            <span className="text-ink-2">Evidence-first investigation layer for Web3</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-ink-3">
            <span>Autonomous Protocol Security</span>
            <span>•</span>
            <span className="text-ink-3">From Alert to Evidence</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
