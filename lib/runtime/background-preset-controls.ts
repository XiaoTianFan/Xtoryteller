import {
  DitheringShapes,
  DitheringTypes,
  GrainGradientShapes,
  WarpPatterns
} from '@paper-design/shaders';

import {
  getPaperShaderSupport,
  normalizePaperShaderPresetName,
  resolvePaperShaderDefinition,
  supportedPaperShaderNames,
  type SupportedPaperShaderName
} from '@/lib/runtime/paper-shaders';

export interface BackgroundPresetControlOption {
  label: string;
  value: string;
}

export interface BackgroundPresetControlDefinition {
  key: string;
  label: string;
  kind: 'color' | 'color-list' | 'json' | 'number' | 'select' | 'text';
  min?: number;
  max?: number;
  step?: number;
  options?: BackgroundPresetControlOption[];
}

const numericRanges: Record<string, { min: number; max: number; step: number }> = {
  caustic: { min: 0, max: 1, step: 0.01 },
  contrast: { min: 0, max: 2, step: 0.01 },
  crumpleSize: { min: 0, max: 2, step: 0.01 },
  crumples: { min: 0, max: 1, step: 0.01 },
  distortion: { min: 0, max: 1, step: 0.01 },
  distortionFreq: { min: 0, max: 5, step: 0.01 },
  distortionShift: { min: -1, max: 1, step: 0.01 },
  drops: { min: 0, max: 1, step: 0.01 },
  edges: { min: 0, max: 1, step: 0.01 },
  fade: { min: 0, max: 1, step: 0.01 },
  falloff: { min: 0, max: 2, step: 0.01 },
  fiber: { min: 0, max: 1, step: 0.01 },
  fiberSize: { min: 0, max: 2, step: 0.01 },
  focalAngle: { min: -180, max: 180, step: 0.1 },
  focalDistance: { min: 0, max: 2, step: 0.01 },
  foldCount: { min: 0, max: 16, step: 1 },
  folds: { min: 0, max: 1, step: 0.01 },
  frame: { min: 0, max: 240, step: 0.1 },
  frequency: { min: 0, max: 2, step: 0.01 },
  grainMixer: { min: 0, max: 1, step: 0.01 },
  grainOverlay: { min: 0, max: 1, step: 0.01 },
  highlights: { min: 0, max: 1, step: 0.01 },
  intensity: { min: 0, max: 1, step: 0.01 },
  layering: { min: 0, max: 1, step: 0.01 },
  mixing: { min: 0, max: 1, step: 0.01 },
  noise: { min: 0, max: 1, step: 0.01 },
  offsetX: { min: -1, max: 1, step: 0.01 },
  offsetY: { min: -1, max: 1, step: 0.01 },
  originX: { min: 0, max: 1, step: 0.01 },
  originY: { min: 0, max: 1, step: 0.01 },
  proportion: { min: 0, max: 1, step: 0.01 },
  pxSize: { min: 0.5, max: 20, step: 0.1 },
  radius: { min: 0, max: 2, step: 0.01 },
  rotation: { min: -360, max: 360, step: 0.1 },
  roughness: { min: 0, max: 1, step: 0.01 },
  scale: { min: 0.01, max: 5, step: 0.01 },
  seed: { min: 0, max: 9999, step: 1 },
  shapeScale: { min: 0, max: 1, step: 0.01 },
  size: { min: 0, max: 2, step: 0.01 },
  softness: { min: 0, max: 1.5, step: 0.01 },
  spacing: { min: 0, max: 2, step: 0.01 },
  speed: { min: 0, max: 20, step: 0.01 },
  swirl: { min: 0, max: 1, step: 0.01 },
  swirlIterations: { min: 0, max: 20, step: 1 },
  waveX: { min: 0, max: 1, step: 0.01 },
  waveXShift: { min: -1, max: 1, step: 0.01 },
  waveY: { min: 0, max: 1, step: 0.01 },
  waveYShift: { min: -1, max: 1, step: 0.01 },
  waves: { min: 0, max: 1, step: 0.01 },
  worldHeight: { min: 0, max: 4000, step: 1 },
  worldWidth: { min: 0, max: 4000, step: 1 }
};

function titleCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toOptions(values: readonly string[]): BackgroundPresetControlOption[] {
  return values.map((value) => ({
    label: value,
    value
  }));
}

function getEnumOptions(shader: SupportedPaperShaderName, key: string): BackgroundPresetControlOption[] | null {
  if (key === 'fit') {
    return toOptions(['none', 'contain', 'cover']);
  }

  if (shader === 'dithering' && key === 'shape') {
    return toOptions(Object.keys(DitheringShapes));
  }

  if (shader === 'dithering' && key === 'type') {
    return toOptions(Object.keys(DitheringTypes));
  }

  if (shader === 'grain-gradient' && key === 'shape') {
    return toOptions(Object.keys(GrainGradientShapes));
  }

  if (shader === 'warp' && key === 'shape') {
    return toOptions(Object.keys(WarpPatterns));
  }

  return null;
}

export function getPaperShaderPresetOptions(shader: SupportedPaperShaderName) {
  const definition = resolvePaperShaderDefinition(shader);
  if (!definition) {
    return [];
  }

  return definition.presets
    .map((preset) => String(preset.name ?? '').trim())
    .filter(Boolean)
    .map((presetName) => ({
      label: presetName,
      value: normalizePaperShaderPresetName(shader, presetName) ?? presetName
    }));
}

export function getPaperShaderPresetSeed(
  shader: SupportedPaperShaderName,
  preset: string | undefined
) {
  const definition = resolvePaperShaderDefinition(shader);
  const normalizedPreset = normalizePaperShaderPresetName(shader, preset);
  const selectedPreset =
    definition?.presets.find((entry) => {
      const entryName = String(entry.name ?? '').trim();
      return entryName && normalizePaperShaderPresetName(shader, entryName) === normalizedPreset;
    }) ?? definition?.presets[0];

  return (selectedPreset?.params ?? {}) as Record<string, unknown>;
}

export function getPaperShaderParameterControls(shader: SupportedPaperShaderName) {
  const support = getPaperShaderSupport(shader);

  return support.allowedParams.map((key) => {
    const options = getEnumOptions(shader, key);
    if (options) {
      return {
        key,
        label: titleCase(key),
        kind: 'select',
        options
      } satisfies BackgroundPresetControlDefinition;
    }

    if (key === 'image') {
      return {
        key,
        label: titleCase(key),
        kind: 'text'
      } satisfies BackgroundPresetControlDefinition;
    }

    if (key === 'colors') {
      return {
        key,
        label: titleCase(key),
        kind: 'color-list'
      } satisfies BackgroundPresetControlDefinition;
    }

    if (key.startsWith('color')) {
      return {
        key,
        label: titleCase(key),
        kind: 'color'
      } satisfies BackgroundPresetControlDefinition;
    }

    const numericRange = numericRanges[key];
    if (numericRange) {
      return {
        key,
        label: titleCase(key),
        kind: 'number',
        ...numericRange
      } satisfies BackgroundPresetControlDefinition;
    }

    return {
      key,
      label: titleCase(key),
      kind: 'json'
    } satisfies BackgroundPresetControlDefinition;
  });
}

export const defaultBackgroundPresetShader: SupportedPaperShaderName = 'paper-texture';
export const availableBackgroundPresetShaders = supportedPaperShaderNames;
