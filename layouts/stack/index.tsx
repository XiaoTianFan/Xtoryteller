import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function StackLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div className={joinLayoutClasses(styles.frame, styles.stack, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      {wrapPanels(items)}
    </div>
  );
}
