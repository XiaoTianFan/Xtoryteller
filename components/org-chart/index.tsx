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
      // No hardcoded offset — y starts at 0 for depth 0
      x: center,
      y: depth * spacingY,
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

  // Raw render coords (no padding yet)
  const rawNodes = flattenTree(root, HORIZONTAL_SPACING, VERTICAL_SPACING).map((node) => ({
    ...node,
    renderX: direction === 'left-right' ? node.y : node.x,
    renderY: direction === 'left-right' ? node.x : node.y,
  }));

  // Measure bounding box and re-origin to uniform DIAGRAM_PADDING on all sides
  const minRX = Math.min(...rawNodes.map((n) => n.renderX));
  const minRY = Math.min(...rawNodes.map((n) => n.renderY));
  const maxRX = Math.max(...rawNodes.map((n) => n.renderX + NODE_WIDTH));
  const maxRY = Math.max(...rawNodes.map((n) => n.renderY + NODE_HEIGHT));

  const viewWidth  = (maxRX - minRX) + DIAGRAM_PADDING * 2;
  const viewHeight = (maxRY - minRY) + DIAGRAM_PADDING * 2;

  const nodes = rawNodes.map((n) => ({
    ...n,
    renderX: n.renderX - minRX + DIAGRAM_PADDING,
    renderY: n.renderY - minRY + DIAGRAM_PADDING,
  }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const hw = NODE_WIDTH  / 2;  // half-width  = 66
  const hh = NODE_HEIGHT / 2;  // half-height = 22

  return (
    <figure className={styles.shell}>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Org chart">
        {/* Connector paths */}
        {nodes.map((node) => {
          if (!node.parentId) return null;
          const parent = nodeMap.get(node.parentId);
          if (!parent) return null;

          if (direction === 'left-right') {
            // Right-centre of parent → left-centre of child
            const x1 = parent.renderX + NODE_WIDTH;
            const y1 = parent.renderY + hh;
            const x2 = node.renderX;
            const y2 = node.renderY + hh;
            const cx = (x1 + x2) / 2;
            return (
              <path
                key={`${parent.id}-${node.id}`}
                d={`M${x1} ${y1} C${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
              />
            );
          }

          // Bottom-centre of parent → top-centre of child
          const x1 = parent.renderX + hw;
          const y1 = parent.renderY + NODE_HEIGHT;
          const x2 = node.renderX + hw;
          const y2 = node.renderY;
          const cy = (y1 + y2) / 2;
          return (
            <path
              key={`${parent.id}-${node.id}`}
              d={`M${x1} ${y1} C${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
          );
        })}

        {/* Node rectangles and labels */}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.renderX}, ${node.renderY})`}>
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="16" className={styles.surface} />
            <text x={hw} y={hh + 5} textAnchor="middle" dominantBaseline="middle" className={styles.label}>
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
