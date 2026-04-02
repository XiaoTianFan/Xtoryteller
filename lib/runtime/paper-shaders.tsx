'use client';

import { ComponentType } from 'react';
import * as PaperShaders from '@paper-design/shaders-react';

import paperShaderSupportData from '@/lib/runtime/paper-shader-support.json';

export type SupportedPaperShaderName =
  | 'dithering'
  | 'grain-gradient'
  | 'mesh-gradient'
  | 'paper-texture'
  | 'static-mesh-gradient'
  | 'static-radial-gradient'
  | 'water'
  | 'warp'
  | 'waves';

type GenericMappingKey =
  | 'colorStops'
  | 'contrast'
  | 'grain'
  | 'intensity'
  | 'speed'
  | 'variant';

interface PaperShaderSupportEntry {
  componentName: string;
  presets: string[];
  defaultPreset: string;
  allowedParams: string[];
  interpolableParams: string[];
  genericMappings: Partial<Record<GenericMappingKey, string>>;
}

interface PaperShaderSupportFile {
  aliases: Record<string, SupportedPaperShaderName>;
  shaders: Record<SupportedPaperShaderName, PaperShaderSupportEntry>;
}

export interface PaperShaderPreset {
  name?: string;
  params?: Record<string, unknown>;
}

export interface PaperShaderDefinition {
  component: ComponentType<Record<string, unknown>>;
  presets: PaperShaderPreset[];
  support: PaperShaderSupportEntry;
}

export interface PaperShaderGenericInput {
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  variant?: string;
}

const paperShaderSupport = paperShaderSupportData as PaperShaderSupportFile;

function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toPresetKey(componentName: string): string {
  return `${componentName.charAt(0).toLowerCase()}${componentName.slice(1)}Presets`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function applyColorStops(
  shader: SupportedPaperShaderName,
  colorStops: string[],
  target: Record<string, unknown>
) {
  if (colorStops.length < 2) {
    return;
  }

  switch (shader) {
    case 'paper-texture':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colorFront == null) {
        target.colorFront = colorStops[1] ?? colorStops[0];
      }
      break;
    case 'water':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colorHighlight == null) {
        target.colorHighlight = colorStops[1] ?? colorStops[0];
      }
      break;
    case 'waves':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colorFront == null) {
        target.colorFront = colorStops[1] ?? colorStops[0];
      }
      break;
    case 'static-radial-gradient':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colors == null) {
        target.colors = colorStops.slice(1);
      }
      break;
    case 'grain-gradient':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colors == null) {
        target.colors = colorStops.slice(1);
      }
      break;
    case 'dithering':
      if (target.colorBack == null) {
        target.colorBack = colorStops[0];
      }
      if (target.colorFront == null) {
        target.colorFront = colorStops[1] ?? colorStops[0];
      }
      break;
    default:
      if (target.colors == null) {
        target.colors = colorStops;
      }
      break;
  }
}

export function normalizePaperShaderName(value?: unknown): SupportedPaperShaderName | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return paperShaderSupport.aliases[normalized] ?? (normalized in paperShaderSupport.shaders ? (normalized as SupportedPaperShaderName) : null);
}

export function normalizePaperShaderPresetName(
  shader: SupportedPaperShaderName,
  value?: unknown
): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const normalized = normalizeKey(value);
  const match = paperShaderSupport.shaders[shader].presets.find((preset) => normalizeKey(preset) === normalized);
  return match;
}

export function getPaperShaderSupport(shader: SupportedPaperShaderName): PaperShaderSupportEntry {
  return paperShaderSupport.shaders[shader];
}

export function paperShaderSupportsBuiltInMotion(shader: SupportedPaperShaderName): boolean {
  const support = getPaperShaderSupport(shader);
  return support.allowedParams.includes('speed') || support.allowedParams.includes('frame');
}

export const supportedPaperShaderNames = Object.keys(paperShaderSupport.shaders).sort() as SupportedPaperShaderName[];

export const paperShaderRegistry = Object.fromEntries(
  supportedPaperShaderNames.map((shader) => {
    const support = paperShaderSupport.shaders[shader];
    const component = PaperShaders[support.componentName as keyof typeof PaperShaders] as ComponentType<Record<string, unknown>>;
    const presets = (PaperShaders[toPresetKey(support.componentName) as keyof typeof PaperShaders] ?? []) as PaperShaderPreset[];
    return [shader, { component, presets, support } satisfies PaperShaderDefinition];
  })
) as Record<SupportedPaperShaderName, PaperShaderDefinition>;

export function resolvePaperShaderDefinition(name?: string | null): PaperShaderDefinition | null {
  const normalized = normalizePaperShaderName(name);
  if (!normalized) {
    return null;
  }

  return paperShaderRegistry[normalized] ?? null;
}

export function normalizePaperShaderParams(
  shader: SupportedPaperShaderName,
  params: Record<string, unknown> | undefined,
  genericInput?: PaperShaderGenericInput
): Record<string, unknown> {
  const support = paperShaderSupport.shaders[shader];
  const allowed = new Set(support.allowedParams);
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params ?? {})) {
    if (allowed.has(key)) {
      normalized[key] = value;
    }
  }

  if (Array.isArray(genericInput?.colorStops) && genericInput.colorStops.length >= 2) {
    applyColorStops(shader, genericInput.colorStops, normalized);
  }

  if (genericInput?.intensity != null) {
    const targetKey = support.genericMappings.intensity;
    if (targetKey && normalized[targetKey] == null) {
      normalized[targetKey] = genericInput.intensity;
    }
  }

  if (genericInput?.grain != null) {
    const targetKey = support.genericMappings.grain;
    if (targetKey && normalized[targetKey] == null) {
      normalized[targetKey] = genericInput.grain;
    }
  }

  if (genericInput?.contrast != null) {
    const targetKey = support.genericMappings.contrast;
    if (targetKey && normalized[targetKey] == null) {
      normalized[targetKey] = genericInput.contrast;
    }
  }

  if (genericInput?.speed != null) {
    const targetKey = support.genericMappings.speed;
    if (targetKey && normalized[targetKey] == null) {
      normalized[targetKey] = genericInput.speed;
    }
  }

  return normalized;
}

export function resolvePaperShaderProps(
  shader: SupportedPaperShaderName,
  presetName: string | undefined,
  params: Record<string, unknown> | undefined
): Record<string, unknown> {
  const definition = paperShaderRegistry[shader];
  const normalizedPreset = normalizePaperShaderPresetName(shader, presetName) ?? definition.support.defaultPreset;
  const selectedPreset =
    definition.presets.find((preset) => normalizeKey(String(preset.name ?? '')) === normalizeKey(normalizedPreset)) ??
    definition.presets[0];
  const filteredParams = asRecord(params) ?? {};

  return {
    ...(selectedPreset?.params ?? {}),
    ...filteredParams
  };
}

export function isPaperShaderParamInterpolable(shader: SupportedPaperShaderName, key: string): boolean {
  return paperShaderSupport.shaders[shader].interpolableParams.includes(key);
}
