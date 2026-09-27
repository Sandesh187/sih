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
  
  let borderColor = 'border-gray-600';
  let glow = '';
  
  if (isSuspect) {
    borderColor = 'border-[#ff4444]';
    glow = 'shadow-[0_0_15px_rgba(255,68,68,0.5)] animate-pulse';
  } else if (isVasp) {
    borderColor = 'border-[#00ff88]';
    glow = 'shadow-[0_0_15px_rgba(0,255,136,0.4)]';
  } else if (isExchange) {
    borderColor = 'border-[#00d4ff]';
    glow = 'shadow-[0_0_15px_rgba(0,212,255,0.4)]';
  }

  const truncLabel = typeof data.label === 'string' && data.label.length > 15
    ? data.label.substring(0, 6) + '...' + data.label.substring(data.label.length - 4)
    : data.label;

  return (
    <div className={`glass-card p-3 rounded-xl border ${borderColor} ${glow} min-w-[120px] text-center bg-[#12121a]/90 backdrop-blur`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-gray-400" />
      
      <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">{data.type}</div>
      <div className="font-mono text-sm text-white font-medium">{truncLabel}</div>
      {data.riskScore !== undefined && (
        <div className={`mt-2 text-xs rounded-full px-2 py-0.5 inline-block ${data.riskScore > 75 ? 'bg-[#ff4444]/20 text-[#ff4444]' : data.riskScore > 40 ? 'bg-[#ffaa00]/20 text-[#ffaa00]' : 'bg-[#00ff88]/20 text-[#00ff88]'}`}>
          Risk: {data.riskScore}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-400" />
    </div>
  );
};

const CustomEdge = ({
  id,
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
            background: 'rgba(18, 18, 26, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: 10,
            color: '#00d4ff',
            fontWeight: 500,
            border: '1px solid rgba(0, 212, 255, 0.2)',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
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
    if (queue.length === 0 && data.nodes.length > 0) queue.push(data.nodes[0].data.id); // fallback for cycles

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
        position: { x: d * 300, y: countAtDepth * 150 },
        data: { ...n.data, isHighlighted },
      };
    });

    const flowEdges: Edge[] = data.edges.map(e => {
      const isHighlighted = highlightedPath.includes(e.data.source) && highlightedPath.includes(e.data.target);
      return {
        id: `${e.data.source}-${e.data.target}`,
        source: e.data.source,
        target: e.data.target,
        type: 'custom',
        animated: true,
        data: { amount: e.data.amount, currency: e.data.currency },
        style: {
          stroke: isHighlighted ? '#00d4ff' : '#4b5563',
          strokeWidth: isHighlighted ? 3 : 1.5,
          opacity: 0.8
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isHighlighted ? '#00d4ff' : '#4b5563',
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
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden glass-card border border-white/10 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickInternal}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-[#0a0a0f]"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="rgba(255, 255, 255, 0.05)" gap={16} size={1} />
        <Controls className="!bg-[#12121a] !border-white/10 !fill-white" />
        <MiniMap 
          nodeColor={(n) => {
            const data = n.data as any;
            if (data.type === 'suspect') return '#ff4444';
            if (data.type === 'vasp') return '#00ff88';
            if (data.type === 'exchange') return '#00d4ff';
            return '#4b5563';
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
          className="!bg-[#12121a] !border-white/10 rounded-lg overflow-hidden" 
        />
      </ReactFlow>
    </div>
  );
}
