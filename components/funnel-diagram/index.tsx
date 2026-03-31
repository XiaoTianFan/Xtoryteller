import styles from '@/components/_shared/diagram.module.css';

interface FunnelStage {
  label?: string;
  value?: string | number;
  detail?: string;
}

function stageList(value: unknown): FunnelStage[] {
  return Array.isArray(value) ? (value as FunnelStage[]) : [];
}

function colorFor(index: number) {
  const palette = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-foreground)', 'var(--color-muted)'];
  return palette[index % palette.length];
}

export default function FunnelDiagram({ props }: { props?: Record<string, unknown> }) {
  const stages = stageList(props?.stages);
  const showValues = props?.showValues !== false;

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 380" role="img" aria-label="Funnel diagram">
        {stages.map((stage, index) => {
          const topWidth = 560 - index * 95;
          const bottomWidth = 470 - index * 95;
          const y = 28 + index * 68;
          const topX = 340 - topWidth / 2;
          const bottomX = 340 - bottomWidth / 2;
          const nextBottomWidth = Math.max(bottomWidth, 120);
          const points = `${topX},${y} ${topX + topWidth},${y} ${bottomX + nextBottomWidth},${y + 54} ${bottomX},${y + 54}`;

          return (
            <g key={`${stage.label}-${index}`}>
              <polygon points={points} fill={colorFor(index)} opacity={0.22 + index * 0.05} stroke={colorFor(index)} />
              <text x="340" y={y + 26} textAnchor="middle" className={styles.label}>{stage.label}</text>
              {showValues && stage.value != null ? (
                <text x="340" y={y + 42} textAnchor="middle" className={styles.label}>{String(stage.value)}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
