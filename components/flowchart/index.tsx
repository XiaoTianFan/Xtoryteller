'use client';

import styles from '@/components/_shared/diagram.module.css';

interface FlowNode {
  id: string;
  label: string;
  type: 'action' | 'decision' | 'start' | 'end';
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export default function Flowchart({ props }: { props?: Record<string, unknown> }) {
  const nodes = Array.isArray(props?.nodes) ? (props?.nodes as FlowNode[]) : [];
  const edges = Array.isArray(props?.edges) ? (props?.edges as FlowEdge[]) : [];
  const positioned = nodes.map((node, index) => ({
    ...node,
    x: 90 + (index % 3) * 210,
    y: 70 + Math.floor(index / 3) * 120
  }));
  const nodeMap = new Map(positioned.map((node) => [node.id, node]));

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 420" role="img" aria-label="Flowchart">
        {edges.map((edge, index) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          return <line key={`${edge.from}-${edge.to}-${index}`} x1={from.x + 60} y1={from.y + 25} x2={to.x + 60} y2={to.y + 25} className={styles.line} markerEnd="url(#flowArrow)" />;
        })}
        {positioned.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            {node.type === 'decision' ? (
              <polygon points="60,0 120,25 60,50 0,25" fill="var(--color-warning)" opacity="0.26" stroke="var(--color-warning)" />
            ) : (
              <rect width="120" height="50" rx="18" className={styles.surface} />
            )}
            <text x="60" y="30" textAnchor="middle" className={styles.label}>{node.label}</text>
          </g>
        ))}
        <defs>
          <marker id="flowArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="var(--color-muted)" />
          </marker>
        </defs>
      </svg>
    </figure>
  );
}
