import styles from '@/layouts/_shared/layout.module.css';
import {
  getLayoutStyle,
  getRatioColumns,
  getVerticalAlign,
  joinLayoutClasses,
  LayoutProps,
  wrapPanels
} from '@/layouts/_shared/layout-helpers';

export default function TwoColumnLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.twoColumn, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateColumns: getRatioColumns(layoutProps?.ratio, '50-50'),
        alignItems: getVerticalAlign(layoutProps?.verticalAlign)
      }}
    >
      {wrapPanels(items)}
    </div>
  );
}
