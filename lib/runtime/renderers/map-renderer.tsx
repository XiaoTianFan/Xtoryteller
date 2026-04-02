'use client';

import { useGesture } from '@use-gesture/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';

import { getCameraTransform, ViewportPoint } from '@/lib/engine/arrangement';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getMapCameraMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

export function MapRenderer() {
  const router = useRouter();
  const { presentation, theme, machine } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const activeClusterId = machine.state.context.currentClusterId;
  const clusters = presentation.clusters ?? [];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const wheelInteractionTimeoutRef = useRef<number | null>(null);
  const clickSuppressUntilRef = useRef(0);
  const dragMovementRef = useRef({ x: 0, y: 0 });
  const pinchStartZoomRef = useRef<number | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });

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

  const handleClusterKeyDown = (event: KeyboardEvent<HTMLElement>, clusterId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      machine.flyToCluster(clusterId);
    }
  };

  const handleClusterSelect = (event: Pick<MouseEvent<HTMLElement>, 'preventDefault' | 'stopPropagation'>, clusterId: string) => {
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
          data-camera-behavior={cameraBehavior}
          initial={false}
          animate={{
            x: cameraTransform.x,
            y: cameraTransform.y,
            scale: cameraTransform.scale
          }}
          transition={cameraBehavior === 'flight' ? cameraMotion : { duration: 0 }}
        >
          {machine.positionedClusters.map((position) => {
            const cluster = clusters.find((item) => item.id === position.id);
            if (!cluster) {
              return null;
            }

            const clusterLabel = [cluster.title ?? cluster.id, cluster.description].filter(Boolean).join('. ');

            return (
              <div
                key={cluster.id}
                className={`clusterCard ${cluster.id === activeClusterId ? 'active' : ''}`}
                style={{ left: position.x, top: position.y, width: position.width, height: position.height }}
                role="button"
                tabIndex={0}
                aria-label={clusterLabel}
                onClick={(event) => handleClusterSelect(event, cluster.id)}
                onKeyDown={(event) => handleClusterKeyDown(event, cluster.id)}
              >
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
