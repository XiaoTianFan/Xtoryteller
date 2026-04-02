import fs from 'node:fs/promises';
import path from 'node:path';

import YAML, { isMap, isSeq, YAMLMap } from 'yaml';

import { PRESENTATIONS_DIR } from '@/lib/engine/constants';
import { PresentationConfig } from '@/lib/types/presentation';

const PRESENTATION_FILE_NAME = 'presentation.yaml';

export interface ClusterLayoutGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PresentationLayoutSaveError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PresentationLayoutSaveError';
    this.status = status;
  }
}

function formatLocalIsoDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function ensureMapNode(parent: YAMLMap<unknown, unknown>, key: string) {
  const existing = parent.get(key, true);
  if (isMap(existing)) {
    return existing as YAMLMap<unknown, unknown>;
  }

  const next = new YAMLMap();
  parent.set(key, next);
  return next;
}

function validateGeometryPayload(
  presentation: PresentationConfig,
  geometryList: ClusterLayoutGeometry[]
) {
  const clusters = presentation.clusters ?? [];
  if (presentation.mode !== 'map') {
    throw new PresentationLayoutSaveError(400, 'Only map presentations support manual layout saves.');
  }

  if (!Array.isArray(geometryList) || geometryList.length === 0) {
    throw new PresentationLayoutSaveError(400, 'Layout payload must include cluster geometry.');
  }

  const seenIds = new Set<string>();
  const geometryById = new Map<string, ClusterLayoutGeometry>();

  for (const geometry of geometryList) {
    if (!geometry || typeof geometry.id !== 'string' || !geometry.id.trim()) {
      throw new PresentationLayoutSaveError(400, 'Each cluster geometry entry must include a non-empty id.');
    }

    if (seenIds.has(geometry.id)) {
      throw new PresentationLayoutSaveError(400, `Cluster geometry includes duplicate id "${geometry.id}".`);
    }
    seenIds.add(geometry.id);

    if (!isFiniteNumber(geometry.x) || !isFiniteNumber(geometry.y)) {
      throw new PresentationLayoutSaveError(400, `Cluster "${geometry.id}" must include finite x/y coordinates.`);
    }

    if (!isFiniteNumber(geometry.width) || geometry.width <= 0) {
      throw new PresentationLayoutSaveError(400, `Cluster "${geometry.id}" width must be greater than 0.`);
    }

    if (!isFiniteNumber(geometry.height) || geometry.height <= 0) {
      throw new PresentationLayoutSaveError(400, `Cluster "${geometry.id}" height must be greater than 0.`);
    }

    geometryById.set(geometry.id, {
      id: geometry.id,
      x: Math.round(geometry.x),
      y: Math.round(geometry.y),
      width: Math.round(geometry.width),
      height: Math.round(geometry.height)
    });
  }

  if (geometryById.size !== clusters.length) {
    throw new PresentationLayoutSaveError(
      400,
      `Layout payload must include geometry for all ${clusters.length} clusters.`
    );
  }

  for (const cluster of clusters) {
    if (!geometryById.has(cluster.id)) {
      throw new PresentationLayoutSaveError(400, `Layout payload is missing cluster "${cluster.id}".`);
    }
  }

  for (const clusterId of geometryById.keys()) {
    if (!clusters.some((cluster) => cluster.id === clusterId)) {
      throw new PresentationLayoutSaveError(400, `Layout payload references unknown cluster "${clusterId}".`);
    }
  }

  return geometryById;
}

export function resolvePresentationYamlPath(slug: string, presentationsDir = PRESENTATIONS_DIR) {
  const trimmedSlug = String(slug ?? '').trim();
  if (!trimmedSlug) {
    throw new PresentationLayoutSaveError(400, 'Presentation slug is required.');
  }

  const root = path.resolve(presentationsDir);
  const filePath = path.resolve(root, trimmedSlug, PRESENTATION_FILE_NAME);
  const relative = path.relative(root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new PresentationLayoutSaveError(400, 'Presentation slug resolves outside the presentations directory.');
  }

  return filePath;
}

export async function savePresentationLayoutAtPath(
  presentationPath: string,
  geometryList: ClusterLayoutGeometry[],
  options?: { now?: Date }
) {
  const source = await fs.readFile(presentationPath, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      throw new PresentationLayoutSaveError(404, `Presentation file was not found at ${presentationPath}.`);
    }

    throw error;
  });
  const document = YAML.parseDocument(source);
  const presentation = document.toJS() as PresentationConfig;
  const geometryById = validateGeometryPayload(presentation, geometryList);

  const clustersNode = document.get('clusters', true);
  if (!isSeq(clustersNode)) {
    throw new PresentationLayoutSaveError(400, 'Presentation YAML does not contain a writable cluster sequence.');
  }

  for (const item of clustersNode.items) {
    if (!isMap(item)) {
      continue;
    }

    const clusterId = item.get('id');
    if (typeof clusterId !== 'string') {
      continue;
    }

    const geometry = geometryById.get(clusterId);
    if (!geometry) {
      throw new PresentationLayoutSaveError(400, `Presentation YAML contains unexpected cluster "${clusterId}".`);
    }

    const anchorNode = ensureMapNode(item, 'anchor');
    anchorNode.set('x', geometry.x);
    anchorNode.set('y', geometry.y);
    anchorNode.delete('relativeTo');
    anchorNode.delete('direction');
    anchorNode.delete('distance');

    const frameNode = ensureMapNode(item, 'frame');
    frameNode.set('width', geometry.width);
    frameNode.set('height', geometry.height);

    item.delete('arrangement');
  }

  const canvasNode = document.get('canvas', true);
  if (isMap(canvasNode)) {
    canvasNode.delete('arrangement');
    if (canvasNode.items.length === 0) {
      document.deleteIn(['canvas']);
    }
  }

  const metaNode = document.get('meta', true);
  if (!isMap(metaNode)) {
    throw new PresentationLayoutSaveError(400, 'Presentation YAML is missing the meta block.');
  }

  const updatedAt = formatLocalIsoDate(options?.now ?? new Date());
  metaNode.set('updatedAt', updatedAt);

  await fs.writeFile(presentationPath, String(document), 'utf8');

  return {
    filePath: presentationPath,
    updatedAt,
    clusterCount: geometryById.size
  };
}

export async function savePresentationLayoutBySlug(
  slug: string,
  geometryList: ClusterLayoutGeometry[],
  options?: { now?: Date; presentationsDir?: string }
) {
  const presentationPath = resolvePresentationYamlPath(slug, options?.presentationsDir);
  return savePresentationLayoutAtPath(presentationPath, geometryList, { now: options?.now });
}
