import React, { useState } from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  TrendingUp
} from 'lucide-react';
import type { GraphNode, GraphEdge } from '../types/sentinel';

interface EvidenceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ nodes, edges }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'INFERRED'>('ALL');

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'WALLET':
        return {
          border: 'border-teal-400',
          bg: 'bg-teal-950/80',
          text: 'text-teal-300',
          badge: 'bg-teal-900/60 text-teal-300 border-teal-500/40',
        };
      case 'TOKEN':
        return {
          border: 'border-amber-400',
          bg: 'bg-amber-950/80',
          text: 'text-amber-300',
          badge: 'bg-amber-900/60 text-amber-300 border-amber-500/40',
        };
      case 'SPENDER':
        return {
          border: 'border-purple-400',
          bg: 'bg-purple-950/80',
          text: 'text-purple-300',
          badge: 'bg-purple-900/60 text-purple-300 border-purple-500/40',
        };
      case 'ADMIN':
        return {
          border: 'border-rose-400',
          bg: 'bg-rose-950/80',
          text: 'text-rose-300',
          badge: 'bg-rose-900/60 text-rose-300 border-rose-500/40',
        };
      case 'IMPLEMENTATION':
        return {
          border: 'border-indigo-400',
          bg: 'bg-indigo-950/80',
          text: 'text-indigo-300',
          badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/40',
        };
      case 'ORACLE':
        return {
          border: 'border-cyan-400',
          bg: 'bg-cyan-950/80',
          text: 'text-cyan-300',
          badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/40',
        };
      default:
        return {
          border: 'border-slate-500',
          bg: 'bg-slate-900',
          text: 'text-slate-300',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
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
    <div className="glass-panel rounded-xl p-6 mb-10 border-slate-700/80 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase bg-teal-950/60 border border-teal-500/40 text-teal-300 mb-1">
            Visual Provenance // Epistemic Graph
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <span>Interactive Evidence Graph</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Every edge in this graph represents a concrete blockchain link. Solid lines are verified direct evidence; dashed lines denote inferred threat pathways.
          </p>
        </div>

        {/* Legend / Filter */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-mono rounded transition ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            All Edges ({edges.length})
          </button>

          <button
            onClick={() => setFilterType('DIRECT')}
            className={`px-3 py-1 text-xs font-mono rounded transition flex items-center gap-1.5 ${
              filterType === 'DIRECT'
                ? 'bg-teal-600 text-white font-semibold'
                : 'bg-slate-900 text-teal-400 border border-slate-800 hover:text-teal-300'
            }`}
          >
            <span className="w-3 h-0.5 bg-teal-400 inline-block"></span>
            <span>Direct Evidence</span>
          </button>

          <button
            onClick={() => setFilterType('INFERRED')}
            className={`px-3 py-1 text-xs font-mono rounded transition flex items-center gap-1.5 ${
              filterType === 'INFERRED'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-900 text-amber-400 border border-slate-800 hover:text-amber-300'
            }`}
          >
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-400 inline-block"></span>
            <span>Inferred Risk</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="bg-[#030614] border border-slate-800 rounded-xl p-6 min-h-[440px] relative overflow-hidden flex flex-col justify-between">
        
        {/* Subtle graph grid background */}
        <div className="absolute inset-0 cyber-grid opacity-50 pointer-events-none" />

        {/* Nodes Layout (Flexible Visual Matrix) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                className={`p-4 rounded-xl border-2 transition cursor-pointer glass-card-hover ${style.bg} ${
                  isSelected ? 'border-white shadow-xl shadow-indigo-500/20 scale-105' : style.border
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}>
                    {node.type}
                  </span>
                  {node.isTarget && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-500 rounded">
                      TARGET
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white mb-0.5 truncate">
                  {node.label}
                </div>

                {node.sublabel && (
                  <div className="text-xs font-mono text-slate-300 truncate mb-2">
                    {node.sublabel}
                  </div>
                )}

                {node.badge && (
                  <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800 truncate">
                    {node.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edges Flow Stream */}
        <div className="relative z-10 border-t border-slate-800/80 pt-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Graph Relationship Matrix ({filteredEdges.length} verified connections)</span>
            <span className="text-[11px] text-teal-400 font-normal">Click any edge to inspect provenance</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-slate-900 border-teal-400 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Nodes connection banner */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">
                      {sourceNode?.label || edge.source}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 ${
                      isDirect 
                        ? 'bg-teal-950 text-teal-300 border border-teal-500/40' 
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isDirect ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <TrendingUp className="w-3 h-3 text-amber-400" />}
                      <span>{edge.relationship}</span>
                    </span>

                    <span className="font-bold text-slate-200">
                      {targetNode?.label || edge.target}
                    </span>
                  </div>

                  {/* Supporting Evidence Detail */}
                  {edge.evidenceRef && (
                    <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800/80">
                      <span className="text-teal-400 font-semibold">Evidence: </span>
                      {edge.evidenceRef}
                    </div>
                  )}

                  {edge.transactionHash && (
                    <div className="text-[10px] font-mono text-indigo-400 flex items-center justify-between">
                      <span>Tx: {edge.transactionHash.slice(0, 12)}...{edge.transactionHash.slice(-8)}</span>
                      <span className="text-slate-400">Direct on-chain receipt</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspector Detail Drawer when Node/Edge Selected */}
        {(selectedNode || selectedEdge) && (
          <div className="relative z-10 mt-6 p-4 rounded-xl bg-slate-900 border border-slate-700 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
                Graph Inspector // {selectedNode ? `Node: ${selectedNode.label}` : `Edge: ${selectedEdge?.relationship}`}
              </span>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Inspector ✕
              </button>
            </div>

            {selectedNode && (
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>Type: <span className="text-white font-bold">{selectedNode.type}</span></div>
                <div>Entity: <span className="text-white">{selectedNode.label}</span></div>
                {selectedNode.sublabel && <div>Address/Slot: <span className="text-teal-300">{selectedNode.sublabel}</span></div>}
                {selectedNode.badge && <div>Security Posture: <span className="text-amber-300">{selectedNode.badge}</span></div>}
              </div>
            )}

            {selectedEdge && (
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>Relationship: <span className="text-white font-bold">{selectedEdge.relationship}</span></div>
                <div>Confidence Class: <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-teal-300' : 'text-amber-300'}>
                  {selectedEdge.relationshipType}
                </span></div>
                <div>Supporting Fact: <span className="text-white">{selectedEdge.evidenceRef}</span></div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
