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

export default function CycleDiagram({ props }: { props?: Record<string, unknown> }) {
  const stages = stageList(props?.stages);

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 420" role="img" aria-label="Cycle diagram">
        <defs>
          <marker id="cycleArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0 0 0 6 9 3z" fill="var(--color-muted)" />
          </marker>
        </defs>
        {stages.map((stage, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(stages.length, 1) - Math.PI / 2;
          const nextAngle = (Math.PI * 2 * ((index + 1) % Math.max(stages.length, 1))) / Math.max(stages.length, 1) - Math.PI / 2;
          const x = 340 + Math.cos(angle) * 125;
          const y = 205 + Math.sin(angle) * 125;
          const nextX = 340 + Math.cos(nextAngle) * 125;
          const nextY = 205 + Math.sin(nextAngle) * 125;

          return (
            <g key={`${stage.label}-${index}`}>
              <path
                d={`M${x} ${y} Q 340 205 ${nextX} ${nextY}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
                markerEnd="url(#cycleArrow)"
              />
              <g transform={`translate(${x - 42}, ${y - 42})`}>
                <circle cx="42" cy="42" r="42" fill="var(--color-surface)" stroke="var(--color-border)" />
                {stage.icon ? (
                  <foreignObject x="24" y="14" width="36" height="36">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--color-primary)' }}>
                      <ProjectIcon name={stage.icon} size={20} color="currentColor" />
                    </div>
                  </foreignObject>
                ) : null}
                <text x="42" y={stage.icon ? 60 : 48} textAnchor="middle" className={styles.label}>{stage.label}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
