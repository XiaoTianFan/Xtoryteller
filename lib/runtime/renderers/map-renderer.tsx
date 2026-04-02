'use client';

import { useGesture } from '@use-gesture/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';

import { getCameraTransform, PositionedCluster, ViewportPoint } from '@/lib/engine/arrangement';
import { getEditorClipboard, setEditorClipboard } from '@/lib/runtime/editor/clipboard';
import { AddComponentOverlay } from '@/lib/runtime/editor/add-component-overlay';
import {
  commitEditorHistorySnapshot,
  createEditorHistoryState,
  EditorHistoryState,
  redoEditorHistory,
  replaceEditorHistoryPresent,
  undoEditorHistory
} from '@/lib/runtime/editor/history';
import {
  isCopyShortcut,
  isDeleteShortcut,
  isDuplicateShortcut,
  isEditableEventTarget,
  isPasteShortcut,
  isRedoShortcut,
  isUndoShortcut
} from '@/lib/runtime/editor/keyboard';
import { EditableComponentDraft, EditableMapClusterDraft } from '@/lib/runtime/editor/types';
import {
  buildMapDraftSignature,
  buildStageDraftSignature,
  buildUniqueClusterId,
  cloneDeep,
  createDraftComponentInstance,
  createEditableComponentDraft,
  offsetFreeformGeometry
} from '@/lib/runtime/editor/utils';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getMapCameraMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';
import { ClusterDefinition, ComponentInstance } from '@/lib/types/presentation';

type EditInteractionMode = 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';
type MapEditLayer = 'clusters' | 'components';
type ClusterContentPhase = 'idle' | 'measuring' | 'active';

interface ClusterInteraction {
  kind: 'cluster';
  clusterId: string;
  mode: EditInteractionMode;
  startClientX: number;
  startClientY: number;
  startDrafts: EditableMapClusterDraft[];
  zoom: number;
  changed: boolean;
}

interface ComponentInteraction {
  kind: 'component';
  clusterId: string;
  componentId: string;
  mode: EditInteractionMode;
  startClientX: number;
  startClientY: number;
  startDrafts: EditableMapClusterDraft[];
  boundsWidth: number;
  boundsHeight: number;
  changed: boolean;
}

type MapEditInteraction = ClusterInteraction | ComponentInteraction;

const MIN_CLUSTER_WIDTH = 280;
const MIN_CLUSTER_HEIGHT = 180;
const MIN_COMPONENT_WIDTH = 140;
const MIN_COMPONENT_HEIGHT = 88;
const COMPONENT_INSERT_OFFSET = 0.04;

export function shouldStartMapPanFromTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return !target.closest('.clusterCard');
}

function getNextSelectedClusterId(clusters: EditableMapClusterDraft[], removedIndex: number) {
  return clusters[removedIndex]?.id ?? clusters[removedIndex - 1]?.id ?? null;
}

function getNextSelectedComponentId(drafts: EditableComponentDraft[], removedIndex: number) {
  return drafts[removedIndex]?.draftId ?? drafts[removedIndex - 1]?.draftId ?? null;
}

function duplicateClusterDraft(
  cluster: EditableMapClusterDraft,
  existingIds: Set<string>
): EditableMapClusterDraft {
  const nextId = buildUniqueClusterId(cluster.id, existingIds);

  return {
    ...cloneDeep(cluster),
    id: nextId,
    title: cluster.title ? `${cluster.title} copy` : nextId,
    x: cluster.x + 80,
    y: cluster.y + 60,
    components: cloneDeep(cluster.components),
    freeformComponents: cluster.freeformComponents
      ? cluster.freeformComponents.map((draft) =>
          createEditableComponentDraft(
            cloneDeep(draft.component),
            {
              x: draft.x,
              y: draft.y,
              width: draft.width,
              height: draft.height
            },
            'map-cluster-component'
          )
        )
      : null
  };
}

function clampComponentGeometry(
  geometry: Pick<EditableComponentDraft, 'x' | 'y' | 'width' | 'height'>,
  boundsWidth: number,
  boundsHeight: number
) {
  const minWidth = Math.min(1, MIN_COMPONENT_WIDTH / Math.max(boundsWidth, 1));
  const minHeight = Math.min(1, MIN_COMPONENT_HEIGHT / Math.max(boundsHeight, 1));
  const width = Math.min(1, Math.max(minWidth, geometry.width));
  const height = Math.min(1, Math.max(minHeight, geometry.height));
  const x = Math.min(Math.max(0, geometry.x), Math.max(0, 1 - width));
  const y = Math.min(Math.max(0, geometry.y), Math.max(0, 1 - height));

  return {
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
    width: Number(width.toFixed(6)),
    height: Number(height.toFixed(6))
  };
}

function updateClusterGeometryFromPointer(
  cluster: EditableMapClusterDraft,
  interaction: ClusterInteraction,
  clientX: number,
  clientY: number
) {
  const deltaX = (clientX - interaction.startClientX) / Math.max(interaction.zoom, 0.001);
  const deltaY = (clientY - interaction.startClientY) / Math.max(interaction.zoom, 0.001);

  if (interaction.mode === 'move') {
    return {
      ...cluster,
      x: Math.round(cluster.x + deltaX),
      y: Math.round(cluster.y + deltaY)
    };
  }

  if (interaction.mode === 'resize-right') {
    return {
      ...cluster,
      width: Math.max(MIN_CLUSTER_WIDTH, Math.round(cluster.width + deltaX))
    };
  }

  if (interaction.mode === 'resize-bottom') {
    return {
      ...cluster,
      height: Math.max(MIN_CLUSTER_HEIGHT, Math.round(cluster.height + deltaY))
    };
  }

  return {
    ...cluster,
    width: Math.max(MIN_CLUSTER_WIDTH, Math.round(cluster.width + deltaX)),
    height: Math.max(MIN_CLUSTER_HEIGHT, Math.round(cluster.height + deltaY))
  };
}

function updateComponentGeometryFromPointer(
  draft: EditableComponentDraft,
  interaction: ComponentInteraction,
  clientX: number,
  clientY: number
) {
  const deltaX = (clientX - interaction.startClientX) / Math.max(interaction.boundsWidth, 1);
  const deltaY = (clientY - interaction.startClientY) / Math.max(interaction.boundsHeight, 1);

  if (interaction.mode === 'move') {
    return {
      ...draft,
      ...clampComponentGeometry(
        {
          x: draft.x + deltaX,
          y: draft.y + deltaY,
          width: draft.width,
          height: draft.height
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  if (interaction.mode === 'resize-right') {
    return {
      ...draft,
      ...clampComponentGeometry(
        {
          x: draft.x,
          y: draft.y,
          width: draft.width + deltaX,
          height: draft.height
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  if (interaction.mode === 'resize-bottom') {
    return {
      ...draft,
      ...clampComponentGeometry(
        {
          x: draft.x,
          y: draft.y,
          width: draft.width,
          height: draft.height + deltaY
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  return {
    ...draft,
    ...clampComponentGeometry(
      {
        x: draft.x,
        y: draft.y,
        width: draft.width + deltaX,
        height: draft.height + deltaY
      },
      interaction.boundsWidth,
      interaction.boundsHeight
    )
  };
}

function getRenderableClusterComponents(cluster: EditableMapClusterDraft) {
  if (!cluster.freeformComponents?.length) {
    return {
      layout: cluster.layout,
      layoutProps: cluster.layoutProps,
      components: cluster.components
    };
  }

  return {
    layout: 'scattered',
    layoutProps: cluster.layoutProps,
    components: cluster.freeformComponents.map((draft) => createDraftComponentInstance(draft))
  };
}

function getInitialFreeformComponents(cluster: EditableMapClusterDraft) {
  if (cluster.layout !== 'scattered') {
    return null;
  }

  const canHydrateFromPosition = cluster.components.every(
    (component) =>
      component.position &&
      typeof component.position.x === 'number' &&
      typeof component.position.y === 'number' &&
      typeof component.position.width === 'number' &&
      typeof component.position.height === 'number'
  );
  if (!canHydrateFromPosition) {
    return null;
  }

  return cluster.components.map((component) =>
    createEditableComponentDraft(
      {
        ...component,
        position: undefined
      },
      {
        x: Number(component.position!.x),
        y: Number(component.position!.y),
        width: Number(component.position!.width),
        height: Number(component.position!.height)
      },
      'map-cluster-component'
    )
  );
}

function buildMapDrafts(clusters: ClusterDefinition[], positions: PositionedCluster[]) {
  const positionsById = new Map(positions.map((cluster) => [cluster.id, cluster]));

  return clusters
    .map((cluster) => {
      const position = positionsById.get(cluster.id);
      if (!position) {
        return null;
      }

      const nextCluster: EditableMapClusterDraft = {
        id: cluster.id,
        title: cluster.title,
        description: cluster.description,
        group: cluster.group,
        layout: cluster.layout,
        layoutProps: cloneDeep(cluster.layoutProps),
        transition: cluster.transition,
        background: cloneDeep(cluster.background),
        x: Math.round(position.x),
        y: Math.round(position.y),
        width: Math.round(position.width),
        height: Math.round(position.height),
        components: cloneDeep(cluster.components),
        freeformComponents: null
      };

      nextCluster.freeformComponents = getInitialFreeformComponents(nextCluster);
      return nextCluster;
    })
    .filter((cluster): cluster is EditableMapClusterDraft => Boolean(cluster));
}

function getInsertedComponentGeometry(drafts: EditableComponentDraft[]) {
  const width = 0.32;
  const height = 0.24;
  const x = Math.min(0.08 + drafts.length * COMPONENT_INSERT_OFFSET, 1 - width - 0.04);
  const y = Math.min(0.1 + drafts.length * COMPONENT_INSERT_OFFSET, 1 - height - 0.04);

  return { x, y, width, height };
}

function measureClusterComponentDrafts(container: HTMLElement, components: ComponentInstance[]) {
  const bodyRect = container.getBoundingClientRect();
  if (bodyRect.width <= 0 || bodyRect.height <= 0) {
    return components.map((component, index) =>
      createEditableComponentDraft(
        {
          ...component,
          position: undefined
        },
        {
          x: Math.min(0.08 + index * 0.12, 0.6),
          y: Math.min(0.1 + index * 0.08, 0.62),
          width: 0.32,
          height: 0.22
        },
        'map-cluster-component'
      )
    );
  }

  const measuredNodes = Array.from(container.querySelectorAll<HTMLElement>('[data-layout-item-index]'));
  if (measuredNodes.length !== components.length) {
    return components.map((component, index) =>
      createEditableComponentDraft(
        {
          ...component,
          position: undefined
        },
        {
          x: Math.min(0.08 + index * 0.12, 0.6),
          y: Math.min(0.1 + index * 0.08, 0.62),
          width: 0.32,
          height: 0.22
        },
        'map-cluster-component'
      )
    );
  }

  return measuredNodes
    .map((node) => {
      const index = Number(node.dataset.layoutItemIndex);
      const component = components[index];
      if (!component) {
        return null;
      }

      const rect = node.getBoundingClientRect();
      return createEditableComponentDraft(
        {
          ...component,
          position: undefined
        },
        clampComponentGeometry(
          {
            x: (rect.left - bodyRect.left) / bodyRect.width,
            y: (rect.top - bodyRect.top) / bodyRect.height,
            width: rect.width / bodyRect.width,
            height: rect.height / bodyRect.height
          },
          bodyRect.width,
          bodyRect.height
        ),
        'map-cluster-component'
      );
    })
    .filter((item): item is EditableComponentDraft => Boolean(item));
}

function getContentLabel(component: ComponentInstance, index: number) {
  const content =
    typeof component.content === 'string' && component.content.trim()
      ? `. ${component.content.trim().slice(0, 80)}`
      : '';
  return `Cluster component ${index + 1} (${component.type})${content}`;
}

function buildClusterSavePayload(cluster: EditableMapClusterDraft, cleanCluster: EditableMapClusterDraft | undefined) {
  const shouldPersistFreeform =
    Boolean(cluster.freeformComponents?.length) &&
    (!cleanCluster ||
      buildStageDraftSignature(cluster.freeformComponents ?? []) !==
        buildStageDraftSignature(cleanCluster.freeformComponents ?? []));

  if (!shouldPersistFreeform) {
    return {
      id: cluster.id,
      title: cluster.title,
      description: cluster.description,
      group: cluster.group,
      layout: cluster.layout,
      layoutProps: cloneDeep(cluster.layoutProps),
      transition: cluster.transition,
      background: cloneDeep(cluster.background),
      x: cluster.x,
      y: cluster.y,
      width: cluster.width,
      height: cluster.height,
      components: cloneDeep(cluster.components)
    };
  }

  return {
    id: cluster.id,
    title: cluster.title,
    description: cluster.description,
    group: cluster.group,
    layout: 'scattered',
    layoutProps: cloneDeep(cluster.layoutProps),
    transition: cluster.transition,
    background: cloneDeep(cluster.background),
    x: cluster.x,
    y: cluster.y,
    width: cluster.width,
    height: cluster.height,
    components: (cluster.freeformComponents ?? []).map((draft) => ({
      ...cloneDeep(draft.component),
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height
    }))
  };
}

export function MapRenderer() {
  const router = useRouter();
  const { presentation, theme, machine } = usePresentationRuntime();
  const isDev = process.env.NODE_ENV !== 'production';
  const prefersReducedMotion = useReducedMotion();
  const activeClusterId = machine.state.context.currentClusterId;
  const clusters = presentation.clusters ?? [];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const clusterContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wheelInteractionTimeoutRef = useRef<number | null>(null);
  const clickSuppressUntilRef = useRef(0);
  const dragMovementRef = useRef({ x: 0, y: 0 });
  const dragPanEnabledRef = useRef(false);
  const pinchStartZoomRef = useRef<number | null>(null);
  const editInteractionRef = useRef<MapEditInteraction | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const [showClusterBounds, setShowClusterBounds] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editLayer, setEditLayer] = useState<MapEditLayer>('clusters');
  const [contentPhase, setContentPhase] = useState<ClusterContentPhase>('idle');
  const [history, setHistory] = useState<EditorHistoryState<EditableMapClusterDraft[]> | null>(null);
  const [cleanDrafts, setCleanDrafts] = useState<EditableMapClusterDraft[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [hasExplicitClusterSelection, setHasExplicitClusterSelection] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAddComponentOverlay, setShowAddComponentOverlay] = useState(false);
  const [presenterReady, setPresenterReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPresenterReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setViewportSize({
        width: rect.width || 1280,
        height: rect.height || 720
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (wheelInteractionTimeoutRef.current !== null) {
        window.clearTimeout(wheelInteractionTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = editInteractionRef.current;
      if (!interaction) {
        return;
      }

      setHistory((current) => {
        if (!current) {
          return current;
        }

        if (interaction.kind === 'cluster') {
          const nextPresent = current.present.map((cluster) => {
            if (cluster.id !== interaction.clusterId) {
              return cluster;
            }

            const baseCluster = interaction.startDrafts.find((item) => item.id === cluster.id) ?? cluster;
            const nextCluster = updateClusterGeometryFromPointer(baseCluster, interaction, event.clientX, event.clientY);
            if (
              nextCluster.x === cluster.x &&
              nextCluster.y === cluster.y &&
              nextCluster.width === cluster.width &&
              nextCluster.height === cluster.height
            ) {
              return cluster;
            }

            interaction.changed = true;
            return nextCluster;
          });

          return replaceEditorHistoryPresent(current, nextPresent);
        }

        const nextPresent = current.present.map((cluster) => {
          if (cluster.id !== interaction.clusterId || !cluster.freeformComponents) {
            return cluster;
          }

          const baseCluster = interaction.startDrafts.find((item) => item.id === cluster.id);
          const nextDrafts = cluster.freeformComponents.map((draft) => {
            if (draft.draftId !== interaction.componentId) {
              return draft;
            }

            const baseDraft =
              baseCluster?.freeformComponents?.find((item) => item.draftId === draft.draftId) ?? draft;
            const nextDraft = updateComponentGeometryFromPointer(baseDraft, interaction, event.clientX, event.clientY);
            if (
              nextDraft.x === draft.x &&
              nextDraft.y === draft.y &&
              nextDraft.width === draft.width &&
              nextDraft.height === draft.height
            ) {
              return draft;
            }

            interaction.changed = true;
            return nextDraft;
          });

          return {
            ...cluster,
            freeformComponents: nextDrafts
          };
        });

        return replaceEditorHistoryPresent(current, nextPresent);
      });
    };

    const finishInteraction = () => {
      const interaction = editInteractionRef.current;
      editInteractionRef.current = null;
      if (!interaction?.changed) {
        return;
      }

      clickSuppressUntilRef.current = Date.now() + 180;

      setHistory((current) => {
        if (!current) {
          return current;
        }

        return commitEditorHistorySnapshot(current, interaction.startDrafts, current.present);
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishInteraction);
    window.addEventListener('pointercancel', finishInteraction);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishInteraction);
      window.removeEventListener('pointercancel', finishInteraction);
    };
  }, []);

  const getViewportPoint = (clientX: number, clientY: number): ViewportPoint => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return {
        x: viewportSize.width / 2,
        y: viewportSize.height / 2
      };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scheduleInteractionEnd = () => {
    if (wheelInteractionTimeoutRef.current !== null) {
      window.clearTimeout(wheelInteractionTimeoutRef.current);
    }

    wheelInteractionTimeoutRef.current = window.setTimeout(() => {
      machine.endDirectManipulation();
      wheelInteractionTimeoutRef.current = null;
    }, 120);
  };

  const bind = useGesture(
    {
      onDragStart: ({ event }) => {
        if (editInteractionRef.current) {
          dragPanEnabledRef.current = false;
          return;
        }

        dragPanEnabledRef.current = !editMode || shouldStartMapPanFromTarget(event.target);
        if (!dragPanEnabledRef.current) {
          return;
        }

        dragMovementRef.current = { x: 0, y: 0 };
        machine.beginDirectManipulation();
      },
      onDrag: ({ movement: [moveX, moveY], pinching }) => {
        if (pinching || editInteractionRef.current) {
          return;
        }

        if (!dragPanEnabledRef.current) {
          return;
        }

        if (Math.hypot(moveX, moveY) > 6) {
          clickSuppressUntilRef.current = Date.now() + 180;
        }

        machine.panBy(moveX - dragMovementRef.current.x, moveY - dragMovementRef.current.y);
        dragMovementRef.current = { x: moveX, y: moveY };
      },
      onDragEnd: () => {
        if (editInteractionRef.current) {
          dragPanEnabledRef.current = false;
          return;
        }

        if (!dragPanEnabledRef.current) {
          return;
        }

        dragMovementRef.current = { x: 0, y: 0 };
        dragPanEnabledRef.current = false;
        machine.endDirectManipulation();
      },
      onWheel: ({ event, delta: [, y] }) => {
        if (editInteractionRef.current) {
          return;
        }

        event.preventDefault();
        machine.beginDirectManipulation();
        const point = getViewportPoint(event.clientX, event.clientY);
        const nextZoom = machine.state.context.camera.zoom * Math.exp(-y / 400);
        machine.zoomAtViewportPoint(nextZoom, point, viewportSize);
        scheduleInteractionEnd();
      },
      onPinchStart: () => {
        if (editInteractionRef.current) {
          return;
        }

        pinchStartZoomRef.current = machine.state.context.camera.zoom;
        machine.beginDirectManipulation();
      },
      onPinch: ({ first, offset: [scale], origin: [originX, originY] }) => {
        if (editInteractionRef.current) {
          return;
        }

        if (first) {
          pinchStartZoomRef.current = machine.state.context.camera.zoom;
        }

        const point = getViewportPoint(originX, originY);
        const baseZoom = pinchStartZoomRef.current ?? machine.state.context.camera.zoom;
        machine.zoomAtViewportPoint(baseZoom * scale, point, viewportSize);
      },
      onPinchEnd: () => {
        if (editInteractionRef.current) {
          return;
        }

        pinchStartZoomRef.current = null;
        machine.endDirectManipulation();
      }
    },
    {
      drag: { filterTaps: true, threshold: 2 }
    }
  );

  const draftClusters = history?.present ?? [];
  const draftSignature = buildMapDraftSignature(draftClusters);
  const cleanSignature = buildMapDraftSignature(cleanDrafts);
  const layoutDraftIsDirty = editMode && draftSignature !== cleanSignature;
  const canUndo = Boolean(history?.past.length);
  const canRedo = Boolean(history?.future.length);

  useEffect(() => {
    if (!editMode || !history) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isEditableEventTarget(event.target)) {
        return;
      }

      if (isUndoShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => (current ? undoEditorHistory(current) : current));
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => (current ? redoEditorHistory(current) : current));
        return;
      }

      if (editLayer === 'clusters') {
        if (isDeleteShortcut(event)) {
          const selectedIndex = history.present.findIndex((cluster) => cluster.id === selectedClusterId);
          if (selectedIndex < 0) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setHistory((current) => {
            if (!current) {
              return current;
            }

            const currentIndex = current.present.findIndex((cluster) => cluster.id === selectedClusterId);
            if (currentIndex < 0) {
              return current;
            }

            const nextPresent = current.present.filter((cluster) => cluster.id !== selectedClusterId);
            const nextSelectedClusterId = getNextSelectedClusterId(nextPresent, currentIndex);
            setSelectedClusterId(nextSelectedClusterId);
            setHasExplicitClusterSelection(Boolean(nextSelectedClusterId));
            setSelectedComponentId(null);
            setEditLayer('clusters');
            setContentPhase('idle');
            return commitEditorHistorySnapshot(current, current.present, nextPresent);
          });
          return;
        }

        if (isDuplicateShortcut(event)) {
          const selectedIndex = history.present.findIndex((cluster) => cluster.id === selectedClusterId);
          if (selectedIndex < 0) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setHistory((current) => {
            if (!current) {
              return current;
            }

            const currentIndex = current.present.findIndex((cluster) => cluster.id === selectedClusterId);
            const selectedCluster = currentIndex >= 0 ? current.present[currentIndex] : null;
            if (!selectedCluster) {
              return current;
            }

            const nextCluster = duplicateClusterDraft(
              selectedCluster,
              new Set(current.present.map((cluster) => cluster.id))
            );
            const nextPresent = [
              ...current.present.slice(0, currentIndex + 1),
              nextCluster,
              ...current.present.slice(currentIndex + 1)
            ];

            setSelectedClusterId(nextCluster.id);
            setHasExplicitClusterSelection(true);
            setSelectedComponentId(null);
            setEditLayer('clusters');
            setContentPhase('idle');
            return commitEditorHistorySnapshot(current, current.present, nextPresent);
          });
          return;
        }

        if (isCopyShortcut(event)) {
          const selectedCluster = history.present.find((cluster) => cluster.id === selectedClusterId);
          if (!selectedCluster) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setEditorClipboard({
            kind: 'map-cluster',
            baseId: selectedCluster.id,
            cluster: {
              ...cloneDeep(selectedCluster),
              components: cloneDeep(selectedCluster.components),
              freeformComponents: selectedCluster.freeformComponents
                ? selectedCluster.freeformComponents.map((draft) => ({
                    ...draft,
                    component: cloneDeep(draft.component)
                  }))
                : null
            }
          });
          return;
        }

        if (isPasteShortcut(event)) {
          const clipboard = getEditorClipboard();
          if (clipboard?.kind !== 'map-cluster') {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setHistory((current) => {
            if (!current) {
              return current;
            }

            const existingIds = new Set(current.present.map((cluster) => cluster.id));
            const nextId = buildUniqueClusterId(clipboard.baseId, existingIds);
            const nextCluster: EditableMapClusterDraft = {
              ...cloneDeep(clipboard.cluster),
              id: nextId,
              title: clipboard.cluster.title ? `${clipboard.cluster.title} copy` : `${nextId}`,
              x: clipboard.cluster.x + 80,
              y: clipboard.cluster.y + 60,
              freeformComponents: clipboard.cluster.freeformComponents
                ? clipboard.cluster.freeformComponents.map((draft) =>
                    createEditableComponentDraft(
                      draft.component,
                      {
                        x: draft.x,
                        y: draft.y,
                        width: draft.width,
                        height: draft.height
                      },
                      'map-cluster-component'
                    )
                  )
                : null
            };

            setSelectedClusterId(nextId);
            setEditLayer('clusters');
            setContentPhase('idle');
            return commitEditorHistorySnapshot(current, current.present, [...current.present, nextCluster]);
          });
          return;
        }

        return;
      }

      if (contentPhase !== 'active') {
        return;
      }

      const selectedCluster = history.present.find((cluster) => cluster.id === selectedClusterId);
      if (!selectedCluster?.freeformComponents) {
        return;
      }

      if (isDeleteShortcut(event)) {
        const selectedIndex = selectedCluster.freeformComponents.findIndex((draft) => draft.draftId === selectedComponentId);
        if (selectedIndex < 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current || !selectedClusterId) {
            return current;
          }

          const nextPresent = current.present.map((cluster) => {
            if (cluster.id !== selectedClusterId) {
              return cluster;
            }

            const drafts = cluster.freeformComponents ?? [];
            const currentIndex = drafts.findIndex((draft) => draft.draftId === selectedComponentId);
            if (currentIndex < 0) {
              return cluster;
            }

            const nextDrafts = drafts.filter((draft) => draft.draftId !== selectedComponentId);
            setSelectedComponentId(getNextSelectedComponentId(nextDrafts, currentIndex));

            return {
              ...cluster,
              freeformComponents: nextDrafts
            };
          });

          return commitEditorHistorySnapshot(current, current.present, nextPresent);
        });
        return;
      }

      if (isDuplicateShortcut(event)) {
        const selectedDraft = selectedCluster.freeformComponents.find((draft) => draft.draftId === selectedComponentId);
        if (!selectedDraft) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current || !selectedClusterId) {
            return current;
          }

          const nextPresent = current.present.map((cluster) => {
            if (cluster.id !== selectedClusterId) {
              return cluster;
            }

            const drafts = cluster.freeformComponents ?? [];
            const currentIndex = drafts.findIndex((draft) => draft.draftId === selectedComponentId);
            const sourceDraft = currentIndex >= 0 ? drafts[currentIndex] : null;
            if (!sourceDraft) {
              return cluster;
            }

            const nextDraft = createEditableComponentDraft(
              cloneDeep(sourceDraft.component),
              offsetFreeformGeometry(sourceDraft, COMPONENT_INSERT_OFFSET, COMPONENT_INSERT_OFFSET),
              'map-cluster-component'
            );
            setSelectedComponentId(nextDraft.draftId);

            return {
              ...cluster,
              freeformComponents: [
                ...drafts.slice(0, currentIndex + 1),
                nextDraft,
                ...drafts.slice(currentIndex + 1)
              ]
            };
          });

          return commitEditorHistorySnapshot(current, current.present, nextPresent);
        });
        return;
      }

      if (isCopyShortcut(event)) {
        const selectedDraft = selectedCluster.freeformComponents.find((draft) => draft.draftId === selectedComponentId);
        if (!selectedDraft) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setEditorClipboard({
          kind: 'map-cluster-component',
          item: {
            component: cloneDeep(selectedDraft.component),
            x: selectedDraft.x,
            y: selectedDraft.y,
            width: selectedDraft.width,
            height: selectedDraft.height
          }
        });
        return;
      }

      if (isPasteShortcut(event)) {
        const clipboard = getEditorClipboard();
        if (clipboard?.kind !== 'map-cluster-component') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current || !selectedClusterId) {
            return current;
          }

          const nextPresent = current.present.map((cluster) => {
            if (cluster.id !== selectedClusterId) {
              return cluster;
            }

            const nextDraft = createEditableComponentDraft(
              clipboard.item.component,
              offsetFreeformGeometry(clipboard.item, COMPONENT_INSERT_OFFSET, COMPONENT_INSERT_OFFSET),
              'map-cluster-component'
            );
            setSelectedComponentId(nextDraft.draftId);

            return {
              ...cluster,
              freeformComponents: [...(cluster.freeformComponents ?? []), nextDraft]
            };
          });

          return commitEditorHistorySnapshot(current, current.present, nextPresent);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [contentPhase, editLayer, editMode, history, selectedClusterId, selectedComponentId]);

  useEffect(() => {
    if (editLayer !== 'components' || contentPhase !== 'measuring' || !selectedClusterId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = clusterContentRefs.current[selectedClusterId];
      const selectedCluster = draftClusters.find((cluster) => cluster.id === selectedClusterId);
      if (!container || !selectedCluster) {
        setSaveError('Could not prepare the cluster component editor.');
        setEditLayer('clusters');
        setContentPhase('idle');
        return;
      }

      if (selectedCluster.freeformComponents?.length) {
        setSelectedComponentId(selectedCluster.freeformComponents[0]?.draftId ?? null);
        setContentPhase('active');
        setSaveError(null);
        return;
      }

      try {
        const measuredDrafts = measureClusterComponentDrafts(container, selectedCluster.components);
        setHistory((current) => {
          if (!current) {
            return current;
          }

          const nextPresent = current.present.map((cluster) =>
            cluster.id === selectedClusterId
              ? {
                  ...cluster,
                  freeformComponents: measuredDrafts
                }
              : cluster
          );

          return replaceEditorHistoryPresent(current, nextPresent);
        });
        setCleanDrafts((current) =>
          current.map((cluster) =>
            cluster.id === selectedClusterId
              ? {
                  ...cluster,
                  freeformComponents: measuredDrafts
                }
              : cluster
          )
        );
        setSelectedComponentId(measuredDrafts[0]?.draftId ?? null);
        setContentPhase('active');
        setSaveError(null);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Could not prepare the cluster component editor.');
        setEditLayer('clusters');
        setContentPhase('idle');
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [contentPhase, draftClusters, editLayer, selectedClusterId]);

  useEffect(() => {
    if (editLayer !== 'components' || contentPhase !== 'active' || !selectedClusterId) {
      return;
    }

    const selectedCluster = draftClusters.find((cluster) => cluster.id === selectedClusterId);
    const freeformComponents = selectedCluster?.freeformComponents ?? [];
    if (!freeformComponents.length) {
      setSelectedComponentId(null);
      return;
    }

    if (!selectedComponentId || !freeformComponents.some((draft) => draft.draftId === selectedComponentId)) {
      setSelectedComponentId(freeformComponents[0]?.draftId ?? null);
    }
  }, [contentPhase, draftClusters, editLayer, selectedClusterId, selectedComponentId]);

  const camera = machine.state.context.camera;
  const cameraBehavior = machine.state.context.cameraBehavior;
  const guidedSequence = presentation.navigation?.sequence ?? clusters.map((cluster) => cluster.id);
  const allClusterIds = clusters.map((cluster) => cluster.id);
  const displaySequence = machine.state.context.guided ? guidedSequence : allClusterIds;
  const activeIndexInDisplay = displaySequence.indexOf(activeClusterId ?? '');
  const currentPosition =
    activeIndexInDisplay >= 0 ? activeIndexInDisplay + 1 : Math.max(1, allClusterIds.indexOf(activeClusterId ?? '') + 1);
  const totalPositions = displaySequence.length || allClusterIds.length;
  const mapStatus =
    editMode && editLayer === 'components'
      ? 'Cluster component edit mode'
      : machine.state.context.guided
        ? 'Guided sequence active'
        : 'Free roam enabled';
  const cameraMotion = getMapCameraMotion(presentation.navigation?.transition, theme, Boolean(prefersReducedMotion));
  const cameraTransform = getCameraTransform(camera, viewportSize);
  const showBoundsOverlay = showClusterBounds || editMode;
  const renderedClusters = editMode ? draftClusters : buildMapDrafts(clusters, machine.positionedClusters);

  const enterEditMode = () => {
    if (editMode || !clusters.length) {
      return;
    }

    const nextDrafts = buildMapDrafts(clusters, machine.positionedClusters);
    setHistory(createEditorHistoryState(nextDrafts));
    setCleanDrafts(nextDrafts);
    setSelectedClusterId(null);
    setHasExplicitClusterSelection(false);
    setSelectedComponentId(null);
    setEditLayer('clusters');
    setContentPhase('idle');
    setSaveError(null);
    setEditMode(true);
  };

  const cancelEditMode = () => {
    editInteractionRef.current = null;
    setEditMode(false);
    setEditLayer('clusters');
    setContentPhase('idle');
    setHistory(null);
    setCleanDrafts([]);
    setSelectedClusterId(null);
    setHasExplicitClusterSelection(false);
    setSelectedComponentId(null);
    setSaveError(null);
    setIsSavingLayout(false);
    setShowAddComponentOverlay(false);
  };

  const startClusterInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    clusterId: string,
    mode: EditInteractionMode
  ) => {
    if (!editMode || editLayer !== 'clusters' || isSavingLayout || event.button !== 0 || !history) {
      return;
    }

    const geometry = history.present.find((cluster) => cluster.id === clusterId);
    if (!geometry) {
      return;
    }

    setSaveError(null);
    editInteractionRef.current = {
      kind: 'cluster',
      clusterId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDrafts: history.present,
      zoom: machine.state.context.camera.zoom,
      changed: false
    };
    event.preventDefault();
    event.stopPropagation();
  };

  const startComponentInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    clusterId: string,
    componentId: string,
    mode: EditInteractionMode
  ) => {
    if (editLayer !== 'components' || contentPhase !== 'active' || isSavingLayout || event.button !== 0 || !history) {
      return;
    }

    const cluster = history.present.find((item) => item.id === clusterId);
    const geometry = cluster?.freeformComponents?.find((draft) => draft.draftId === componentId);
    const container = clusterContentRefs.current[clusterId];
    if (!geometry || !container) {
      return;
    }

    const bodyRect = container.getBoundingClientRect();
    setSelectedComponentId(componentId);
    setSaveError(null);
    editInteractionRef.current = {
      kind: 'component',
      clusterId,
      componentId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDrafts: history.present,
      boundsWidth: bodyRect.width,
      boundsHeight: bodyRect.height,
      changed: false
    };
    event.preventDefault();
    event.stopPropagation();
  };

  const saveLayout = async () => {
    if (!editMode || !history || !layoutDraftIsDirty || isSavingLayout) {
      return;
    }

    setIsSavingLayout(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/presentations/${encodeURIComponent(presentation.meta.slug)}/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clusters: history.present.map((cluster) =>
            buildClusterSavePayload(
              cluster,
              cleanDrafts.find((cleanCluster) => cleanCluster.id === cluster.id)
            )
          )
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save layout.');
      }

      if (process.env.NODE_ENV === 'development') {
        void fetch(`/api/dev/presentations/${encodeURIComponent(presentation.meta.slug)}/thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        });
      }

      cancelEditMode();
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save layout.');
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleClusterKeyDown = (event: ReactKeyboardEvent<HTMLElement>, clusterId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (editMode) {
        if (editLayer === 'clusters') {
          if (selectedClusterId === clusterId && hasExplicitClusterSelection) {
            setEditLayer('components');
            setContentPhase('measuring');
            setSelectedComponentId(null);
          } else {
            setSelectedClusterId(clusterId);
            setHasExplicitClusterSelection(true);
            setSaveError(null);
          }
        }
        return;
      }

      machine.flyToCluster(clusterId);
    }
  };

  const exitComponentEditMode = (nextSelectedClusterId = selectedClusterId, explicit = true) => {
    setEditLayer('clusters');
    setContentPhase('idle');
    setSelectedComponentId(null);
    setSelectedClusterId(nextSelectedClusterId ?? null);
    setHasExplicitClusterSelection(explicit && Boolean(nextSelectedClusterId));
    setSaveError(null);
  };

  const clearSelection = () => {
    setEditLayer('clusters');
    setContentPhase('idle');
    setSelectedClusterId(null);
    setSelectedComponentId(null);
    setHasExplicitClusterSelection(false);
    setSaveError(null);
  };

  const handleClusterSelect = (event: Pick<MouseEvent<HTMLElement>, 'preventDefault' | 'stopPropagation'>, clusterId: string) => {
    if (editMode) {
      event.preventDefault();
      event.stopPropagation();

      if (Date.now() < clickSuppressUntilRef.current) {
        return;
      }

      if (editLayer === 'clusters') {
        if (selectedClusterId === clusterId && hasExplicitClusterSelection) {
          setEditLayer('components');
          setContentPhase('measuring');
          setSelectedComponentId(null);
        } else {
          setSelectedClusterId(clusterId);
          setHasExplicitClusterSelection(true);
          setSaveError(null);
        }
        return;
      }

      exitComponentEditMode(clusterId);
      return;
    }

    if (Date.now() < clickSuppressUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    machine.flyToCluster(clusterId);
  };

  const handleViewportClick = (event: MouseEvent<HTMLElement>) => {
    if (!editMode) {
      return;
    }

    if (Date.now() < clickSuppressUntilRef.current) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest('.clusterCard')) {
      return;
    }

    clearSelection();
  };

  const handleAddClusterComponent = (component: ComponentInstance) => {
    if (!selectedClusterId) {
      return;
    }

    setHistory((current) => {
      if (!current) {
        return current;
      }

      const nextPresent = current.present.map((cluster) => {
        if (cluster.id !== selectedClusterId) {
          return cluster;
        }

        const currentDrafts = cluster.freeformComponents ?? [];
        const nextDraft = createEditableComponentDraft(
          component,
          getInsertedComponentGeometry(currentDrafts),
          'map-cluster-component'
        );
        setSelectedComponentId(nextDraft.draftId);

        return {
          ...cluster,
          freeformComponents: [...currentDrafts, nextDraft]
        };
      });

      return commitEditorHistorySnapshot(current, current.present, nextPresent);
    });
    setShowAddComponentOverlay(false);
  };

  return (
    <main className="viewerShell mapViewer" data-xt-presenter-ready={presenterReady ? 'true' : 'false'}>
      <BackgroundLayer />
      <div ref={viewportRef} className="mapViewport" onClick={handleViewportClick} {...bind()}>
        <motion.div
          className="mapCanvas"
          data-show-bounds={showBoundsOverlay ? 'true' : 'false'}
          data-camera-behavior={cameraBehavior}
          initial={false}
          animate={{
            x: cameraTransform.x,
            y: cameraTransform.y,
            scale: cameraTransform.scale
          }}
          transition={cameraBehavior === 'flight' ? cameraMotion : { duration: 0 }}
        >
          {renderedClusters.map((cluster) => {
            const clusterLabel = [cluster.title ?? cluster.id, cluster.description].filter(Boolean).join('. ');
            const isSelected = cluster.id === selectedClusterId;
            const isContentEditing = editMode && editLayer === 'components' && cluster.id === selectedClusterId;
            const renderableContent = getRenderableClusterComponents(cluster);
            const freeformDrafts = cluster.freeformComponents ?? [];

            return (
              <div
                key={cluster.id}
                className={`clusterCard ${cluster.id === activeClusterId ? 'active' : ''} ${showBoundsOverlay ? 'showBounds' : ''} ${editMode ? 'editing' : ''} ${isSelected ? 'selected' : ''} ${isContentEditing ? 'componentEditing' : ''}`}
                style={{ left: cluster.x, top: cluster.y, width: cluster.width, height: cluster.height }}
                role="button"
                tabIndex={0}
                aria-label={clusterLabel}
                aria-pressed={editMode ? isSelected : undefined}
                data-cluster-id={cluster.id}
                data-editing={editMode ? 'true' : 'false'}
                data-selected={isSelected ? 'true' : 'false'}
                onClick={(event) => handleClusterSelect(event, cluster.id)}
                onKeyDown={(event) => handleClusterKeyDown(event, cluster.id)}
                onPointerDown={(event) => startClusterInteraction(event, cluster.id, 'move')}
              >
                {showBoundsOverlay ? (
                  <div className="clusterCardBounds" aria-hidden="true">
                    <span className="clusterCardBoundsLabel">
                      {cluster.id} {Math.round(cluster.width)}×{Math.round(cluster.height)}
                    </span>
                  </div>
                ) : null}
                <div className="clusterCardHeader">
                  <span className="clusterBadge">{cluster.group ?? 'Cluster'}</span>
                  <span className="clusterCardTitle">{cluster.title ?? cluster.id}</span>
                </div>
                <div
                  ref={(node) => {
                    clusterContentRefs.current[cluster.id] = node;
                  }}
                  className="clusterCardContent"
                >
                  {isContentEditing && contentPhase === 'active' ? (
                    <div className="stageEditCanvas clusterComponentEditCanvas" aria-label="Cluster component editor">
                      {freeformDrafts.map((item, index) => {
                        const isSelectedComponent = item.draftId === selectedComponentId;
                        return (
                          <div
                            key={item.draftId}
                            className={`stageEditItem ${isSelectedComponent ? 'selected' : ''}`}
                            style={{
                              left: `${item.x * 100}%`,
                              top: `${item.y * 100}%`,
                              width: `${item.width * 100}%`,
                              height: `${item.height * 100}%`
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={getContentLabel(item.component, index)}
                            aria-pressed={isSelectedComponent}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedComponentId(item.draftId);
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, cluster.id, item.draftId, 'move')}
                          >
                            <div className="stageEditItemHeader" aria-hidden="true">
                              <span className="clusterBadge">{item.component.type}</span>
                              <span className="stageEditItemLabel">{index + 1}</span>
                            </div>
                            <div className="stageEditItemContent">
                              <LayoutRenderer
                                layout="single-content"
                                items={[
                                  {
                                    component: createDraftComponentInstance(item),
                                    revealCount: Number.MAX_SAFE_INTEGER
                                  }
                                ]}
                                compact
                              />
                            </div>
                            {isSelectedComponent ? (
                              <>
                                <button
                                  type="button"
                                  className="clusterResizeHandle clusterResizeHandleEast"
                                  aria-label={`Resize cluster component ${index + 1} width`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                  onPointerDown={(event) => startComponentInteraction(event, cluster.id, item.draftId, 'resize-right')}
                                />
                                <button
                                  type="button"
                                  className="clusterResizeHandle clusterResizeHandleSouth"
                                  aria-label={`Resize cluster component ${index + 1} height`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                  onPointerDown={(event) => startComponentInteraction(event, cluster.id, item.draftId, 'resize-bottom')}
                                />
                                <button
                                  type="button"
                                  className="clusterResizeHandle clusterResizeHandleCorner"
                                  aria-label={`Resize cluster component ${index + 1} width and height`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                  onPointerDown={(event) => startComponentInteraction(event, cluster.id, item.draftId, 'resize-corner')}
                                />
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <LayoutRenderer
                      layout={renderableContent.layout}
                      layoutProps={renderableContent.layoutProps}
                      items={renderableContent.components.map((component) => ({ component, revealCount: 999 }))}
                      compact
                    />
                  )}
                </div>
                {editMode && editLayer === 'clusters' && isSelected ? (
                  <>
                    <button
                      type="button"
                      className="clusterResizeHandle clusterResizeHandleEast"
                      aria-label={`Resize ${cluster.id} width`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onPointerDown={(event) => startClusterInteraction(event, cluster.id, 'resize-right')}
                    />
                    <button
                      type="button"
                      className="clusterResizeHandle clusterResizeHandleSouth"
                      aria-label={`Resize ${cluster.id} height`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onPointerDown={(event) => startClusterInteraction(event, cluster.id, 'resize-bottom')}
                    />
                    <button
                      type="button"
                      className="clusterResizeHandle clusterResizeHandleCorner"
                      aria-label={`Resize ${cluster.id} width and height`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onPointerDown={(event) => startClusterInteraction(event, cluster.id, 'resize-corner')}
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </motion.div>
      </div>
      <PresentationControls
        total={totalPositions}
        current={currentPosition}
        mapMode
        sequence={
          <div className="mapSequence appScrollbarMuted">
            {displaySequence.map((clusterId, index) => (
              <button
                key={clusterId}
                type="button"
                className={`sequenceChip ${clusterId === activeClusterId ? 'active' : ''}`}
                onClick={() => machine.flyToCluster(clusterId)}
              >
                {index + 1}. {clusterId}
              </button>
            ))}
          </div>
        }
        rightActions={
          <>
            <span className="mapMeta">{mapStatus}</span>
            {editMode ? (
              <>
                <span className={`mapEditStatus ${layoutDraftIsDirty ? 'dirty' : ''}`}>
                  {contentPhase === 'measuring'
                    ? 'Preparing components'
                    : editLayer === 'components'
                      ? 'Editing cluster contents'
                      : layoutDraftIsDirty
                        ? 'Unsaved edits'
                        : 'Editing layout'}
                </span>
                <span className="mapMeta">Undo {canUndo ? 'available' : 'empty'} | Redo {canRedo ? 'available' : 'empty'}</span>
                {saveError ? <span className="mapEditError">{saveError}</span> : null}
                {editLayer === 'components' ? (
                  <>
                    <button
                      type="button"
                      className="ghostButton"
                      onClick={() => setShowAddComponentOverlay(true)}
                      disabled={contentPhase !== 'active' || isSavingLayout}
                    >
                      Add component
                    </button>
                    <button
                      type="button"
                      className="ghostButton"
                      onClick={() => {
                        setEditLayer('clusters');
                        setContentPhase('idle');
                        setSelectedComponentId(null);
                      }}
                      disabled={isSavingLayout}
                    >
                      Back to clusters
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => {
                    void saveLayout();
                  }}
                  disabled={!layoutDraftIsDirty || isSavingLayout}
                >
                  {isSavingLayout ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="ghostButton" onClick={cancelEditMode} disabled={isSavingLayout}>
                  Cancel
                </button>
              </>
            ) : null}
            {isDev ? (
              <>
                {!editMode ? (
                  <button type="button" className="ghostButton" onClick={enterEditMode}>
                    Edit layout
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => setShowClusterBounds((value) => !value)}
                  aria-pressed={showClusterBounds}
                >
                  Bounds
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="ghostButton"
              onClick={machine.state.context.guided ? machine.exitGuided : machine.enterGuided}
            >
              {machine.state.context.guided ? 'Free roam' : 'Guided'}
            </button>
            <button type="button" className="ghostButton" onClick={() => router.push('/')}>
              Back
            </button>
          </>
        }
      />
      <AddComponentOverlay
        open={showAddComponentOverlay}
        title="Add component to cluster"
        onClose={() => setShowAddComponentOverlay(false)}
        onAdd={(definition) => handleAddClusterComponent(definition.component)}
      />
      <LiveRegion message={`Map cluster ${activeClusterId ?? 'overview'}`} />
    </main>
  );
}
