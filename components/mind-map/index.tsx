'use client';

import styles from '@/components/_shared/diagram.module.css';

interface BranchNode {
  label: string;
  detail?: string;
  children?: BranchNode[];
}

export default function MindMap({ props }: { props?: Record<string, unknown> }) {
  const root = (props?.root as { label?: string }) ?? { label: 'Topic' };
  const branches = Array.isArray(props?.branches) ? (props?.branches as BranchNode[]) : [];

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 720 420" role="img" aria-label="Mind map">
        <circle cx="360" cy="210" r="56" className={styles.surface} />
        <text x="360" y="214" textAnchor="middle" className={styles.label}>{root.label}</text>
        {branches.map((branch, index) => {
          const angle = ((Math.PI * 2) / Math.max(branches.length, 1)) * index;
          const x = 360 + Math.cos(angle) * 190;
          const y = 210 + Math.sin(angle) * 140;
          return (
            <g key={`${branch.label}-${index}`}>
              <path d={`M360 210 Q ${(360 + x) / 2} ${(210 + y) / 2 - 20} ${x} ${y}`} className={styles.line} fill="none" />
              <circle cx={x} cy={y} r="36" fill={`hsl(${(index * 68) % 360} 55% 72%)`} stroke="var(--color-border)" />
              <text x={x} y={y + 4} textAnchor="middle" className={styles.label}>{branch.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
