'use client';

import { useMachine } from '@xstate/react';
import { useEffect, useMemo } from 'react';

import { frameCluster, frameClusters, resolveClusterPositions } from '@/lib/engine/arrangement';
import { presentationMachine } from '@/lib/machines/presentation-machine';
import { PresentationConfig } from '@/lib/types/presentation';

export function usePresentationMachine(presentation: PresentationConfig) {
  const positionedClusters = useMemo(
    () => resolveClusterPositions(presentation.clusters ?? [], presentation.canvas),
    [presentation.canvas, presentation.clusters]
  );
  const clusterFrames = useMemo(
    () => new Map(positionedClusters.map((cluster) => [cluster.id, frameCluster(cluster, presentation.canvas)])),
    [positionedClusters, presentation.canvas]
  );
  const initialCamera = useMemo(
    () =>
      presentation.mode === 'map'
        ? frameClusters(positionedClusters, presentation.canvas)
        : {
            x: 0,
            y: 0,
            zoom: 1
          },
    [positionedClusters, presentation.canvas, presentation.mode]
  );
  const machine = useMemo(() => presentationMachine.provide({}), []);
  const [state, send] = useMachine(machine, {
    input: { presentation, initialCamera }
  });

  useEffect(() => {
    send({ type: 'BACKGROUND_UPDATE' });
  }, [send, state.context.currentStepIndex, state.context.currentClusterId]);

  const guidedSequence = useMemo(
    () => presentation.navigation?.sequence ?? presentation.clusters?.map((cluster) => cluster.id) ?? [],
    [presentation.clusters, presentation.navigation?.sequence]
  );
  const cameraFrame = useMemo(() => frameClusters(positionedClusters, presentation.canvas), [positionedClusters, presentation.canvas]);

  const focusCluster = (clusterId: string | null) => {
    if (!clusterId) {
      return;
    }

    const camera = clusterFrames.get(clusterId);
    if (!camera) {
      return;
    }

    send({ type: 'SET_CAMERA', camera });
  };

  return {
    state,
    send,
    positionedClusters,
    cameraFrame,
    next: () => {
      if (presentation.mode === 'map' && state.context.guided) {
        focusCluster(guidedSequence[Math.min(guidedSequence.length - 1, state.context.guidedIndex + 1)] ?? null);
      }

      send({ type: 'NEXT' });
    },
    prev: () => {
      if (presentation.mode === 'map' && state.context.guided) {
        focusCluster(guidedSequence[Math.max(0, state.context.guidedIndex - 1)] ?? null);
      }

      send({ type: 'PREV' });
    },
    goToStep: (stepIndex: number) => send({ type: 'GO_TO_STEP', stepIndex }),
    goToCluster: (clusterId: string) => {
      focusCluster(clusterId);
      send({ type: 'GO_TO_CLUSTER', clusterId });
    },
    enterGuided: () => send({ type: 'ENTER_GUIDED' }),
    exitGuided: () => send({ type: 'EXIT_GUIDED' }),
    pan: (deltaX: number, deltaY: number) => send({ type: 'PAN', deltaX, deltaY }),
    zoom: (zoom: number) => send({ type: 'ZOOM', zoom })
  };
}
