'use client';

import { useMachine } from '@xstate/react';
import { useEffect, useMemo } from 'react';

import {
  CameraState,
  frameCluster,
  frameClusters,
  resolveClusterPositions,
  ViewportPoint,
  ViewportSize
} from '@/lib/engine/arrangement';
import { presentationMachine } from '@/lib/machines/presentation-machine';
import { PresentationConfig } from '@/lib/types/presentation';

export function usePresentationMachine(presentation: PresentationConfig) {
  const positionedClusters = useMemo(
    () => resolveClusterPositions(presentation.clusters ?? [], presentation.canvas),
    [presentation.canvas, presentation.clusters]
  );
  const clusterCameras = useMemo(
    () =>
      Object.fromEntries(
        positionedClusters.map((cluster) => [cluster.id, frameCluster(cluster, presentation.canvas)])
      ) as Record<string, CameraState>,
    [positionedClusters, presentation.canvas]
  );
  const overviewCamera = useMemo(
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
    input: { presentation, initialCamera: overviewCamera, overviewCamera, clusterCameras }
  });

  useEffect(() => {
    send({ type: 'BACKGROUND_UPDATE' });
  }, [send, state.context.currentStepIndex, state.context.currentClusterId]);

  return {
    state,
    send,
    positionedClusters,
    cameraFrame: overviewCamera,
    next: () => send({ type: 'NEXT' }),
    prev: () => send({ type: 'PREV' }),
    goToStep: (stepIndex: number) => send({ type: 'GO_TO_STEP', stepIndex }),
    flyToCluster: (clusterId: string) => send({ type: 'FLY_TO_CLUSTER', clusterId }),
    flyToCamera: (camera: CameraState, preserveCluster?: boolean) => send({ type: 'FLY_TO_CAMERA', camera, preserveCluster }),
    enterGuided: () => send({ type: 'ENTER_GUIDED' }),
    exitGuided: () => send({ type: 'EXIT_GUIDED' }),
    beginDirectManipulation: () => send({ type: 'BEGIN_INTERACTION' }),
    endDirectManipulation: () => send({ type: 'END_INTERACTION' }),
    panBy: (deltaX: number, deltaY: number) => send({ type: 'PAN_BY', deltaX, deltaY }),
    zoomAtViewportPoint: (zoom: number, point: ViewportPoint, viewport: ViewportSize) =>
      send({ type: 'ZOOM_TO_POINT', zoom, point, viewport }),
    resetOverview: () => send({ type: 'RESET_OVERVIEW' })
  };
}
