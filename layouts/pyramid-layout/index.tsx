import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

export default function PyramidLayout({ items, compact, layoutProps }: LayoutProps) {
  return (
    <div className={joinLayoutClasses(styles.frame, styles.pyramidLayout, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      {items.map((item, index) => (
        <div key={index} className={styles.pyramidItem}>
          {item}
        </div>
      ))}
    </div>
  );
}
