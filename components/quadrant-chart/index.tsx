'use client';

import styles from '@/components/_shared/diagram.module.css';

interface QuadrantItem {
  label: string;
  x: number;
  y: number;
}

export default function QuadrantChart({ props }: { props?: Record<string, unknown> }) {
  const items = Array.isArray(props?.items) ? (props?.items as QuadrantItem[]) : [];
  const xAxis = (props?.xAxis as { label?: string; low?: string; high?: string }) ?? {};
  const yAxis = (props?.yAxis as { label?: string; low?: string; high?: string }) ?? {};

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 640 420" role="img" aria-label="Quadrant chart">
        <rect x="40" y="30" width="560" height="320" fill="var(--color-surface)" stroke="var(--color-border)" />
        <line x1="320" y1="30" x2="320" y2="350" className={styles.line} />
        <line x1="40" y1="190" x2="600" y2="190" className={styles.line} />
        <text x="320" y="395" textAnchor="middle" className={styles.label}>{xAxis.label ?? 'X axis'}</text>
        <text x="320" y="18" textAnchor="middle" className={styles.label}>{yAxis.label ?? 'Y axis'}</text>
        {items.map((item, index) => (
          <g key={`${item.label}-${index}`}>
            <circle cx={40 + item.x * 560} cy={350 - item.y * 320} r="10" className={styles.dot} />
            <text x={54 + item.x * 560} y={346 - item.y * 320} className={styles.label}>{item.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
