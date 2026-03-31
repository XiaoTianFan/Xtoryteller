'use client';

import styles from '@/components/_shared/diagram.module.css';

interface Layer {
  depth: string;
  label: string;
  items: string[];
}

export default function IcebergDiagram({ props }: { props?: Record<string, unknown> }) {
  const layers = Array.isArray(props?.layers) ? (props?.layers as Layer[]) : [];
  const waterline = Number(props?.waterlinePosition ?? 0.28);
  const waterY = 80 + waterline * 280;

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 640 420" role="img" aria-label="Iceberg diagram">
        <rect x="0" y={waterY} width="640" height={420 - waterY} fill="color-mix(in srgb, var(--color-secondary) 28%, white 72%)" />
        <polygon points={`220,70 420,70 520,${waterY} 120,${waterY}`} fill="var(--color-surface)" stroke="var(--color-border)" />
        <polygon points={`120,${waterY} 520,${waterY} 440,360 200,360`} fill="color-mix(in srgb, var(--color-secondary) 18%, var(--color-surface) 82%)" stroke="var(--color-border)" />
        {layers.map((layer, index) => {
          const y = 96 + index * 70;
          return (
            <g key={`${layer.depth}-${index}`}>
              <text x="320" y={y} textAnchor="middle" className={styles.label}>{layer.label}</text>
              <text x="320" y={y + 24} textAnchor="middle" className={styles.label}>{layer.items.join(' · ')}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
