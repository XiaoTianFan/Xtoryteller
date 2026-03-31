import { ReactNode } from 'react';

import styles from '@/layouts/_shared/layout.module.css';

export interface LayoutProps {
  items: ReactNode[];
  compact?: boolean;
}

export function wrapPanels(items: ReactNode[]) {
  return items.map((item, index) => (
    <div key={index} className={styles.panel}>
      {item}
    </div>
  ));
}
