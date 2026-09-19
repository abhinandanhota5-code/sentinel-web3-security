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
          border: 'border-[#a7f3d0]/40',
          bg: 'bg-[#a7f3d0]/10',
          text: 'text-[#a7f3d0]',
          badge: 'bg-[#a7f3d0]/15 text-[#a7f3d0] border-[#a7f3d0]/30',
        };
      case 'TOKEN':
        return {
          border: 'border-[#fed7aa]/40',
          bg: 'bg-[#fed7aa]/10',
          text: 'text-[#fed7aa]',
          badge: 'bg-[#fed7aa]/15 text-[#fed7aa] border-[#fed7aa]/30',
        };
      case 'SPENDER':
        return {
          border: 'border-[#d8b4fe]/40',
          bg: 'bg-[#d8b4fe]/10',
          text: 'text-[#d8b4fe]',
          badge: 'bg-[#d8b4fe]/15 text-[#d8b4fe] border-[#d8b4fe]/30',
        };
      case 'ADMIN':
        return {
          border: 'border-[#fca5a5]/40',
          bg: 'bg-[#fca5a5]/10',
          text: 'text-[#fca5a5]',
          badge: 'bg-[#fca5a5]/15 text-[#fca5a5] border-[#fca5a5]/30',
        };
      case 'IMPLEMENTATION':
        return {
          border: 'border-[#c4b5fd]/40',
          bg: 'bg-[#c4b5fd]/10',
          text: 'text-[#c4b5fd]',
          badge: 'bg-[#c4b5fd]/15 text-[#c4b5fd] border-[#c4b5fd]/30',
        };
      case 'ORACLE':
        return {
          border: 'border-[#bae6fd]/40',
          bg: 'bg-[#bae6fd]/10',
          text: 'text-[#bae6fd]',
          badge: 'bg-[#bae6fd]/15 text-[#bae6fd] border-[#bae6fd]/30',
        };
      default:
        return {
          border: 'border-[#e6ded6]/30',
          bg: 'bg-[#e6ded6]/5',
          text: 'text-stone-300',
          badge: 'bg-stone-800/60 text-stone-300 border-stone-700',
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
    <div className="liquid-glass rounded-3xl p-6 mb-10 shadow-2xl relative overflow-hidden border border-[#e6ded6]/15">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] font-mono tracking-wider uppercase text-[#d8b4fe] mb-1">
            Visual Provenance
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#d8b4fe]" />
            <span>Interactive Evidence Graph</span>
          </h2>
          <p className="text-xs text-stone-400 max-w-xl mt-0.5">
            Every edge connects verified state facts. Solid lines represent direct on-chain evidence; dashed lines denote inferred threat pathways.
          </p>
        </div>

        {/* Legend Filters */}
        <div className="flex items-center gap-1.5 liquid-glass-subtle p-1 rounded-xl self-start border border-[#e6ded6]/15">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition ${
              filterType === 'ALL'
                ? 'bg-stone-100/15 text-stone-100 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All ({edges.length})
          </button>

          <button
            onClick={() => setFilterType('DIRECT')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'DIRECT'
                ? 'bg-[#a7f3d0]/20 text-[#a7f3d0] font-bold border border-[#a7f3d0]/40 shadow-sm'
                : 'text-stone-400 hover:text-[#a7f3d0]'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#a7f3d0] inline-block"></span>
            <span>Direct Evidence</span>
          </button>

          <button
            onClick={() => setFilterType('INFERRED')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'INFERRED'
                ? 'bg-[#fed7aa]/20 text-[#fed7aa] font-bold border border-[#fed7aa]/40 shadow-sm'
                : 'text-stone-400 hover:text-[#fed7aa]'
            }`}
          >
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-[#fed7aa] inline-block"></span>
            <span>Inferred Risk</span>
          </button>
        </div>
      </div>

      {/* Main Graph Arena */}
      <div className="bg-black/35 border border-[#e6ded6]/10 rounded-2xl p-6 min-h-[420px] relative overflow-hidden flex flex-col justify-between backdrop-blur-xl">
        
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
                  isSelected ? 'border-white shadow-xl shadow-[#a7f3d0]/20 scale-105' : style.border
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}>
                    {node.type}
                  </span>
                  {node.isTarget && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#a7f3d0]/25 text-[#a7f3d0] border border-[#a7f3d0]/40 rounded-md">
                      TARGET
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-stone-100 mb-0.5 truncate">
                  {node.label}
                </div>

                {node.sublabel && (
                  <div className="text-xs font-mono text-stone-300 truncate mb-2">
                    {node.sublabel}
                  </div>
                )}

                {node.badge && (
                  <div className="text-[10px] font-mono text-stone-400 bg-black/40 px-2 py-1 rounded-lg border border-white/5 truncate">
                    {node.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edges List */}
        <div className="relative z-10 border-t border-white/10 pt-5">
          <div className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3 flex items-center justify-between">
            <span>Verified Connections ({filteredEdges.length})</span>
            <span className="text-[10px] text-[#a7f3d0] font-normal">Click edge to view state proof</span>
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
                      ? 'liquid-glass border-[#a7f3d0]/60 shadow-lg'
                      : 'liquid-glass-subtle hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-stone-200">
                      {sourceNode?.label || edge.source}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wide flex items-center gap-1 ${
                      isDirect 
                        ? 'bg-[#a7f3d0]/15 text-[#a7f3d0] border border-[#a7f3d0]/30' 
                        : 'bg-[#fed7aa]/15 text-[#fed7aa] border border-[#fed7aa]/30'
                    }`}>
                      {isDirect ? <CheckCircle2 className="w-3 h-3 text-[#a7f3d0]" /> : <TrendingUp className="w-3 h-3 text-[#fed7aa]" />}
                      <span>{edge.relationship}</span>
                    </span>

                    <span className="font-bold text-stone-200">
                      {targetNode?.label || edge.target}
                    </span>
                  </div>

                  {edge.evidenceRef && (
                    <div className="text-[10px] text-stone-400 font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-[#a7f3d0] font-semibold">Evidence: </span>
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
          <div className="relative z-10 mt-5 p-4 rounded-2xl liquid-glass border border-[#e6ded6]/20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#a7f3d0] font-bold">
                {selectedNode ? `Node: ${selectedNode.label}` : `Edge: ${selectedEdge?.relationship}`}
              </span>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs font-mono text-stone-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            {selectedNode && (
              <div className="text-xs text-stone-300 font-mono space-y-0.5">
                <div>Type: <span className="text-white font-bold">{selectedNode.type}</span></div>
                {selectedNode.sublabel && <div>Target: <span className="text-[#a7f3d0]">{selectedNode.sublabel}</span></div>}
                {selectedNode.badge && <div>State Attribute: <span className="text-[#fed7aa]">{selectedNode.badge}</span></div>}
              </div>
            )}

            {selectedEdge && (
              <div className="text-xs text-stone-300 font-mono space-y-0.5">
                <div>Relationship: <span className="text-white font-bold">{selectedEdge.relationship}</span></div>
                <div>Confidence: <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-[#a7f3d0]' : 'text-[#fed7aa]'}>
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
