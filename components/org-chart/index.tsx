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

const NODE_WIDTH = 132;
const NODE_HEIGHT = 44;
const HORIZONTAL_SPACING = 170;
const VERTICAL_SPACING = 110;
const DIAGRAM_PADDING = 40;

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
      width: NODE_WIDTH,
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
  const nodes = flattenTree(root, HORIZONTAL_SPACING, VERTICAL_SPACING).map((node) => ({
    ...node,
    renderX: (direction === 'left-right' ? node.y : node.x) + DIAGRAM_PADDING,
    renderY: (direction === 'left-right' ? node.x : node.y) + DIAGRAM_PADDING
  }));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const viewWidth =
    Math.max(...nodes.map((node) => node.renderX + NODE_WIDTH), NODE_WIDTH + DIAGRAM_PADDING * 2) + DIAGRAM_PADDING;
  const viewHeight =
    Math.max(...nodes.map((node) => node.renderY + NODE_HEIGHT), NODE_HEIGHT + DIAGRAM_PADDING * 2) + DIAGRAM_PADDING;

  return (
    <figure className={styles.shell}>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Org chart">
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
                d={`M${parent.renderX + 70} ${parent.renderY + 22} C ${parent.renderX + 105} ${parent.renderY + 22}, ${node.renderX + 15} ${node.renderY + 22}, ${node.renderX + 50} ${node.renderY + 22}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
              />
            );
          }

          return (
            <path
              key={`${parent.id}-${node.id}`}
              d={`M${parent.renderX + 66} ${parent.renderY + 42} C ${parent.renderX + 66} ${parent.renderY + 72}, ${node.renderX + 66} ${node.renderY - 30}, ${node.renderX + 66} ${node.renderY}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
          );
        })}

        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.renderX}, ${node.renderY})`}>
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="16" className={styles.surface} />
            <text x="66" y="27" textAnchor="middle" className={styles.label}>{node.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
