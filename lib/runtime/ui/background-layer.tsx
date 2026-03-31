'use client';

import { useMemo } from 'react';

import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { BackgroundShaderConfig } from '@/lib/types/presentation';

function pickBackground(): BackgroundShaderConfig {
  return {
    type: 'paper',
    colorStops: ['rgba(239, 230, 216, 0.82)', 'rgba(216, 154, 79, 0.18)', 'rgba(42, 108, 100, 0.2)'],
    intensity: 1,
    opacity: 1
  };
}

export function BackgroundLayer() {
  const { presentation, machine } = usePresentationRuntime();
  const currentStepIndex = machine.state.context.currentStepIndex;
  const step = presentation.steps?.[currentStepIndex];
  const cluster = presentation.clusters?.find((item) => item.id === machine.state.context.currentClusterId);

  const shader = useMemo(() => {
    const sections = presentation.backgroundSections ?? [];
    const matched = sections.find((section) => {
      if (section.match.stepRange && step) {
        const [start, end] = section.match.stepRange;
        return currentStepIndex >= start && currentStepIndex <= end;
      }

      if (section.match.clusterIds && cluster) {
        return section.match.clusterIds.includes(cluster.id);
      }

      if (section.match.group && cluster) {
        return section.match.group === cluster.group;
      }

      return false;
    });

    return matched?.shader ?? step?.background ?? cluster?.background ?? presentation.background ?? pickBackground();
  }, [cluster, currentStepIndex, presentation.background, presentation.backgroundSections, step]);

  const colorStops = shader.colorStops ?? ['rgba(255, 250, 242, 0.92)', 'rgba(141, 79, 45, 0.18)', 'rgba(42, 108, 100, 0.2)'];

  return (
    <div
      aria-hidden="true"
      className="backgroundLayer"
      style={{
        background: `radial-gradient(circle at 20% 20%, ${colorStops[1]}, transparent 36%), radial-gradient(circle at 80% 24%, ${colorStops[2]}, transparent 34%), linear-gradient(135deg, ${colorStops[0]} 0%, color-mix(in srgb, ${colorStops[0]} 70%, var(--color-panel) 30%) 100%)`,
        opacity: Number(shader.opacity ?? 1)
      }}
    >
      <div className="backgroundNoise" />
    </div>
  );
}
