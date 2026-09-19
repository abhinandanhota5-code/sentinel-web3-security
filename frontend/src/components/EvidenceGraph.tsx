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
          border: 'border-teal-400/50',
          bg: 'bg-teal-500/10',
          text: 'text-teal-300',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        };
      case 'TOKEN':
        return {
          border: 'border-amber-400/50',
          bg: 'bg-amber-500/10',
          text: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'SPENDER':
        return {
          border: 'border-purple-400/50',
          bg: 'bg-purple-500/10',
          text: 'text-purple-300',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'ADMIN':
        return {
          border: 'border-rose-400/50',
          bg: 'bg-rose-500/10',
          text: 'text-rose-300',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'IMPLEMENTATION':
        return {
          border: 'border-indigo-400/50',
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-300',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        };
      case 'ORACLE':
        return {
          border: 'border-cyan-400/50',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      default:
        return {
          border: 'border-slate-500/50',
          bg: 'bg-slate-800/20',
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
    <div className="liquid-glass rounded-2xl p-6 mb-10 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-indigo-300 mb-1">
            Visual Provenance
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <span>Interactive Evidence Graph</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            Every edge connects verified state facts. Solid lines represent direct on-chain evidence; dashed lines denote inferred threat pathways.
          </p>
        </div>

        {/* Legend Filters */}
        <div className="flex items-center gap-1.5 liquid-glass-subtle p-1 rounded-xl self-start">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition ${
              filterType === 'ALL'
                ? 'bg-white/15 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({edges.length})
          </button>

          <button
            onClick={() => setFilterType('DIRECT')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'DIRECT'
                ? 'bg-teal-500/25 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-teal-300'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-teal-400 inline-block"></span>
            <span>Direct Evidence</span>
          </button>

          <button
            onClick={() => setFilterType('INFERRED')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'INFERRED'
                ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-amber-400 inline-block"></span>
            <span>Inferred Risk</span>
          </button>
        </div>
      </div>

      {/* Main Graph Arena */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 min-h-[420px] relative overflow-hidden flex flex-col justify-between backdrop-blur-xl">
        
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />

        {/* Nodes Capsules */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                className={`liquid-glass-subtle p-4 rounded-2xl border transition cursor-pointer liquid-card-hover ${style.bg} ${
                  isSelected ? 'border-white shadow-xl shadow-teal-500/20 scale-105' : style.border
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}>
                    {node.type}
                  </span>
                  {node.isTarget && (
                    <span className="px-1.5 py-0.2 text-[8px] font-mono bg-teal-500/30 text-teal-300 border border-teal-500/50 rounded-md">
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
                  <div className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-lg border border-white/5 truncate">
                    {node.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edges List */}
        <div className="relative z-10 border-t border-white/10 pt-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Verified Connections ({filteredEdges.length})</span>
            <span className="text-[10px] text-teal-400 font-normal">Click edge to view state proof</span>
          </div>

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
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'liquid-glass border-teal-400 shadow-lg'
                      : 'liquid-glass-subtle hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">
                      {sourceNode?.label || edge.source}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wide flex items-center gap-1 ${
                      isDirect 
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isDirect ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <TrendingUp className="w-3 h-3 text-amber-400" />}
                      <span>{edge.relationship}</span>
                    </span>

                    <span className="font-bold text-slate-200">
                      {targetNode?.label || edge.target}
                    </span>
                  </div>

                  {edge.evidenceRef && (
                    <div className="text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-teal-400 font-semibold">Evidence: </span>
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
          <div className="relative z-10 mt-5 p-4 rounded-xl liquid-glass border border-white/20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-300 font-bold">
                {selectedNode ? `Node: ${selectedNode.label}` : `Edge: ${selectedEdge?.relationship}`}
              </span>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            {selectedNode && (
              <div className="text-xs text-slate-300 font-mono space-y-0.5">
                <div>Type: <span className="text-white font-bold">{selectedNode.type}</span></div>
                {selectedNode.sublabel && <div>Target: <span className="text-teal-300">{selectedNode.sublabel}</span></div>}
                {selectedNode.badge && <div>State Attribute: <span className="text-amber-300">{selectedNode.badge}</span></div>}
              </div>
            )}

            {selectedEdge && (
              <div className="text-xs text-slate-300 font-mono space-y-0.5">
                <div>Relationship: <span className="text-white font-bold">{selectedEdge.relationship}</span></div>
                <div>Confidence: <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-teal-300' : 'text-amber-300'}>
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
