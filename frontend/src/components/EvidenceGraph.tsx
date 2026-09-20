import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitBranch,
  ExternalLink,
  FileSearch,
  RotateCcw,
} from 'lucide-react';
import type { GraphNode, GraphEdge } from '../types/sentinel';

interface EvidenceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Open a specific evidence record in the Evidence section. */
  onOpenEvidence?: (evidenceId: string) => void;
}

/* ============================== Styling maps ============================== */

const NODE_STYLE: Record<string, { stroke: string; fill: string; chip: string }> = {
  WALLET: { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.16)', chip: 'WALLET' },
  TOKEN: { stroke: '#38bdf8', fill: 'rgba(56,189,248,0.14)', chip: 'TOKEN' },
  SPENDER: { stroke: '#f87171', fill: 'rgba(248,113,113,0.15)', chip: 'SPENDER' },
  CONTRACT: { stroke: '#2c4568', fill: 'rgba(19,36,58,0.9)', chip: 'CONTRACT' },
  ADMIN: { stroke: '#f87171', fill: 'rgba(248,113,113,0.15)', chip: 'ADMIN' },
  IMPLEMENTATION: { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.16)', chip: 'IMPL' },
  DELEGATED_TARGET: { stroke: '#38bdf8', fill: 'rgba(56,189,248,0.16)', chip: 'DELEGATE' },
  ORACLE: { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.14)', chip: 'ORACLE' },
};

const EDGE_COLOR: Record<string, string> = {
  DIRECT_EVIDENCE: '#3b82f6',
  INFERRED: '#fbbf24',
};

const REL_STYLE: Record<string, { color: string; dash?: string }> = {
  HOLDS: { color: '#38bdf8' },
  TRANSFERRED_TO: { color: '#38bdf8' },
  APPROVED: { color: '#3b82f6' },
  ALLOWANCE: { color: '#a78bfa' },
  INTERACTED_WITH: { color: '#2c4568' },
  DELEGATES_TO: { color: '#22d3ee', dash: '7 4' },
  CONTROLLED_BY: { color: '#f87171' },
  UPGRADEABLE_TO: { color: '#3b82f6', dash: '7 4' },
  DEPENDS_ON: { color: '#fbbf24', dash: '2 3' },
};

/* ============================ Custom node types =========================== */

type FlowData = {
  label: string;
  sublabel?: string;
  chip: string;
  stroke: string;
  fill: string;
  isTarget?: boolean;
  address?: string;
};

type FlowNodeType = Node<FlowData, 'sentinel'>;

function SentinelNode({ data, selected }: NodeProps<FlowNodeType>) {
  return (
    <div
      className="rounded-xl px-3 py-2 min-w-[150px] max-w-[210px] transition-shadow"
      style={{
        background: data.fill,
        border: `1.5px solid ${selected ? '#22d3ee' : data.stroke}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(34,211,238,0.18)'
          : data.isTarget
            ? '0 0 0 1.5px rgba(59,130,246,0.45)'
            : '0 4px 14px rgba(2,8,18,0.45)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} isConnectable={false} />
      <div className="text-[8.5px] font-bold tracking-[0.09em]" style={{ color: data.stroke }}>
        {data.chip}
      </div>
      <div className="text-[11.5px] font-bold text-[#e8f0f8] leading-tight truncate" title={data.label}>
        {data.label}
      </div>
      {data.sublabel && (
        <div className="text-[9px] text-[#8fa3b8] font-mono truncate" title={data.sublabel}>
          {data.sublabel}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { sentinel: SentinelNode };

/* ============================== Auto layout =============================== */

/**
 * Deterministic layered layout: BFS depth from the target, columns wrapped
 * into sub-columns so no layer ever becomes a giant vertical strip of tiny
 * nodes. Pure function of nodes+edges — same graph, same layout, every time.
 */
function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return pos;

  const target = nodes.find((n) => n.isTarget) ?? nodes[0]!;
  const targetId = target.id;

  // BFS depth from the target over the undirected edge set.
  const depth = new Map<string, number>([[targetId, 0]]);
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    adjacency.set(e.source, [...(adjacency.get(e.source) ?? []), e.target]);
    adjacency.set(e.target, [...(adjacency.get(e.target) ?? []), e.source]);
  }
  const queue = [targetId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nb of adjacency.get(cur) ?? []) {
      if (!depth.has(nb)) {
        depth.set(nb, depth.get(cur)! + 1);
        queue.push(nb);
      }
    }
  }

  // Group by depth (columns), then order each column deterministically.
  const columns = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 99;
    const col = columns.get(d) ?? [];
    col.push(n.id);
    columns.set(d, col);
  }

  const COL_W = 300;
  const SUBCOL_W = 210;
  const ROW_H = 96;
  const MAX_ROWS_PER_SUBCOL = 4;
  for (const [d, ids] of columns) {
    const subColCount = Math.ceil(ids.length / MAX_ROWS_PER_SUBCOL);
    ids.forEach((id, i) => {
      const subCol = Math.floor(i / MAX_ROWS_PER_SUBCOL);
      const row = i % MAX_ROWS_PER_SUBCOL;
      // Center each sub-column's own rows vertically around the axis.
      const itemsInSubCol = Math.min(ids.length - subCol * MAX_ROWS_PER_SUBCOL, MAX_ROWS_PER_SUBCOL);
      const y = (row - (itemsInSubCol - 1) / 2) * ROW_H;
      const x = d * COL_W + (subColCount > 1 ? subCol * SUBCOL_W : 0);
      pos.set(id, { x, y });
    });
  }

  return pos;
}

/* ================================ Component =============================== */

const EvidenceGraphInner: React.FC<EvidenceGraphProps> = ({ nodes, edges, onOpenEvidence }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const initialNodes = useMemo<Node[]>(() => {
    const layout = computeLayout(nodes, edges);
    return nodes.map((n) => {
      const st = NODE_STYLE[n.type] ?? NODE_STYLE.CONTRACT;
      const p = layout.get(n.id) ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: 'sentinel',
        position: p,
        data: {
          label: n.label,
          sublabel: n.sublabel,
          chip: st.chip,
          stroke: st.stroke,
          fill: st.fill,
          isTarget: n.isTarget,
          address: n.address,
        },
      };
    });
  }, [nodes, edges]);

  const initialEdges = useMemo<Edge[]>(() => {
    return edges.map((e) => {
      const rel = REL_STYLE[e.relationship] ?? {};
      const direct = e.relationshipType === 'DIRECT_EVIDENCE';
      const color = rel.color ?? EDGE_COLOR[e.relationshipType] ?? '#3b82f6';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.count && e.count > 1 ? `${e.relationship} ×${e.count}` : e.relationship,
        labelStyle: { fill: color, fontSize: 9.5, fontWeight: 700 },
        labelBgStyle: { fill: '#07111f', fillOpacity: 0.92 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        style: {
          stroke: color,
          strokeWidth: direct ? 1.8 : 1.4,
          strokeDasharray: rel.dash,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      };
    });
  }, [edges]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  // Fit after first paint. (The parent remounts this component per
  // investigation via `key`, so no state-sync effect is needed.)
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 60);
    return () => clearTimeout(t);
  }, [fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const original = nodes.find((n) => n.id === node.id);
      if (!original) return;
      setSelectedNode(original);
      setSelectedEdge(null);
      setFlowEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: e.source === node.id || e.target === node.id,
          style: {
            ...e.style,
            opacity: e.source === node.id || e.target === node.id ? 1 : 0.22,
            strokeWidth: e.source === node.id || e.target === node.id ? 2.4 : 1.2,
          },
        })),
      );
      setFlowNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: { ...n.style, opacity: n.id === node.id ? 1 : 0.3 },
        })),
      );
    },
    [nodes, setFlowEdges, setFlowNodes],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const original = edges.find((e) => e.id === edge.id);
      if (!original) return;
      setSelectedEdge(original);
      setSelectedNode(null);
      setFlowEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: e.id === edge.id,
          style: { ...e.style, opacity: e.id === edge.id ? 1 : 0.18, strokeWidth: e.id === edge.id ? 2.6 : 1.2 },
        })),
      );
      setFlowNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: { ...n.style, opacity: n.id === edge.source || n.id === edge.target ? 1 : 0.28 },
        })),
      );
    },
    [edges, setFlowEdges, setFlowNodes],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setFlowEdges((eds) => eds.map((e) => ({ ...e, animated: false, style: { ...e.style, opacity: 1, strokeWidth: e.style?.strokeWidth } })));
    setFlowNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
  }, [setFlowEdges, setFlowNodes]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setFlowEdges((eds) => eds.map((e) => ({ ...e, animated: false, style: { ...e.style, opacity: 1 } })));
    setFlowNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
  }, [setFlowEdges, setFlowNodes]);

  const relatedFindings = useMemo(() => {
    if (!selectedNode) return [];
    const addr = selectedNode.address?.toLowerCase();
    if (!addr) return [];
    return edges
      .filter((e) => (e.source === selectedNode.id || e.target === selectedNode.id) && e.evidenceIds?.length)
      .flatMap((e) => e.evidenceIds!)
      .filter((id, i, a) => a.indexOf(id) === i);
  }, [selectedNode, edges]);

  // ---------- Truthful empty state ----------
  if (nodes.length === 0 || edges.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-10 text-center">
        <GitBranch className="w-10 h-10 mx-auto mb-3 text-ink-3" />
        <h3 className="text-lg font-bold text-ink mb-1">No evidence relationships available</h3>
        <p className="text-sm text-ink-2 max-w-md mx-auto">
          The deterministic engine did not return any relationship evidence for this entity, so no
          graph is drawn. Sentinel never invents graph relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-accent mb-1 font-medium">
            Evidence Relationships
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            <span>Interactive Evidence Graph</span>
            <span className="text-[11px] font-mono text-ink-3 font-normal">{nodes.length} entities · {edges.length} relationships</span>
          </h2>
          <p className="text-xs text-ink-2 max-w-xl mt-0.5">
            Every node and edge is generated from actual engine evidence; repeated interactions are
            aggregated onto one edge with all supporting evidence IDs. Click nodes/edges to inspect.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              clearSelection();
              fitView({ padding: 0.15, duration: 400 });
            }}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold liquid-pill text-ink-2 hover:text-ink transition cursor-pointer flex items-center gap-1.5"
            title="Reset layout, selection, and zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden border border-[var(--border-1)]" style={{ height: 520 }} ref={wrapperRef}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          elementsSelectable
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="rgba(44,69,104,0.5)" />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            pannable
            zoomable
            position="top-right"
            style={{ background: '#0b1626', border: '1px solid #203653', borderRadius: 10 }}
            nodeColor={(n) => {
              const t = (n.data as FlowData | undefined)?.chip ?? '';
              if (t === 'SPENDER' || t === 'ADMIN') return 'rgba(248,113,113,0.75)';
              if (t === 'TOKEN' || t === 'DELEGATE') return 'rgba(56,189,248,0.75)';
              if (t === 'WALLET') return 'rgba(59,130,246,0.85)';
              return '#1c3552';
            }}
            maskColor="rgba(5, 7, 11, 0.72)"
            nodeStrokeWidth={0}
          />
        </ReactFlow>
      </div>

      {/* Inspector */}
      {(selectedNode || selectedEdge) && (
        <div className="mt-4 p-4 rounded-2xl liquid-glass-strong animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
              {selectedNode ? <>Node: {selectedNode.label}</> : <>Edge: {selectedEdge?.relationship}</>}
            </span>
            <button onClick={clearSelection} className="text-xs text-ink-3 hover:text-ink cursor-pointer">
              Close ✕
            </button>
          </div>

          {selectedNode && (
            <div className="text-xs text-ink-2 space-y-1.5">
              <div>
                Entity type: <span className="text-ink font-bold">{selectedNode.type}</span>
                {selectedNode.isTarget && (
                  <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-accent/15 text-accent border border-accent/30 rounded">
                    INVESTIGATION TARGET
                  </span>
                )}
              </div>
              {selectedNode.address && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-technical break-all">{selectedNode.address}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(selectedNode.address!)}
                    className="text-[10px] text-ink-3 hover:text-accent cursor-pointer underline"
                  >
                    copy
                  </button>
                  <a
                    href={`https://etherscan.io/address/${selectedNode.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-accent hover:text-accent-deep inline-flex items-center gap-0.5"
                  >
                    explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selectedNode.badge && (
                <div>
                  State: <span className="text-warn">{selectedNode.badge}</span>
                </div>
              )}
              <div>
                Direct connections:{' '}
                <span className="font-mono text-technical">
                  {flowEdges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => e.label as string)
                    .join(', ') || '—'}
                </span>
              </div>
              {relatedFindings.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-ink-3">Supporting evidence:</span>
                  {relatedFindings.map((id) => (
                    <button
                      key={id}
                      onClick={() => onOpenEvidence?.(id)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <FileSearch className="w-3 h-3" /> {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEdge && (
            <div className="text-xs text-ink-2 space-y-1.5">
              <div>
                {nodes.find((n) => n.id === selectedEdge.source)?.label ?? selectedEdge.source}{' '}
                <span
                  className="font-bold"
                  style={{ color: EDGE_COLOR[selectedEdge.relationshipType] ?? '#3b82f6' }}
                >
                  —{selectedEdge.relationship}→
                </span>{' '}
                {nodes.find((n) => n.id === selectedEdge.target)?.label ?? selectedEdge.target}
              </div>
              <div>
                Confidence:{' '}
                <span className={selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-accent font-bold' : 'text-warn font-bold'}>
                  {selectedEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'OBSERVED' : 'INFERRED'}
                </span>
              </div>
              {selectedEdge.evidenceRef && (
                <div className="text-technical font-mono glass-well p-2 break-all">{selectedEdge.evidenceRef}</div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ink-3">Supporting evidence IDs:</span>
                {(selectedEdge.evidenceIds ?? []).map((id) => (
                  <button
                    key={id}
                    onClick={() => onOpenEvidence?.(id)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <FileSearch className="w-3 h-3" /> {id}
                  </button>
                ))}
                {(selectedEdge.evidenceIds ?? []).length === 0 && (
                  <span className="text-[10px] text-ink-3">edge-level reference only (see evidenceRef)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = (props) => (
  <ReactFlowProvider>
    <EvidenceGraphInner {...props} />
  </ReactFlowProvider>
);

export default EvidenceGraph;
