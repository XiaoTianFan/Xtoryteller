import type { CSSProperties } from 'react';

import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, getRatioColumns, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

function resolveSlotNodes(entries: LayoutProps['entries'], items: LayoutProps['items']) {
  const hasSlots = entries?.some((entry) => entry.component.slot);
  if (!hasSlots) {
    return {
      main: items.slice(0, 1),
      support: items.slice(1, 2),
      ornament: items.slice(2, 3)
    };
  }

  const nodes = {
    main: [] as LayoutProps['items'],
    support: [] as LayoutProps['items'],
    ornament: [] as LayoutProps['items']
  };

  for (const entry of entries ?? []) {
    const slot =
      entry.component.slot === 'support' || entry.component.slot === 'ornament'
        ? entry.component.slot
        : 'main';
    nodes[slot].push(entry.node);
  }

  return nodes;
}

export default function AsymmetricSplitLayout({ items, entries, compact, layoutProps }: LayoutProps) {
  const slots = resolveSlotNodes(entries, items);
  const ornamentAnchor = typeof layoutProps?.ornamentAnchor === 'string' ? layoutProps.ornamentAnchor : 'top-right';

  return (
    <div
      className={joinLayoutClasses(styles.frame, styles.asymmetricSplit, compact && styles.compact)}
      style={{
        ...getLayoutStyle(layoutProps),
        gridTemplateColumns: getRatioColumns(layoutProps?.ratio, '60-40')
      } satisfies CSSProperties}
    >
      <div className={styles.asymmetricSplitMain}>{slots.main}</div>
      <div className={styles.asymmetricSplitSupport}>{slots.support}</div>
      {slots.ornament.length ? (
        <div className={[styles.asymmetricSplitOrnament, styles[ornamentAnchor as keyof typeof styles] ?? ''].join(' ')}>
          {slots.ornament}
        </div>
      ) : null}
    </div>
  );
}
