import { ReactNode } from 'react';

import styles from '@/layouts/_shared/layout.module.css';

export default function ScatteredLayout({
  items,
  compact
}: {
  items: ReactNode[];
  compact?: boolean;
}) {
  return (
    <div className={`${styles.frame} ${styles.scattered} ${compact ? styles.compact : ''}`}>
      {items.map((item, index) => {
        const x = 8 + (index % 3) * 28;
        const y = 8 + Math.floor(index / 3) * 24;
        return (
          <div key={index} className={styles.scatterItem} style={{ left: `${x}%`, top: `${y}%` }}>
            {item}
          </div>
        );
      })}
    </div>
  );
}
