'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { createBuildPlan, getSequentialRevealCount, isComponentVisible } from '@/lib/runtime/build-plan';
import { resolveRuntimeTransition } from '@/lib/runtime/primitive-resolver';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getStageSceneMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

export function StageRenderer() {
  const router = useRouter();
  const { presentation, theme, machine } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const step = presentation.steps?.[machine.state.context.currentStepIndex];

  if (!step) {
    return null;
  }

  const buildPlan = createBuildPlan(step);
  const visibleEntries = buildPlan.filter((entry) => isComponentVisible(entry, machine.state.context.currentBuildIndex));
  const sceneMotion = getStageSceneMotion(
    resolveRuntimeTransition(presentation.meta.slug, step.transition),
    theme,
    Boolean(prefersReducedMotion)
  );

  return (
    <main className="viewerShell">
      <BackgroundLayer />
      <AnimatePresence mode="wait">
        <motion.section
          key={`${presentation.meta.slug}-${machine.state.context.currentStepIndex}`}
          className="stepScene"
          initial={sceneMotion.initial}
          animate={sceneMotion.animate}
          exit={sceneMotion.exit}
          transition={sceneMotion.transition}
        >
          {step.title || step.description ? (
            <header className="stepSceneHeader">
              {step.title ? <p className="stepSceneTitle">{step.title}</p> : null}
              {step.description ? <p className="stepSceneDescription">{step.description}</p> : null}
            </header>
          ) : null}
          <div className="stepSceneBody">
            <LayoutRenderer
              layout={step.layout}
              layoutProps={step.layoutProps}
              items={visibleEntries.map((entry) => ({
                component: entry.component,
                revealCount:
                  entry.component.build === 'sequential'
                    ? getSequentialRevealCount(entry, machine.state.context.currentBuildIndex)
                    : Number.MAX_SAFE_INTEGER
              }))}
            />
          </div>
        </motion.section>
      </AnimatePresence>
      <PresentationControls
        total={presentation.steps?.length ?? 0}
        current={machine.state.context.currentStepIndex + 1}
        rightActions={
          <button type="button" className="ghostButton" onClick={() => router.push('/')}>
            Back
          </button>
        }
      />
      <LiveRegion
        message={`Step ${machine.state.context.currentStepIndex + 1} of ${presentation.steps?.length ?? 0}: ${step.title ?? presentation.meta.title}`}
      />
    </main>
  );
}
