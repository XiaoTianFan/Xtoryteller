import { ComponentInstance } from '@/lib/types/presentation';
import styles from '@/layouts/_shared/layout.module.css';
import { getLayoutStyle, joinLayoutClasses, LayoutProps } from '@/layouts/_shared/layout-helpers';

export default function ScatteredLayout({ items, entries, compact, layoutProps }: LayoutProps) {
  const resolvedEntries =
    entries ?? items.map((node, index) => ({ node, component: { type: `generated-${index}` } as ComponentInstance }));

  return (
    <div className={joinLayoutClasses(styles.frame, styles.scattered, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>
      {resolvedEntries.map((entry, index) => {
        const x = typeof entry.component.position?.x === 'number' ? Math.max(0, Math.min(1, entry.component.position.x)) * 100 : 8 + (index % 3) * 28;
        const y = typeof entry.component.position?.y === 'number' ? Math.max(0, Math.min(1, entry.component.position.y)) * 100 : 8 + Math.floor(index / 3) * 24;
        const width = typeof entry.component.position?.width === 'number' ? `${Math.max(0, Math.min(1, entry.component.position.width)) * 100}%` : undefined;
        const height = typeof entry.component.position?.height === 'number' ? `${Math.max(0, Math.min(1, entry.component.position.height)) * 100}%` : undefined;
        const hasExplicitFrame = Boolean(width || height);

        return (
          <div
            key={index}
            className={joinLayoutClasses(styles.scatterItem, hasExplicitFrame && styles.scatterItemPinned)}
            style={
              hasExplicitFrame
                ? {
                    left: `${x}%`,
                    top: `${y}%`,
                    width,
                    height,
                    transform: 'none'
                  }
                : { left: `${x}%`, top: `${y}%` }
            }
          >
            {entry.node}
          </div>
        );
      })}
    </div>
  );
}
