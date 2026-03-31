import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function SidebarMainLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.sidebarMain} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
