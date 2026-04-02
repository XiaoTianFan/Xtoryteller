import { BackgroundPresetConfig } from '@/lib/types/background-preset';
import { PresentationConfig } from '@/lib/types/presentation';
import type { ThemeConfig } from '@/lib/types/theme';

type BackgroundObjectLike = {
  type?: string;
  shader?: string;
  preset?: string;
  presetRef?: string;
  params?: Record<string, unknown>;
  value?: string;
  gradient?: unknown;
  variant?: string;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  opacity?: number;
  filter?: {
    mode?: string;
    opacity?: number;
    radialSize?: {
      width?: number;
      height?: number;
    };
    linearProportion?: number;
    steepness?: number;
  };
  transition?: {
    duration?: number;
    easing?: string;
  };
  stages?: BackgroundObjectLike[];
  regions?: BackgroundObjectLike[];
  steps?: [number, number];
  clusters?: string[];
  group?: string;
};

function asBackgroundObject(value: unknown): BackgroundObjectLike | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as BackgroundObjectLike) : null;
}

function mergePresetBackground(
  config: BackgroundObjectLike,
  preset: BackgroundPresetConfig
): BackgroundObjectLike {
  const {
    presetRef: _presetRef,
    params: inlineParams,
    filter: inlineFilter,
    stages,
    regions,
    ...inlineRest
  } = config;

  return {
    type: inlineRest.type ?? 'paper-shader',
    shader: inlineRest.shader ?? preset.shader,
    preset: inlineRest.preset ?? preset.preset,
    params: {
      ...(preset.params ?? {}),
      ...(inlineParams ?? {})
    },
    colorStops: inlineRest.colorStops ?? preset.colorStops,
    intensity: inlineRest.intensity ?? preset.intensity,
    grain: inlineRest.grain ?? preset.grain,
    contrast: inlineRest.contrast ?? preset.contrast,
    speed: inlineRest.speed ?? preset.speed,
    opacity: inlineRest.opacity ?? preset.opacity,
    filter: preset.filter || inlineFilter
      ? {
          ...((preset.filter as Record<string, unknown> | undefined) ?? {}),
          ...((inlineFilter as Record<string, unknown> | undefined) ?? {}),
          radialSize: {
            ...(((preset.filter as { radialSize?: Record<string, unknown> } | undefined)?.radialSize) ?? {}),
            ...(((inlineFilter as { radialSize?: Record<string, unknown> } | undefined)?.radialSize) ?? {})
          }
        }
      : undefined,
    ...inlineRest,
    stages,
    regions
  };
}

function resolveBackgroundConfigPresetRefs(
  value: unknown,
  presetMap: Map<string, BackgroundPresetConfig>
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveBackgroundConfigPresetRefs(entry, presetMap));
  }

  const config = asBackgroundObject(value);
  if (!config) {
    return value;
  }

  const resolvedStages = Array.isArray(config.stages)
    ? config.stages.map((stage) => resolveBackgroundConfigPresetRefs(stage, presetMap) as BackgroundObjectLike)
    : undefined;
  const resolvedRegions = Array.isArray(config.regions)
    ? config.regions.map((region) => resolveBackgroundConfigPresetRefs(region, presetMap) as BackgroundObjectLike)
    : undefined;
  const nextConfig: BackgroundObjectLike = {
    ...config,
    stages: resolvedStages,
    regions: resolvedRegions
  };

  if (!config.presetRef) {
    return nextConfig;
  }

  const preset = presetMap.get(config.presetRef);
  if (!preset) {
    throw new Error(`Unknown background preset "${config.presetRef}".`);
  }

  return mergePresetBackground(nextConfig, preset);
}

export function resolvePresentationBackgroundPresetRefs(
  presentation: PresentationConfig,
  presetMap: Map<string, BackgroundPresetConfig>
): PresentationConfig {
  return {
    ...presentation,
    background: resolveBackgroundConfigPresetRefs(presentation.background, presetMap) as PresentationConfig['background'],
    backgroundSections: presentation.backgroundSections?.map((section) => ({
      ...section,
      shader: resolveBackgroundConfigPresetRefs(section.shader, presetMap) as typeof section.shader
    })),
    steps: presentation.steps?.map((step) => ({
      ...step,
      background: resolveBackgroundConfigPresetRefs(step.background, presetMap) as typeof step.background
    })),
    clusters: presentation.clusters?.map((cluster) => ({
      ...cluster,
      background: resolveBackgroundConfigPresetRefs(cluster.background, presetMap) as typeof cluster.background
    }))
  };
}

export function resolveThemeBackgroundPresetRefs(
  theme: ThemeConfig,
  presetMap: Map<string, BackgroundPresetConfig>
): ThemeConfig {
  if (!theme.background) {
    return theme;
  }

  return {
    ...theme,
    background: resolveBackgroundConfigPresetRefs(theme.background, presetMap) as ThemeConfig['background']
  };
}
