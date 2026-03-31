'use client';

import { useGesture } from '@use-gesture/react';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

export function MapRenderer() {
  const router = useRouter();
  const { presentation, machine } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const activeClusterId = machine.state.context.currentClusterId;
  const clusters = presentation.clusters ?? [];
  const viewportRef = useRef<HTMLDivElement | null>(null);
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

  const bind = useGesture(
    {
      onDrag: ({ delta: [x, y] }) => machine.pan(x, y),
      onWheel: ({ delta: [, y] }) => machine.zoom(machine.state.context.camera.zoom - y / 1200)
    },
    {
      drag: { filterTaps: true }
    }
  );

  const camera = machine.state.context.camera;
  const guidedSequence = presentation.navigation?.sequence ?? clusters.map((cluster) => cluster.id);
  const allClusterIds = clusters.map((cluster) => cluster.id);
  const displaySequence = machine.state.context.guided ? guidedSequence : allClusterIds;
  const activeIndexInDisplay = displaySequence.indexOf(activeClusterId ?? '');
  const currentPosition = activeIndexInDisplay >= 0 ? activeIndexInDisplay + 1 : Math.max(1, allClusterIds.indexOf(activeClusterId ?? '') + 1);
  const totalPositions = displaySequence.length || allClusterIds.length;

  const handleClusterKeyDown = (event: KeyboardEvent<HTMLElement>, clusterId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      machine.goToCluster(clusterId);
    }
  };

  return (
    <div className="viewerShell mapViewer">
      <BackgroundLayer />
      <button type="button" className="backLink" onClick={() => router.push('/')}>
        Back
      </button>
      <div className="mapToolbar">
        <button type="button" className="ghostButton" onClick={machine.state.context.guided ? machine.exitGuided : machine.enterGuided}>
          {machine.state.context.guided ? 'Free roam' : 'Guided'}
        </button>
        <span className="mapMeta">{machine.state.context.guided ? 'Guided sequence active' : 'Drag to pan, wheel to zoom'}</span>
      </div>
      <div ref={viewportRef} className="mapViewport" {...bind()}>
        <motion.div
          className="mapCanvas"
          animate={{
            x: viewportSize.width / 2 - camera.x * camera.zoom,
            y: viewportSize.height / 2 - camera.y * camera.zoom,
            scale: camera.zoom
          }}
          transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {machine.positionedClusters.map((position) => {
            const cluster = clusters.find((item) => item.id === position.id);
            if (!cluster) {
              return null;
            }

            const clusterLabel = [cluster.title ?? cluster.id, cluster.description].filter(Boolean).join('. ');

            return (
              <article
                key={cluster.id}
                className={`clusterCard ${cluster.id === activeClusterId ? 'active' : ''}`}
                style={{ left: position.x, top: position.y, width: position.width, height: position.height }}
                role="button"
                tabIndex={0}
                aria-label={clusterLabel}
                onClick={() => machine.goToCluster(cluster.id)}
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
              </article>
            );
          })}
        </motion.div>
      </div>
      <div className="mapSequence">
        {guidedSequence.map((clusterId, index) => (
          <button
            key={clusterId}
            type="button"
            className={`sequenceChip ${clusterId === activeClusterId ? 'active' : ''}`}
            onClick={() => machine.goToCluster(clusterId)}
          >
            {index + 1}. {clusterId}
          </button>
        ))}
      </div>
      <PresentationControls total={totalPositions} current={currentPosition} mapMode />
      <LiveRegion message={`Map cluster ${activeClusterId ?? 'overview'}`} />
    </div>
  );
}
