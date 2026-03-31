import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

function Divider({ divider }: { divider: unknown }) {
  if (divider === 'vs') {
    return <div className={styles.comparisonDividerBadge}>VS</div>;
  }

  if (divider === 'arrow') {
    return <div className={styles.comparisonDividerArrow}>&rarr;</div>;
  }

  return <div className={styles.comparisonDividerLine} />;
}

export default function ComparisonLayout({ items, compact, layoutProps }: LayoutProps) {
  const [left, right] = items;

  return (
    <div className={joinLayoutClasses(styles.frame, styles.comparisonLayout, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      <div className={styles.panel}>{left}</div>
      <div className={styles.comparisonDivider}>
        <Divider divider={layoutProps?.divider} />
      </div>
      <div className={styles.panel}>{right}</div>
    </div>
  );
}
