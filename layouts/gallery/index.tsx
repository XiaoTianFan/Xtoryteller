import styles from '@/layouts/_shared/layout.module.css';
import { LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function GalleryLayout({ items, compact }: LayoutProps) {
  return <div className={`${styles.frame} ${styles.gallery} ${compact ? styles.compact : ''}`}>{wrapPanels(items)}</div>;
}
