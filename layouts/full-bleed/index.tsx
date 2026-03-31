import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function FullBleedLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.fullBleed} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
