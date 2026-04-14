import fs from 'node:fs/promises';
import path from 'node:path';

import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import {
  REQUIRED_BORDER_PATHS,
  REQUIRED_COLOR_KEYS,
  REQUIRED_MOTION_PATHS,
  REQUIRED_RADII_PATHS,
  REQUIRED_SHADOW_PATHS,
  REQUIRED_SIZING_PATHS,
  REQUIRED_SPACING_PATHS,
  REQUIRED_TYPOGRAPHY_PATHS
} from '@/lib/engine/theme-editor-schema';
import paperShaderSupportData from '@/lib/runtime/paper-shader-support.json';
import type { BackgroundPresetConfig } from '@/lib/types/background-preset';
import type { ThemeConfig } from '@/lib/types/theme';

const MIN_CONTRAST = 4.5;
const FONT_SOURCES = ['local', 'google', 'fontshare', 'system'] as const;
const FONT_DISPLAYS = ['auto', 'block', 'swap', 'fallback', 'optional'] as const;
const FONT_STYLES = ['normal', 'italic'] as const;

interface PaperShaderSupportEntry {
  presets: string[];
  allowedParams: string[];
  genericMappings: Partial<Record<'colorStops' | 'intensity' | 'grain' | 'contrast' | 'speed', string>>;
}

interface PaperShaderSupportFile {
  aliases: Record<string, string>;
  shaders: Record<string, PaperShaderSupportEntry>;
}

export class ThemeValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(issues[0] ?? 'Theme validation failed.');
    this.name = 'ThemeValidationError';
    this.issues = issues;
  }
}

const PAPER_SHADER_SUPPORT = paperShaderSupportData as PaperShaderSupportFile;
const PAPER_SHADER_NAMES = new Set(Object.keys(PAPER_SHADER_SUPPORT.shaders));

function parseHex(hex: string) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    return normalized.split('').map((part) => Number.parseInt(`${part}${part}`, 16));
  }

  if (normalized.length === 6) {
    return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
  }

  return null;
}

function parseRgb(input: string) {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()));

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }

  return [r, g, b];
}

function toRgb(input: unknown) {
  if (typeof input !== 'string') {
    return null;
  }

  if (input.startsWith('#')) {
    return parseHex(input);
  }

  if (input.startsWith('rgb')) {
    return parseRgb(input);
  }

  return null;
}

function normalizeKey(value: unknown) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizePaperShaderName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return PAPER_SHADER_SUPPORT.aliases[normalized] ?? (PAPER_SHADER_NAMES.has(normalized) ? normalized : null);
}

function normalizePaperShaderPresetName(shaderName: string | null, value: unknown) {
  if (!shaderName || typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return (
    PAPER_SHADER_SUPPORT.shaders[shaderName]?.presets.find(
      (preset) => normalizeKey(preset) === normalized
    ) ?? null
  );
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function looksLikeCssBackground(value: string) {
  return /(gradient\(|#|rgb\(|rgba\(|hsl\(|hsla\(|var\(|url\()/i.test(value);
}

function validateCssGradient(gradient: unknown, label: string, issues: string[]) {
  if (!gradient) {
    return;
  }

  const value = asObject(gradient);
  if (!value) {
    issues.push(`${label} must be an object.`);
    return;
  }

  if (value.type != null && !['linear', 'radial'].includes(String(value.type))) {
    issues.push(`${label}.type must be "linear" or "radial".`);
  }

  if (
    !Array.isArray(value.stops) ||
    value.stops.length < 2 ||
    !value.stops.every((stop) => typeof stop === 'string')
  ) {
    issues.push(`${label}.stops must contain at least two color strings.`);
  }
}

function validateBackgroundFilterConfig(filter: unknown, label: string, issues: string[]) {
  if (filter == null) {
    return;
  }

  const value = asObject(filter);
  if (!value) {
    issues.push(`${label} must be an object.`);
    return;
  }

  const allowedKeys = new Set(['mode', 'opacity', 'radialSize', 'linearProportion', 'steepness']);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push(`${label}.${key} is not supported.`);
    }
  }

  if (
    ![
      'radial',
      'radial-reverse',
      'linear-horizontal',
      'linear-horizontal-reverse',
      'linear-vertical',
      'linear-vertical-reverse'
    ].includes(String(value.mode))
  ) {
    issues.push(
      `${label}.mode must be "radial", "radial-reverse", "linear-horizontal", "linear-horizontal-reverse", "linear-vertical", or "linear-vertical-reverse".`
    );
  }

  if (
    value.opacity != null &&
    (!Number.isFinite(value.opacity) || Number(value.opacity) < 0 || Number(value.opacity) > 1)
  ) {
    issues.push(`${label}.opacity must be between 0 and 1.`);
  }

  if (
    value.linearProportion != null &&
    (!Number.isFinite(value.linearProportion) ||
      Number(value.linearProportion) < 0 ||
      Number(value.linearProportion) > 1)
  ) {
    issues.push(`${label}.linearProportion must be between 0 and 1.`);
  }

  if (
    value.steepness != null &&
    (!Number.isFinite(value.steepness) || Number(value.steepness) < 0 || Number(value.steepness) > 1)
  ) {
    issues.push(`${label}.steepness must be between 0 and 1.`);
  }

  if (value.radialSize != null) {
    const radialSize = asObject(value.radialSize);
    if (!radialSize) {
      issues.push(`${label}.radialSize must be an object.`);
      return;
    }

    const allowedRadialKeys = new Set(['width', 'height']);
    for (const key of Object.keys(radialSize)) {
      if (!allowedRadialKeys.has(key)) {
        issues.push(`${label}.radialSize.${key} is not supported.`);
      }
    }

    for (const key of ['width', 'height'] as const) {
      const nested = radialSize[key];
      if (nested != null && (!Number.isFinite(nested) || Number(nested) < 0 || Number(nested) > 1)) {
        issues.push(`${label}.radialSize.${key} must be between 0 and 1.`);
      }
    }
  }
}

function validatePaperShaderConfig(
  value: Record<string, unknown>,
  label: string,
  issues: string[],
  shaderName: string
) {
  const support = PAPER_SHADER_SUPPORT.shaders[shaderName];
  if (!support) {
    issues.push(`${label} references unsupported Paper shader "${shaderName}".`);
    return;
  }

  const normalizedPreset =
    normalizePaperShaderPresetName(shaderName, value.preset) ??
    normalizePaperShaderPresetName(shaderName, value.variant);
  const declaredPreset = typeof value.preset === 'string' ? value.preset : value.variant;
  if (declaredPreset != null && !normalizedPreset) {
    issues.push(
      `${label} references unsupported preset "${String(declaredPreset)}" for Paper shader "${shaderName}".`
    );
  }

  const params = asObject(value.params) ?? {};
  const allowedParams = new Set(support.allowedParams);
  for (const key of Object.keys(params)) {
    if (!allowedParams.has(key)) {
      issues.push(`${label}.params.${key} is not supported for Paper shader "${shaderName}".`);
    }
  }

  for (const field of ['colorStops', 'intensity', 'grain', 'contrast', 'speed'] as const) {
    if (value[field] == null) {
      continue;
    }

    if (!support.genericMappings[field]) {
      issues.push(`${label}.${field} is not supported for Paper shader "${shaderName}".`);
    }
  }

  if (value.colorStops != null) {
    if (
      !Array.isArray(value.colorStops) ||
      value.colorStops.length < 2 ||
      !value.colorStops.every((entry) => typeof entry === 'string')
    ) {
      issues.push(`${label}.colorStops must contain at least two color strings.`);
    }
  }
}

function resolvePresetBackedBackground(
  value: Record<string, unknown>,
  backgroundPresetMap: Map<string, BackgroundPresetConfig>
) {
  const presetRef =
    typeof value.presetRef === 'string' && value.presetRef.trim() ? value.presetRef.trim() : null;
  const preset = presetRef ? backgroundPresetMap.get(presetRef) ?? null : null;

  if (!preset) {
    return { presetRef, preset: null, effectiveValue: value };
  }

  return {
    presetRef,
    preset,
    effectiveValue: {
      ...preset,
      ...value,
      type: value.type ?? 'paper-shader',
      shader: value.shader ?? preset.shader,
      preset: value.preset ?? preset.preset,
      params: {
        ...(asObject(preset.params) ?? {}),
        ...(asObject(value.params) ?? {})
      },
      colorStops: value.colorStops ?? preset.colorStops,
      intensity: value.intensity ?? preset.intensity,
      grain: value.grain ?? preset.grain,
      contrast: value.contrast ?? preset.contrast,
      speed: value.speed ?? preset.speed,
      opacity: value.opacity ?? preset.opacity,
      filter:
        preset.filter || value.filter
          ? {
              ...(asObject(preset.filter) ?? {}),
              ...(asObject(value.filter) ?? {}),
              radialSize: {
                ...((asObject(preset.filter)?.radialSize &&
                  asObject(asObject(preset.filter)?.radialSize)) ??
                  {}),
                ...((asObject(value.filter)?.radialSize &&
                  asObject(asObject(value.filter)?.radialSize)) ??
                  {})
              }
            }
          : undefined
    }
  };
}

function validateThemeBackground(
  background: ThemeConfig['background'],
  issues: string[],
  backgroundPresetMap: Map<string, BackgroundPresetConfig>
) {
  if (background == null) {
    return;
  }

  if (typeof background === 'string') {
    const normalized = normalizePaperShaderName(background);
    if (
      normalizeKey(background) === 'none' ||
      looksLikeCssBackground(background) ||
      (normalized && PAPER_SHADER_NAMES.has(normalized))
    ) {
      return;
    }

    issues.push(
      'background must be "none", a CSS background string, or a supported Paper shader name.'
    );
    return;
  }

  const value = asObject(background);
  if (!value) {
    issues.push('background must be a string or object.');
    return;
  }

  if (value.stages != null || value.regions != null || value.transition != null) {
    issues.push('background on a theme cannot declare stages, regions, or transition overrides.');
  }

  const { presetRef, preset, effectiveValue } = resolvePresetBackedBackground(value, backgroundPresetMap);
  const normalizedType = normalizeKey(effectiveValue.type ?? '');
  const explicitCss = normalizedType === 'css';
  const explicitNone = normalizedType === 'none';
  const shaderName =
    normalizePaperShaderName(effectiveValue.shader) ??
    (normalizedType === 'paper-shader' ? 'paper-texture' : null) ??
    (normalizedType && !['css', 'none', 'paper', 'paper-shader'].includes(normalizedType)
      ? normalizePaperShaderName(value.type)
      : null);

  if (value.presetRef != null && !presetRef) {
    issues.push('background.presetRef must be a non-empty string.');
  }

  if (presetRef && !preset) {
    issues.push(`background.presetRef references unknown background preset "${presetRef}".`);
  }

  if (presetRef && (value.value != null || value.gradient != null)) {
    issues.push('background.presetRef cannot be combined with CSS-only fields like value or gradient.');
  }

  if (presetRef && (explicitCss || explicitNone)) {
    issues.push(
      `background.presetRef implies a Paper shader background and cannot be combined with type "${String(value.type)}".`
    );
  }

  if (
    !explicitCss &&
    !explicitNone &&
    value.type != null &&
    shaderName == null &&
    normalizedType !== 'paper'
  ) {
    issues.push(
      'background.type must be "css", "paper-shader", "none", legacy "paper", or a supported Paper shader alias.'
    );
  }

  if (
    !explicitCss &&
    !explicitNone &&
    normalizedType !== 'paper' &&
    shaderName == null &&
    effectiveValue.value == null &&
    effectiveValue.gradient == null &&
    effectiveValue.colorStops == null
  ) {
    issues.push('background must declare a CSS background, "none", or a supported Paper shader.');
  }

  if (
    !explicitNone &&
    (explicitCss ||
      normalizedType === 'paper' ||
      (!shaderName &&
        (effectiveValue.value != null ||
          effectiveValue.gradient != null ||
          effectiveValue.colorStops != null)))
  ) {
    if (effectiveValue.filter != null) {
      issues.push(
        'background.filter is only supported on Paper shader backgrounds or presetRef-backed Paper shader backgrounds.'
      );
    }

    if (effectiveValue.value != null && typeof effectiveValue.value !== 'string') {
      issues.push('background.value must be a string.');
    }

    if (effectiveValue.colorStops != null) {
      if (
        !Array.isArray(effectiveValue.colorStops) ||
        effectiveValue.colorStops.length < 3 ||
        !effectiveValue.colorStops.every((entry) => typeof entry === 'string')
      ) {
        issues.push('background.colorStops must contain at least three color strings for CSS backgrounds.');
      }
    }

    validateCssGradient(effectiveValue.gradient, 'background.gradient', issues);
    return;
  }

  if (!explicitNone && shaderName) {
    validateBackgroundFilterConfig(effectiveValue.filter, 'background.filter', issues);
    validatePaperShaderConfig(effectiveValue, 'background', issues, shaderName);
  } else if (effectiveValue.filter != null) {
    issues.push(
      'background.filter is only supported on Paper shader backgrounds or presetRef-backed Paper shader backgrounds.'
    );
  }
}

function channelToLinear(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(left: number[], right: number[]) {
  const l1 = luminance(left);
  const l2 = luminance(right);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hasNestedKey(value: unknown, pathSegments: string[]) {
  let current = value;

  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return false;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

function validateRequiredKeys(
  sectionName: string,
  value: unknown,
  requiredKeys: string[],
  issues: string[]
) {
  if (!value || typeof value !== 'object') {
    issues.push(`${sectionName} is missing required values.`);
    return;
  }

  for (const key of requiredKeys) {
    if (!(key in (value as Record<string, unknown>))) {
      issues.push(`${sectionName} is missing required key "${key}".`);
    }
  }
}

function validateRequiredPaths(
  sectionName: string,
  value: unknown,
  requiredPaths: string[],
  issues: string[]
) {
  if (!value || typeof value !== 'object') {
    issues.push(`${sectionName} is missing required values.`);
    return;
  }

  for (const keyPath of requiredPaths) {
    if (!hasNestedKey(value, keyPath.split('.'))) {
      issues.push(`${sectionName} is missing required key "${keyPath}".`);
    }
  }
}

function validateFontMetadata(
  roleName: string,
  role: ThemeConfig['fonts']['heading'] | undefined,
  issues: string[]
) {
  if (!role?.family) {
    issues.push(`${roleName} font is missing a family.`);
    return false;
  }

  if (role.source && !FONT_SOURCES.includes(role.source)) {
    issues.push(`${roleName} font has unsupported source "${role.source}".`);
  }

  if (role.display && !FONT_DISPLAYS.includes(role.display)) {
    issues.push(`${roleName} font has unsupported display "${role.display}".`);
  }

  if (Array.isArray(role.styles)) {
    for (const style of role.styles) {
      if (!FONT_STYLES.includes(style)) {
        issues.push(`${roleName} font has unsupported style "${style}".`);
      }
    }
  }

  return true;
}

async function validateLocalFontRole(
  roleName: string,
  role: ThemeConfig['fonts']['heading'],
  issues: string[],
  projectRoot: string
) {
  if (!Array.isArray(role.files) || role.files.length === 0) {
    issues.push(`${roleName} font at "${role.family}" is local and must declare files.`);
    return;
  }

  const fontsRoot = path.join(projectRoot, 'public', 'fonts');
  for (const file of role.files) {
    if (!file?.path || typeof file.path !== 'string') {
      issues.push(`${roleName} font at "${role.family}" has a file entry without a path.`);
      continue;
    }

    if (typeof file.weight !== 'number' || !Number.isFinite(file.weight)) {
      issues.push(`${roleName} font at "${role.family}" has a file entry without a numeric weight.`);
    }

    if (file.style && !FONT_STYLES.includes(file.style)) {
      issues.push(`${roleName} font at "${role.family}" has unsupported file style "${file.style}".`);
    }

    const relativePath = file.path.replace(/^\//, '').replace(/^fonts[\\/]/, '');
    const resolvedPath = path.resolve(fontsRoot, relativePath);
    if (!resolvedPath.startsWith(fontsRoot)) {
      issues.push(
        `${roleName} font at "${role.family}" references ${file.path}, which is outside public/fonts/.`
      );
      continue;
    }

    try {
      await fs.access(resolvedPath);
    } catch {
      issues.push(
        `${roleName} font at "${role.family}" references missing file ${path.relative(projectRoot, resolvedPath)}.`
      );
    }
  }
}

function validateGoogleFontRole(
  roleName: string,
  role: ThemeConfig['fonts']['heading'],
  issues: string[]
) {
  if (!Array.isArray(role.weights) || role.weights.length === 0) {
    issues.push(`${roleName} font at "${role.family}" needs explicit weights when source is google.`);
  }
}

function validateFontshareRole(
  roleName: string,
  role: ThemeConfig['fonts']['heading'],
  issues: string[]
) {
  if (typeof role.cssUrl !== 'string' || !/^https?:\/\//i.test(role.cssUrl)) {
    issues.push(
      `${roleName} font at "${role.family}" must provide a valid cssUrl when source is fontshare.`
    );
  }
}

async function validateFontRole(
  roleName: string,
  role: ThemeConfig['fonts']['heading'] | undefined,
  issues: string[],
  projectRoot: string
) {
  if (!validateFontMetadata(roleName, role, issues) || !role) {
    return;
  }

  switch (role.source) {
    case 'local':
      await validateLocalFontRole(roleName, role, issues, projectRoot);
      break;
    case 'google':
      validateGoogleFontRole(roleName, role, issues);
      break;
    case 'fontshare':
      validateFontshareRole(roleName, role, issues);
      break;
    default:
      break;
  }
}

export async function collectThemeValidationIssues(
  theme: ThemeConfig,
  options?: {
    backgroundPresetMap?: Map<string, BackgroundPresetConfig>;
    projectRoot?: string;
  }
) {
  const backgroundPresetMap = options?.backgroundPresetMap ?? (await loadBackgroundPresetMap());
  const projectRoot = options?.projectRoot ?? process.cwd();
  const issues: string[] = [];

  await Promise.all([
    validateFontRole('heading', theme.fonts?.heading, issues, projectRoot),
    validateFontRole('body', theme.fonts?.body, issues, projectRoot),
    validateFontRole('mono', theme.fonts?.mono, issues, projectRoot)
  ]);

  if (!theme.name?.trim()) {
    issues.push('name is required.');
  }

  validateRequiredKeys('colors', theme.colors, REQUIRED_COLOR_KEYS, issues);
  validateRequiredPaths('typography', theme.typography, REQUIRED_TYPOGRAPHY_PATHS, issues);
  validateRequiredPaths('spacing', theme.spacing, REQUIRED_SPACING_PATHS, issues);
  validateRequiredPaths('sizing', theme.sizing, REQUIRED_SIZING_PATHS, issues);
  validateRequiredPaths('radii', theme.radii, REQUIRED_RADII_PATHS, issues);
  validateRequiredPaths('shadows', theme.shadows, REQUIRED_SHADOW_PATHS, issues);
  validateRequiredPaths('borders', theme.borders, REQUIRED_BORDER_PATHS, issues);
  validateRequiredPaths('motion', theme.motion, REQUIRED_MOTION_PATHS, issues);
  validateThemeBackground(theme.background, issues, backgroundPresetMap);

  const background = toRgb(theme.colors?.background);
  const surface = toRgb(theme.colors?.surface ?? theme.colors?.background);
  const checks: Array<[string, number[] | null, number[] | null]> = [
    ['foreground/background', toRgb(theme.colors?.foreground), background],
    ['foreground/surface', toRgb(theme.colors?.foreground), surface],
    ['muted/background', toRgb(theme.colors?.muted), background],
    ['primary/background', toRgb(theme.colors?.primary), background],
    ['secondary/background', toRgb(theme.colors?.secondary), background]
  ];

  for (const [label, left, right] of checks) {
    if (!left || !right) {
      continue;
    }

    const contrast = contrastRatio(left, right);
    if (contrast < MIN_CONTRAST) {
      issues.push(`${label} contrast is ${contrast.toFixed(2)}:1, below ${MIN_CONTRAST}:1.`);
    }
  }

  return issues;
}

export async function validateThemeConfig(
  theme: ThemeConfig,
  options?: {
    backgroundPresetMap?: Map<string, BackgroundPresetConfig>;
    projectRoot?: string;
  }
) {
  const issues = await collectThemeValidationIssues(theme, options);
  if (issues.length) {
    throw new ThemeValidationError(issues);
  }
}
