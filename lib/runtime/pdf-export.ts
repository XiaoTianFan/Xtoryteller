import { resolveClusterPositions, type PositionedCluster } from '@/lib/engine/arrangement';
import { createBuildPlan, type ComponentBuildPlan } from '@/lib/runtime/build-plan';
import type {
  BackgroundConfigObject,
  BackgroundShaderConfig,
  ClusterDefinition,
  ComponentInstance,
  PresentationConfig,
  StepDefinition
} from '@/lib/types/presentation';

export const PDF_PAGE_WIDTH = 1920;
export const PDF_PAGE_HEIGHT = 1080;
export const PDF_MAP_PADDING = 160;
export const PDF_REVEAL_ALL = Number.MAX_SAFE_INTEGER;

const CSS_BACKGROUND_PATTERN = /(gradient\(|#|rgb\(|rgba\(|hsl\(|hsla\(|var\(|url\()/i;
const PAPER_SHADER_NAMES = new Set([
  'dithering',
  'grain-gradient',
  'mesh-gradient',
  'paper-texture',
  'static-mesh-gradient',
  'static-radial-gradient',
  'water',
  'warp',
  'waves'
]);
const MEDIA_FALLBACK_COMPONENTS = new Set(['video', 'iframe-embed']);
const CANVAS_LIKE_COMPONENT_PATTERN = /(^|[-_])(canvas|webgl|shader|three|p5)([-_]|$)/i;

export interface PdfRenderItem {
  component: ComponentInstance;
  revealCount: number;
}

export interface PdfStagePage {
  kind: 'stage';
  pageIndex: number;
  stepIndex: number;
  step: StepDefinition;
  items: PdfRenderItem[];
}

export interface PdfMapPage {
  kind: 'map';
  pageIndex: 0;
  clusters: Array<PositionedCluster & { cluster: ClusterDefinition }>;
  transform: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface PdfExportWarning {
  code: 'paper-background' | 'media-fallback' | 'canvas-like-component';
  target: string;
  message: string;
}

function getFinalRevealCount(entry: ComponentBuildPlan): number {
  return entry.component.build === 'sequential' ? entry.end - entry.start + 1 : PDF_REVEAL_ALL;
}

export function buildStagePdfPages(presentation: PresentationConfig): PdfStagePage[] {
  return (presentation.steps ?? []).map((step, stepIndex) => ({
    kind: 'stage',
    pageIndex: stepIndex,
    stepIndex,
    step,
    items: createBuildPlan(step).map((entry) => ({
      component: entry.component,
      revealCount: getFinalRevealCount(entry)
    }))
  }));
}

function getClusterBounds(clusters: PositionedCluster[], padding: number) {
  if (!clusters.length) {
    return {
      minX: -PDF_PAGE_WIDTH / 2,
      minY: -PDF_PAGE_HEIGHT / 2,
      maxX: PDF_PAGE_WIDTH / 2,
      maxY: PDF_PAGE_HEIGHT / 2
    };
  }

  return {
    minX: Math.min(...clusters.map((cluster) => cluster.x)) - padding,
    minY: Math.min(...clusters.map((cluster) => cluster.y)) - padding,
    maxX: Math.max(...clusters.map((cluster) => cluster.x + cluster.width)) + padding,
    maxY: Math.max(...clusters.map((cluster) => cluster.y + cluster.height)) + padding
  };
}

export function getMapPdfTransform(
  clusters: PositionedCluster[],
  pageWidth = PDF_PAGE_WIDTH,
  pageHeight = PDF_PAGE_HEIGHT,
  padding = PDF_MAP_PADDING
) {
  const bounds = getClusterBounds(clusters, padding);
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(pageWidth / spanX, pageHeight / spanY);

  return {
    x: (pageWidth - spanX * scale) / 2 - bounds.minX * scale,
    y: (pageHeight - spanY * scale) / 2 - bounds.minY * scale,
    scale
  };
}

export function buildMapPdfPage(presentation: PresentationConfig): PdfMapPage {
  const clusters = presentation.clusters ?? [];
  const positions = resolveClusterPositions(clusters, presentation.canvas);
  const clustersById = new Map(clusters.map((cluster) => [cluster.id, cluster]));
  const positionedClusters = positions
    .map((position) => {
      const cluster = clustersById.get(position.id);
      return cluster ? { ...position, cluster } : null;
    })
    .filter((cluster): cluster is PositionedCluster & { cluster: ClusterDefinition } => Boolean(cluster));

  return {
    kind: 'map',
    pageIndex: 0,
    clusters: positionedClusters,
    transform: getMapPdfTransform(positionedClusters)
  };
}

function normalizeKey(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function isPaperBackground(background: unknown): boolean {
  if (!background) {
    return false;
  }

  if (typeof background === 'string') {
    const normalized = normalizeKey(background);
    return normalized !== 'none' && !CSS_BACKGROUND_PATTERN.test(background) && PAPER_SHADER_NAMES.has(normalized);
  }

  if (typeof background !== 'object' || Array.isArray(background)) {
    return false;
  }

  const config = background as BackgroundConfigObject;
  const normalizedType = normalizeKey(String(config.type ?? ''));
  const record = config as unknown as Record<string, unknown>;
  return (
    normalizedType === 'paper' ||
    normalizedType === 'paper-shader' ||
    typeof record.shader === 'string' ||
    typeof record.preset === 'string'
  );
}

function collectBackgroundWarnings(
  background: BackgroundShaderConfig | undefined,
  target: string,
  warnings: PdfExportWarning[]
) {
  if (isPaperBackground(background)) {
    warnings.push({
      code: 'paper-background',
      target,
      message: `${target} uses a Paper Shader background; PDF export keeps it decorative and may rasterize that surface.`
    });
  }

  if (!background || typeof background !== 'object' || Array.isArray(background)) {
    return;
  }

  const config = background as BackgroundConfigObject;
  for (const [index, stage] of (config.stages ?? []).entries()) {
    collectBackgroundWarnings(stage as BackgroundShaderConfig, `${target}.stages[${index}]`, warnings);
  }

  for (const [index, region] of (config.regions ?? []).entries()) {
    collectBackgroundWarnings(region as BackgroundShaderConfig, `${target}.regions[${index}]`, warnings);
  }
}

function collectComponentWarnings(components: ComponentInstance[], target: string, warnings: PdfExportWarning[]) {
  for (const [index, component] of components.entries()) {
    const componentTarget = `${target}.components[${index}](${component.type})`;

    if (MEDIA_FALLBACK_COMPONENTS.has(component.type)) {
      warnings.push({
        code: 'media-fallback',
        target: componentTarget,
        message: `${componentTarget} is rendered as a static PDF fallback, not as live embedded media.`
      });
    }

    if (CANVAS_LIKE_COMPONENT_PATTERN.test(component.type)) {
      warnings.push({
        code: 'canvas-like-component',
        target: componentTarget,
        message: `${componentTarget} looks canvas/WebGL-based; PDF export may rasterize its own drawing surface.`
      });
    }
  }
}

export function collectPdfExportWarnings(presentation: PresentationConfig): PdfExportWarning[] {
  const warnings: PdfExportWarning[] = [];
  collectBackgroundWarnings(presentation.background, 'presentation.background', warnings);

  for (const [index, section] of (presentation.backgroundSections ?? []).entries()) {
    collectBackgroundWarnings(section.shader, `presentation.backgroundSections[${index}].shader`, warnings);
  }

  for (const [index, step] of (presentation.steps ?? []).entries()) {
    collectBackgroundWarnings(step.background, `steps[${index}].background`, warnings);
    collectComponentWarnings(step.components, `steps[${index}]`, warnings);
  }

  for (const [index, cluster] of (presentation.clusters ?? []).entries()) {
    collectBackgroundWarnings(cluster.background, `clusters[${index}].background`, warnings);
    collectComponentWarnings(cluster.components, `clusters[${index}]`, warnings);
  }

  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.target}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
