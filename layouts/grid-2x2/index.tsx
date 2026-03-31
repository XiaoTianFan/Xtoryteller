import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function Grid2x2Layout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.grid2x2} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
