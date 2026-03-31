import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, getRatioColumns, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function SidebarMainLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.sidebarMain, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateColumns: getRatioColumns(layoutProps?.ratio, '30-70')
      }}
    >
      {wrapPanels(items)}
    </div>
  );
}
