import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';

export default function TitleLeftLayout({ items, compact, layoutProps }: LayoutProps) {
  const [first, second, third] = wrapPanels(items);

  return (
    <div className={joinLayoutClasses(styles.frame, styles.titleLeft, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      <div className={styles.titleLeftMain}>
        {first}
        {second}
      </div>
      {third ? <div className={styles.titleLeftAccent}>{third}</div> : null}
    </div>
  );
}
