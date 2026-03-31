import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

export default function TimelineLayout({ items, compact, layoutProps }: LayoutProps) {
  const orientation = layoutProps?.orientation === 'vertical' ? 'vertical' : 'horizontal';

  return (
    <div
      className={joinLayoutClasses(
        styles.frame,
        styles.timelineLayout,
        orientation === 'vertical' ? styles.timelineLayoutVertical : styles.timelineLayoutHorizontal,
        compact && styles.compact
      )}
      style={getLayoutStyle(layoutProps)}
    >
      <div className={styles.timelineTrack} aria-hidden="true" />
      {items.map((item, index) => (
        <div key={index} className={styles.timelineNode}>
          {item}
        </div>
      ))}
    </div>
  );
}
