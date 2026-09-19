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
  Database
} from 'lucide-react';
import type { Finding } from '../types/sentinel';

interface EvidenceDetailPanelProps {
  finding: Finding | null;
  onClose: () => void;
}

export const EvidenceDetailPanel: React.FC<EvidenceDetailPanelProps> = ({
  finding,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tripartite' | 'raw_proof' | 'remediation'>('tripartite');

  if (!finding) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#2e3440]/30 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      
      {/* Liquid Glass Drawer */}
      <div className="w-full max-w-2xl liquid-glass-strong border-l border-white/70 shadow-2xl h-full flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-[#171a1f]/8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-bad/12 text-bad border border-bad/25">
                {finding.severity}
              </span>
              <span className="text-xs text-ink-3 font-semibold uppercase tracking-wider">
                Evidence Inspector // {finding.findingType}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-ink leading-tight">
              {finding.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-ink-3 hover:text-ink bg-white/55 hover:bg-white/80 rounded-xl border border-[#171a1f]/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#171a1f]/8 bg-white/25 px-6">
          <button
            onClick={() => setActiveTab('tripartite')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tripartite'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Observed / Inferred / Unknown</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_proof')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'raw_proof'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw RPC Proofs & Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'remediation'
                ? 'border-accent text-accent bg-accent/10'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Action & Remediation</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: TRIPARTITE REASONING */}
          {activeTab === 'tripartite' && (
            <div className="space-y-4">
              
              {/* Section 1: OBSERVED */}
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-accent">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-accent font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>OBSERVED // VERIFIED FACTS</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/25 font-medium">
                    Deterministic RPC Truth
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.observed.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
                      <span className="text-accent font-bold shrink-0 mt-0.5">[{i + 1}]</span>
                      <span className="leading-relaxed">{obs}</span>
                    </li>
                  ))}
                </ul>

                {/* Evidence Details */}
                <div className="mt-3 pt-3 border-t border-[#171a1f]/8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  {finding.evidence.transactionHash && (
                    <div className="glass-well p-2 flex items-center justify-between">
                      <span className="text-ink-3">Tx Hash:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-accent truncate max-w-[120px]">
                          {finding.evidence.transactionHash.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => handleCopy(finding.evidence.transactionHash!, 'tx')}
                          className="text-ink-3 hover:text-ink"
                        >
                          {copiedField === 'tx' ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {finding.evidence.blockNumber && (
                    <div className="glass-well p-2 flex items-center justify-between">
                      <span className="text-ink-3">Block:</span>
                      <span className="text-ink-2 font-mono">#{finding.evidence.blockNumber}</span>
                    </div>
                  )}

                  {finding.evidence.formattedAllowance && (
                    <div className="glass-well p-2 flex items-center justify-between sm:col-span-2">
                      <span className="text-ink-3">Active Allowance:</span>
                      <span className="text-warn font-bold">{finding.evidence.formattedAllowance}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: INFERRED */}
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-warn">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-warn font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>INFERRED // DERIVED HYPOTHESIS</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-warn/12 text-warn border border-warn/25 font-medium">
                    Logical Deduction
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.inferred.map((inf, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
                      <span className="text-warn font-bold shrink-0 mt-0.5">↳</span>
                      <span className="leading-relaxed">{inf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: UNKNOWN */}
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-ink-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-ink-2 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-ink-3" />
                    <span>UNKNOWN // EXPLICIT BOUNDARIES</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/55 text-ink-2 border border-[#171a1f]/10 font-medium">
                    Epistemic Bound
                  </span>
                </div>

                <ul className="space-y-2">
                  {finding.tripartite.unknown.map((unk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-2 glass-well p-2.5">
                      <span className="text-ink-2 font-bold shrink-0 mt-0.5">?</span>
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
                <div className="flex items-center justify-between text-xs text-ink-2 mb-3">
                  <span className="flex items-center gap-1.5 text-accent">
                    <Database className="w-3.5 h-3.5" />
                    Method: {finding.evidence.verificationMethod}
                  </span>
                  <span className="text-accent text-[10px]">EVM State Grounded</span>
                </div>

                {finding.evidence.contractAddress && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">Contract Address Under Audit</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-ink-2 break-all flex items-center justify-between">
                      <span>{finding.evidence.contractAddress}</span>
                      <button 
                        onClick={() => handleCopy(finding.evidence.contractAddress!, 'contract')}
                        className="text-ink-3 hover:text-ink"
                      >
                        {copiedField === 'contract' ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {finding.evidence.stateSlot && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">EVM Storage Slot / Mapping</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-accent break-all">
                      {finding.evidence.stateSlot}
                    </div>
                  </div>
                )}

                {finding.evidence.rawCalldata && (
                  <div className="mb-3">
                    <label className="text-[10px] text-ink-3 block mb-1">Raw Calldata Payload</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-ink-2 break-all max-h-28 overflow-y-auto">
                      {finding.evidence.rawCalldata}
                    </div>
                  </div>
                )}

                {finding.allowance && (
                  <div>
                    <label className="text-[10px] text-ink-3 block mb-1">Decoded Raw Allowance (uint256)</label>
                    <div className="glass-well p-2.5 font-mono text-xs text-warn break-all">
                      {finding.allowance}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON export */}
              <div className="liquid-glass-subtle rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-ink-2">Structured Backend JSON Payload</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(finding, null, 2), 'json')}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'json' ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-ink-2 glass-well p-3 overflow-x-auto max-h-52">
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
              <div className="liquid-glass-subtle rounded-2xl p-5 border-l-4 border-l-accent">
                <div className="flex items-center gap-2 text-accent font-bold text-xs mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>ACTIONABLE REMEDIATION</span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed mb-4">
                  {finding.remediation?.actionText || 'Review authorizations and ensure unused allowances or roles are revoked.'}
                </p>

                {finding.remediation?.suggestedCalldata && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-ink-3 block">
                      Generated Zero-Allowance Revoke Calldata:
                    </label>
                    <div className="glass-well p-3 font-mono text-xs text-accent break-all flex items-start justify-between gap-2">
                      <span>{finding.remediation.suggestedCalldata}</span>
                      <button
                        onClick={() => handleCopy(finding.remediation!.suggestedCalldata!, 'calldata')}
                        className="p-1 text-ink-3 hover:text-ink shrink-0 cursor-pointer"
                      >
                        {copiedField === 'calldata' ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => alert(`Simulating on-chain transaction to revoke allowance... Target: ${finding.evidence.contractAddress}`)}
                    className="px-4 py-2 bg-accent hover:bg-[#4d6a8c] text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Simulate Revoke Tx</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-ink-3">Zero gas estimation check</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
