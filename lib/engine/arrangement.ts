import { ClusterDefinition, MapCanvasConfig } from '@/lib/types/presentation';

export interface PositionedCluster {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function clampZoom(zoom: number, canvas: MapCanvasConfig): number {
  return Math.min(canvas.maxZoom ?? 2.5, Math.max(canvas.minZoom ?? 0.35, zoom));
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

function getArrangementConfig(clusters: ClusterDefinition[], canvas: MapCanvasConfig) {
  const configured = clusters.find((cluster) => cluster.arrangement)?.arrangement;

  return {
    algorithm: configured?.algorithm,
    columns: Number(configured?.columns ?? 0) || undefined,
    radius: Number(configured?.radius ?? 0) || undefined,
    spacing: Number(configured?.spacing ?? canvas.spacing ?? 320) || 320
  };
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

function flowArrangement(clusters: ClusterDefinition[], spacing: number, columns = 3): PositionedCluster[] {
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

function treeArrangement(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  if (!clusters.length) {
    return [];
  }

  const children = new Map<string | null, string[]>();
  const byId = new Map(clusters.map((cluster) => [cluster.id, cluster]));

  for (const cluster of clusters) {
    const parentId = cluster.anchor?.relativeTo ?? null;
    const bucket = children.get(parentId) ?? [];
    bucket.push(cluster.id);
    children.set(parentId, bucket);
  }

  const roots = children.get(null)?.filter((id) => byId.has(id)) ?? [clusters[0].id];
  const positioned = new Map<string, PositionedCluster>();
  let cursorX = 0;

  const averageHeight =
    clusters.reduce((total, cluster) => total + estimateClusterSize(cluster).height, 0) / Math.max(clusters.length, 1);

  const layoutNode = (clusterId: string, depth: number): { center: number } => {
    const cluster = byId.get(clusterId);
    if (!cluster) {
      return { center: cursorX };
    }

    const descendants = children.get(clusterId) ?? [];
    const { width, height } = estimateClusterSize(cluster);
    let center = cursorX + width / 2;

    if (descendants.length) {
      const spans = descendants.map((childId) => layoutNode(childId, depth + 1));
      center = (spans[0].center + spans[spans.length - 1].center) / 2;
    } else {
      cursorX += width + spacing;
    }

    positioned.set(clusterId, {
      id: clusterId,
      x: center - width / 2,
      y: depth * (averageHeight + spacing),
      width,
      height
    });

    return { center };
  };

  for (const rootId of roots) {
    layoutNode(rootId, 0);
    cursorX += spacing * 0.5;
  }

  return clusters
    .map((cluster) => positioned.get(cluster.id))
    .filter((cluster): cluster is PositionedCluster => Boolean(cluster));
}

export function resolveClusterPositions(
  clusters: ClusterDefinition[],
  canvas: MapCanvasConfig = {}
): PositionedCluster[] {
  const { algorithm, columns, radius, spacing } = getArrangementConfig(clusters, canvas);

  if (algorithm === 'radial') {
    return radialArrangement(clusters, radius ?? spacing * 1.2);
  }

  if (algorithm === 'grid') {
    return gridArrangement(clusters, spacing);
  }

  if (algorithm === 'flow') {
    return flowArrangement(clusters, spacing, columns ?? 3);
  }

  if (algorithm === 'tree') {
    return treeArrangement(clusters, spacing);
  }

  return resolveManualPositions(clusters, spacing);
}

export function frameClusters(
  clusters: PositionedCluster[],
  canvas: MapCanvasConfig = {}
): { x: number; y: number; zoom: number } {
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
  const zoom = clampZoom(Math.min(1, 1100 / Math.max(spanX, spanY, 1)), canvas);

  return { x: centerX, y: centerY, zoom };
}

export function frameCluster(
  cluster: PositionedCluster,
  canvas: MapCanvasConfig = {}
): { x: number; y: number; zoom: number } {
  const padding = Math.max(Number(canvas.spacing ?? 320) * 0.5, 160);
  const spanX = cluster.width + padding;
  const spanY = cluster.height + padding;

  return {
    x: cluster.x + cluster.width / 2,
    y: cluster.y + cluster.height / 2,
    zoom: clampZoom(Math.min(1.6, 1100 / Math.max(spanX, spanY, 1)), canvas)
  };
}
