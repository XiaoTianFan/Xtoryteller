import styles from '@/components/_shared/diagram.module.css';

interface SankeyNode {
  id: string;
  label?: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

function assignLevels(nodes: SankeyNode[], links: SankeyLink[]) {
  const levels = new Map<string, number>();
  const incoming = new Map<string, SankeyLink[]>();

  for (const link of links) {
    const bucket = incoming.get(link.target) ?? [];
    bucket.push(link);
    incoming.set(link.target, bucket);
  }

  const visit = (nodeId: string): number => {
    if (levels.has(nodeId)) {
      return levels.get(nodeId) ?? 0;
    }

    const parents = incoming.get(nodeId) ?? [];
    const level = parents.length ? Math.max(...parents.map((parent) => visit(parent.source))) + 1 : 0;
    levels.set(nodeId, level);
    return level;
  };

  for (const node of nodes) {
    visit(node.id);
  }

  return levels;
}

export default function SankeyDiagram({ props }: { props?: Record<string, unknown> }) {
  const nodes = Array.isArray(props?.nodes) ? (props.nodes as SankeyNode[]) : [];
  const links = Array.isArray(props?.links) ? (props.links as SankeyLink[]) : [];
  const levels = assignLevels(nodes, links);
  const byLevel = new Map<number, SankeyNode[]>();

  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    const bucket = byLevel.get(level) ?? [];
    bucket.push(node);
    byLevel.set(level, bucket);
  }

  const positioned = new Map(
    nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const siblings = byLevel.get(level) ?? [];
      const index = siblings.findIndex((candidate) => candidate.id === node.id);
      const x = 80 + level * 170;
      const y = 70 + index * 95;
      return [node.id, { x, y, label: node.label ?? node.id }] as const;
    })
  );

  const maxValue = Math.max(...links.map((link) => Number(link.value)), 1);

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 760 420" role="img" aria-label="Sankey diagram">
        {links.map((link, index) => {
          const source = positioned.get(link.source);
          const target = positioned.get(link.target);

          if (!source || !target) {
            return null;
          }

          const strokeWidth = 8 + (Number(link.value) / maxValue) * 30;

          return (
            <path
              key={`${link.source}-${link.target}-${index}`}
              d={`M${source.x + 120} ${source.y + 22} C ${source.x + 170} ${source.y + 22}, ${target.x - 50} ${target.y + 22}, ${target.x} ${target.y + 22}`}
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity={Number(props?.opacity ?? 0.5)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {Array.from(positioned.entries()).map(([id, node]) => (
          <g key={id} transform={`translate(${node.x}, ${node.y})`}>
            <rect width="120" height="44" rx="14" className={styles.surface} />
            <text x="60" y="27" textAnchor="middle" className={styles.label}>{node.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
