import { ClusterArrangementConfig, ClusterDefinition, MapCanvasConfig } from '@/lib/types/presentation';

export interface PositionedCluster {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

const DEFAULT_MIN_ZOOM = 0.12;
const DEFAULT_MAX_ZOOM = 6;
const DEFAULT_CLUSTER_WIDTH = 540;
const DEFAULT_CLUSTER_HEIGHT = 360;
const DEFAULT_CLUSTER_SPACING = 320;

function getMinZoom(canvas: MapCanvasConfig): number {
  return canvas.minZoom ?? DEFAULT_MIN_ZOOM;
}

function getMaxZoom(canvas: MapCanvasConfig): number {
  return canvas.maxZoom ?? DEFAULT_MAX_ZOOM;
}

export function clampCameraZoom(
  zoom: number,
  canvas: MapCanvasConfig = {},
  options?: { maxCap?: number }
): number {
  const maxZoom = Math.min(getMaxZoom(canvas), options?.maxCap ?? Number.POSITIVE_INFINITY);
  return Math.min(maxZoom, Math.max(getMinZoom(canvas), zoom));
}

export function getCameraTransform(camera: CameraState, viewport: ViewportSize) {
  return {
    x: viewport.width / 2 - camera.x * camera.zoom,
    y: viewport.height / 2 - camera.y * camera.zoom,
    scale: camera.zoom
  };
}

export function panCameraByScreenDelta(camera: CameraState, deltaX: number, deltaY: number): CameraState {
  return {
    ...camera,
    x: camera.x - deltaX / camera.zoom,
    y: camera.y - deltaY / camera.zoom
  };
}

export function getWorldPointAtViewportPoint(
  camera: CameraState,
  point: ViewportPoint,
  viewport: ViewportSize
): ViewportPoint {
  return {
    x: camera.x + (point.x - viewport.width / 2) / camera.zoom,
    y: camera.y + (point.y - viewport.height / 2) / camera.zoom
  };
}

export function zoomCameraAtViewportPoint(
  camera: CameraState,
  zoom: number,
  point: ViewportPoint,
  viewport: ViewportSize,
  canvas: MapCanvasConfig = {}
): CameraState {
  const nextZoom = clampCameraZoom(zoom, canvas);
  const worldPoint = getWorldPointAtViewportPoint(camera, point, viewport);

  return {
    x: worldPoint.x - (point.x - viewport.width / 2) / nextZoom,
    y: worldPoint.y - (point.y - viewport.height / 2) / nextZoom,
    zoom: nextZoom
  };
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

function readPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveClusterFrame(cluster: ClusterDefinition): { width: number; height: number } {
  const width =
    readPositiveNumber(cluster.frame?.width) ??
    readPositiveNumber(cluster.layoutProps?.width) ??
    DEFAULT_CLUSTER_WIDTH;
  const height =
    readPositiveNumber(cluster.frame?.height) ??
    readPositiveNumber(cluster.layoutProps?.height) ??
    DEFAULT_CLUSTER_HEIGHT;
  return { width, height };
}

function resolveArrangementConfig(
  config: ClusterArrangementConfig | undefined,
  fallbackSpacing: number
): { algorithm?: ClusterArrangementConfig['algorithm']; columns?: number; radius?: number; spacing: number } {
  return {
    algorithm: config?.algorithm,
    columns: readPositiveNumber(config?.columns),
    radius: readPositiveNumber(config?.radius),
    spacing: readPositiveNumber(config?.spacing) ?? fallbackSpacing
  };
}

function getArrangementConfig(clusters: ClusterDefinition[], canvas: MapCanvasConfig) {
  const fallbackSpacing = readPositiveNumber(canvas.spacing) ?? DEFAULT_CLUSTER_SPACING;
  if (canvas.arrangement) {
    return resolveArrangementConfig(canvas.arrangement, fallbackSpacing);
  }

  const configured = clusters.find((cluster) => cluster.arrangement)?.arrangement;
  if (configured) {
    return resolveArrangementConfig(configured, fallbackSpacing);
  }

  return {
    algorithm: undefined,
    columns: undefined,
    radius: undefined,
    spacing: fallbackSpacing
  };
}

function resolveRelativePosition(
  base: PositionedCluster,
  size: { width: number; height: number },
  direction: keyof typeof DIRECTION_VECTORS,
  distance: number
): { x: number; y: number } {
  switch (direction) {
    case 'left':
      return {
        x: base.x - size.width - distance,
        y: base.y + (base.height - size.height) / 2
      };
    case 'right':
      return {
        x: base.x + base.width + distance,
        y: base.y + (base.height - size.height) / 2
      };
    case 'above':
      return {
        x: base.x + (base.width - size.width) / 2,
        y: base.y - size.height - distance
      };
    case 'below':
      return {
        x: base.x + (base.width - size.width) / 2,
        y: base.y + base.height + distance
      };
    case 'upper-left':
      return {
        x: base.x - size.width - distance,
        y: base.y - size.height - distance
      };
    case 'upper-right':
      return {
        x: base.x + base.width + distance,
        y: base.y - size.height - distance
      };
    case 'lower-left':
      return {
        x: base.x - size.width - distance,
        y: base.y + base.height + distance
      };
    case 'lower-right':
    default:
      return {
        x: base.x + base.width + distance,
        y: base.y + base.height + distance
      };
  }
}

function resolveManualPositions(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  const positioned = new Map<string, PositionedCluster>();
  const byId = new Map(clusters.map((cluster) => [cluster.id, cluster]));

  const resolve = (cluster: ClusterDefinition): PositionedCluster => {
    const existing = positioned.get(cluster.id);
    if (existing) {
      return existing;
    }

    const { width, height } = resolveClusterFrame(cluster);
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

    const base = anchor.relativeTo ? byId.get(anchor.relativeTo) : undefined;
    if (!base) {
      const fallback = { id: cluster.id, x: 0, y: 0, width, height };
      positioned.set(cluster.id, fallback);
      return fallback;
    }

    const basePosition = resolve(base);
    const distance = anchor.distance ?? spacing;
    const nextPosition = resolveRelativePosition(basePosition, { width, height }, anchor.direction ?? 'right', distance);
    const resolved = {
      id: cluster.id,
      x: nextPosition.x,
      y: nextPosition.y,
      width,
      height
    };
    positioned.set(cluster.id, resolved);
    return resolved;
  };

  return clusters.map(resolve);
}

function flowArrangement(clusters: ClusterDefinition[], spacing: number, columns = 3): PositionedCluster[] {
  const rows = Array.from({ length: Math.ceil(clusters.length / columns) }, (_, rowIndex) =>
    clusters.slice(rowIndex * columns, rowIndex * columns + columns)
  );
  const positions: PositionedCluster[] = [];
  let y = 0;

  for (const row of rows) {
    let x = 0;
    let rowHeight = 0;

    for (const cluster of row) {
      const { width, height } = resolveClusterFrame(cluster);
      rowHeight = Math.max(rowHeight, height);
      positions.push({
        id: cluster.id,
        x,
        y,
        width,
        height
      });
      x += width + spacing;
    }

    y += rowHeight + spacing;
  }

  return positions;
}

function radialArrangement(clusters: ClusterDefinition[], radius: number): PositionedCluster[] {
  return clusters.map((cluster, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(clusters.length, 1);
    const { width, height } = resolveClusterFrame(cluster);
    return {
      id: cluster.id,
      x: Math.cos(angle) * radius - width / 2,
      y: Math.sin(angle) * radius - height / 2,
      width,
      height
    };
  });
}

function gridArrangement(clusters: ClusterDefinition[], spacing: number): PositionedCluster[] {
  const columns = Math.max(2, Math.ceil(Math.sqrt(clusters.length)));
  const frames = clusters.map((cluster) => ({ cluster, ...resolveClusterFrame(cluster) }));
  const rowCount = Math.ceil(clusters.length / columns);
  const columnWidths = Array.from({ length: columns }, (_, column) =>
    Math.max(
      0,
      ...frames
        .filter((_, index) => index % columns === column)
        .map((frame) => frame.width)
    )
  );
  const rowHeights = Array.from({ length: rowCount }, (_, row) =>
    Math.max(
      0,
      ...frames
        .slice(row * columns, row * columns + columns)
        .map((frame) => frame.height)
    )
  );

  return frames.map((frame, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = columnWidths.slice(0, column).reduce((total, width) => total + width + spacing, 0);
    const y = rowHeights.slice(0, row).reduce((total, height) => total + height + spacing, 0);

    return {
      id: frame.cluster.id,
      x,
      y,
      width: frame.width,
      height: frame.height
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
  const frameById = new Map(clusters.map((cluster) => [cluster.id, resolveClusterFrame(cluster)]));
  const subtreeWidthCache = new Map<string, number>();
  const depthMap = new Map<string, number>();
  const maxHeightByDepth = new Map<number, number>();

  const measureSubtreeWidth = (clusterId: string): number => {
    const cached = subtreeWidthCache.get(clusterId);
    if (cached != null) {
      return cached;
    }

    const clusterFrame = frameById.get(clusterId);
    if (!clusterFrame) {
      return 0;
    }

    const descendants = children.get(clusterId) ?? [];
    const descendantWidth = descendants.reduce((total, childId, index) => {
      return total + measureSubtreeWidth(childId) + (index > 0 ? spacing : 0);
    }, 0);
    const measured = Math.max(clusterFrame.width, descendantWidth);
    subtreeWidthCache.set(clusterId, measured);
    return measured;
  };

  const collectDepthMetrics = (clusterId: string, depth: number) => {
    const cluster = byId.get(clusterId);
    if (!cluster) {
      return;
    }

    depthMap.set(clusterId, depth);
    const { height } = frameById.get(clusterId)!;
    maxHeightByDepth.set(depth, Math.max(maxHeightByDepth.get(depth) ?? 0, height));
    const descendants = children.get(clusterId) ?? [];
    for (const childId of descendants) {
      collectDepthMetrics(childId, depth + 1);
    }
  };

  for (const rootId of roots) {
    collectDepthMetrics(rootId, 0);
  }

  const yOffsets = new Map<number, number>();
  let cursorY = 0;
  for (const depth of [...maxHeightByDepth.keys()].sort((left, right) => left - right)) {
    yOffsets.set(depth, cursorY);
    cursorY += (maxHeightByDepth.get(depth) ?? 0) + spacing;
  }

  const layoutNode = (clusterId: string, left: number) => {
    const cluster = byId.get(clusterId);
    const clusterFrame = frameById.get(clusterId);
    if (!cluster || !clusterFrame) {
      return;
    }

    const subtreeWidth = measureSubtreeWidth(clusterId);
    const nodeCenterX = left + subtreeWidth / 2;
    const depth = depthMap.get(clusterId) ?? 0;

    positioned.set(clusterId, {
      id: clusterId,
      x: nodeCenterX - clusterFrame.width / 2,
      y: yOffsets.get(depth) ?? 0,
      width: clusterFrame.width,
      height: clusterFrame.height
    });

    const descendants = children.get(clusterId) ?? [];
    if (!descendants.length) {
      return;
    }

    const descendantsWidth = descendants.reduce((total, childId, index) => {
      return total + measureSubtreeWidth(childId) + (index > 0 ? spacing : 0);
    }, 0);
    let childLeft = left + (subtreeWidth - descendantsWidth) / 2;

    for (const childId of descendants) {
      layoutNode(childId, childLeft);
      childLeft += measureSubtreeWidth(childId) + spacing;
    }
  };

  let cursorX = 0;
  for (const rootId of roots) {
    layoutNode(rootId, cursorX);
    cursorX += measureSubtreeWidth(rootId) + spacing;
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
  const zoom = clampCameraZoom(Math.min(1, 1100 / Math.max(spanX, spanY, 1)), canvas, { maxCap: 1 });

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
    zoom: clampCameraZoom(Math.min(1.6, 1100 / Math.max(spanX, spanY, 1)), canvas, { maxCap: 1.6 })
  };
}
