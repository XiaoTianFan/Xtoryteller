import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function TitleCenterLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div className={joinLayoutClasses(styles.frame, styles.titleCenter, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      {wrapPanels(items)}
    </div>
  );
}
