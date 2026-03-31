import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, getRatioColumns, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function MediaLeftContentRightLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.mediaLeftContentRight, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateColumns: getRatioColumns(layoutProps?.ratio, '40-60')
      }}
    >
      {wrapPanels(items)}
    </div>
  );
}
