'use client';

import { useMachine } from '@xstate/react';
import { useEffect, useMemo } from 'react';

import { presentationMachine } from '@/lib/machines/presentation-machine';
import { frameClusters, resolveClusterPositions } from '@/lib/engine/arrangement';
import { PresentationConfig } from '@/lib/types/presentation';

export function usePresentationMachine(presentation: PresentationConfig) {
  const machine = useMemo(() => presentationMachine.provide({}), []);
  const [state, send] = useMachine(machine, {
    input: { presentation }
  });

  useEffect(() => {
    send({ type: 'BACKGROUND_UPDATE' });
  }, [send, state.context.currentStepIndex, state.context.currentClusterId]);

  const positionedClusters = useMemo(
    () => resolveClusterPositions(presentation.clusters ?? [], presentation.canvas),
    [presentation.canvas, presentation.clusters]
  );

  const cameraFrame = useMemo(() => frameClusters(positionedClusters), [positionedClusters]);

  return {
    state,
    send,
    positionedClusters,
    cameraFrame,
    next: () => send({ type: 'NEXT' }),
    prev: () => send({ type: 'PREV' }),
    goToStep: (stepIndex: number) => send({ type: 'GO_TO_STEP', stepIndex }),
    goToCluster: (clusterId: string) => send({ type: 'GO_TO_CLUSTER', clusterId }),
    enterGuided: () => send({ type: 'ENTER_GUIDED' }),
    exitGuided: () => send({ type: 'EXIT_GUIDED' }),
    pan: (deltaX: number, deltaY: number) => send({ type: 'PAN', deltaX, deltaY }),
    zoom: (zoom: number) => send({ type: 'ZOOM', zoom })
  };
}
