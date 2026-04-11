import { assign, setup } from 'xstate';

import {
  CameraState,
  panCameraByScreenDelta,
  ViewportPoint,
  ViewportSize,
  zoomCameraAtViewportPoint
} from '@/lib/engine/arrangement';
import { getTotalBuildSteps } from '@/lib/runtime/build-plan';
import { ClusterDefinition, PresentationConfig } from '@/lib/types/presentation';

type CameraBehavior = 'interactive' | 'flight';

interface RuntimeContext {
  presentation: PresentationConfig;
  currentStepIndex: number;
  currentBuildIndex: number;
  totalBuildSteps: number;
  currentClusterId: string | null;
  guidedIndex: number;
  guided: boolean;
  camera: CameraState;
  cameraBehavior: CameraBehavior;
  overviewCamera: CameraState;
  clusterCameras: Record<string, CameraState>;
  targetStepIndex: number | null;
  targetClusterId: string | null;
}

function getGuidedSequence(presentation: PresentationConfig): string[] {
  return presentation.navigation?.sequence ?? presentation.clusters?.map((cluster) => cluster.id) ?? [];
}

function getClusterById(presentation: PresentationConfig, clusterId: string | null): ClusterDefinition | undefined {
  return presentation.clusters?.find((cluster) => cluster.id === clusterId);
}

export const presentationMachine = setup({
  types: {
    context: {} as RuntimeContext,
    input: {} as {
      presentation: PresentationConfig;
      initialCamera?: CameraState;
      overviewCamera: CameraState;
      clusterCameras: Record<string, CameraState>;
      initialHash?: string;
    },
    events: {} as
      | { type: 'NEXT' }
      | { type: 'PREV' }
      | { type: 'GO_TO_STEP'; stepIndex: number }
      | { type: 'BEGIN_INTERACTION' }
      | { type: 'END_INTERACTION' }
      | { type: 'PAN_BY'; deltaX: number; deltaY: number }
      | { type: 'ZOOM_TO_POINT'; zoom: number; point: ViewportPoint; viewport: ViewportSize }
      | { type: 'FLY_TO_CLUSTER'; clusterId: string }
      | { type: 'FLY_TO_CAMERA'; camera: CameraState; preserveCluster?: boolean }
      | { type: 'RESET_OVERVIEW' }
      | { type: 'ENTER_GUIDED' }
      | { type: 'EXIT_GUIDED' }
      | { type: 'BACKGROUND_UPDATE' }
  },
  guards: {
    isMap: ({ context }) => context.presentation.mode === 'map',
    hasBuildStepsRemaining: ({ context }) => context.currentBuildIndex < context.totalBuildSteps - 1,
    hasNextStep: ({ context }) => context.currentStepIndex < (context.presentation.steps?.length ?? 0) - 1,
    hasPrevStep: ({ context }) => context.currentStepIndex > 0,
    isAtFirstBuild: ({ context }) => context.currentBuildIndex === 0,
    hasTargetCluster: ({ context }) => Boolean(context.targetClusterId),
    hasNextCluster: ({ context }) => {
      const sequence = getGuidedSequence(context.presentation);
      return context.guidedIndex < sequence.length - 1;
    },
    hasPrevCluster: ({ context }) => context.guidedIndex > 0
  },
  actions: {
    incrementBuild: assign(({ context }) => ({
      currentBuildIndex: Math.min(context.totalBuildSteps - 1, context.currentBuildIndex + 1)
    })),
    decrementBuild: assign(({ context }) => ({
      currentBuildIndex: Math.max(0, context.currentBuildIndex - 1)
    })),
    queueTargetStep: assign(({ event }) => ('stepIndex' in event ? { targetStepIndex: event.stepIndex } : {})),
    jumpToStep: assign(({ context }) => {
      const index = context.targetStepIndex ?? context.currentStepIndex + 1;
      const step = context.presentation.steps?.[index];
      return {
        currentStepIndex: index,
        targetStepIndex: null,
        currentBuildIndex: 0,
        totalBuildSteps: step ? getTotalBuildSteps(step) : 1
      };
    }),
    moveToPreviousStep: assign(({ context }) => {
      const index = Math.max(0, context.currentStepIndex - 1);
      const step = context.presentation.steps?.[index];
      return {
        currentStepIndex: index,
        currentBuildIndex: Math.max(0, (step ? getTotalBuildSteps(step) : 1) - 1),
        totalBuildSteps: step ? getTotalBuildSteps(step) : 1
      };
    }),
    resetBuild: assign({ currentBuildIndex: 0 }),
    beginInteraction: assign({ cameraBehavior: 'interactive' }),
    endInteraction: assign({ cameraBehavior: 'interactive' }),
    enterGuided: assign(({ context }) => {
      const sequence = getGuidedSequence(context.presentation);
      return {
        guided: true,
        guidedIndex: Math.max(0, sequence.indexOf(context.currentClusterId ?? ''))
      };
    }),
    exitGuided: assign({ guided: false }),
    advanceGuided: assign(({ context }) => {
      const sequence = getGuidedSequence(context.presentation);
      const nextIndex = Math.min(sequence.length - 1, context.guidedIndex + 1);
      const clusterId = sequence[nextIndex];
      return {
        guidedIndex: nextIndex,
        targetClusterId: clusterId,
        camera: context.clusterCameras[clusterId] ?? context.camera,
        cameraBehavior: 'flight'
      };
    }),
    retreatGuided: assign(({ context }) => {
      const sequence = getGuidedSequence(context.presentation);
      const nextIndex = Math.max(0, context.guidedIndex - 1);
      const clusterId = sequence[nextIndex];
      return {
        guidedIndex: nextIndex,
        targetClusterId: clusterId,
        camera: context.clusterCameras[clusterId] ?? context.camera,
        cameraBehavior: 'flight'
      };
    }),
    flyToCluster: assign(({ event, context }) => {
      const clusterId = 'clusterId' in event ? event.clusterId : context.targetClusterId;
      const sequence = getGuidedSequence(context.presentation);
      return {
        targetClusterId: clusterId,
        guidedIndex: Math.max(0, sequence.indexOf(clusterId ?? '')),
        camera: (clusterId ? context.clusterCameras[clusterId] : undefined) ?? context.camera,
        cameraBehavior: 'flight'
      };
    }),
    flyToCamera: assign(({ context, event }) =>
      'camera' in event
        ? {
            camera: event.camera,
            cameraBehavior: 'flight',
            targetClusterId: event.preserveCluster ? context.targetClusterId : null
          }
        : {}
    ),
    resetOverview: assign(({ context }) => ({
      camera: context.overviewCamera,
      cameraBehavior: 'flight',
      targetClusterId: null
    })),
    arriveAtCluster: assign(({ context }) => ({
      currentClusterId: context.targetClusterId,
      targetClusterId: null,
      cameraBehavior: 'interactive'
    })),
    finishFlight: assign({ cameraBehavior: 'interactive' }),
    panCamera: assign(({ context, event }) =>
      'deltaX' in event
        ? {
            camera: panCameraByScreenDelta(context.camera, event.deltaX, event.deltaY),
            cameraBehavior: 'interactive'
          }
        : {}
    ),
    zoomCamera: assign(({ context, event }) =>
      'zoom' in event
        ? {
            camera: zoomCameraAtViewportPoint(
              context.camera,
              event.zoom,
              event.point,
              event.viewport,
              context.presentation.canvas
            ),
            cameraBehavior: 'interactive'
          }
        : {}
    )
  }
}).createMachine({
  id: 'presentation',
  type: 'parallel',
  context: ({ input }) => ({
    presentation: input.presentation,
    currentStepIndex: 0,
    currentBuildIndex: 0,
    totalBuildSteps: input.presentation.steps?.[0] ? getTotalBuildSteps(input.presentation.steps[0]) : 1,
    currentClusterId: input.presentation.clusters?.[0]?.id ?? null,
    guidedIndex: 0,
    guided: false,
    camera: input.initialCamera ?? {
      x: 0,
      y: 0,
      zoom: input.presentation.canvas?.initialZoom ?? 1
    },
    cameraBehavior: 'interactive',
    overviewCamera: input.overviewCamera,
    clusterCameras: input.clusterCameras,
    targetStepIndex: null,
    targetClusterId: null
  }),
  states: {
    navigation: {
      initial: 'decide',
      states: {
        decide: {
          always: [
            { target: 'map', guard: 'isMap' },
            { target: 'stage' }
          ]
        },
        stage: {
          on: {
            GO_TO_STEP: {
              target: '#presentation.navigation.stage.exiting',
              actions: 'queueTargetStep'
            }
          },
          initial: 'entering',
          states: {
            entering: {
              after: {
                320: 'building'
              }
            },
            building: {
              initial: 'waitingForInput',
              states: {
                waitingForInput: {
                  on: {
                    NEXT: [
                      {
                        guard: 'hasBuildStepsRemaining',
                        target: 'animatingBuild',
                        actions: 'incrementBuild'
                      },
                      {
                        guard: 'hasNextStep',
                        target: '#presentation.navigation.stage.exiting'
                      }
                    ],
                    PREV: [
                      {
                        guard: 'isAtFirstBuild',
                        target: '#presentation.navigation.stage.entering',
                        actions: 'moveToPreviousStep'
                      },
                      {
                        target: 'animatingBuild',
                        actions: 'decrementBuild'
                      }
                    ],
                    GO_TO_STEP: {
                      target: '#presentation.navigation.stage.exiting',
                      actions: 'queueTargetStep'
                    }
                  }
                },
                animatingBuild: {
                  after: {
                    220: 'waitingForInput'
                  }
                }
              }
            },
            exiting: {
              after: {
                260: {
                  target: 'entering',
                  actions: 'jumpToStep'
                }
              }
            }
          }
        },
        map: {
          initial: 'freeRoam',
          states: {
            freeRoam: {
              on: {
                BEGIN_INTERACTION: { actions: 'beginInteraction' },
                END_INTERACTION: { actions: 'endInteraction' },
                PAN_BY: { actions: 'panCamera' },
                ZOOM_TO_POINT: { actions: 'zoomCamera' },
                FLY_TO_CLUSTER: {
                  target: 'flying',
                  actions: 'flyToCluster'
                },
                FLY_TO_CAMERA: {
                  target: 'flying',
                  actions: 'flyToCamera'
                },
                RESET_OVERVIEW: {
                  target: 'flying',
                  actions: 'resetOverview'
                },
                ENTER_GUIDED: {
                  target: 'guided',
                  actions: 'enterGuided'
                }
              }
            },
            flying: {
              after: {
                700: [
                  {
                    target: 'guided',
                    guard: ({ context }) => context.guided && Boolean(context.targetClusterId),
                    actions: 'arriveAtCluster'
                  },
                  {
                    target: 'guided',
                    guard: ({ context }) => context.guided,
                    actions: 'finishFlight'
                  },
                  {
                    target: 'freeRoam',
                    guard: 'hasTargetCluster',
                    actions: 'arriveAtCluster'
                  },
                  {
                    target: 'freeRoam',
                    actions: 'finishFlight'
                  }
                ]
              }
            },
            guided: {
              on: {
                BEGIN_INTERACTION: { actions: 'beginInteraction' },
                END_INTERACTION: { actions: 'endInteraction' },
                PAN_BY: { actions: 'panCamera' },
                ZOOM_TO_POINT: { actions: 'zoomCamera' },
                NEXT: {
                  guard: 'hasNextCluster',
                  target: 'flying',
                  actions: 'advanceGuided'
                },
                PREV: {
                  guard: 'hasPrevCluster',
                  target: 'flying',
                  actions: 'retreatGuided'
                },
                FLY_TO_CLUSTER: {
                  target: 'flying',
                  actions: 'flyToCluster'
                },
                FLY_TO_CAMERA: {
                  target: 'flying',
                  actions: 'flyToCamera'
                },
                RESET_OVERVIEW: {
                  target: 'flying',
                  actions: 'resetOverview'
                },
                EXIT_GUIDED: {
                  target: 'freeRoam',
                  actions: 'exitGuided'
                }
              }
            }
          }
        }
      }
    },
    background: {
      initial: 'stable',
      states: {
        stable: {
          on: {
            BACKGROUND_UPDATE: 'interpolating'
          }
        },
        interpolating: {
          after: {
            420: 'stable'
          }
        }
      }
    },
    ui: {
      initial: 'idle',
      states: {
        idle: {}
      }
    }
  }
});

export function getActiveCluster(context: RuntimeContext): ClusterDefinition | undefined {
  return getClusterById(context.presentation, context.currentClusterId);
}
