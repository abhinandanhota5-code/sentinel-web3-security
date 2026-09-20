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
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Box,
  ChevronDown,
  ChevronUp,
  Coins,
  ExternalLink,
  FileSearch,
  GitBranch,
  GitFork,
  Key,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet as WalletIcon,
} from 'lucide-react';
import type { GraphNode, GraphEdge, Finding } from '../types/sentinel';

/* ============================== Props ====================================== */

interface EvidenceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Open a specific evidence record in the Evidence section. */
  onOpenEvidence?: (evidenceId: string) => void;
  /** Findings to surface alongside a selected node ("why is this flagged?"). */
  findings?: Finding[];
  /** Open a finding in the Evidence detail panel. */
  onOpenFinding?: (finding: Finding) => void;
}

/* ============================== Visual maps ================================ */
/**
 * Monochrome-first visual direction. Blue is kept only as a restrained
 * interactive accent; severity colors map to CRITICAL/HIGH (red), MEDIUM
 * (amber), LOW (blue) exactly as the rest of the console. Nothing glows except
 * the investigation target, which gets a subtle off-white emphasis.
 */

const NODE_VISUAL: Record<string, { stroke: string; fill: string; typeLabel: string }> = {
  WALLET: { stroke: '#e9eef5', fill: 'rgba(32,40,52,0.92)', typeLabel: 'WALLET' },
  TOKEN: { stroke: '#7ea9dd', fill: 'rgba(63,123,201,0.10)', typeLabel: 'TOKEN' },
  SPENDER: { stroke: '#d15b5b', fill: 'rgba(209,91,91,0.10)', typeLabel: 'SPENDER' },
  CONTRACT: { stroke: '#aab4c0', fill: 'rgba(22,29,38,0.92)', typeLabel: 'CONTRACT' },
  ADMIN: { stroke: '#c9a86b', fill: 'rgba(201,168,107,0.09)', typeLabel: 'ADMIN' },
  IMPLEMENTATION: { stroke: '#7ea9dd', fill: 'rgba(63,123,201,0.08)', typeLabel: 'IMPL' },
  DELEGATED_TARGET: { stroke: '#7ea9dd', fill: 'rgba(63,123,201,0.10)', typeLabel: 'DELEGATE' },
  ORACLE: { stroke: '#aab4c0', fill: 'rgba(22,29,38,0.92)', typeLabel: 'ORACLE' },
};

const ICONS: Record<string, LucideIcon> = {
  WALLET: WalletIcon,
  TOKEN: Coins,
  CONTRACT: Box,
  SPENDER: ShieldCheck,
  ADMIN: Key,
  IMPLEMENTATION: GitFork,
  DELEGATED_TARGET: User,
  ORACLE: Activity,
};

/* Security-relevant relationships carry a restrained accent-blue tint; purely
   historical/referential edges stay neutral grey. Unknown/inferred edges are
   grey + dashed. */
const SECURITY_EDGES = new Set(['CONTROLLED_BY', 'DELEGATES_TO', 'UPGRADEABLE_TO', 'ALLOWANCE', 'APPROVED']);

const RELATION_LABEL: Record<string, string> = {
  HOLDS: 'HOLDS',
  TRANSFERRED_TO: 'TRANSFERRED',
  APPROVED: 'APPROVED',
  ALLOWANCE: 'ALLOWANCE',
  INTERACTED_WITH: 'INTERACTED',
  DELEGATES_TO: 'DELEGATES TO',
  CONTROLLED_BY: 'CONTROLLED BY',
  UPGRADEABLE_TO: 'UPGRADES TO',
  DEPENDS_ON: 'DEPENDS ON',
};

/** Node types that materially contribute to understanding a finding:
    privileged/security relations stay individual; tokens are only kept
    individual when a finding flags them (LOW+) — incidental holdings group. */
const SECURITY_TYPES = new Set(['SPENDER', 'ADMIN', 'IMPLEMENTATION', 'DELEGATED_TARGET', 'ORACLE']);

const FOCUSED_CAP = 15; // max visible nodes in the focused view
const MAX_INTERACTION_NODES = 8; // standalone historical counterparties kept before collapsing
const AGGREGATE_NODE_ID = 'agg-history';
const TOKEN_AGG_NODE_ID = 'agg-tokens';

/* ============================ Custom node ================================= */

type FlowData = {
  nodeType: string;
  label: string;
  sublabel?: string;
  stroke: string;
  fill: string;
  address?: string;
  isTarget?: boolean;
  aggregated?: boolean;
  riskLevel?: 'red' | 'amber' | 'blue';
};

type FlowNodeType = Node<FlowData, 'sentinel'>;

function SentinelNode({ data, selected }: NodeProps<FlowNodeType>) {
  const Icon = ICONS[data.nodeType] ?? Box;
  const v = NODE_VISUAL[data.nodeType] ?? NODE_VISUAL.CONTRACT;
  const stroke = selected ? '#e9eef5' : data.stroke;
  const riskColor =
    data.riskLevel === 'red' ? '#e05c5c' : data.riskLevel === 'amber' ? '#d9a95a' : data.riskLevel === 'blue' ? '#7ea9dd' : null;

  return (
    <div
      className="rounded-xl border min-w-[168px] max-w-[220px] transition-shadow"
      style={{
        background: data.fill,
        borderColor: stroke,
        borderStyle: data.aggregated ? 'dashed' : 'solid',
        boxShadow: selected
          ? '0 0 0 3px rgba(223,230,240,0.14)'
          : data.isTarget
            ? '0 0 26px rgba(232,237,244,0.16)'
            : '0 6px 18px rgba(0,0,0,0.45)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} isConnectable={false} />
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" style={{ color: v.stroke }}>
            <Icon className="w-3 h-3" strokeWidth={2.2} />
            <span className="text-[9px] font-bold tracking-[0.1em]">
              {data.aggregated ? 'AGGREGATED EVENTS' : v.typeLabel}
            </span>
          </div>
          {riskColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: riskColor, boxShadow: `0 0 6px ${riskColor}` }}
              title="Entity referenced by an active security finding"
            />
          )}
        </div>
        <div className="text-[12.5px] font-bold text-ink leading-tight truncate mt-1" title={data.label}>
          {data.label}
        </div>
        {data.sublabel && (
          <div className="text-[10px] text-ink-3 font-mono truncate" title={data.sublabel}>
            {data.sublabel}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { sentinel: SentinelNode } as const;

/* ====================== Focused projection (aggregation) ================== */
/**
 * Pure projection of the full deterministic evidence graph:
 *  - always keep the investigation target;
 *  - keep every SECURITY node + every node flagged by a real finding (the
 *    entities that materially explain the findings);
 *  - show only the most-connected historical counterparties (capped);
 *  - group everything incidental (zero-balance token holdings, remaining
 *    history) into ONE aggregated node per group, one aggregated edge each.
 * No nodes or edges are ever invented — only visually grouped. The underlying
 * evidence IDs are preserved and reachable via "Show all evidence".
 */
export function projectFocused(
  nodes: GraphNode[],
  edges: GraphEdge[],
  materialIds: ReadonlySet<string>,
): { nodes: GraphNode[]; edges: GraphEdge[]; hiddenInteractions: number; hiddenTokens: number } {
  if (nodes.length <= FOCUSED_CAP) return { nodes, edges, hiddenInteractions: 0, hiddenTokens: 0 };

  const target = nodes.find((n) => n.isTarget) ?? nodes[0];
  const material = nodes.filter((n) => n !== target && materialIds.has(n.id));
  const interactions = nodes.filter((n) => n !== target && n.type === 'CONTRACT' && !materialIds.has(n.id));
  const tokens = nodes.filter((n) => n !== target && n.type === 'TOKEN' && !materialIds.has(n.id));
  const misc = nodes.filter((n) => n !== target && !materialIds.has(n.id) && n.type !== 'TOKEN' && n.type !== 'CONTRACT');

  const byWeight = (id: string) =>
    edges.reduce(
      (sum, e) => (e.source === id || e.target === id ? sum + (e.count ?? e.evidenceIds?.length ?? 1) : sum),
      0,
    );
  const budget = Math.max(0, FOCUSED_CAP - 1 - material.length);
  const keepCount = Math.min(budget, MAX_INTERACTION_NODES);
  const ranked = [...interactions].sort((a, b) => byWeight(b.id) - byWeight(a.id) || a.id.localeCompare(b.id));
  const topInteractions = ranked.slice(0, keepCount);
  const hiddenHistory = ranked.slice(keepCount);

  const keptIds = new Set([target!.id, ...material.map((n) => n.id), ...topInteractions.map((n) => n.id)]);
  const keptNodes = nodes.filter((n) => keptIds.has(n.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));

  const aggregateEdge = (
    edgeId: string,
    sourceId: string,
    targetId: string,
    relationship: GraphEdge['relationship'],
    ids: string[],
    totalEvents: number,
    ref: string,
  ): GraphEdge => ({
    id: edgeId,
    source: sourceId,
    target: targetId,
    relationship,
    relationshipType: 'DIRECT_EVIDENCE',
    evidenceIds: ids,
    count: totalEvents,
    evidenceRef: ref,
  });

  const grouped = { hiddenInteractions: 0, hiddenTokens: 0 };
  const outNodes = [...keptNodes];
  const outEdges = [...keptEdges];

  /* Group incidental token holdings (balances, not authorizations). */
  if (tokens.length > 0) {
    const tokenIds = new Set(tokens.map((n) => n.id));
    const related = edges.filter((e) => tokenIds.has(e.source) || tokenIds.has(e.target));
    const ids = [...new Set(related.flatMap((e) => e.evidenceIds ?? []))];
    const events = related.reduce((sum, e) => sum + (e.count ?? e.evidenceIds?.length ?? 1), 0);
    outNodes.push({
      id: TOKEN_AGG_NODE_ID,
      label: `Token holdings`,
      sublabel: `${tokens.length} tokens`,
      type: 'TOKEN',
      badge: `${ids.length || events} balance records`,
    });
    outEdges.push(
      aggregateEdge('edge-agg-tokens', target!.id, TOKEN_AGG_NODE_ID, 'HOLDS', ids, events, `Aggregated ${tokens.length} token balance records from the deterministic timeline`),
    );
    grouped.hiddenTokens = tokens.length;
  }

  /* Group remaining historical counterparties (and any misc entity). */
  const historyIds = [...hiddenHistory, ...misc].map((n) => n.id);
  if (historyIds.length > 0) {
    const histIdSet = new Set(historyIds);
    const related = edges.filter((e) => histIdSet.has(e.source) || histIdSet.has(e.target));
    const ids = [...new Set(related.flatMap((e) => e.evidenceIds ?? []))];
    const events = related.reduce((sum, e) => sum + (e.count ?? e.evidenceIds?.length ?? 1), 0);
    const sublabel =
      `${hiddenHistory.length} counterparties` +
      (misc.length > 0 ? ` · ${misc.length} other entities` : '');
    outNodes.push({
      id: AGGREGATE_NODE_ID,
      label: `Historical interactions`,
      sublabel,
      type: 'CONTRACT',
      badge: `${events} on-chain events`,
    });
    outEdges.push(
      aggregateEdge('edge-agg-history', target!.id, AGGREGATE_NODE_ID, 'INTERACTED_WITH', ids, events, `Aggregated ${hiddenHistory.length} indexed on-chain counterparties from the deterministic timeline`),
    );
    grouped.hiddenInteractions = historyIds.length;
  }

  return { nodes: outNodes, edges: outEdges, hiddenInteractions: grouped.hiddenInteractions, hiddenTokens: grouped.hiddenTokens };
}

/* ====================== Deterministic layered layout ====================== */
/** Longest-path layering from the target along edge direction: wallet stays on
    the far left and relationships flow left → right. Columns wrap only when
    very tall, keeping the canvas compact. Pure function of the visible graph. */
export function computeLayout(visibleNodes: GraphNode[], visibleEdges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  if (visibleNodes.length === 0) return pos;

  const target = visibleNodes.find((n) => n.isTarget) ?? visibleNodes[0];
  const rank = new Map<string, number>([[target!.id, 0]]);
  for (let iter = 0; iter < visibleNodes.length; iter++) {
    let changed = false;
    for (const e of visibleEdges) {
      const s = rank.get(e.source);
      if (s === undefined) continue;
      const t = rank.get(e.target);
      if (t === undefined || t < s + 1) {
        rank.set(e.target, s + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const n of visibleNodes) if (!rank.has(n.id)) rank.set(n.id, 1);

  const order = new Map(visibleNodes.map((n, i) => [n.id, i]));
  const columns = new Map<number, string[]>();
  for (const n of visibleNodes) {
    const d = rank.get(n.id) ?? 1;
    const col = columns.get(d) ?? [];
    col.push(n.id);
    columns.set(d, col);
  }
  for (const ids of columns.values()) ids.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));

  const COL_W = 250;
  const SUBCOL_W = 172;
  const ROW_H = 86;
  const MAX_ROWS = 7;

  for (const [d, ids] of columns) {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += MAX_ROWS) chunks.push(ids.slice(i, i + MAX_ROWS));
    chunks.forEach((chunk, ci) => {
      chunk.forEach((id, row) => {
        const y = (row - (chunk.length - 1) / 2) * ROW_H;
        const x = d * COL_W + ci * SUBCOL_W;
        pos.set(id, { x, y });
      });
    });
  }

  return pos;
}

/* ================================ Component =============================== */

const EvidenceGraphInner: React.FC<EvidenceGraphProps> = ({ nodes, edges, onOpenEvidence, findings, onOpenFinding }) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fitView } = useReactFlow();


  /* ----- Severity emphasis: which nodes are referenced by a finding? ----- */
  const nodeRisk = useMemo(() => {
    const map = new Map<string, 'red' | 'amber' | 'blue'>();
    const rankOf = (lvl: string | null) => (lvl === 'red' ? 0 : lvl === 'amber' ? 1 : 2);
    for (const f of findings ?? []) {
      const sev = f.severity as string;
      const lvl: 'red' | 'amber' | 'blue' | null =
        sev === 'CRITICAL' || sev === 'HIGH' ? 'red' : sev === 'MEDIUM' ? 'amber' : sev === 'LOW' ? 'blue' : null;
      if (!lvl) continue;
      const addresses = [f.token?.address, f.spender?.address, f.evidence?.contractAddress]
        .filter((a): a is string => typeof a === 'string')
        .map((a) => a.toLowerCase());
      const refs = new Set(f.evidenceIds ?? []);
      for (const n of nodes) {
        const linkedByAddress = n.address && addresses.includes(n.address.toLowerCase());
        const linkedByEvidence = (edges.some((e) => (e.source === n.id || e.target === n.id) && (e.evidenceIds ?? []).some((id) => refs.has(id))) && refs.size > 0);
        if (!linkedByAddress && !linkedByEvidence) continue;
        const cur = map.get(n.id);
        if (cur === undefined || rankOf(lvl) < rankOf(cur)) map.set(n.id, lvl);
      }
    }
    return map;
  }, [nodes, edges, findings]);

  /* ----- Which nodes materially matter (target + flagged/privileged)? ----- */
  const materialIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of nodes) {
      if (n.id === AGGREGATE_NODE_ID || n.id === TOKEN_AGG_NODE_ID) continue;
      if (n.isTarget || SECURITY_TYPES.has(n.type) || nodeRisk.has(n.id)) ids.add(n.id);
    }
    return ids;
  }, [nodes, nodeRisk]);

  /* ----- Deterministic projection: focused small graph or full evidence ----- */
  const projected = useMemo(
    () => (showAll ? { nodes, edges, hiddenInteractions: 0, hiddenTokens: 0 } : projectFocused(nodes, edges, materialIds)),
    [nodes, edges, showAll, materialIds],
  );

  const visibleNodes = projected.nodes;
  const visibleEdges = projected.edges;
  const nodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  /* ----- Build React Flow state (memoized; unaffected by selection) ----- */
  const layout = useMemo(() => computeLayout(visibleNodes, visibleEdges), [visibleNodes, visibleEdges]);

  const builtNodes = useMemo<Node[]>(
    () =>
      visibleNodes.map((n) => {
        const v = NODE_VISUAL[n.type] ?? NODE_VISUAL.CONTRACT;
        return {
          id: n.id,
          type: 'sentinel',
          position: layout.get(n.id) ?? { x: 0, y: 0 },
          data: {
            nodeType: n.type,
            label: n.label,
            sublabel: n.sublabel,
            stroke: v.stroke,
            fill: v.fill,
            address: n.address,
            isTarget: n.isTarget,
            aggregated: n.id === AGGREGATE_NODE_ID,
            riskLevel: nodeRisk.get(n.id),
          },
        };
      }),
    [visibleNodes, layout, nodeRisk],
  );

  const builtEdges = useMemo<Edge[]>(
    () =>
      visibleEdges.map((e) => {
        const relLabel = RELATION_LABEL[e.relationship] ?? e.relationship;
        const inferred = e.relationshipType === 'INFERRED' || e.relationship === 'DEPENDS_ON';
        const color = inferred ? '#7b8794' : SECURITY_EDGES.has(e.relationship) ? '#8fb0dd' : '#aab4c0';
        const label = e.count && e.count > 1 ? `${relLabel} ×${e.count}` : relLabel;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label,
          labelStyle: { fill: color, fontSize: 10, fontWeight: 700, letterSpacing: '0.03em' },
          labelBgStyle: { fill: '#0d1117', fillOpacity: 0.95, stroke: 'rgba(255,255,255,0.05)' },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
          style: { stroke: color, strokeWidth: 1.7, strokeDasharray: inferred ? '5 4' : undefined },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
        } as Edge;
      }),
    [visibleEdges],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => setRfNodes(builtNodes), [builtNodes, setRfNodes]);
  useEffect(() => setRfEdges(builtEdges), [builtEdges, setRfEdges]);

  /* Auto-fit when the graph opens and whenever the focused/all projection
     changes — users should never have to zoom in to read. */
  useEffect(() => {
    if (builtNodes.length === 0) return;
    const t = setTimeout(() => fitView({ padding: 0.16, duration: 320 }), 90);
    return () => clearTimeout(t);
  }, [builtNodes, showAll, fitView]);

  /* ----- Selection / interaction ----- */
  const applyDim = useCallback(
    (focusNodeId?: string, focusEdgeId?: string) => {
      setRfEdges((eds) =>
        eds.map((e) => {
          const focused = e.id === focusEdgeId || e.source === focusNodeId || e.target === focusNodeId;
          return {
            ...e,
            animated: e.id === focusEdgeId || e.source === focusNodeId || e.target === focusNodeId,
            style: { ...e.style, opacity: focused ? 1 : 0.18, strokeWidth: focused ? 2.4 : 1.1 },
          };
        }),
      );
      setRfNodes((nds) =>
        nds.map((n) => ({ ...n, style: { ...n.style, opacity: n.id === focusNodeId ? 1 : 0.28 } })),
      );
    },
    [setRfEdges, setRfNodes],
  );

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setRfEdges((eds) => eds.map((e) => ({ ...e, animated: false, style: { ...e.style, opacity: 1, strokeWidth: 1.7 } })));
    setRfNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
  }, [setRfEdges, setRfNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const original = visibleNodes.find((n) => n.id === node.id);
      if (!original) return;
      setSelectedNode(original);
      setSelectedEdge(null);
      applyDim(node.id);
    },
    [visibleNodes, applyDim],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const original = visibleEdges.find((e) => e.id === edge.id);
      if (!original) return;
      setSelectedEdge(original);
      setSelectedNode(null);
      applyDim(undefined, edge.id);
    },
    [visibleEdges, applyDim],
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      const original = visibleNodes.find((n) => n.id === node.id);
      if (original) setHoverNode(original);
    },
    [visibleNodes],
  );

  const onNodeMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverNode(null), 150);
  }, []);

  /* ----- Selection must stay valid across projection toggles ----- */
  const selNode = selectedNode && nodeIds.has(selectedNode.id) ? selectedNode : null;
  const selEdge = selectedEdge && visibleEdges.some((e) => e.id === selectedEdge.id) ? selectedEdge : null;

  /* ----- Evidence lookups for the inspector ----- */
  const relatedFindings = useMemo(() => {
    if (!selNode) return [];
    return edges
      .filter((e) => (e.source === selNode.id || e.target === selNode.id) && e.evidenceIds?.length)
      .flatMap((e) => e.evidenceIds!)
      .filter((id, i, a) => a.indexOf(id) === i);
  }, [selNode, edges]);

  const nodeFindings = useMemo(() => {
    if (!selNode || !findings) return [];
    const addr = selNode.address?.toLowerCase();
    const relatedIds = new Set(
      edges
        .filter((e) => (e.source === selNode.id || e.target === selNode.id) && e.evidenceIds?.length)
        .flatMap((e) => e.evidenceIds!),
    );
    return findings.filter((f) => {
      if (addr && (f.token?.address?.toLowerCase() === addr || f.spender?.address?.toLowerCase() === addr || f.evidence?.contractAddress?.toLowerCase() === addr)) {
        return true;
      }
      return (f.evidenceIds ?? []).some((id) => relatedIds.has(id));
    });
  }, [selNode, findings, edges]);

  const edgeFindings = useMemo(() => {
    if (!selEdge || !findings) return [];
    const edgeIds = new Set(selEdge.evidenceIds ?? []);
    const src = visibleNodes.find((n) => n.id === selEdge.source);
    const tgt = visibleNodes.find((n) => n.id === selEdge.target);
    const srcAddr = src?.address?.toLowerCase();
    const tgtAddr = tgt?.address?.toLowerCase();
    return findings.filter((f) => {
      if (srcAddr && tgtAddr && (f.token?.address?.toLowerCase() === srcAddr || f.token?.address?.toLowerCase() === tgtAddr || f.spender?.address?.toLowerCase() === srcAddr || f.spender?.address?.toLowerCase() === tgtAddr || f.evidence?.contractAddress?.toLowerCase() === srcAddr || f.evidence?.contractAddress?.toLowerCase() === tgtAddr)) {
        return true;
      }
      return (f.evidenceIds ?? []).some((id) => edgeIds.has(id));
    });
  }, [selEdge, findings, visibleNodes]);

  const hoverCount = useMemo(() => {
    if (!hoverNode) return 0;
    return edges.filter((e) => e.source === hoverNode.id || e.target === hoverNode.id).length;
  }, [hoverNode, edges]);

  /* ----- Notices ----- */
  const hasHidden = projected.hiddenInteractions > 0;
  const canToggle = nodes.length > visibleNodes.length;

  /* ---------- Truthful empty state ---------- */
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

  const isAggregatedNode = selNode?.id === AGGREGATE_NODE_ID;

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full liquid-pill text-[10px] tracking-wider uppercase text-ink-2 mb-1 font-medium">
            Evidence Relationships
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            <span>Interactive Evidence Graph</span>
            <span className="text-[11px] font-mono text-ink-3 font-normal">
              {visibleNodes.length} entities · {visibleEdges.length} relationships
              {showAll ? ' · all evidence' : hasHidden || canToggle ? ' · focused view' : ''}
            </span>
          </h2>
          <p className="text-xs text-ink-2 max-w-2xl mt-0.5">
            Every node and edge is generated from actual engine evidence; repeated interactions are
            aggregated onto one edge with all supporting evidence IDs preserved. Click nodes or edges
            to trace the evidence. Repeated historical activity is grouped until “Show all evidence”.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canToggle && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold liquid-pill text-ink-2 hover:text-ink transition cursor-pointer flex items-center gap-1.5"
              title={showAll ? 'Collapse back to the focused security view' : 'Reveal every historical counterparty in the evidence set'}
            >
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAll ? 'Focused view' : `Show all evidence (${nodes.length})`}
            </button>
          )}
          <button
            onClick={() => {
              clearSelection();
              fitView({ padding: 0.16, duration: 400 });
            }}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold liquid-pill text-ink-2 hover:text-ink transition cursor-pointer flex items-center gap-1.5"
            title="Reset selection and fit the graph to view"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset & fit
          </button>
        </div>
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mb-3 text-[10px] text-ink-3 font-mono">
        <span className="text-ink-2 font-sans font-semibold uppercase tracking-wider text-[9px]">Legend</span>
        <span className="flex items-center gap-1"><span className="text-[#e9eef5]">○</span> Wallet</span>
        <span className="flex items-center gap-1"><span className="text-[#c9a86b]">◇</span> Token</span>
        <span className="flex items-center gap-1"><span className="text-[#d15b5b]">◉</span> Spender</span>
        <span className="flex items-center gap-1"><span className="text-[#aab4c0]">□</span> Contract</span>
        <span className="flex items-center gap-1"><span className="text-[#c9a86b]">◆</span> Admin</span>
        <span className="flex items-center gap-1"><span className="text-[#7ea9dd]">↗</span> Implementation</span>
        <span className="flex items-center gap-1"><span className="text-[#7ea9dd]">⇢</span> Delegate</span>
        {hasHidden && (
          <span className="flex items-center gap-1 text-ink-2">＋ grouped history</span>
        )}
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border-1)]" style={{ height: 420 }}>
        <div className="absolute inset-0">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            nodeTypes={nodeTypes}
            minZoom={0.25}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            elementsSelectable
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={26} size={1.3} color="rgba(148,163,184,0.16)" />
            <Controls showInteractive={false} position="bottom-right" />
            <MiniMap
              pannable
              zoomable
              position="top-right"
              className="hidden sm:block"
              style={{ background: '#0d1117', border: '1px solid #2a323c', borderRadius: 10 }}
              nodeColor={(n) => {
                const t = (n.data as FlowData | undefined)?.nodeType ?? '';
                if (t === 'SPENDER' || t === 'ADMIN') return 'rgba(209,91,91,0.7)';
                if (t === 'TOKEN' || t === 'IMPLEMENTATION' || t === 'DELEGATED_TARGET') return 'rgba(126,169,221,0.75)';
                if (t === 'WALLET') return 'rgba(233,238,245,0.9)';
                return '#39414d';
              }}
              maskColor="rgba(7,9,13,0.75)"
              nodeStrokeWidth={0}
            />
          </ReactFlow>
        </div>

        {/* Hover preview — compact, never a modal */}
        {hoverNode && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none animate-in fade-in duration-100">
            <div className="liquid-glass-strong rounded-xl px-3 py-2 text-[10px] max-w-[240px] shadow-2xl">
              <div className="flex items-center gap-1.5 font-bold tracking-[0.08em]" style={{ color: (NODE_VISUAL[hoverNode.type] ?? NODE_VISUAL.CONTRACT).stroke }}>
                {(() => {
                  const Icon = ICONS[hoverNode.type] ?? Box;
                  return <Icon className="w-3 h-3" strokeWidth={2.2} />;
                })()}
                {hoverNode.id === AGGREGATE_NODE_ID ? 'AGGREGATED EVENTS' : NODE_VISUAL[hoverNode.type]?.typeLabel ?? hoverNode.type}
              </div>
              <div className="text-[11.5px] font-bold text-ink truncate mt-0.5">{hoverNode.label}</div>
              <div className="text-[9px] text-ink-3 font-mono truncate">
                {hoverNode.id === AGGREGATE_NODE_ID ? `${hoverNode.sublabel ?? ''} · ${hoverNode.badge ?? ''}` : hoverNode.address ?? hoverNode.sublabel}
              </div>
              <div className="text-[9px] text-ink-3 mt-0.5">
                {hoverCount} connection{hoverCount === 1 ? '' : 's'} {hoverNode.isTarget ? '· investigation target' : ''}
                {nodeRisk.get(hoverNode.id) ? '· ⚠ active finding' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspector */}
      {(selNode || selEdge) && (
        <div className="mt-4 p-4 rounded-2xl liquid-glass-strong animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
              {selNode ? <>Node: {selNode.label}</> : <>Edge: {(RELATION_LABEL[selEdge!.relationship] ?? selEdge!.relationship)}</>}
            </span>
            <button onClick={clearSelection} className="text-xs text-ink-3 hover:text-ink cursor-pointer">
              Close ✕
            </button>
          </div>

          {selNode && (
            <div className="text-xs text-ink-2 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase"
                  style={{ color: (NODE_VISUAL[selNode.type] ?? NODE_VISUAL.CONTRACT).stroke, background: `${(NODE_VISUAL[selNode.type] ?? NODE_VISUAL.CONTRACT).stroke}1f` }}
                >
                  {NODE_VISUAL[selNode.type]?.typeLabel ?? selNode.type}
                </span>
                {selNode.isTarget && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-ink border border-white/15 rounded">
                    INVESTIGATION TARGET
                  </span>
                )}
                {nodeRisk.get(selNode.id) && <span className="text-[9px] text-ink-3">⚠ referenced by an active finding</span>}
              </div>

              {isAggregatedNode && (
                <div className="text-ink-3 text-[11px]">
                  Aggregated view of {selNode.sublabel?.replace(' counterparties', '') ?? 'multiple'} historical counterparties from the
                  deterministic timeline. Open “Show all evidence” for the full per-counterparty breakdown. Original evidence IDs remain
                  attached to the aggregated edge below.
                </div>
              )}

              {selNode.address && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-technical break-all">{selNode.address}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(selNode.address!)}
                    className="text-[10px] text-ink-3 hover:text-accent cursor-pointer underline"
                  >
                    copy
                  </button>
                  <a
                    href={`https://etherscan.io/address/${selNode.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-accent hover:text-accent-deep inline-flex items-center gap-0.5"
                  >
                    explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selNode.badge && (
                <div>
                  State: <span className="text-warn">{selNode.badge}</span>
                </div>
              )}
              <div>
                Direct connections:{' '}
                <span className="font-mono text-technical">
                  {rfEdges
                    .filter((e) => e.source === selNode.id || e.target === selNode.id)
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

              {nodeFindings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-1)] space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" /> Why does the engine flag this entity?
                  </div>
                  {nodeFindings.map((f) => (
                    <div key={f.id} className="glass-well rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] text-ink font-semibold truncate" title={f.title}>{f.title}</div>
                        <div className="text-[9px] text-ink-3 uppercase tracking-wider">
                          {f.severity} · {f.confidence}
                        </div>
                      </div>
                      {onOpenFinding && (
                        <button
                          onClick={() => onOpenFinding(f)}
                          className="text-[9px] font-bold text-accent border border-accent/30 bg-accent/12 hover:bg-accent/20 rounded-md px-1.5 py-1 cursor-pointer shrink-0"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selEdge && (
            <div className="text-xs text-ink-2 space-y-1.5">
              <div>
                {visibleNodes.find((n) => n.id === selEdge.source)?.label ?? selEdge.source}{' '}
                <span className="font-bold text-ink">
                  —{(RELATION_LABEL[selEdge.relationship] ?? selEdge.relationship)}
                  {selEdge.count && selEdge.count > 1 ? ` ×${selEdge.count}` : ''}→
                </span>{' '}
                {visibleNodes.find((n) => n.id === selEdge.target)?.label ?? selEdge.target}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Confidence:{' '}
                  <span className={selEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'text-ok font-bold' : 'text-warn font-bold'}>
                    {selEdge.relationshipType === 'DIRECT_EVIDENCE' ? 'OBSERVED' : 'INFERRED'}
                  </span>
                </span>
                {selEdge.relationshipType === 'INFERRED' && (
                  <span className="text-[9px] text-ink-3 px-1.5 py-0.5 border border-dashed border-[var(--border-2)] rounded">
                    inferred, not directly observed — grey dashed in graph
                  </span>
                )}
              </div>
              {selEdge.transactionHash && (
                <div className="text-technical font-mono">tx {selEdge.transactionHash}</div>
              )}
              {selEdge.evidenceRef && (
                <div className="text-technical font-mono glass-well p-2 break-all">{selEdge.evidenceRef}</div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ink-3">Supporting evidence IDs:</span>
                {(selEdge.evidenceIds ?? []).map((id) => (
                  <button
                    key={id}
                    onClick={() => onOpenEvidence?.(id)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <FileSearch className="w-3 h-3" /> {id}
                  </button>
                ))}
                {(selEdge.evidenceIds ?? []).length === 0 && (
                  <span className="text-[10px] text-ink-3">edge-level reference only (see evidenceRef)</span>
                )}
              </div>

              {edgeFindings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-1)] space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" /> Linked findings on this relationship
                  </div>
                  {edgeFindings.map((f) => (
                    <div key={f.id} className="glass-well rounded-lg px-2.5 py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-ink font-semibold truncate" title={f.title}>{f.title}</div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                              f.severity === 'CRITICAL' || f.severity === 'HIGH'
                                ? 'bg-[#d15b5b]/15 text-[#e05c5c]'
                                : f.severity === 'MEDIUM'
                                  ? 'bg-[#d9a95a]/15 text-[#d9a95a]'
                                  : f.severity === 'LOW'
                                    ? 'bg-[#7ea9dd]/15 text-[#7ea9dd]'
                                    : 'bg-white/8 text-ink-3'
                            }`}
                          >
                            {f.severity}
                          </span>
                          {onOpenFinding && (
                            <button
                              onClick={() => onOpenFinding(f)}
                              className="text-[9px] font-bold text-accent border border-accent/30 bg-accent/12 hover:bg-accent/20 rounded-md px-1.5 py-1 cursor-pointer"
                            >
                              Open
                            </button>
                          )}
                        </div>
                      </div>
                      {f.tripartite.observed[0] && (
                        <div className="text-[9.5px] text-ink-2">
                          <span className="text-ok font-bold uppercase text-[8.5px] mr-1">Observed:</span>
                          {f.tripartite.observed[0]}
                        </div>
                      )}
                      {f.tripartite.inferred[0] && (
                        <div className="text-[9.5px] text-ink-3">
                          <span className="text-warn font-bold uppercase text-[8.5px] mr-1">Inferred:</span>
                          {f.tripartite.inferred[0]}
                        </div>
                      )}
                      {f.tripartite.unknown[0] && (
                        <div className="text-[9.5px] text-ink-3 border-l border-dashed border-[var(--border-2)] pl-1.5">
                          <span className="text-ink-2 font-bold uppercase text-[8.5px] mr-1">UNKNOWN:</span>
                          {f.tripartite.unknown[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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