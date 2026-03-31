'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { createBuildPlan, getSequentialRevealCount, isComponentVisible } from '@/lib/runtime/build-plan';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

export function StageRenderer() {
  const { presentation, machine } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const step = presentation.steps?.[machine.state.context.currentStepIndex];

  if (!step) {
    return null;
  }

  const buildPlan = createBuildPlan(step);
  const visibleEntries = buildPlan.filter((entry) => isComponentVisible(entry, machine.state.context.currentBuildIndex));

  return (
    <div className="viewerShell">
      <BackgroundLayer />
      <Link href="/" className="backLink">
        Back
      </Link>
      <AnimatePresence mode="wait">
        <motion.section
          key={`${presentation.meta.slug}-${machine.state.context.currentStepIndex}`}
          className="stepScene"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: -18 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.35 }}
        >
          <LayoutRenderer
            layout={step.layout}
            layoutProps={step.layoutProps}
            items={visibleEntries.map((entry) => ({
              component: entry.component,
              revealCount: getSequentialRevealCount(entry, machine.state.context.currentBuildIndex)
            }))}
          />
        </motion.section>
      </AnimatePresence>
      <PresentationControls total={presentation.steps?.length ?? 0} current={machine.state.context.currentStepIndex + 1} />
      <LiveRegion
        message={`Step ${machine.state.context.currentStepIndex + 1} of ${presentation.steps?.length ?? 0}: ${step.title ?? presentation.meta.title}`}
      />
    </div>
  );
}
