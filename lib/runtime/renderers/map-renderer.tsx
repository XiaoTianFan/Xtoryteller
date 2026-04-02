'use client';

import { useGesture } from '@use-gesture/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';

import { getCameraTransform, PositionedCluster, ViewportPoint } from '@/lib/engine/arrangement';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getMapCameraMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

interface EditableClusterGeometry extends PositionedCluster {}

type EditInteractionMode = 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';

interface EditInteraction {
  clusterId: string;
  mode: EditInteractionMode;
  startClientX: number;
  startClientY: number;
  startGeometry: EditableClusterGeometry;
  zoom: number;
}

const MIN_CLUSTER_WIDTH = 280;
const MIN_CLUSTER_HEIGHT = 180;

function buildDraftGeometry(clusters: PositionedCluster[]) {
  return Object.fromEntries(
    clusters.map((cluster) => [
      cluster.id,
      {
        id: cluster.id,
        x: Math.round(cluster.x),
        y: Math.round(cluster.y),
        width: Math.round(cluster.width),
        height: Math.round(cluster.height)
      } satisfies EditableClusterGeometry
    ])
  ) as Record<string, EditableClusterGeometry>;
}

function getDraftSignature(draft: Record<string, EditableClusterGeometry>) {
  return Object.keys(draft)
    .sort((left, right) => left.localeCompare(right))
    .map((clusterId) => {
      const cluster = draft[clusterId];
      return `${clusterId}:${cluster.x},${cluster.y},${cluster.width},${cluster.height}`;
    })
    .join('|');
}

function updateGeometryFromPointer(interaction: EditInteraction, clientX: number, clientY: number): EditableClusterGeometry {
  const deltaX = (clientX - interaction.startClientX) / Math.max(interaction.zoom, 0.001);
  const deltaY = (clientY - interaction.startClientY) / Math.max(interaction.zoom, 0.001);
  const start = interaction.startGeometry;

  if (interaction.mode === 'move') {
    return {
      ...start,
      x: Math.round(start.x + deltaX),
      y: Math.round(start.y + deltaY)
    };
  }

  if (interaction.mode === 'resize-right') {
    return {
      ...start,
      width: Math.max(MIN_CLUSTER_WIDTH, Math.round(start.width + deltaX))
    };
  }

  if (interaction.mode === 'resize-bottom') {
    return {
      ...start,
      height: Math.max(MIN_CLUSTER_HEIGHT, Math.round(start.height + deltaY))
    };
  }

  return {
    ...start,
    width: Math.max(MIN_CLUSTER_WIDTH, Math.round(start.width + deltaX)),
    height: Math.max(MIN_CLUSTER_HEIGHT, Math.round(start.height + deltaY))
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
  const wheelInteractionTimeoutRef = useRef<number | null>(null);
  const clickSuppressUntilRef = useRef(0);
  const dragMovementRef = useRef({ x: 0, y: 0 });
  const pinchStartZoomRef = useRef<number | null>(null);
  const editInteractionRef = useRef<EditInteraction | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const [showClusterBounds, setShowClusterBounds] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draftClusters, setDraftClusters] = useState<Record<string, EditableClusterGeometry>>({});
  const [initialDraftSignature, setInitialDraftSignature] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

      setDraftClusters((current) => {
        const existing = current[interaction.clusterId];
        if (!existing) {
          return current;
        }

        const next = updateGeometryFromPointer(interaction, event.clientX, event.clientY);
        if (
          next.x === existing.x &&
          next.y === existing.y &&
          next.width === existing.width &&
          next.height === existing.height
        ) {
          return current;
        }

        return {
          ...current,
          [interaction.clusterId]: next
        };
      });
    };

    const finishInteraction = () => {
      editInteractionRef.current = null;
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
      onDragStart: () => {
        dragMovementRef.current = { x: 0, y: 0 };
        machine.beginDirectManipulation();
      },
      onDrag: ({ movement: [moveX, moveY], pinching }) => {
        if (pinching) {
          return;
        }

        if (Math.hypot(moveX, moveY) > 6) {
          clickSuppressUntilRef.current = Date.now() + 180;
        }

        machine.panBy(moveX - dragMovementRef.current.x, moveY - dragMovementRef.current.y);
        dragMovementRef.current = { x: moveX, y: moveY };
      },
      onDragEnd: () => {
        dragMovementRef.current = { x: 0, y: 0 };
        machine.endDirectManipulation();
      },
      onWheel: ({ event, delta: [, y] }) => {
        event.preventDefault();
        machine.beginDirectManipulation();
        const point = getViewportPoint(event.clientX, event.clientY);
        const nextZoom = machine.state.context.camera.zoom * Math.exp(-y / 400);
        machine.zoomAtViewportPoint(nextZoom, point, viewportSize);
        scheduleInteractionEnd();
      },
      onPinchStart: () => {
        pinchStartZoomRef.current = machine.state.context.camera.zoom;
        machine.beginDirectManipulation();
      },
      onPinch: ({ first, offset: [scale], origin: [originX, originY] }) => {
        if (first) {
          pinchStartZoomRef.current = machine.state.context.camera.zoom;
        }

        const point = getViewportPoint(originX, originY);
        const baseZoom = pinchStartZoomRef.current ?? machine.state.context.camera.zoom;
        machine.zoomAtViewportPoint(baseZoom * scale, point, viewportSize);
      },
      onPinchEnd: () => {
        pinchStartZoomRef.current = null;
        machine.endDirectManipulation();
      }
    },
    {
      drag: { filterTaps: true, threshold: 2 }
    }
  );

  const camera = machine.state.context.camera;
  const cameraBehavior = machine.state.context.cameraBehavior;
  const guidedSequence = presentation.navigation?.sequence ?? clusters.map((cluster) => cluster.id);
  const allClusterIds = clusters.map((cluster) => cluster.id);
  const displaySequence = machine.state.context.guided ? guidedSequence : allClusterIds;
  const activeIndexInDisplay = displaySequence.indexOf(activeClusterId ?? '');
  const currentPosition =
    activeIndexInDisplay >= 0 ? activeIndexInDisplay + 1 : Math.max(1, allClusterIds.indexOf(activeClusterId ?? '') + 1);
  const totalPositions = displaySequence.length || allClusterIds.length;
  const mapStatus = machine.state.context.guided ? 'Guided sequence active' : 'Free roam enabled';
  const cameraMotion = getMapCameraMotion(presentation.navigation?.transition, theme, Boolean(prefersReducedMotion));
  const cameraTransform = getCameraTransform(camera, viewportSize);
  const draftSignature = getDraftSignature(draftClusters);
  const layoutDraftIsDirty = editMode && draftSignature !== initialDraftSignature;
  const showBoundsOverlay = showClusterBounds || editMode;
  const resolvedPositionsById = new Map(machine.positionedClusters.map((cluster) => [cluster.id, cluster]));
  const renderedClusters = editMode
    ? clusters
        .map((cluster) => {
          const draft = draftClusters[cluster.id] ?? resolvedPositionsById.get(cluster.id);
          return draft ? { ...draft } : null;
        })
        .filter((cluster): cluster is EditableClusterGeometry => Boolean(cluster))
    : machine.positionedClusters;

  const enterEditMode = () => {
    if (editMode || !clusters.length) {
      return;
    }

    const nextDraft = buildDraftGeometry(machine.positionedClusters);
    setDraftClusters(nextDraft);
    setInitialDraftSignature(getDraftSignature(nextDraft));
    setSelectedClusterId(activeClusterId ?? clusters[0]?.id ?? null);
    setSaveError(null);
    setEditMode(true);
  };

  const cancelEditMode = () => {
    editInteractionRef.current = null;
    setEditMode(false);
    setDraftClusters({});
    setInitialDraftSignature('');
    setSelectedClusterId(null);
    setSaveError(null);
    setIsSavingLayout(false);
  };

  const startClusterInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    clusterId: string,
    mode: EditInteractionMode
  ) => {
    if (!editMode || isSavingLayout || event.button !== 0) {
      return;
    }

    const geometry = draftClusters[clusterId];
    if (!geometry) {
      return;
    }

    setSelectedClusterId(clusterId);
    setSaveError(null);
    clickSuppressUntilRef.current = Date.now() + 180;
    editInteractionRef.current = {
      clusterId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startGeometry: geometry,
      zoom: machine.state.context.camera.zoom
    };
    event.preventDefault();
    event.stopPropagation();
  };

  const saveLayout = async () => {
    if (!editMode || !layoutDraftIsDirty || isSavingLayout) {
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
          clusters: clusters
            .map((cluster) => draftClusters[cluster.id])
            .filter((cluster): cluster is EditableClusterGeometry => Boolean(cluster))
            .map((cluster) => ({
              id: cluster.id,
              x: cluster.x,
              y: cluster.y,
              width: cluster.width,
              height: cluster.height
            }))
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save layout.');
      }

      cancelEditMode();
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save layout.');
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleClusterKeyDown = (event: KeyboardEvent<HTMLElement>, clusterId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (editMode) {
        setSelectedClusterId(clusterId);
        return;
      }

      machine.flyToCluster(clusterId);
    }
  };

  const handleClusterSelect = (event: Pick<MouseEvent<HTMLElement>, 'preventDefault' | 'stopPropagation'>, clusterId: string) => {
    if (editMode) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedClusterId(clusterId);
      setSaveError(null);
      return;
    }

    if (Date.now() < clickSuppressUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    machine.flyToCluster(clusterId);
  };

  return (
    <main className="viewerShell mapViewer">
      <BackgroundLayer />
      <div ref={viewportRef} className="mapViewport" {...bind()}>
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
          {renderedClusters.map((position) => {
            const cluster = clusters.find((item) => item.id === position.id);
            if (!cluster) {
              return null;
            }

            const clusterLabel = [cluster.title ?? cluster.id, cluster.description].filter(Boolean).join('. ');
            const isSelected = cluster.id === selectedClusterId;

            return (
              <div
                key={cluster.id}
                className={`clusterCard ${cluster.id === activeClusterId ? 'active' : ''} ${showBoundsOverlay ? 'showBounds' : ''} ${editMode ? 'editing' : ''} ${isSelected ? 'selected' : ''}`}
                style={{ left: position.x, top: position.y, width: position.width, height: position.height }}
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
                      {cluster.id} {Math.round(position.width)}×{Math.round(position.height)}
                    </span>
                  </div>
                ) : null}
                <div className="clusterCardHeader">
                  <span className="clusterBadge">{cluster.group ?? 'Cluster'}</span>
                  <span className="clusterCardTitle">{cluster.title ?? cluster.id}</span>
                </div>
                <div className="clusterCardContent">
                  <LayoutRenderer
                    layout={cluster.layout}
                    layoutProps={cluster.layoutProps}
                    items={cluster.components.map((component) => ({ component, revealCount: 999 }))}
                    compact
                  />
                </div>
                {editMode && isSelected ? (
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
                  {layoutDraftIsDirty ? 'Unsaved edits' : 'Editing layout'}
                </span>
                {saveError ? <span className="mapEditError">{saveError}</span> : null}
                <button
                  type="button"
                  className="ghostButton"
                  onClick={saveLayout}
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
      <LiveRegion message={`Map cluster ${activeClusterId ?? 'overview'}`} />
    </main>
  );
}
