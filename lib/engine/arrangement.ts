import { ClusterDefinition, MapCanvasConfig } from '@/lib/types/presentation';

export interface PositionedCluster {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DIRECTION_VECTORS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  above: { x: 0, y: -1 },
  below: { x: 0, y: 1 },
  'upper-right': { x: 1, y: -1 },
  'upper-left': { x: -1, y: -1 },
  'lower-right': { x: 1, y: 1 },
  'lower-left': { x: -1, y: 1 }
} as const;

function estimateClusterSize(cluster: ClusterDefinition): { width: number; height: number } {
  const width = Number(cluster.layoutProps?.width ?? 540);
  const height = Number(cluster.layoutProps?.height ?? 360);
  return { width, height };
}

function resolveManualPositions(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  const positioned = new Map<string, PositionedCluster>();

  const resolve = (cluster: ClusterDefinition): PositionedCluster => {
    const existing = positioned.get(cluster.id);
    if (existing) {
      return existing;
    }

    const { width, height } = estimateClusterSize(cluster);
    const anchor = cluster.anchor;

    if (!anchor || (anchor.x != null && anchor.y != null)) {
      const resolved = {
        id: cluster.id,
        x: anchor?.x ?? 0,
        y: anchor?.y ?? 0,
        width,
        height
      };
      positioned.set(cluster.id, resolved);
      return resolved;
    }

    const base = clusters.find((candidate) => candidate.id === anchor.relativeTo);
    if (!base) {
      const fallback = { id: cluster.id, x: 0, y: 0, width, height };
      positioned.set(cluster.id, fallback);
      return fallback;
    }

    const basePosition = resolve(base);
    const vector = DIRECTION_VECTORS[anchor.direction ?? 'right'];
    const distance = anchor.distance ?? spacing;
    const resolved = {
      id: cluster.id,
      x: basePosition.x + vector.x * distance,
      y: basePosition.y + vector.y * distance,
      width,
      height
    };
    positioned.set(cluster.id, resolved);
    return resolved;
  };

  return clusters.map(resolve);
}

function flowArrangement(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  return clusters.map((cluster, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const { width, height } = estimateClusterSize(cluster);
    return {
      id: cluster.id,
      x: column * (width + spacing),
      y: row * (height + spacing),
      width,
      height
    };
  });
}

function radialArrangement(clusters: ClusterDefinition[], radius: number): PositionedCluster[] {
  return clusters.map((cluster, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(clusters.length, 1);
    const { width, height } = estimateClusterSize(cluster);
    return {
      id: cluster.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      width,
      height
    };
  });
}

function gridArrangement(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  const columns = Math.max(2, Math.ceil(Math.sqrt(clusters.length)));
  return clusters.map((cluster, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const { width, height } = estimateClusterSize(cluster);
    return {
      id: cluster.id,
      x: column * (width + spacing),
      y: row * (height + spacing),
      width,
      height
    };
  });
}

export function resolveClusterPositions(
  clusters: ClusterDefinition[],
  canvas: MapCanvasConfig = {}
): PositionedCluster[] {
  const spacing = canvas.spacing ?? 320;
  const arrangement = clusters[0]?.arrangement?.algorithm;

  if (arrangement === 'radial') {
    return radialArrangement(clusters, clusters[0]?.arrangement?.radius ?? spacing * 1.2);
  }

  if (arrangement === 'grid') {
    return gridArrangement(clusters, spacing);
  }

  if (arrangement === 'flow') {
    return flowArrangement(clusters, spacing);
  }

  return resolveManualPositions(clusters, spacing);
}

export function frameClusters(clusters: PositionedCluster[]): { x: number; y: number; zoom: number } {
  if (!clusters.length) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const minX = Math.min(...clusters.map((cluster) => cluster.x));
  const minY = Math.min(...clusters.map((cluster) => cluster.y));
  const maxX = Math.max(...clusters.map((cluster) => cluster.x + cluster.width));
  const maxY = Math.max(...clusters.map((cluster) => cluster.y + cluster.height));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const zoom = Math.max(0.35, Math.min(1, 1100 / Math.max(spanX, spanY, 1)));

  return { x: centerX, y: centerY, zoom };
}
