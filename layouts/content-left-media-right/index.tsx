import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, getRatioColumns, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function ContentLeftMediaRightLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.contentLeftMediaRight, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateColumns: getRatioColumns(layoutProps?.ratio, '60-40')
      }}
    >
      {wrapPanels(items)}
    </div>
  );
}
