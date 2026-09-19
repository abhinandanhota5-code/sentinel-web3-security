import React, { useState } from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  TrendingUp, 
  ExternalLink, 
  Copy, 
  Check, 
  Search,
  Layers
} from 'lucide-react';
import type { GraphNode, GraphEdge } from '../types/sentinel';

interface EvidenceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  blockExplorerUrl?: string;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ 
  nodes, 
  edges,
  blockExplorerUrl = 'https://etherscan.io',
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'INFERRED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'WALLET':
        return {
          border: 'border-white/15',
          bg: 'bg-white/[0.04]',
          text: 'text-slate-200',
          badge: 'bg-white/10 text-slate-200 border-white/15',
        };
      case 'TOKEN':
        return {
          border: 'border-[#5B7FA6]/30',
          bg: 'bg-[#5B7FA6]/10',
          text: 'text-[#9ac2e8]',
          badge: 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30',
        };
      case 'SPENDER':
        return {
          border: 'border-[#5B7FA6]/30',
          bg: 'bg-[#5B7FA6]/10',
          text: 'text-[#9ac2e8]',
          badge: 'bg-[#5B7FA6]/15 text-[#9ac2e8] border-[#5B7FA6]/30',
        };
      case 'CONTRACT':
        return {
          border: 'border-slate-500/30',
          bg: 'bg-slate-500/10',
          text: 'text-slate-200',
          badge: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
        };
      case 'ADMIN':
        return {
          border: 'border-[#A45F5F]/30',
          bg: 'bg-[#A45F5F]/10',
          text: 'text-[#d97f7f]',
          badge: 'bg-[#A45F5F]/15 text-[#d97f7f] border-[#A45F5F]/30',
        };
      case 'IMPLEMENTATION':
        return {
          border: 'border-[#9A7A4A]/30',
          bg: 'bg-[#9A7A4A]/10',
          text: 'text-[#dfba82]',
          badge: 'bg-[#9A7A4A]/15 text-[#dfba82] border-[#9A7A4A]/30',
        };
      case 'ORACLE':
        return {
          border: 'border-slate-400/25',
          bg: 'bg-white/[0.04]',
          text: 'text-slate-300',
          badge: 'bg-white/10 text-slate-300 border-white/15',
        };
      default:
        return {
          border: 'border-white/15',
          bg: 'bg-white/[0.04]',
          text: 'text-slate-300',
          badge: 'bg-white/10 text-slate-300 border-white/15',
        };
    }
  };

  const filteredEdges = edges.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'DIRECT') return e.relationshipType === 'DIRECT_EVIDENCE';
    if (filterType === 'INFERRED') return e.relationshipType === 'INFERRED';
    return true;
  });

  return (
    <div className="liquid-glass rounded-2xl p-5 sm:p-6 mb-10 shadow-2xl relative overflow-hidden border border-white/15">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#9ac2e8] mb-1.5 border border-[#5B7FA6]/30 bg-[#5B7FA6]/15">
            Visual Provenance (Section 7)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#88b0d8]" />
            <span>Structured Evidence Graph</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Cryptographically structured relationships: Wallet, Token, Spender, Contract, Admin, and Implementation. Only structured backend relationships are rendered.
          </p>
        </div>

        {/* Legend Filters */}
        <div className="flex items-center gap-1.5 liquid-glass-subtle p-1 rounded-xl self-start border border-white/10">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({edges.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('DIRECT')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              filterType === 'DIRECT'
                ? 'bg-[#5E806A]/15 text-[#8cc4a1] font-semibold border border-[#5E806A]/30 shadow-sm'
                : 'text-slate-400 hover:text-[#8cc4a1]'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#5E806A] inline-block" />
            <span>Direct Evidence</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('INFERRED')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              filterType === 'INFERRED'
                ? 'bg-[#9A7A4A]/15 text-[#dfba82] font-semibold border border-[#9A7A4A]/30 shadow-sm'
                : 'text-slate-400 hover:text-[#dfba82]'
            }`}
          >
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-[#9A7A4A] inline-block" />
            <span>Inferred Risk</span>
          </button>
        </div>
      </div>

      {/* Main Graph Arena */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-5 sm:p-6 min-h-[420px] relative overflow-hidden flex flex-col justify-between backdrop-blur-2xl">
        
        {/* Subtle ambient mesh backdrop */}
        <div className="absolute inset-0 ambient-mesh opacity-20 pointer-events-none" />

        {/* Nodes Capsules */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {nodes.map((node) => {
            const style = getNodeColor(node.type);
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                className={`liquid-glass-subtle p-3.5 rounded-xl border transition cursor-pointer liquid-card-hover ${style.bg} ${
                  isSelected ? 'border-white shadow-xl shadow-black/40 scale-[1.02]' : style.border
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold tracking-wider uppercase border ${style.badge}`}>
                    {node.type}
                  </span>
                  {node.isTarget && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#5B7FA6]/20 text-[#9ac2e8] border border-[#5B7FA6]/30 rounded-md font-semibold">
                      TARGET
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono font-semibold text-white truncate mb-0.5">
                  {node.label}
                </div>

                {node.sublabel && (
                  <div className="text-[10px] font-mono text-slate-300 truncate mb-1.5">
                    {node.sublabel}
                  </div>
                )}

                {node.address && (
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {node.address.slice(0, 6)}...{node.address.slice(-4)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edges List */}
        <div className="relative z-10 border-t border-white/10 pt-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
            <span>Structured Backend Relationships ({filteredEdges.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Click edge to view state proof</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEdges.map((edge) => {
              const isDirect = edge.relationshipType === 'DIRECT_EVIDENCE';
              const isSelected = selectedEdge?.id === edge.id;
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);

              return (
                <div
                  key={edge.id}
                  onClick={() => {
                    setSelectedEdge(edge);
                    setSelectedNode(null);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'liquid-glass border-[#5B7FA6]/60 shadow-lg'
                      : 'liquid-glass-subtle hover:border-white/20 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200 truncate max-w-[90px]">
                      {sourceNode?.label || edge.source}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-semibold tracking-wide flex items-center gap-1 shrink-0 ${
                      isDirect 
                        ? 'bg-[#5E806A]/15 text-[#8cc4a1] border border-[#5E806A]/30' 
                        : 'bg-[#9A7A4A]/15 text-[#dfba82] border border-[#9A7A4A]/30'
                    }`}>
                      {isDirect ? <CheckCircle2 className="w-3 h-3 text-[#8cc4a1]" /> : <TrendingUp className="w-3 h-3 text-[#dfba82]" />}
                      <span>{edge.relationship}</span>
                    </span>

                    <span className="font-semibold text-slate-200 truncate max-w-[90px]">
                      {targetNode?.label || edge.target}
                    </span>
                  </div>

                  {edge.evidenceRef && (
                    <div className="text-[10px] text-slate-300 font-mono bg-white/[0.03] p-2 rounded-lg border border-white/10">
                      <span className="text-[#88b0d8] font-medium">Proof: </span>
                      {edge.evidenceRef}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Inspector Bar */}
        {(selectedNode || selectedEdge) && (
          <div className="relative z-10 mt-5 p-4 rounded-xl liquid-glass border border-white/15 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#88b0d8] font-semibold">
                {selectedNode ? `Node: ${selectedNode.label}` : `Relationship: ${selectedEdge?.relationship}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {selectedNode && (
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <div>Type: <span className="text-white font-medium">{selectedNode.type}</span></div>
                {selectedNode.sublabel && <div>Role: <span className="text-slate-200">{selectedNode.sublabel}</span></div>}
                {selectedNode.address && (
                  <div className="flex items-center gap-1.5">
                    <span>Address: </span>
                    <span className="text-slate-100">{selectedNode.address}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedNode.address!, 'node-addr')}
                      className="p-1 hover:text-white"
                    >
                      {copiedId === 'node-addr' ? <Check className="w-3 h-3 text-[#8cc4a1]" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <a
                      href={`${blockExplorerUrl}/address/${selectedNode.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selectedNode.badge && <div>State Attribute: <span className="text-[#dfba82]">{selectedNode.badge}</span></div>}
              </div>
            )}

            {selectedEdge && (
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <div>Edge: <span className="text-white font-medium">{selectedEdge.relationship}</span></div>
                <div>Confidence: <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-[#8cc4a1]' : 'text-[#dfba82]'}>
                  {selectedEdge.relationshipType}
                </span></div>
                {selectedEdge.evidenceRef && (
                  <div>Supporting Fact: <span className="text-slate-200">{selectedEdge.evidenceRef}</span></div>
                )}
                {selectedEdge.transactionHash && (
                  <div>Transaction: <span className="text-[#88b0d8]">{selectedEdge.transactionHash}</span></div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
