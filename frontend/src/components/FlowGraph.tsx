'use client';
import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  NodeProps,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphData } from '../types';

interface FlowGraphProps {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
  highlightedPath?: string[];
}

type WalletNodeData = GraphData['nodes'][number]['data'];
type WalletNodeType = Node<WalletNodeData, 'wallet'>;
type TransactionEdgeData = GraphData['edges'][number]['data'];
type TransactionEdgeType = Edge<TransactionEdgeData, 'custom'>;

const WalletNode = ({ data }: NodeProps<WalletNodeType>) => {
  const isSuspect = data.type === 'suspect';
  const isVasp = data.type === 'vasp';
  const isExchange = data.type === 'exchange';
  
  let borderColor = 'border-slate-300 dark:border-slate-700';
  let glow = '';
  
  if (isSuspect) {
    borderColor = 'border-red-500';
    glow = 'shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse';
  } else if (isVasp) {
    borderColor = 'border-emerald-500';
    glow = 'shadow-[0_0_15px_rgba(16,185,129,0.35)]';
  } else if (isExchange) {
    borderColor = 'border-blue-500';
    glow = 'shadow-[0_0_15px_rgba(59,130,246,0.35)]';
  }

  const truncLabel = typeof data.label === 'string' && data.label.length > 15
    ? data.label.substring(0, 6) + '...' + data.label.substring(data.label.length - 4)
    : data.label;

  return (
    <div className={`glass-card p-3 rounded-xl border ${borderColor} ${glow} min-w-[125px] text-center bg-white/95 dark:bg-[#12121a]/95 backdrop-blur shadow-sm`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-400" />
      
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-bold">{data.type}</div>
      <div className="font-mono text-xs text-slate-900 dark:text-slate-100 font-semibold">{truncLabel}</div>
      {data.riskScore !== undefined && (
        <div className={`mt-2 text-[10px] rounded-full px-2 py-0.5 inline-block font-mono font-bold ${
          data.riskScore > 75 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' 
            : data.riskScore > 40 
            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
        }`}>
          Risk: {data.riskScore}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-400" />
    </div>
  );
};

const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps<TransactionEdgeType>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: 10,
            fontWeight: 600,
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-slate-100 dark:bg-[#12121a] text-blue-600 dark:text-blue-400 border border-slate-300 dark:border-blue-500/30 shadow-sm font-mono"
        >
          {data?.amount} {data?.currency}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = {
  wallet: WalletNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function FlowGraph({ data, onNodeClick, highlightedPath = [] }: FlowGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Basic left-to-right layout based on BFS
    const nodeDepths: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    
    data.nodes.forEach(n => {
      adj[n.data.id] = [];
    });
    
    data.edges.forEach(e => {
      if (!adj[e.data.source]) adj[e.data.source] = [];
      adj[e.data.source].push(e.data.target);
    });

    // Find sources (in-degree 0)
    const inDegree: Record<string, number> = {};
    data.nodes.forEach(n => inDegree[n.data.id] = 0);
    data.edges.forEach(e => {
      inDegree[e.data.target] = (inDegree[e.data.target] || 0) + 1;
    });

    let queue = data.nodes.filter(n => inDegree[n.data.id] === 0).map(n => n.data.id);
    if (queue.length === 0 && data.nodes.length > 0) queue.push(data.nodes[0].data.id);

    queue.forEach(id => nodeDepths[id] = 0);
    
    while(queue.length > 0) {
      const curr = queue.shift()!;
      const d = nodeDepths[curr];
      (adj[curr] || []).forEach(neighbor => {
        if (nodeDepths[neighbor] === undefined) {
          nodeDepths[neighbor] = d + 1;
          queue.push(neighbor);
        } else if (nodeDepths[neighbor] < d + 1) {
          nodeDepths[neighbor] = d + 1;
        }
      });
    }

    const depthCounts: Record<number, number> = {};
    
    const flowNodes: Node[] = data.nodes.map(n => {
      const d = nodeDepths[n.data.id] || 0;
      const countAtDepth = depthCounts[d] || 0;
      depthCounts[d] = countAtDepth + 1;
      
      const isHighlighted = highlightedPath.includes(n.data.id);
      
      return {
        id: n.data.id,
        type: 'wallet',
        position: { x: d * 280, y: countAtDepth * 140 },
        data: n.data,
        style: isHighlighted ? { zIndex: 10 } : {},
      };
    });

    const flowEdges: Edge[] = data.edges.map(e => {
      const isHighlighted = 
        highlightedPath.includes(e.data.source) && 
        highlightedPath.includes(e.data.target);

      return {
        id: `${e.data.source}-${e.data.target}`,
        source: e.data.source,
        target: e.data.target,
        type: 'custom',
        animated: isHighlighted,
        data: e.data,
        style: {
          stroke: isHighlighted ? '#2563EB' : '#94A3B8',
          strokeWidth: isHighlighted ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: isHighlighted ? '#2563EB' : '#94A3B8',
        },
      };
    });

    // Center y positions vertically
    const maxYs: Record<number, number> = {};
    flowNodes.forEach(n => {
      const d = nodeDepths[n.id] || 0;
      if (!maxYs[d] || n.position.y > maxYs[d]) maxYs[d] = n.position.y;
    });
    
    flowNodes.forEach(n => {
      const d = nodeDepths[n.id] || 0;
      const offset = maxYs[d] / 2;
      n.position.y -= offset;
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [data, highlightedPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClickInternal = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden glass-card border border-[var(--border-color)] bg-[var(--bg-app)] relative shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickInternal}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="rgba(148, 163, 184, 0.15)" gap={16} size={1} />
        <Controls className="!bg-white dark:!bg-[#12121a] !border-[var(--border-color)] !fill-slate-700 dark:!fill-slate-200 !shadow-sm" />
        <MiniMap 
          nodeColor={(n) => {
            const data = n.data as any;
            if (data.type === 'suspect') return '#EF4444';
            if (data.type === 'vasp') return '#10B981';
            if (data.type === 'exchange') return '#2563EB';
            return '#94A3B8';
          }}
          maskColor="rgba(15, 23, 42, 0.4)"
          className="!bg-white dark:!bg-[#12121a] !border-[var(--border-color)] rounded-xl overflow-hidden !shadow-md" 
        />
      </ReactFlow>
    </div>
  );
}
