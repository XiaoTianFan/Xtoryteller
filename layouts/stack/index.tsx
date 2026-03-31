import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function StackLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.stack} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
