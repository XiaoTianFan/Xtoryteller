import fs from 'node:fs/promises';
import path from 'node:path';

import YAML, { isMap, isSeq, YAMLMap } from 'yaml';

import { PRESENTATIONS_DIR } from '@/lib/engine/constants';
import { ClusterDefinition, ComponentInstance, PresentationConfig } from '@/lib/types/presentation';

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

export interface SavedStageComponentLayoutDraft extends StageComponentLayoutGeometry, ComponentInstance {}

export interface SavedMapClusterComponentDraft extends ComponentInstance {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SavedMapClusterLayoutDraft
  extends Omit<ClusterDefinition, 'anchor' | 'arrangement' | 'components' | 'frame'>,
    ClusterLayoutGeometry {
  components: SavedMapClusterComponentDraft[];
}

export interface MapPresentationLayoutSavePayload {
  clusters: Array<ClusterLayoutGeometry | SavedMapClusterLayoutDraft>;
}

export interface StagePresentationLayoutSavePayload {
  stepIndex: number;
  components: Array<StageComponentLayoutGeometry | SavedStageComponentLayoutDraft>;
}

export type PresentationLayoutSavePayload =
  | MapPresentationLayoutSavePayload
  | StagePresentationLayoutSavePayload;

type MapGeometryById = Map<string, ClusterLayoutGeometry>;

interface ValidatedStageSave {
  stepIndex: number;
  components: ComponentInstance[];
}

interface ValidatedMapFullCluster extends Omit<SavedMapClusterLayoutDraft, 'components'> {
  components: ComponentInstance[];
}

const GENERIC_FREEFORM_LAYOUT_PROP_KEYS = ['gap', 'maxWidth', 'width', 'minHeight'] as const;

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

function isFiniteInteger(value: unknown): value is number {
  return Number.isInteger(value);
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

function cloneJson<T>(value: T): T {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function filterFreeformLayoutProps(layoutProps: Record<string, unknown> | undefined) {
  if (!layoutProps) {
    return undefined;
  }

  const nextLayoutProps = Object.fromEntries(
    Object.entries(layoutProps).filter(([key]) => GENERIC_FREEFORM_LAYOUT_PROP_KEYS.includes(key as (typeof GENERIC_FREEFORM_LAYOUT_PROP_KEYS)[number]))
  );

  return Object.keys(nextLayoutProps).length ? nextLayoutProps : undefined;
}

function createSerializableComponent(
  component: ComponentInstance,
  geometry?: { x: number; y: number; width?: number; height?: number }
) {
  const nextComponent = cloneJson(component);
  if (geometry) {
    nextComponent.position = {
      x: Number(geometry.x.toFixed(6)),
      y: Number(geometry.y.toFixed(6)),
      ...(geometry.width != null ? { width: Number(geometry.width.toFixed(6)) } : {}),
      ...(geometry.height != null ? { height: Number(geometry.height.toFixed(6)) } : {})
    };
  }

  return nextComponent;
}

function validateOptionalPosition(position: ComponentInstance['position'], label: string) {
  if (!position) {
    return;
  }

  validateUnitInterval(position.x, `${label} x`);
  validateUnitInterval(position.y, `${label} y`);
  if (position.width != null) {
    validateUnitInterval(position.width, `${label} width`, { exclusiveMinimum: true });
  }
  if (position.height != null) {
    validateUnitInterval(position.height, `${label} height`, { exclusiveMinimum: true });
  }
}

function normalizeMapComponentDraft(component: SavedMapClusterComponentDraft, index: number): ComponentInstance {
  if (!component || typeof component.type !== 'string' || !component.type.trim()) {
    throw new PresentationLayoutSaveError(400, `Cluster component ${index} must include a non-empty type.`);
  }

  const { x, y, width, height, ...componentFields } = component;
  const normalizedComponent = cloneJson(componentFields as ComponentInstance);
  validateOptionalPosition(normalizedComponent.position, `Cluster component ${index} position`);

  const hasFlatGeometry = [x, y, width, height].some((value) => value != null);
  if (hasFlatGeometry) {
    validateUnitInterval(x, `Cluster component ${index} x`);
    validateUnitInterval(y, `Cluster component ${index} y`);
    validateUnitInterval(width, `Cluster component ${index} width`, { exclusiveMinimum: true });
    validateUnitInterval(height, `Cluster component ${index} height`, { exclusiveMinimum: true });
    normalizedComponent.position = {
      x: Number(x.toFixed(6)),
      y: Number(y.toFixed(6)),
      width: Number(width.toFixed(6)),
      height: Number(height.toFixed(6))
    };
  }

  return normalizedComponent;
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

  return geometryById;
}

function isFullMapClusterDraft(
  cluster: ClusterLayoutGeometry | SavedMapClusterLayoutDraft
): cluster is SavedMapClusterLayoutDraft {
  return typeof (cluster as SavedMapClusterLayoutDraft).layout === 'string' || Array.isArray((cluster as SavedMapClusterLayoutDraft).components);
}

function validateMapFullPayload(
  presentation: PresentationConfig,
  clusterList: Array<ClusterLayoutGeometry | SavedMapClusterLayoutDraft>
) {
  if (presentation.mode !== 'map') {
    throw new PresentationLayoutSaveError(400, 'Only map presentations support manual layout saves.');
  }

  if (!Array.isArray(clusterList) || clusterList.length === 0) {
    throw new PresentationLayoutSaveError(400, 'Layout payload must include clusters.');
  }

  const validatedClusters: ValidatedMapFullCluster[] = [];
  const seenIds = new Set<string>();

  for (const [index, cluster] of clusterList.entries()) {
    if (!isFullMapClusterDraft(cluster)) {
      throw new PresentationLayoutSaveError(
        400,
        `Cluster payload at index ${index} must include full cluster definition fields.`
      );
    }

    if (typeof cluster.id !== 'string' || !cluster.id.trim()) {
      throw new PresentationLayoutSaveError(400, `Cluster payload at index ${index} must include a non-empty id.`);
    }
    if (seenIds.has(cluster.id)) {
      throw new PresentationLayoutSaveError(400, `Cluster payload includes duplicate id "${cluster.id}".`);
    }
    seenIds.add(cluster.id);

    if (!isFiniteNumber(cluster.x) || !isFiniteNumber(cluster.y)) {
      throw new PresentationLayoutSaveError(400, `Cluster "${cluster.id}" must include finite x/y coordinates.`);
    }
    if (!isFiniteNumber(cluster.width) || cluster.width <= 0) {
      throw new PresentationLayoutSaveError(400, `Cluster "${cluster.id}" width must be greater than 0.`);
    }
    if (!isFiniteNumber(cluster.height) || cluster.height <= 0) {
      throw new PresentationLayoutSaveError(400, `Cluster "${cluster.id}" height must be greater than 0.`);
    }
    if (typeof cluster.layout !== 'string' || !cluster.layout.trim()) {
      throw new PresentationLayoutSaveError(400, `Cluster "${cluster.id}" must include a layout.`);
    }
    if (!Array.isArray(cluster.components)) {
      throw new PresentationLayoutSaveError(400, `Cluster "${cluster.id}" must include its components array.`);
    }

    validatedClusters.push({
      ...cloneJson(cluster),
      x: Math.round(cluster.x),
      y: Math.round(cluster.y),
      width: Math.round(cluster.width),
      height: Math.round(cluster.height),
      layoutProps:
        cluster.layout === 'scattered'
          ? filterFreeformLayoutProps(cluster.layoutProps)
          : cloneJson(cluster.layoutProps),
      components: cluster.components.map((component, componentIndex) =>
        normalizeMapComponentDraft(component, componentIndex)
      )
    });
  }

  return validatedClusters;
}

function validateStagePayload(
  presentation: PresentationConfig,
  stepIndex: number,
  componentList: Array<StageComponentLayoutGeometry | SavedStageComponentLayoutDraft>
): ValidatedStageSave {
  const steps = presentation.steps ?? [];
  if (presentation.mode !== 'stage') {
    throw new PresentationLayoutSaveError(400, 'Only stage presentations support stage layout saves.');
  }

  if (!isFiniteInteger(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
    throw new PresentationLayoutSaveError(400, `Step index ${stepIndex} is out of range.`);
  }

  const step = steps[stepIndex];
  const existingComponents = step?.components ?? [];
  if (!Array.isArray(componentList) || componentList.length === 0) {
    throw new PresentationLayoutSaveError(400, 'Layout payload must include component geometry.');
  }

  const seenIndexes = new Set<number>();
  const normalizedComponents: ComponentInstance[] = Array.from({ length: componentList.length });

  for (const component of componentList) {
    if (!component || !isFiniteInteger(component.index) || component.index < 0) {
      throw new PresentationLayoutSaveError(400, 'Each component layout entry must include a non-negative index.');
    }
    if (seenIndexes.has(component.index)) {
      throw new PresentationLayoutSaveError(400, `Component geometry includes duplicate index "${component.index}".`);
    }
    seenIndexes.add(component.index);

    validateUnitInterval(component.x, `Component ${component.index} x`);
    validateUnitInterval(component.y, `Component ${component.index} y`);
    validateUnitInterval(component.width, `Component ${component.index} width`, { exclusiveMinimum: true });
    validateUnitInterval(component.height, `Component ${component.index} height`, { exclusiveMinimum: true });

    if (component.x + component.width > 1.0001) {
      throw new PresentationLayoutSaveError(400, `Component ${component.index} exceeds the step width.`);
    }

    if (component.y + component.height > 1.0001) {
      throw new PresentationLayoutSaveError(400, `Component ${component.index} exceeds the step height.`);
    }

    const hasFullDefinition = typeof (component as SavedStageComponentLayoutDraft).type === 'string';
    const baseComponent =
      hasFullDefinition
        ? cloneJson((() => {
            const { index, x, y, width, height, ...componentFields } = component as SavedStageComponentLayoutDraft;
            return componentFields as ComponentInstance;
          })())
        : cloneJson(existingComponents[component.index]);

    if (!baseComponent || typeof baseComponent.type !== 'string' || !baseComponent.type.trim()) {
      throw new PresentationLayoutSaveError(
        400,
        `Component ${component.index} must include a full definition when saving a new or replaced component.`
      );
    }

    normalizedComponents[component.index] = createSerializableComponent(baseComponent, {
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height
    });
  }

  if (seenIndexes.size !== componentList.length) {
    throw new PresentationLayoutSaveError(400, 'Stage component indexes must be unique.');
  }

  for (let index = 0; index < normalizedComponents.length; index += 1) {
    if (!normalizedComponents[index]) {
      throw new PresentationLayoutSaveError(
        400,
        `Layout payload must include a contiguous component definition for index "${index}".`
      );
    }
  }

  return {
    stepIndex,
    components: normalizedComponents
  };
}

function stripUndefinedEntries<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
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
    const shouldRewriteFullClusters = resolvedPayload.clusters.some((cluster) => isFullMapClusterDraft(cluster));

    if (!shouldRewriteFullClusters) {
      const geometryById = validateMapGeometryPayload(presentation, resolvedPayload.clusters as ClusterLayoutGeometry[]);
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

    const validatedClusters = validateMapFullPayload(presentation, resolvedPayload.clusters);
    const serializedClusters = validatedClusters.map((cluster) =>
      stripUndefinedEntries({
        id: cluster.id,
        title: cluster.title,
        description: cluster.description,
        group: cluster.group,
        layout: cluster.layout,
        layoutProps: cluster.layout === 'scattered' ? filterFreeformLayoutProps(cluster.layoutProps) : cluster.layoutProps,
        transition: cluster.transition,
        background: cluster.background,
        anchor: {
          x: cluster.x,
          y: cluster.y
        },
        frame: {
          width: cluster.width,
          height: cluster.height
        },
        components: cluster.components
      })
    );

    document.set('clusters', serializedClusters);

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
      clusterCount: validatedClusters.length
    };
  }

  const validatedStage = validateStagePayload(presentation, resolvedPayload.stepIndex, resolvedPayload.components);
  const stepsNode = document.get('steps', true);
  if (!isSeq(stepsNode)) {
    throw new PresentationLayoutSaveError(400, 'Presentation YAML does not contain a writable step sequence.');
  }

  const stepNode = stepsNode.items[validatedStage.stepIndex];
  if (!isMap(stepNode)) {
    throw new PresentationLayoutSaveError(400, `Step ${validatedStage.stepIndex} is not writable.`);
  }

  stepNode.set('layout', 'scattered');

  const existingLayoutProps = stepNode.get('layoutProps', true);
  if (isMap(existingLayoutProps)) {
    const nextLayoutProps = new YAMLMap();
    for (const key of GENERIC_FREEFORM_LAYOUT_PROP_KEYS) {
      const value = existingLayoutProps.get(key, true);
      if (value !== undefined) {
        nextLayoutProps.set(key, value);
      }
    }

    if (nextLayoutProps.items.length > 0) {
      stepNode.set('layoutProps', nextLayoutProps);
    } else {
      stepNode.delete('layoutProps');
    }
  } else {
    stepNode.delete('layoutProps');
  }

  stepNode.set('components', validatedStage.components);

  await fs.writeFile(presentationPath, String(document), 'utf8');

  return {
    filePath: presentationPath,
    updatedAt,
    stepIndex: validatedStage.stepIndex,
    componentCount: validatedStage.components.length
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
