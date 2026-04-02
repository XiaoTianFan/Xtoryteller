import type { CSSProperties } from 'react';

import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

function resolveSlotNodes(entries: LayoutProps['entries'], items: LayoutProps['items']) {
  const hasSlots = entries?.some((entry) => entry.component.slot);
  if (!hasSlots) {
    return {
      main: items.slice(0, 1),
      rail: items.slice(1, 2),
      accent: items.slice(2, 3)
    };
  }

  const nodes = {
    main: [] as LayoutProps['items'],
    rail: [] as LayoutProps['items'],
    accent: [] as LayoutProps['items']
  };

  for (const entry of entries ?? []) {
    const slot = entry.component.slot === 'rail' || entry.component.slot === 'accent' ? entry.component.slot : 'main';
    nodes[slot].push(entry.node);
  }

  return nodes;
}

export default function FramedRailLayout({ items, entries, compact, layoutProps }: LayoutProps) {
  const slots = resolveSlotNodes(entries, items);
  const railSide = layoutProps?.railSide === 'left' ? 'left' : 'right';
  const contentAlign = layoutProps?.contentAlign === 'center' ? 'center' : 'left';
  const frameMaxWidth = typeof layoutProps?.frameMaxWidth === 'string' ? layoutProps.frameMaxWidth : 'min(92vw, 76rem)';

  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.framedRail, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        ['--framed-rail-max-width' as string]: frameMaxWidth
      } satisfies CSSProperties}
    >
      <div
        className={[
          styles.framedRailFrame,
          railSide === 'left' ? styles.framedRailLeft : styles.framedRailRight,
          contentAlign === 'center' ? styles.framedRailCenter : ''
        ].join(' ')}
      >
        {slots.rail.length ? <div className={styles.framedRailRail}>{slots.rail}</div> : null}
        <div className={styles.framedRailMain}>{slots.main}</div>
        {slots.accent.length ? <div className={styles.framedRailAccent}>{slots.accent}</div> : null}
      </div>
    </div>
  );
}
