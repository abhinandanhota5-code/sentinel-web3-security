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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      
      <div className="w-full max-w-2xl bg-[#070e24] border-l border-slate-700/80 shadow-2xl h-full flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-slate-800 bg-[#040817]/90 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50">
                {finding.severity}
              </span>
              <span className="text-xs font-mono text-teal-400 font-semibold uppercase tracking-wider">
                EVIDENCE INSPECTOR // {finding.findingType}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">
              {finding.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('tripartite')}
            className={`py-3 px-4 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tripartite'
                ? 'border-teal-400 text-teal-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Observed / Inferred / Unknown</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_proof')}
            className={`py-3 px-4 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'raw_proof'
                ? 'border-indigo-400 text-indigo-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw RPC Proof & Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-4 text-xs font-mono font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'remediation'
                ? 'border-rose-400 text-rose-300 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Remediation & Action</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: TRIPARTITE REASONING */}
          {activeTab === 'tripartite' && (
            <div className="space-y-6">
              
              {/* Section 1: OBSERVED */}
              <div className="bg-slate-900/80 border-2 border-teal-500/40 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-teal-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>OBSERVED // VERIFIED FACTS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40">
                    Deterministic RPC Truth
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Facts directly proven through cryptographic signatures, EVM state mappings, or block receipts. These are 100% indisputable on-chain realities:
                </p>

                <ul className="space-y-2.5">
                  {finding.tripartite.observed.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-teal-400 font-mono font-bold shrink-0 mt-0.5">[{i + 1}]</span>
                      <span className="leading-relaxed font-mono">{obs}</span>
                    </li>
                  ))}
                </ul>

                {/* Evidence Details Box */}
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {finding.evidence.transactionHash && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Tx Hash:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-indigo-300 truncate max-w-[120px]">
                          {finding.evidence.transactionHash.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => handleCopy(finding.evidence.transactionHash!, 'tx')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedField === 'tx' ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {finding.evidence.blockNumber && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Block:</span>
                      <span className="text-slate-200">#{finding.evidence.blockNumber}</span>
                    </div>
                  )}

                  {finding.evidence.formattedAllowance && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between sm:col-span-2">
                      <span className="text-slate-400">Allowance Amount:</span>
                      <span className="text-rose-400 font-bold">{finding.evidence.formattedAllowance}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: INFERRED */}
              <div className="bg-slate-900/80 border-2 border-amber-500/40 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>INFERRED // DERIVED HYPOTHESIS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                    Logical Deduction
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Probabilistic or technical implications derived from verified facts. Describes what <em>can</em> occur given current bytecode execution logic:
                </p>

                <ul className="space-y-2.5">
                  {finding.tripartite.inferred.map((inf, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-amber-400 font-mono font-bold shrink-0 mt-0.5">↳</span>
                      <span className="leading-relaxed">{inf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: UNKNOWN */}
              <div className="bg-slate-900/80 border-2 border-purple-500/40 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-purple-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-sm">
                    <HelpCircle className="w-4 h-4" />
                    <span>UNKNOWN // EXPLICIT BOUNDARIES</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600/40">
                    Epistemic Boundary
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  What on-chain evidence alone <strong>cannot</strong> prove. Sentinel refuses to guess off-chain intentions or establish maliciousness without cryptographic signatures:
                </p>

                <ul className="space-y-2.5">
                  {finding.tripartite.unknown.map((unk, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-purple-400 font-mono font-bold shrink-0 mt-0.5">?</span>
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
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Database className="w-3.5 h-3.5" />
                    Verification Method: {finding.evidence.verificationMethod}
                  </span>
                  <span className="text-teal-400">Cryptographically Grounded</span>
                </div>

                {finding.evidence.contractAddress && (
                  <div className="mb-3">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Contract Address Under Audit</label>
                    <div className="bg-slate-900 p-2 rounded font-mono text-xs text-slate-200 break-all flex items-center justify-between">
                      <span>{finding.evidence.contractAddress}</span>
                      <button 
                        onClick={() => handleCopy(finding.evidence.contractAddress!, 'contract')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedField === 'contract' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {finding.evidence.stateSlot && (
                  <div className="mb-3">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">EVM Storage Slot / Mapping</label>
                    <div className="bg-slate-900 p-2 rounded font-mono text-xs text-teal-300 break-all">
                      {finding.evidence.stateSlot}
                    </div>
                  </div>
                )}

                {finding.evidence.rawCalldata && (
                  <div className="mb-3">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Raw Calldata Payload</label>
                    <div className="bg-slate-900 p-2 rounded font-mono text-xs text-slate-300 break-all max-h-32 overflow-y-auto">
                      {finding.evidence.rawCalldata}
                    </div>
                  </div>
                )}

                {finding.allowance && (
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Decoded Raw Allowance (uint256)</label>
                    <div className="bg-slate-900 p-2 rounded font-mono text-xs text-rose-300 break-all">
                      {finding.allowance}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON export */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">Full Evidence JSON Schema</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(finding, null, 2), 'json')}
                    className="text-xs font-mono text-teal-400 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-60">
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

          {/* TAB 3: REMEDIATION & ACTION */}
          {activeTab === 'remediation' && (
            <div className="space-y-4">
              <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-5">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Recommended Risk Elimination</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {finding.remediation?.actionText || 'Review authorizations and ensure unused allowances or roles are revoked.'}
                </p>

                {finding.remediation?.suggestedCalldata && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 block">
                      Generated Zero-Allowance Revoke Calldata:
                    </label>
                    <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-teal-300 break-all border border-slate-800 flex items-start justify-between gap-2">
                      <span>{finding.remediation.suggestedCalldata}</span>
                      <button
                        onClick={() => handleCopy(finding.remediation!.suggestedCalldata!, 'calldata')}
                        className="p-1 text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedField === 'calldata' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => alert(`Simulating on-chain transaction to revoke allowance... Target: ${finding.evidence.contractAddress}`)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs rounded-lg shadow-lg transition flex items-center gap-2"
                  >
                    <span>Simulate Revoke Tx</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-400">Zero gas estimation simulation</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
