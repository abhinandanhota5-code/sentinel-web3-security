import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  Terminal, 
  Copy, 
  Check, 
  ShieldAlert, 
  Layers, 
  ArrowRight,
  Database,
  ExternalLink,
  Search,
  Server
} from 'lucide-react';
import type { Finding } from '../types/sentinel';

interface EvidenceDetailPanelProps {
  finding: Finding | null;
  onClose: () => void;
  blockExplorerUrl?: string;
}

export const EvidenceDetailPanel: React.FC<EvidenceDetailPanelProps> = ({
  finding,
  onClose,
  blockExplorerUrl = 'https://etherscan.io',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'why_saying_this' | 'tripartite' | 'raw_proof' | 'remediation'>('why_saying_this');

  if (!finding) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const providerOrSource = finding.evidence.providerOrSource || 'security-engine:evm-storage';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      
      {/* Liquid Glass Drawer */}
      <div className="w-full max-w-2xl liquid-glass border-l border-white/25 shadow-2xl h-full flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-white/10 bg-black/40 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-white/10 text-rose-300 border border-rose-400/30">
                {finding.severity}
              </span>
              <span className="text-xs font-mono text-[#2dd4bf] font-semibold uppercase tracking-wider">
                EVIDENCE INSPECTOR // {finding.findingType}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#fdfbf7] leading-tight font-mono">
              {finding.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('why_saying_this')}
            className={`py-3 px-3.5 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'why_saying_this'
                ? 'border-[#2dd4bf] text-[#2dd4bf] bg-[#2dd4bf]/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Why are you saying this?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tripartite')}
            className={`py-3 px-3.5 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tripartite'
                ? 'border-[#bae6fd] text-[#bae6fd] bg-[#bae6fd]/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Observed / Inferred / Unknown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw_proof')}
            className={`py-3 px-3.5 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'raw_proof'
                ? 'border-[#fde68a] text-[#fde68a] bg-[#fde68a]/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw Proofs & Slots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-3.5 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'remediation'
                ? 'border-rose-400 text-rose-300 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Action & Remediation</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 0: WHY ARE YOU SAYING THIS? (SECTION 6 REQUIREMENT) */}
          {activeTab === 'why_saying_this' && (
            <div className="space-y-4">
              
              <div className="liquid-glass-teal rounded-2xl p-5 border-l-4 border-l-[#2dd4bf]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-[#fdfbf7] font-mono flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#2dd4bf]" />
                    <span>Deterministic Evidence Proof (Section 6)</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/40">
                    {finding.confidence}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-mono leading-relaxed mb-4">
                  {finding.summary}
                </p>

                {/* Structured Evidence Items */}
                <div className="space-y-2.5 text-xs font-mono">
                  
                  {/* Transaction Hash */}
                  {finding.evidence.transactionHash && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Transaction Hash:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#bae6fd]">
                          {finding.evidence.transactionHash.slice(0, 10)}...{finding.evidence.transactionHash.slice(-8)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(finding.evidence.transactionHash!, 'tx-hash')}
                          className="p-1 hover:text-white"
                        >
                          {copiedField === 'tx-hash' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`${blockExplorerUrl}/tx/${finding.evidence.transactionHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-[#bae6fd]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Block Number */}
                  {finding.evidence.blockNumber && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Block Number:</span>
                      <span className="text-[#fdfbf7] font-bold">
                        #{finding.evidence.blockNumber.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Contract Address */}
                  {finding.evidence.contractAddress && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Contract Address:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#93c5fd]">
                          {finding.evidence.contractAddress.slice(0, 8)}...{finding.evidence.contractAddress.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(finding.evidence.contractAddress!, 'contract-addr')}
                          className="p-1 hover:text-white"
                        >
                          {copiedField === 'contract-addr' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`${blockExplorerUrl}/address/${finding.evidence.contractAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-[#bae6fd]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Token Address */}
                  {(finding.token?.address || finding.evidence.token?.address) && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Token Address:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#fde68a]">
                          {finding.token?.symbol || 'Token'} ({(finding.token?.address || finding.evidence.token!.address).slice(0, 6)}...{(finding.token?.address || finding.evidence.token!.address).slice(-4)})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(finding.token?.address || finding.evidence.token!.address, 'token-addr')}
                          className="p-1 hover:text-white"
                        >
                          {copiedField === 'token-addr' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Allowance */}
                  {(finding.allowance || finding.evidence.allowanceAmount || finding.evidence.formattedAllowance) && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Allowance Amount:</span>
                      <span className="text-rose-300 font-bold">
                        {finding.evidence.formattedAllowance || finding.allowance || 'Unlimited'}
                      </span>
                    </div>
                  )}

                  {/* Owner / Admin */}
                  {finding.evidence.spender?.address && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">Spender / Admin Key:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#fca5a5]">
                          {finding.evidence.spender.address.slice(0, 8)}...{finding.evidence.spender.address.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(finding.evidence.spender!.address, 'spender-addr')}
                          className="p-1 hover:text-white"
                        >
                          {copiedField === 'spender-addr' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Implementation */}
                  {finding.evidence.stateSlot && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-400">EVM Storage Slot:</span>
                      <span className="text-[#2dd4bf] truncate max-w-[200px]">
                        {finding.evidence.stateSlot}
                      </span>
                    </div>
                  )}

                  {/* Provider / Source */}
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-400">Provider / Source:</span>
                    <span className="text-[#fdfbf7] font-semibold flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#2dd4bf]" />
                      <span>{providerOrSource}</span>
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 1: TRIPARTITE REASONING */}
          {activeTab === 'tripartite' && (
            <div className="space-y-4">
              
              {/* Section 1: OBSERVED */}
              <div className="liquid-glass-teal rounded-2xl p-5 border-l-4 border-l-[#2dd4bf]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-[#2dd4bf] font-mono font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>OBSERVED // VERIFIED FACTS</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
                    Deterministic RPC Truth
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.observed.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl border border-white/10 font-mono">
                      <span className="text-[#2dd4bf] font-bold shrink-0 mt-0.5">[{i + 1}]</span>
                      <span className="leading-relaxed">{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 2: INFERRED */}
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-[#fde68a]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-[#fde68a] font-mono font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>INFERRED // DERIVED HYPOTHESIS</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#fef3c7]/20 text-[#fde68a] border border-[#fde68a]/30">
                    Logical Deduction
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.inferred.map((inf, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl border border-white/10 font-mono">
                      <span className="text-[#fde68a] font-bold shrink-0 mt-0.5">↳</span>
                      <span className="leading-relaxed">{inf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: UNKNOWN */}
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-[#cbd5e1]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-[#fdfbf7] font-mono font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-slate-300" />
                    <span>UNKNOWN // EXPLICIT BOUNDARIES</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#fdfbf7] border border-white/20">
                    Epistemic Bound
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.unknown.map((unk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl border border-white/10 font-mono">
                      <span className="text-[#cbd5e1] font-bold shrink-0 mt-0.5">?</span>
                      <span className="leading-relaxed">{unk}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: RAW PROOF & SLOTS */}
          {activeTab === 'raw_proof' && (
            <div className="space-y-4">
              <div className="liquid-glass-subtle rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-3">
                  <span className="flex items-center gap-1.5 text-[#bae6fd]">
                    <Database className="w-3.5 h-3.5" />
                    Method: {finding.evidence.verificationMethod}
                  </span>
                  <span className="text-[#2dd4bf] text-[10px]">EVM State Grounded</span>
                </div>

                {finding.evidence.contractAddress && (
                  <div className="mb-3">
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">Contract Address Under Audit</label>
                    <div className="bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl font-mono text-xs text-slate-200 break-all flex items-center justify-between border border-white/10">
                      <span>{finding.evidence.contractAddress}</span>
                      <button 
                        type="button"
                        onClick={() => handleCopy(finding.evidence.contractAddress!, 'contract')}
                        className="text-slate-300 hover:text-white"
                      >
                        {copiedField === 'contract' ? <Check className="w-3.5 h-3.5 text-[#2dd4bf]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {finding.evidence.stateSlot && (
                  <div className="mb-3">
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">EVM Storage Slot / Mapping</label>
                    <div className="bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl font-mono text-xs text-[#2dd4bf] break-all border border-white/10">
                      {finding.evidence.stateSlot}
                    </div>
                  </div>
                )}

                {finding.evidence.rawCalldata && (
                  <div className="mb-3">
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">Raw Calldata Payload</label>
                    <div className="bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl font-mono text-xs text-slate-200 break-all max-h-28 overflow-y-auto border border-white/10">
                      {finding.evidence.rawCalldata}
                    </div>
                  </div>
                )}

                {finding.allowance && (
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">Decoded Raw Allowance (uint256)</label>
                    <div className="bg-white/[0.06] backdrop-blur-md p-2.5 rounded-xl font-mono text-xs text-rose-300 break-all border border-white/10">
                      {finding.allowance}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON export */}
              <div className="liquid-glass-subtle rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-300">Structured Backend JSON Payload</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(finding, null, 2), 'json')}
                    className="text-xs font-mono text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'json' ? <Check className="w-3 h-3 text-[#2dd4bf]" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-200 bg-white/[0.06] backdrop-blur-md p-3 rounded-xl overflow-x-auto max-h-52 border border-white/10">
                  {JSON.stringify({
                    findingType: finding.findingType,
                    status: finding.confidence,
                    severity: finding.severity,
                    token: finding.token,
                    spender: finding.spender,
                    allowance: finding.allowance,
                    evidence: finding.evidence,
                    tripartite: finding.tripartite
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: REMEDIATION */}
          {activeTab === 'remediation' && (
            <div className="space-y-4">
              <div className="liquid-glass-teal rounded-2xl p-5 border-l-4 border-l-[#2dd4bf]">
                <div className="flex items-center gap-2 text-[#2dd4bf] font-bold text-xs font-mono mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>ACTIONABLE REMEDIATION</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {finding.remediation?.actionText || 'Review authorizations and ensure unused allowances or roles are revoked.'}
                </p>

                {finding.remediation?.suggestedCalldata && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-300 block">
                      Generated Zero-Allowance Revoke Calldata:
                    </label>
                    <div className="bg-white/[0.06] backdrop-blur-md p-3 rounded-xl font-mono text-xs text-[#2dd4bf] break-all border border-white/10 flex items-start justify-between gap-2">
                      <span>{finding.remediation.suggestedCalldata}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(finding.remediation!.suggestedCalldata!, 'calldata')}
                        className="p-1 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                      >
                        {copiedField === 'calldata' ? <Check className="w-3.5 h-3.5 text-[#2dd4bf]" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
