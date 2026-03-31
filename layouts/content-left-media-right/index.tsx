import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function ContentLeftMediaRightLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.contentLeftMediaRight} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
