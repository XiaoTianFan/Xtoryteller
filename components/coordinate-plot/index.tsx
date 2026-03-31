import styles from '@/components/_shared/diagram.module.css';

interface PlotPoint {
  label?: string;
  x: number;
  y: number;
  radius?: number;
  color?: string;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function CoordinatePlot({ props }: { props?: Record<string, unknown> }) {
  const points = Array.isArray(props?.points) ? (props.points as PlotPoint[]) : [];
  const xAxis = (props?.xAxis as { label?: string; min?: number; max?: number } | undefined) ?? {};
  const yAxis = (props?.yAxis as { label?: string; min?: number; max?: number } | undefined) ?? {};
  const minX = Number(xAxis.min ?? 0);
  const maxX = Number(xAxis.max ?? 100);
  const minY = Number(yAxis.min ?? 0);
  const maxY = Number(yAxis.max ?? 100);

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 720 420" role="img" aria-label="Coordinate plot">
        {props?.showGrid !== false
          ? [0.2, 0.4, 0.6, 0.8].map((step) => (
              <g key={step}>
                <line x1="90" y1={60 + 270 * step} x2="620" y2={60 + 270 * step} className={styles.line} opacity="0.5" />
                <line x1={90 + 530 * step} y1="60" x2={90 + 530 * step} y2="330" className={styles.line} opacity="0.5" />
              </g>
            ))
          : null}
        <line x1="90" y1="330" x2="620" y2="330" className={styles.line} />
        <line x1="90" y1="60" x2="90" y2="330" className={styles.line} />
        <text x="355" y="372" textAnchor="middle" className={styles.label}>{xAxis.label ?? 'X axis'}</text>
        <text x="36" y="198" textAnchor="middle" className={styles.label} transform="rotate(-90 36 198)">{yAxis.label ?? 'Y axis'}</text>

        {points.map((point, index) => {
          const x = 90 + clamp((Number(point.x) - minX) / Math.max(maxX - minX, 1)) * 530;
          const y = 330 - clamp((Number(point.y) - minY) / Math.max(maxY - minY, 1)) * 270;

          return (
            <g key={`${point.label}-${index}`}>
              <circle cx={x} cy={y} r={Number(point.radius ?? props?.defaultRadius ?? 18)} fill={point.color ?? String(props?.defaultColor ?? 'var(--color-primary)')} opacity="0.82" />
              {props?.showLabels !== false ? <text x={x} y={y - 24} textAnchor="middle" className={styles.label}>{point.label}</text> : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
