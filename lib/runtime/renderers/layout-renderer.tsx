'use client';

import { motion, useReducedMotion } from 'framer-motion';

import SingleContentLayout from '@/layouts/single-content';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { resolveRuntimeLayout } from '@/lib/runtime/primitive-resolver';
import { ComponentRenderer } from '@/lib/runtime/renderers/component-renderer';
import { getLayoutRevealMotion } from '@/lib/runtime/transition-presets';
import { ComponentInstance } from '@/lib/types/presentation';

const hoverableTypes = new Set(['card', 'callout', 'comparison-card', 'feature-card', 'profile-card', 'stat-card', 'timeline-item']);

export function LayoutRenderer({
  layout,
  layoutProps,
  items,
  compact,
  disableMotion
}: {
  layout: string;
  layoutProps?: Record<string, unknown>;
  items: { component: ComponentInstance; revealCount: number }[];
  compact?: boolean;
  disableMotion?: boolean;
}) {
  const { presentation, theme } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const Selected = resolveRuntimeLayout(presentation.meta.slug, layout) ?? SingleContentLayout;
  const hoverSection = theme.motion && typeof theme.motion === 'object'
    ? ((theme.motion as Record<string, unknown>).hover as Record<string, unknown> | undefined)
    : undefined;
  const hoverScale = typeof hoverSection?.scale === 'number' ? hoverSection.scale : 1.01;
  const renderedEntries = items.map((item, index) => {
    const motionConfig = getLayoutRevealMotion(theme, Boolean(prefersReducedMotion), index, compact);

    return {
      component: item.component,
      node: disableMotion ? (
        <div
          key={`${item.component.type}-${index}`}
          className={hoverableTypes.has(item.component.type) ? 'layoutRevealCard' : 'layoutRevealItem'}
          data-layout-item-index={index}
        >
          <ComponentRenderer
            component={item.component}
            revealCount={item.revealCount}
            slug={presentation.meta.slug}
            compact={compact}
          />
        </div>
      ) : (
        <motion.div
          key={`${item.component.type}-${index}`}
          className={hoverableTypes.has(item.component.type) ? 'layoutRevealCard' : 'layoutRevealItem'}
          data-layout-item-index={index}
          initial={motionConfig.initial}
          animate={motionConfig.animate}
          transition={motionConfig.transition}
          whileHover={hoverableTypes.has(item.component.type) && !prefersReducedMotion ? { scale: hoverScale } : undefined}
        >
          <ComponentRenderer
            component={item.component}
            revealCount={item.revealCount}
            slug={presentation.meta.slug}
            compact={compact}
          />
        </motion.div>
      )
    };
  });

  return (
    <Selected
      items={renderedEntries.map((item) => item.node)}
      entries={renderedEntries}
      compact={compact}
      layoutProps={layoutProps}
    />
  );
}
