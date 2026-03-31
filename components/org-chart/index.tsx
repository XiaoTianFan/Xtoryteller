import styles from '@/components/_shared/diagram.module.css';

interface OrgNode {
  label?: string;
  detail?: string;
  children?: OrgNode[];
}

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  parentId?: string;
}

function flattenTree(root: OrgNode, spacingX: number, spacingY: number) {
  const nodes: PositionedNode[] = [];
  let cursor = 0;
  let nodeIndex = 0;

  const walk = (node: OrgNode, depth: number, parentId?: string): { center: number; id: string } => {
    const id = `${node.label ?? 'node'}-${nodeIndex}`;
    nodeIndex += 1;
    const children = Array.isArray(node.children) ? node.children : [];
    let center = cursor;

    if (children.length) {
      const spans = children.map((child) => walk(child, depth + 1, id));
      center = (spans[0].center + spans[spans.length - 1].center) / 2;
    } else {
      center = cursor;
      cursor += spacingX;
    }

    nodes.push({
      id,
      label: String(node.label ?? 'Node'),
      x: center,
      y: 60 + depth * spacingY,
      width: 132,
      depth,
      parentId
    });

    if (children.length) {
      cursor += spacingX * 0.2;
    }

    return { center, id };
  };

  walk(root, 0);
  return nodes;
}

export default function OrgChart({ props }: { props?: Record<string, unknown> }) {
  const root = (props?.root as OrgNode | undefined) ?? { label: 'Root' };
  const direction = props?.direction === 'left-right' ? 'left-right' : 'top-bottom';
  const nodes = flattenTree(root, 170, 110);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 760 420" role="img" aria-label="Org chart">
        {nodes.map((node) => {
          if (!node.parentId) {
            return null;
          }

          const parent = nodeMap.get(node.parentId);
          if (!parent) {
            return null;
          }

          if (direction === 'left-right') {
            return (
              <path
                key={`${parent.id}-${node.id}`}
                d={`M${parent.y + 70} ${parent.x + 66} C ${parent.y + 105} ${parent.x + 66}, ${node.y + 15} ${node.x + 66}, ${node.y + 50} ${node.x + 66}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
              />
            );
          }

          return (
            <path
              key={`${parent.id}-${node.id}`}
              d={`M${parent.x + 66} ${parent.y + 42} C ${parent.x + 66} ${parent.y + 72}, ${node.x + 66} ${node.y - 30}, ${node.x + 66} ${node.y}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
          );
        })}

        {nodes.map((node) => {
          const x = direction === 'left-right' ? node.y : node.x;
          const y = direction === 'left-right' ? node.x : node.y;

          return (
            <g key={node.id} transform={`translate(${x}, ${y})`}>
              <rect width="132" height="44" rx="16" className={styles.surface} />
              <text x="66" y="27" textAnchor="middle" className={styles.label}>{node.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
