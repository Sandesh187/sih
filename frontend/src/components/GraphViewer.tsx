'use client';
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { GraphData } from '@/types';

cytoscape.use(dagre);

interface GraphViewerProps {
  data: GraphData;
}

export default function GraphViewer({ data }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...data.nodes.map(n => ({ data: n.data })),
        ...data.edges.map(e => ({ data: e.data }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': (ele: cytoscape.NodeSingular) => {
              const type = ele.data('type');
              if (type === 'suspect') return '#ff4444'; // danger
              if (type === 'vasp') return '#00ff88'; // success
              if (type === 'exchange') return '#00d4ff'; // accent
              return '#4b5563'; // gray
            },
            'color': '#fff',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'text-outline-width': 2,
            'text-outline-color': '#12121a'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#374151',
            'target-arrow-color': '#374151',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': (ele: cytoscape.EdgeSingular) => `${ele.data('amount')} ${ele.data('currency')}`,
            'font-size': '10px',
            'color': '#9ca3af',
            'text-background-opacity': 1,
            'text-background-color': '#12121a',
            'text-background-padding': '2px'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 50,
      }
    });

    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [data]);

  return (
    <div className="w-full h-[500px] bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-mono">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-danger"></div>Suspect</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div>VASP</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent"></div>Exchange</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-600"></div>Intermediate</div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
