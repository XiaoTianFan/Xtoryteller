import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function SingleContentLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.singleContent} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
