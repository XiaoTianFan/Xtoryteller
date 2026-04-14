import { ProjectIcon } from '@/components/_shared/project-icon';
import styles from '@/components/_shared/diagram.module.css';

interface CycleStage {
  label?: string;
  detail?: string;
  icon?: string;
}

function stageList(value: unknown): CycleStage[] {
  return Array.isArray(value) ? (value as CycleStage[]) : [];
}

const NODE_R = 42;      // node circle radius
const ORBIT_R = 120;    // distance from diagram centre to node centres
const CX = 360;         // diagram centre x
const CY = 255;         // diagram centre y
const CTRL_FACTOR = 1.65; // how far outward to push the bezier control point
const TEXT_GAP = 14;    // gap between node edge and label baseline

export default function CycleDiagram({ props }: { props?: Record<string, unknown> }) {
  const stages = stageList(props?.stages);
  const n = Math.max(stages.length, 1);
  const dir = props?.direction === 'counterclockwise' ? -1 : 1;

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 720 530" role="img" aria-label="Cycle diagram">
        <defs>
          {/* refX=9 places the arrowhead tip exactly at the path endpoint */}
          <marker id="cycleArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0 0 0 6 9 3z" fill="var(--color-muted)" />
          </marker>
        </defs>

        {stages.map((stage, i) => {
          const angle     = (Math.PI * 2 * i * dir) / n - Math.PI / 2;
          const nextAngle = (Math.PI * 2 * ((i + 1) % n) * dir) / n - Math.PI / 2;

          // Node centres on orbit circle
          const x  = CX + Math.cos(angle)     * ORBIT_R;
          const y  = CY + Math.sin(angle)      * ORBIT_R;
          const nx = CX + Math.cos(nextAngle)  * ORBIT_R;
          const ny = CY + Math.sin(nextAngle)  * ORBIT_R;

          // Control point: midpoint angle between the two nodes, pushed outward
          const midAngle = angle + (Math.PI * dir) / n;
          const cpX = CX + Math.cos(midAngle) * (ORBIT_R * CTRL_FACTOR);
          const cpY = CY + Math.sin(midAngle) * (ORBIT_R * CTRL_FACTOR);

          // Arrow start: edge of source node in the direction toward the control point
          const sdx = cpX - x, sdy = cpY - y;
          const sd  = Math.sqrt(sdx * sdx + sdy * sdy);
          const sx  = x + (sdx / sd) * NODE_R;
          const sy  = y + (sdy / sd) * NODE_R;

          // Arrow end: edge of destination node from the direction of the control point
          const edx = nx - cpX, edy = ny - cpY;
          const ed  = Math.sqrt(edx * edx + edy * edy);
          const ex  = nx - (edx / ed) * NODE_R;
          const ey  = ny - (edy / ed) * NODE_R;

          // Label: radially outward from each node centre
          const textDist   = ORBIT_R + NODE_R + TEXT_GAP;
          const textX      = CX + Math.cos(angle) * textDist;
          const textY      = CY + Math.sin(angle) * textDist;
          const cosA       = Math.cos(angle);
          const textAnchor = Math.abs(cosA) < 0.25 ? 'middle' : cosA > 0 ? 'start' : 'end';

          return (
            <g key={`stage-${i}`}>
              {/* Outward-bending arrow */}
              <path
                d={`M${sx} ${sy} Q${cpX} ${cpY} ${ex} ${ey}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
                markerEnd="url(#cycleArrow)"
              />

              {/* Node circle */}
              <circle cx={x} cy={y} r={NODE_R} fill="var(--color-surface)" stroke="var(--color-border)" />

              {/* Icon centred inside node */}
              {stage.icon && (
                <foreignObject x={x - 15} y={y - 15} width="30" height="30">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <ProjectIcon name={stage.icon} size={20} color="currentColor" />
                  </div>
                </foreignObject>
              )}

              {/* Label radially outside the node */}
              <text
                x={textX}
                y={textY}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className={styles.label}
              >
                {stage.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
