'use client';

import { useGesture } from '@use-gesture/react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

import { frameClusters } from '@/lib/engine/arrangement';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls } from '@/lib/runtime/ui/presentation-controls';

export function MapRenderer() {
  const { presentation, machine } = usePresentationRuntime();
  const prefersReducedMotion = useReducedMotion();
  const activeClusterId = machine.state.context.currentClusterId;
  const clusters = presentation.clusters ?? [];
  const bounds = useMemo(() => frameClusters(machine.positionedClusters), [machine.positionedClusters]);

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

  return (
    <div className="viewerShell mapViewer">
      <BackgroundLayer />
      <Link href="/" className="backLink">
        Back
      </Link>
      <div className="mapToolbar">
        <button type="button" className="ghostButton" onClick={machine.state.context.guided ? machine.exitGuided : machine.enterGuided}>
          {machine.state.context.guided ? 'Free roam' : 'Guided'}
        </button>
        <span className="mapMeta">{machine.state.context.guided ? 'Guided sequence active' : 'Drag to pan, wheel to zoom'}</span>
      </div>
      <div className="mapViewport" {...bind()}>
        <motion.div
          className="mapCanvas"
          animate={{
            x: -camera.x + bounds.x + 260,
            y: -camera.y + bounds.y + 180,
            scale: camera.zoom
          }}
          transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {machine.positionedClusters.map((position) => {
            const cluster = clusters.find((item) => item.id === position.id);
            if (!cluster) {
              return null;
            }

            return (
              <button
                type="button"
                key={cluster.id}
                className={`clusterCard ${cluster.id === activeClusterId ? 'active' : ''}`}
                style={{ left: position.x, top: position.y, width: position.width, height: position.height }}
                onClick={() => machine.goToCluster(cluster.id)}
              >
                <div className="clusterCardHeader">
                  <span className="clusterBadge">{cluster.group ?? 'Cluster'}</span>
                  <h2>{cluster.title ?? cluster.id}</h2>
                  {cluster.description ? <p>{cluster.description}</p> : null}
                </div>
                <LayoutRenderer
                  layout={cluster.layout}
                  layoutProps={cluster.layoutProps}
                  items={cluster.components.map((component) => ({ component, revealCount: 999 }))}
                  compact
                />
              </button>
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
      <PresentationControls total={clusters.length} current={guidedSequence.indexOf(activeClusterId ?? '') + 1 || 1} mapMode />
      <LiveRegion message={`Map cluster ${activeClusterId ?? 'overview'}`} />
    </div>
  );
}
