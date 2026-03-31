import styles from '@/components/_shared/diagram.module.css';

interface VennSet {
  label?: string;
  color?: string;
}

interface VennIntersection {
  sets?: string[];
  label?: string;
}

function setList(value: unknown): VennSet[] {
  return Array.isArray(value) ? (value as VennSet[]).slice(0, 3) : [];
}

function intersectionList(value: unknown): VennIntersection[] {
  return Array.isArray(value) ? (value as VennIntersection[]) : [];
}

export default function VennDiagram({ props }: { props?: Record<string, unknown> }) {
  const sets = setList(props?.sets);
  const intersections = intersectionList(props?.intersections);
  const positions =
    sets.length === 2
      ? [
          { cx: 250, cy: 180 },
          { cx: 420, cy: 180 }
        ]
      : [
          { cx: 280, cy: 145 },
          { cx: 410, cy: 145 },
          { cx: 345, cy: 255 }
        ];

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 380" role="img" aria-label="Venn diagram">
        {sets.map((set, index) => (
          <g key={`${set.label}-${index}`}>
            <circle
              cx={positions[index]?.cx ?? 200}
              cy={positions[index]?.cy ?? 180}
              r="110"
              fill={set.color ?? ['#4f8ef7', '#2ba892', '#f59e0b'][index] ?? 'var(--color-primary)'}
              opacity={Number(props?.opacity ?? 0.28)}
              stroke={set.color ?? ['#4f8ef7', '#2ba892', '#f59e0b'][index] ?? 'var(--color-primary)'}
            />
            <text x={positions[index]?.cx ?? 200} y={(positions[index]?.cy ?? 180) - 118} textAnchor="middle" className={styles.label}>
              {set.label}
            </text>
          </g>
        ))}
        {intersections.map((intersection, index) => (
          <text
            key={`${intersection.label}-${index}`}
            x={345}
            y={sets.length === 2 ? 185 + index * 22 : 205 + index * 24}
            textAnchor="middle"
            className={styles.label}
          >
            {intersection.label}
          </text>
        ))}
      </svg>
    </figure>
  );
}
