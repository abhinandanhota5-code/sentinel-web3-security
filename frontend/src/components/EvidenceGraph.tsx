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
          border: 'border-accent/35',
          bg: 'bg-accent/8',
          text: 'text-accent',
          badge: 'bg-accent/12 text-accent border-accent/25',
        };
      case 'TOKEN':
        return {
          border: 'border-warn/35',
          bg: 'bg-warn/8',
          text: 'text-warn',
          badge: 'bg-warn/12 text-warn border-warn/25',
        };
      case 'SPENDER':
        return {
          border: 'border-bad/35',
          bg: 'bg-bad/8',
          text: 'text-bad',
          badge: 'bg-bad/12 text-bad border-bad/25',
        };
      case 'ADMIN':
        return {
          border: 'border-bad/35',
          bg: 'bg-bad/8',
          text: 'text-bad',
          badge: 'bg-bad/12 text-bad border-bad/25',
        };
      case 'IMPLEMENTATION':
        return {
          border: 'border-accent/35',
          bg: 'bg-accent/8',
          text: 'text-accent',
          badge: 'bg-accent/12 text-accent border-accent/25',
        };
      case 'ORACLE':
        return {
          border: 'border-[#171a1f]/12',
          bg: 'bg-white/40',
          text: 'text-ink-2',
          badge: 'bg-white/55 text-ink-2 border-[#171a1f]/10',
        };
      default:
        return {
          border: 'border-[#171a1f]/12',
          bg: 'bg-white/40',
          text: 'text-ink-2',
          badge: 'bg-white/55 text-ink-2 border-[#171a1f]/10',
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
    <div className="liquid-glass rounded-3xl p-6 mb-10 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-accent mb-1 font-medium">
            Visual Provenance
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent-deep" />
            <span>Interactive Evidence Graph</span>
          </h2>
          <p className="text-xs text-ink-2 max-w-xl mt-0.5">
            Every edge connects verified state facts. Solid lines represent direct on-chain evidence; dashed lines denote inferred threat pathways.
          </p>
        </div>

        {/* Legend Filters */}
        <div className="flex items-center gap-1.5 liquid-glass-subtle p-1 rounded-xl self-start">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs rounded-lg transition ${
              filterType === 'ALL'
                ? 'bg-white/80 text-ink font-semibold shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            All ({edges.length})
          </button>

          <button
            onClick={() => setFilterType('DIRECT')}
            className={`px-3 py-1 text-xs rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'DIRECT'
                ? 'bg-accent-soft text-accent font-semibold border border-accent/30'
                : 'text-ink-3 hover:text-accent'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-accent inline-block"></span>
            <span>Direct Evidence</span>
          </button>

          <button
            onClick={() => setFilterType('INFERRED')}
            className={`px-3 py-1 text-xs rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'INFERRED'
                ? 'bg-warn/12 text-warn font-semibold border border-warn/30'
                : 'text-ink-3 hover:text-warn'
            }`}
          >
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-warn inline-block"></span>
            <span>Inferred Risk</span>
          </button>
        </div>
      </div>

      {/* Main Graph Arena */}
      <div className="bg-white/25 border border-white/60 rounded-2xl p-6 min-h-[420px] relative overflow-hidden flex flex-col justify-between backdrop-blur-2xl">
        
        {/* Subtle ambient mesh backdrop */}
        <div className="absolute inset-0 ambient-mesh opacity-50 pointer-events-none" />

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
                  isSelected ? 'border-accent/55 shadow-lg shadow-accent/10 scale-105' : style.border
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border ${style.badge}`}>
                    {node.type}
                  </span>
                  {node.isTarget && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-accent/15 text-accent border border-accent/30 rounded-md">
                      TARGET
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-ink mb-0.5 truncate">
                  {node.label}
                </div>

                {node.sublabel && (
                  <div className="text-xs font-mono text-ink-3 truncate mb-2">
                    {node.sublabel}
                  </div>
                )}

                {node.badge && (
                  <div className="text-[10px] font-mono text-ink-2 glass-well px-2 py-1 truncate">
                    {node.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edges List */}
        <div className="relative z-10 border-t border-[#171a1f]/8 pt-5">
          <div className="text-xs uppercase tracking-wider text-ink-3 mb-3 flex items-center justify-between">
            <span>Verified Connections ({filteredEdges.length})</span>
            <span className="text-[10px] text-accent font-normal normal-case">Click edge to view state proof</span>
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
                      ? 'liquid-glass border-accent/45 shadow-lg'
                      : 'liquid-glass-subtle hover:border-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink-2">
                      {sourceNode?.label || edge.source}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wide flex items-center gap-1 ${
                      isDirect 
                        ? 'bg-accent/12 text-accent border border-accent/25' 
                        : 'bg-warn/12 text-warn border border-warn/25'
                    }`}>
                      {isDirect ? <CheckCircle2 className="w-3 h-3 text-accent" /> : <TrendingUp className="w-3 h-3 text-warn" />}
                      <span>{edge.relationship}</span>
                    </span>

                    <span className="font-semibold text-ink-2">
                      {targetNode?.label || edge.target}
                    </span>
                  </div>

                  {edge.evidenceRef && (
                    <div className="text-[10px] text-ink-2 font-mono glass-well p-2">
                      <span className="text-accent font-semibold">Evidence: </span>
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
          <div className="relative z-10 mt-5 p-4 rounded-2xl liquid-glass animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase tracking-wider text-accent font-bold">
                {selectedNode ? `Node: ${selectedNode.label}` : `Edge: ${selectedEdge?.relationship}`}
              </span>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs text-ink-3 hover:text-ink"
              >
                Close ✕
              </button>
            </div>

            {selectedNode && (
              <div className="text-xs text-ink-2 space-y-0.5">
                <div>Type: <span className="text-ink font-bold">{selectedNode.type}</span></div>
                {selectedNode.sublabel && <div>Target: <span className="text-accent font-mono">{selectedNode.sublabel}</span></div>}
                {selectedNode.badge && <div>State Attribute: <span className="text-warn">{selectedNode.badge}</span></div>}
              </div>
            )}

            {selectedEdge && (
              <div className="text-xs text-ink-2 space-y-0.5">
                <div>Relationship: <span className="text-ink font-bold">{selectedEdge.relationship}</span></div>
                <div>Confidence: <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-accent' : 'text-warn'}>
                  {selectedEdge.relationshipType}
                </span></div>
                <div>Supporting Fact: <span className="text-ink font-mono">{selectedEdge.evidenceRef}</span></div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
