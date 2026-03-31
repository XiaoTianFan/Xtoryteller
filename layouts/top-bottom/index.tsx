import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, getRatioRows, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function TopBottomLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.topBottom, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateRows: getRatioRows(layoutProps?.ratio, '50-50')
      }}
    >
      {wrapPanels(items.slice(0, 2))}
    </div>
  );
}
