import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function SectionHeaderLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div className={joinLayoutClasses(styles.frame, styles.sectionHeader, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      {wrapPanels(items.slice(0, 2))}
    </div>
  );
}
