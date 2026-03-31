'use client';

import styles from '@/components/_shared/diagram.module.css';

interface Variable {
  id: string;
  label: string;
  detail?: string;
}

interface Edge {
  from: string;
  to: string;
  polarity: '+' | '-';
  label?: string;
}

function positionVariables(variables: Variable[]) {
  return variables.map((variable, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(variables.length, 1);
    return {
      ...variable,
      x: 320 + Math.cos(angle) * 190,
      y: 210 + Math.sin(angle) * 130
    };
  });
}

export default function CausalDiagram({ props }: { props?: Record<string, unknown> }) {
  const variables = Array.isArray(props?.variables) ? (props?.variables as Variable[]) : [];
  const edges = Array.isArray(props?.edges) ? (props?.edges as Edge[]) : [];
  const nodes = positionVariables(variables);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 640 420" role="img" aria-label="Causal diagram">
        {edges.map((edge, index) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) {
            return null;
          }

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={styles.line} markerEnd="url(#arrow)" />
              <circle cx={midX} cy={midY} r="15" fill={edge.polarity === '+' ? 'var(--color-success)' : 'var(--color-error)'} />
              <text x={midX} y={midY + 5} textAnchor="middle" fill="white" fontSize="12">{edge.polarity}</text>
            </g>
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="46" className={styles.surface} />
            <text x={node.x} y={node.y} textAnchor="middle" className={styles.label}>
              <tspan x={node.x} dy="0">{node.label}</tspan>
            </text>
          </g>
        ))}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="var(--color-muted)" />
          </marker>
        </defs>
      </svg>
    </figure>
  );
}
