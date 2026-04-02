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

export interface StageComponentLayoutGeometry {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapPresentationLayoutSavePayload {
  clusters: ClusterLayoutGeometry[];
}

export interface StagePresentationLayoutSavePayload {
  stepIndex: number;
  components: StageComponentLayoutGeometry[];
}

export type PresentationLayoutSavePayload =
  | MapPresentationLayoutSavePayload
  | StagePresentationLayoutSavePayload;

type MapGeometryById = Map<string, ClusterLayoutGeometry>;
type StageGeometryByIndex = Map<number, StageComponentLayoutGeometry>;

const GENERIC_STAGE_LAYOUT_PROP_KEYS = ['gap', 'maxWidth', 'width', 'minHeight'] as const;

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

function isFiniteInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function validateUnitInterval(
  value: unknown,
  label: string,
  options?: { exclusiveMinimum?: boolean }
): asserts value is number {
  if (!isFiniteNumber(value)) {
    throw new PresentationLayoutSaveError(400, `${label} must be a finite number.`);
  }

  if (options?.exclusiveMinimum ? value <= 0 : value < 0) {
    throw new PresentationLayoutSaveError(
      400,
      `${label} must be ${options?.exclusiveMinimum ? 'greater than 0' : 'between 0 and 1'}.`
    );
  }

  if (value > 1) {
    throw new PresentationLayoutSaveError(400, `${label} must be between 0 and 1.`);
  }
}

function validateMapGeometryPayload(
  presentation: PresentationConfig,
  geometryList: ClusterLayoutGeometry[]
): MapGeometryById {
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

function validateStageGeometryPayload(
  presentation: PresentationConfig,
  stepIndex: number,
  geometryList: StageComponentLayoutGeometry[]
): StageGeometryByIndex {
  const steps = presentation.steps ?? [];
  if (presentation.mode !== 'stage') {
    throw new PresentationLayoutSaveError(400, 'Only stage presentations support stage layout saves.');
  }

  if (!isFiniteInteger(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
    throw new PresentationLayoutSaveError(400, `Step index ${stepIndex} is out of range.`);
  }

  const step = steps[stepIndex];
  const components = step?.components ?? [];
  if (!Array.isArray(geometryList) || geometryList.length === 0) {
    throw new PresentationLayoutSaveError(400, 'Layout payload must include component geometry.');
  }

  const seenIndexes = new Set<number>();
  const geometryByIndex = new Map<number, StageComponentLayoutGeometry>();

  for (const geometry of geometryList) {
    if (!geometry || !isFiniteInteger(geometry.index) || geometry.index < 0) {
      throw new PresentationLayoutSaveError(400, 'Each component geometry entry must include a non-negative index.');
    }

    if (seenIndexes.has(geometry.index)) {
      throw new PresentationLayoutSaveError(400, `Component geometry includes duplicate index "${geometry.index}".`);
    }
    seenIndexes.add(geometry.index);

    validateUnitInterval(geometry.x, `Component ${geometry.index} x`);
    validateUnitInterval(geometry.y, `Component ${geometry.index} y`);
    validateUnitInterval(geometry.width, `Component ${geometry.index} width`, { exclusiveMinimum: true });
    validateUnitInterval(geometry.height, `Component ${geometry.index} height`, { exclusiveMinimum: true });

    if (geometry.x + geometry.width > 1.0001) {
      throw new PresentationLayoutSaveError(400, `Component ${geometry.index} exceeds the step width.`);
    }

    if (geometry.y + geometry.height > 1.0001) {
      throw new PresentationLayoutSaveError(400, `Component ${geometry.index} exceeds the step height.`);
    }

    geometryByIndex.set(geometry.index, {
      index: geometry.index,
      x: Number(geometry.x.toFixed(6)),
      y: Number(geometry.y.toFixed(6)),
      width: Number(geometry.width.toFixed(6)),
      height: Number(geometry.height.toFixed(6))
    });
  }

  if (geometryByIndex.size !== components.length) {
    throw new PresentationLayoutSaveError(
      400,
      `Layout payload must include geometry for all ${components.length} components in step ${stepIndex}.`
    );
  }

  for (let index = 0; index < components.length; index += 1) {
    if (!geometryByIndex.has(index)) {
      throw new PresentationLayoutSaveError(400, `Layout payload is missing component index "${index}".`);
    }
  }

  for (const index of geometryByIndex.keys()) {
    if (index >= components.length) {
      throw new PresentationLayoutSaveError(400, `Layout payload references unknown component index "${index}".`);
    }
  }

  return geometryByIndex;
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
  payload: ClusterLayoutGeometry[] | PresentationLayoutSavePayload,
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
  const resolvedPayload = Array.isArray(payload) ? ({ clusters: payload } satisfies MapPresentationLayoutSavePayload) : payload;

  const metaNode = document.get('meta', true);
  if (!isMap(metaNode)) {
    throw new PresentationLayoutSaveError(400, 'Presentation YAML is missing the meta block.');
  }

  const updatedAt = formatLocalIsoDate(options?.now ?? new Date());
  metaNode.set('updatedAt', updatedAt);

  if ('clusters' in resolvedPayload) {
    const geometryById = validateMapGeometryPayload(presentation, resolvedPayload.clusters);
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

    await fs.writeFile(presentationPath, String(document), 'utf8');

    return {
      filePath: presentationPath,
      updatedAt,
      clusterCount: geometryById.size
    };
  }

  const geometryByIndex = validateStageGeometryPayload(
    presentation,
    resolvedPayload.stepIndex,
    resolvedPayload.components
  );
  const stepsNode = document.get('steps', true);
  if (!isSeq(stepsNode)) {
    throw new PresentationLayoutSaveError(400, 'Presentation YAML does not contain a writable step sequence.');
  }

  const stepNode = stepsNode.items[resolvedPayload.stepIndex];
  if (!isMap(stepNode)) {
    throw new PresentationLayoutSaveError(400, `Step ${resolvedPayload.stepIndex} is not writable.`);
  }

  stepNode.set('layout', 'scattered');

  const nextLayoutProps = new YAMLMap();
  const existingLayoutProps = stepNode.get('layoutProps', true);
  if (isMap(existingLayoutProps)) {
    for (const key of GENERIC_STAGE_LAYOUT_PROP_KEYS) {
      const value = existingLayoutProps.get(key, true);
      if (value !== undefined) {
        nextLayoutProps.set(key, value);
      }
    }
  }

  if (nextLayoutProps.items.length > 0) {
    stepNode.set('layoutProps', nextLayoutProps);
  } else {
    stepNode.delete('layoutProps');
  }

  const componentsNode = stepNode.get('components', true);
  if (!isSeq(componentsNode)) {
    throw new PresentationLayoutSaveError(400, `Step ${resolvedPayload.stepIndex} does not contain a writable component sequence.`);
  }

  for (const [index, item] of componentsNode.items.entries()) {
    if (!isMap(item)) {
      continue;
    }

    const geometry = geometryByIndex.get(index);
    if (!geometry) {
      throw new PresentationLayoutSaveError(400, `Step ${resolvedPayload.stepIndex} contains unexpected component index "${index}".`);
    }

    const positionNode = ensureMapNode(item, 'position');
    positionNode.set('x', geometry.x);
    positionNode.set('y', geometry.y);
    positionNode.set('width', geometry.width);
    positionNode.set('height', geometry.height);
  }

  await fs.writeFile(presentationPath, String(document), 'utf8');

  return {
    filePath: presentationPath,
    updatedAt,
    stepIndex: resolvedPayload.stepIndex,
    componentCount: geometryByIndex.size
  };
}

export async function savePresentationLayoutBySlug(
  slug: string,
  payload: ClusterLayoutGeometry[] | PresentationLayoutSavePayload,
  options?: { now?: Date; presentationsDir?: string }
) {
  const presentationPath = resolvePresentationYamlPath(slug, options?.presentationsDir);
  return savePresentationLayoutAtPath(presentationPath, payload, { now: options?.now });
}
