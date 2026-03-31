import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function MediaLeftContentRightLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.mediaLeftContentRight} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
