import styles from '@/components/_shared/diagram.module.css';

interface RadarAxis {
  label?: string;
  max?: number;
}

interface RadarDataset {
  label?: string;
  values?: number[];
  color?: string;
}

function polarPoint(index: number, total: number, radius: number, centerX: number, centerY: number) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

const themePalette = [
  'var(--color-diagram-series-1, var(--color-primary))',
  'var(--color-diagram-series-2, var(--color-secondary))',
  'var(--color-diagram-series-3, var(--color-accent))'
];

export default function RadarChart({ props }: { props?: Record<string, unknown> }) {
  const axes = Array.isArray(props?.axes) ? (props.axes as RadarAxis[]) : [];
  const datasets = Array.isArray(props?.datasets) ? (props.datasets as RadarDataset[]) : [];
  const centerX = 320;
  const centerY = 180;
  const radius = 128;

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 420" role="img" aria-label="Radar chart">
        {[0.25, 0.5, 0.75, 1].map((step) => (
          <polygon
            key={step}
            points={axes.map((_, index) => {
              const point = polarPoint(index, axes.length, radius * step, centerX, centerY);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--color-border)"
          />
        ))}

        {axes.map((axis, index) => {
          const point = polarPoint(index, axes.length, radius, centerX, centerY);
          const labelPoint = polarPoint(index, axes.length, radius + 28, centerX, centerY);

          return (
            <g key={`${axis.label}-${index}`}>
              <line x1={centerX} y1={centerY} x2={point.x} y2={point.y} className={styles.line} />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" className={styles.label}>
                {axis.label}
              </text>
            </g>
          );
        })}

        {datasets.map((dataset, datasetIndex) => {
          const color = dataset.color ?? themePalette[datasetIndex] ?? 'var(--color-primary)';
          const points = axes.map((axis, axisIndex) => {
            const rawValue = Number(dataset.values?.[axisIndex] ?? 0);
            const max = Number(axis.max ?? 100) || 100;
            const point = polarPoint(axisIndex, axes.length, radius * Math.min(1, Math.max(0, rawValue / max)), centerX, centerY);
            return `${point.x},${point.y}`;
          });

          return (
            <g key={`${dataset.label}-${datasetIndex}`}>
              <polygon points={points.join(' ')} fill={color} fillOpacity={Number(props?.fillOpacity ?? 0.2)} stroke={color} strokeWidth="2.5" />
              {props?.showValues
                ? points.map((point, index) => {
                    const [x, y] = point.split(',').map(Number);
                    return (
                      <text key={index} x={x} y={y - 8} textAnchor="middle" className={styles.label}>
                        {dataset.values?.[index]}
                      </text>
                    );
                  })
                : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
