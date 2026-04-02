import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import {
  BackgroundFilterConfig,
  BackgroundConfigObject,
  CssGradientConfig,
  PresentationConfig
} from '@/lib/types/presentation';
import { ThemeConfig } from '@/lib/types/theme';
import {
  normalizePaperShaderName,
  normalizePaperShaderParams,
  normalizePaperShaderPresetName,
  resolvePaperShaderProps
} from '@/lib/runtime/paper-shaders';
import { resolveMotionDurationMs } from '@/lib/runtime/transition-presets';

export interface ResolvedCssGradientConfig {
  type: 'linear' | 'radial';
  angle?: string;
  position?: string;
  stops: string[];
}

export interface ResolvedBackgroundAppearance {
  kind: 'css' | 'none' | 'paper-shader';
  key: string;
  opacity: number;
  filter?: ResolvedBackgroundFilter;
  shader?: string;
  preset?: string;
  params?: Record<string, unknown>;
  value?: string;
  cssConfig?: ResolvedCssGradientConfig;
}

export interface ResolvedBackgroundFilter {
  mode:
    | 'radial'
    | 'radial-reverse'
    | 'linear-horizontal'
    | 'linear-horizontal-reverse'
    | 'linear-vertical'
    | 'linear-vertical-reverse';
  opacity: number;
  radialSize: {
    width: number;
    height: number;
  };
  linearProportion: number;
  steepness: number;
  color: string;
  value: string;
}

export interface ResolvedBackgroundTransition {
  duration: number;
  easing: string;
}

export interface ResolvedBackgroundState {
  appearance: ResolvedBackgroundAppearance;
  transition: ResolvedBackgroundTransition;
}

interface BackgroundSectionLike {
  match?: {
    stepRange?: [number, number];
    clusterIds?: string[];
    group?: string;
  };
  shader?: unknown;
}

interface PresentationBackgroundLike {
  type?: string;
  presetRef?: string;
  shader?: string;
  preset?: string;
  params?: Record<string, unknown>;
  value?: string;
  gradient?: CssGradientConfig;
  filter?: BackgroundFilterConfig;
  variant?: string;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  opacity?: number;
  stages?: Array<{
    steps: [number, number];
    type?: string;
    presetRef?: string;
    shader?: string;
    preset?: string;
    params?: Record<string, unknown>;
    value?: string;
    gradient?: CssGradientConfig;
    variant?: string;
    colorStops?: string[];
    intensity?: number;
    grain?: number;
    contrast?: number;
    speed?: number;
    opacity?: number;
    filter?: BackgroundFilterConfig;
  }>;
  regions?: Array<{
    clusters?: string[];
    group?: string;
    type?: string;
    presetRef?: string;
    shader?: string;
    preset?: string;
    params?: Record<string, unknown>;
    value?: string;
    gradient?: CssGradientConfig;
    variant?: string;
    colorStops?: string[];
    intensity?: number;
    grain?: number;
    contrast?: number;
    speed?: number;
    opacity?: number;
    filter?: BackgroundFilterConfig;
  }>;
  transition?: {
    duration?: number;
    easing?: string;
  };
}

function asObject<T extends object>(value: unknown): T | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : null;
}

function getNestedValue(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

function getThemeColorStops(theme?: ThemeConfig): string[] | null {
  const resolved = getNestedValue(theme?.colors, ['backgroundStops', 'default']);
  return Array.isArray(resolved) && resolved.every((entry) => typeof entry === 'string') ? (resolved as string[]) : null;
}

function getThemeSceneEasing(theme?: ThemeConfig) {
  const resolved = getNestedValue(theme?.motion, ['scene', 'easing']);
  return typeof resolved === 'string' ? resolved : 'ease-in-out';
}

function getThemeSceneDuration(theme?: ThemeConfig) {
  return resolveMotionDurationMs(getNestedValue(theme?.motion, ['scene', 'duration']), 800);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampUnit(value: unknown, fallback: number): number {
  return Math.max(0, Math.min(1, toFiniteNumber(value, fallback)));
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function parseCssColor(value: string): [number, number, number, number] | null {
  const trimmed = value.trim();
  const hex = trimmed.match(/^#([\da-f]{3,8})$/i);
  if (hex) {
    const normalized = hex[1].length <= 4
      ? hex[1]
          .split('')
          .map((part) => part + part)
          .join('')
      : hex[1];
    if (normalized.length === 6 || normalized.length === 8) {
      const red = Number.parseInt(normalized.slice(0, 2), 16);
      const green = Number.parseInt(normalized.slice(2, 4), 16);
      const blue = Number.parseInt(normalized.slice(4, 6), 16);
      const alpha = normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;
      return [red, green, blue, alpha];
    }
  }

  const rgb = trimmed.match(/^rgba?\((.+)\)$/i);
  if (!rgb) {
    return null;
  }

  const parts = rgb[1].split(',').map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const red = Number.parseFloat(parts[0]);
  const green = Number.parseFloat(parts[1]);
  const blue = Number.parseFloat(parts[2]);
  const alpha = parts[3] == null ? 1 : Number.parseFloat(parts[3]);
  return [red, green, blue, alpha].every((entry) => Number.isFinite(entry))
    ? [red, green, blue, alpha]
    : null;
}

function colorWithOpacity(color: string, opacity: number): string {
  const parsed = parseCssColor(color);
  if (!parsed) {
    return `color-mix(in srgb, ${color} ${(opacity * 100).toFixed(1)}%, transparent)`;
  }

  return `rgba(${Math.round(parsed[0])}, ${Math.round(parsed[1])}, ${Math.round(parsed[2])}, ${(parsed[3] * opacity).toFixed(3)})`;
}

function looksLikeCssBackground(value: string): boolean {
  return /(gradient\(|#|rgb\(|rgba\(|hsl\(|hsla\(|var\(|url\()/i.test(value);
}

function looksLikeLocalAssetPath(value: string): boolean {
  if (!value || /^(https?:|data:|#|var\(|rgb|hsl)/i.test(value) || value.startsWith('/')) {
    return false;
  }

  if (value.startsWith('./') || value.startsWith('assets/')) {
    return true;
  }

  return /\.(?:png|jpe?g|webp|gif|svg|avif|bmp|ico|mp4|webm)$/i.test(value);
}

function resolveShaderAssets(value: unknown, slug: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveShaderAssets(entry, slug));
  }

  if (typeof value === 'string') {
    return looksLikeLocalAssetPath(value) ? resolveAssetPath(slug, value) : value;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, resolveShaderAssets(nested, slug)])
    );
  }

  return value;
}

function getThemeBackgroundColor(theme?: ThemeConfig): string | null {
  const resolved = getNestedValue(theme?.colors, ['background']);
  return typeof resolved === 'string' && resolved.trim() ? resolved : null;
}

function resolveBackgroundFilterColor(params: Record<string, unknown>, theme?: ThemeConfig): string {
  const colorBack = typeof params.colorBack === 'string' && params.colorBack.trim() ? params.colorBack : null;
  if (colorBack) {
    return colorBack;
  }

  const colors = Array.isArray(params.colors) ? params.colors : [];
  const firstPaletteColor = colors.find((entry) => typeof entry === 'string' && entry.trim());
  if (typeof firstPaletteColor === 'string') {
    return firstPaletteColor;
  }

  return getThemeBackgroundColor(theme) ?? 'var(--color-background)';
}

function buildBackgroundFilterValue(filter: {
  mode: ResolvedBackgroundFilter['mode'];
  opacity: number;
  radialSize: { width: number; height: number };
  linearProportion: number;
  steepness: number;
  color: string;
}): string {
  const overlayColor = colorWithOpacity(filter.color, filter.opacity);

  if (filter.mode === 'radial' || filter.mode === 'radial-reverse') {
    const isReverse = filter.mode === 'radial-reverse';
    if (filter.steepness <= 0) {
      if (isReverse) {
        return `radial-gradient(ellipse ${(filter.radialSize.width * 100).toFixed(1)}% ${(filter.radialSize.height * 100).toFixed(1)}% at center, ${overlayColor} 0%, ${overlayColor} 54%, transparent 100%)`;
      }
      return `radial-gradient(ellipse ${(filter.radialSize.width * 100).toFixed(1)}% ${(filter.radialSize.height * 100).toFixed(1)}% at center, transparent 0%, transparent 54%, ${overlayColor} 100%)`;
    }

    const fadeStart = (54 + (100 - 54) * filter.steepness).toFixed(1);
    if (isReverse) {
      return `radial-gradient(ellipse ${(filter.radialSize.width * 100).toFixed(1)}% ${(filter.radialSize.height * 100).toFixed(1)}% at center, ${overlayColor} 0%, ${overlayColor} ${fadeStart}%, transparent 100%)`;
    }
    return `radial-gradient(ellipse ${(filter.radialSize.width * 100).toFixed(1)}% ${(filter.radialSize.height * 100).toFixed(1)}% at center, transparent 0%, transparent ${fadeStart}%, ${overlayColor} 100%)`;
  }

  const edgeSize = Math.max(0, (1 - filter.linearProportion) / 2);
  const edgeStop = (edgeSize * 100).toFixed(1);
  const centerStop = ((1 - edgeSize) * 100).toFixed(1);
  const isHorizontal =
    filter.mode === 'linear-horizontal' || filter.mode === 'linear-horizontal-reverse';
  const isReverse =
    filter.mode === 'linear-horizontal-reverse' || filter.mode === 'linear-vertical-reverse';
  const angle = isHorizontal ? '90deg' : '180deg';
  if (filter.steepness <= 0) {
    if (isReverse) {
      return `linear-gradient(${angle}, transparent 0%, ${overlayColor} ${edgeStop}%, ${overlayColor} ${centerStop}%, transparent 100%)`;
    }
    return `linear-gradient(${angle}, ${overlayColor} 0%, transparent ${edgeStop}%, transparent ${centerStop}%, ${overlayColor} 100%)`;
  }

  const fadeInset = (edgeSize * filter.steepness * 100).toFixed(1);
  const fadeOutset = ((1 - edgeSize * filter.steepness) * 100).toFixed(1);
  if (isReverse) {
    return `linear-gradient(${angle}, transparent 0%, transparent ${fadeInset}%, ${overlayColor} ${edgeStop}%, ${overlayColor} ${centerStop}%, transparent ${fadeOutset}%, transparent 100%)`;
  }
  return `linear-gradient(${angle}, ${overlayColor} 0%, ${overlayColor} ${fadeInset}%, transparent ${edgeStop}%, transparent ${centerStop}%, ${overlayColor} ${fadeOutset}%, ${overlayColor} 100%)`;
}

function normalizeBackgroundFilterConfig(
  filter: BackgroundFilterConfig | undefined,
  params: Record<string, unknown>,
  theme?: ThemeConfig
): ResolvedBackgroundFilter | null {
  if (!filter || typeof filter !== 'object') {
    return null;
  }

  if (
    filter.mode !== 'radial' &&
    filter.mode !== 'radial-reverse' &&
    filter.mode !== 'linear-horizontal' &&
    filter.mode !== 'linear-horizontal-reverse' &&
    filter.mode !== 'linear-vertical' &&
    filter.mode !== 'linear-vertical-reverse'
  ) {
    return null;
  }

  const normalizedFilter: ResolvedBackgroundFilter = {
    mode: filter.mode,
    opacity: clampUnit(filter.opacity, 0.18),
    radialSize: {
      width: clampUnit(filter.radialSize?.width, 0.7),
      height: clampUnit(filter.radialSize?.height, 0.55)
    },
    linearProportion: clampUnit(filter.linearProportion, 0.45),
    steepness: clampUnit(filter.steepness, 0),
    color: resolveBackgroundFilterColor(params, theme),
    value: ''
  };
  normalizedFilter.value = buildBackgroundFilterValue(normalizedFilter);
  return normalizedFilter;
}

export function normalizeCssGradientConfig(
  gradient: CssGradientConfig | undefined,
  colorStops: string[] | undefined,
  theme?: ThemeConfig
): ResolvedCssGradientConfig | null {
  if (gradient && Array.isArray(gradient.stops) && gradient.stops.length >= 2) {
    return {
      type: gradient.type ?? 'linear',
      angle: typeof gradient.angle === 'number' ? `${gradient.angle}deg` : gradient.angle,
      position: gradient.position,
      stops: gradient.stops
    };
  }

  const fallbackStops = Array.isArray(colorStops) && colorStops.length >= 3
    ? colorStops
    : getThemeColorStops(theme) ?? [
        'rgba(var(--color-background-rgb, 245, 242, 227), 0.96)',
        'rgba(var(--color-foreground-rgb, 34, 33, 26), 0.12)',
        'rgba(var(--color-foreground-rgb, 34, 33, 26), 0.18)'
      ];

  return {
    type: 'radial',
    position: '20% 20%',
    stops: fallbackStops
  };
}

export function buildCssBackgroundValue(
  config: Pick<PresentationBackgroundLike, 'value' | 'gradient' | 'colorStops'>,
  theme?: ThemeConfig
): { value: string; cssConfig?: ResolvedCssGradientConfig } {
  if (typeof config.value === 'string' && config.value.trim()) {
    return { value: config.value };
  }

  const gradient = normalizeCssGradientConfig(config.gradient, config.colorStops, theme);
  if (!gradient) {
    return { value: 'transparent' };
  }

  if (config.gradient) {
    if (gradient.type === 'linear') {
      const angle = gradient.angle ?? '135deg';
      return {
        cssConfig: gradient,
        value: `linear-gradient(${angle}, ${gradient.stops.join(', ')})`
      };
    }

    const position = gradient.position ?? 'center';
    return {
      cssConfig: gradient,
      value: `radial-gradient(circle at ${position}, ${gradient.stops.join(', ')})`
    };
  }

  return {
    cssConfig: gradient,
    value: `radial-gradient(circle at 20% 20%, ${gradient.stops[1]}, transparent 36%), radial-gradient(circle at 80% 24%, ${gradient.stops[2]}, transparent 34%), linear-gradient(135deg, ${gradient.stops[0]} 0%, color-mix(in srgb, ${gradient.stops[0]} 70%, var(--color-panel) 30%) 100%)`
  };
}

function isExplicitPaperShader(config: PresentationBackgroundLike): boolean {
  return (
    normalizePaperShaderName(config.shader) != null ||
    (typeof config.type === 'string' && normalizeKey(config.type) === 'paper-shader') ||
    typeof config.preset === 'string' ||
    (config.params != null && typeof config.params === 'object' && !Array.isArray(config.params))
  );
}

export function resolveBackgroundAppearance(
  input: unknown,
  slug: string,
  theme?: ThemeConfig
): ResolvedBackgroundAppearance | null {
  if (typeof input === 'string') {
    const normalizedString = normalizeKey(input);
    if (normalizedString === 'none') {
      return { kind: 'none', key: 'none', opacity: 0 };
    }

    if (looksLikeCssBackground(input)) {
      return {
        kind: 'css',
        key: `css:${stableStringify({ value: input, opacity: 1 })}`,
        value: input,
        opacity: 1
      };
    }

    const shader = normalizePaperShaderName(input);
    if (!shader) {
      return null;
    }

    const preset = normalizePaperShaderPresetName(shader, undefined);
    const params = resolvePaperShaderProps(shader, preset, {});
    return {
      kind: 'paper-shader',
      key: `paper-shader:${shader}:${stableStringify({ preset: preset ?? null, params, opacity: 1, filter: null })}`,
      shader,
      preset,
      params,
      opacity: 1
    };
  }

  const config = asObject<PresentationBackgroundLike>(input);
  if (!config) {
    return null;
  }

  const normalizedType = normalizeKey(String(config.type ?? ''));
  if (normalizedType === 'none') {
    return { kind: 'none', key: 'none', opacity: 0 };
  }

  const explicitCss = normalizedType === 'css';
  const explicitShader = isExplicitPaperShader(config) && !explicitCss;
  if (
    explicitCss ||
    (!explicitShader &&
      (typeof config.value === 'string' ||
        config.gradient != null ||
        Array.isArray(config.colorStops) ||
        normalizedType === 'paper'))
  ) {
    const cssBackground = buildCssBackgroundValue(config, theme);
    return {
      kind: 'css',
      key: `css:${stableStringify({ value: cssBackground.value, cssConfig: cssBackground.cssConfig ?? null, opacity: config.opacity ?? 1 })}`,
      value: cssBackground.value,
      cssConfig: cssBackground.cssConfig,
      opacity: toFiniteNumber(config.opacity, 1)
    };
  }

  if (!explicitShader) {
    return null;
  }

  const shader =
    normalizePaperShaderName(config.shader) ??
    (normalizedType === 'paper-shader' ? 'paper-texture' : normalizePaperShaderName(config.type)) ??
    'paper-texture';
  const preset =
    normalizePaperShaderPresetName(shader, config.preset) ??
    normalizePaperShaderPresetName(shader, config.variant);
  const rawParams = asObject<Record<string, unknown>>(config.params) ?? {};
  const normalizedParams = normalizePaperShaderParams(
    shader,
    resolveShaderAssets(rawParams, slug) as Record<string, unknown>,
    {
      colorStops: Array.isArray(config.colorStops) ? config.colorStops : undefined,
      intensity: config.intensity,
      grain: config.grain,
      contrast: config.contrast,
      speed: config.speed,
      variant: config.variant
    }
  );
  const params = resolvePaperShaderProps(shader, preset, normalizedParams);
  const filter = normalizeBackgroundFilterConfig(config.filter, params, theme);

  return {
    kind: 'paper-shader',
    key: `paper-shader:${shader}:${stableStringify({ preset: preset ?? null, params, opacity: config.opacity ?? 1, filter })}`,
    shader,
    preset,
    params,
    filter: filter ?? undefined,
    opacity: toFiniteNumber(config.opacity, 1)
  };
}

function buildDefaultBackgroundAppearance(slug: string, theme?: ThemeConfig): ResolvedBackgroundAppearance {
  return (
    resolveBackgroundAppearance(
      { type: 'css', colorStops: getThemeColorStops(theme) ?? undefined } satisfies BackgroundConfigObject,
      slug,
      theme
    ) ?? {
      kind: 'css' as const,
      key: 'css:default',
      ...buildCssBackgroundValue({}, theme),
      opacity: 1
    }
  );
}

function matchLegacyBackgroundSection(
  section: BackgroundSectionLike,
  presentation: PresentationConfig,
  currentStepIndex: number,
  currentClusterId: string | null
): boolean {
  const match = section.match;
  if (!match) {
    return false;
  }

  if (match.stepRange && presentation.mode === 'stage') {
    const [start, end] = match.stepRange;
    const stepNumber = currentStepIndex + 1;
    return stepNumber >= start && stepNumber <= end;
  }

  if (Array.isArray(match.clusterIds) && currentClusterId) {
    return match.clusterIds.includes(currentClusterId);
  }

  if (match.group && currentClusterId) {
    const cluster = presentation.clusters?.find((entry) => entry.id === currentClusterId);
    return cluster?.group === match.group;
  }

  return false;
}

function findBackgroundOverride(
  presentation: PresentationConfig,
  currentStepIndex: number,
  currentClusterId: string | null
): unknown {
  const background = asObject<PresentationBackgroundLike>(presentation.background);
  if (presentation.mode === 'stage') {
    const stageMatch = background?.stages?.find(
      (section) => currentStepIndex >= section.steps[0] && currentStepIndex <= section.steps[1]
    );
    if (stageMatch) {
      return stageMatch;
    }
  }

  if (presentation.mode === 'map') {
    const cluster = presentation.clusters?.find((entry) => entry.id === currentClusterId);
    const regionMatch = background?.regions?.find((section) => {
      if (Array.isArray(section.clusters) && currentClusterId) {
        return section.clusters.includes(currentClusterId);
      }

      return Boolean(section.group && cluster?.group === section.group);
    });
    if (regionMatch) {
      return regionMatch;
    }
  }

  const legacyMatch = presentation.backgroundSections?.find((section) =>
    matchLegacyBackgroundSection(section as BackgroundSectionLike, presentation, currentStepIndex, currentClusterId)
  );
  if (legacyMatch) {
    return (legacyMatch as BackgroundSectionLike).shader;
  }

  return null;
}

export function getBackgroundTransition(
  presentation: PresentationConfig,
  theme?: ThemeConfig
): ResolvedBackgroundTransition {
  const config = asObject<PresentationBackgroundLike>(presentation.background);
  return {
    duration: toFiniteNumber(config?.transition?.duration, getThemeSceneDuration(theme)),
    easing:
      typeof config?.transition?.easing === 'string' ? config.transition.easing : getThemeSceneEasing(theme)
  };
}

export function getThemeBackgroundTransition(theme?: ThemeConfig): ResolvedBackgroundTransition {
  return {
    duration: getThemeSceneDuration(theme),
    easing: getThemeSceneEasing(theme)
  };
}

export function resolveThemeBackgroundState(
  theme: ThemeConfig,
  slug = 'dashboard'
): ResolvedBackgroundState {
  return {
    appearance:
      resolveBackgroundAppearance(theme.background, slug, theme) ??
      buildDefaultBackgroundAppearance(slug, theme),
    transition: getThemeBackgroundTransition(theme)
  };
}

export function resolveBackgroundState(
  presentation: PresentationConfig,
  currentStepIndex: number,
  currentClusterId: string | null,
  theme?: ThemeConfig
): ResolvedBackgroundState {
  const step = presentation.steps?.[currentStepIndex];
  const cluster = presentation.clusters?.find((entry) => entry.id === currentClusterId);
  const override = findBackgroundOverride(presentation, currentStepIndex, currentClusterId);
  const defaultAppearance = buildDefaultBackgroundAppearance(presentation.meta.slug, theme);
  const themeAppearance = theme?.background
    ? resolveBackgroundAppearance(theme.background, presentation.meta.slug, theme)
    : null;
  const appearance =
    resolveBackgroundAppearance(override, presentation.meta.slug, theme) ??
    resolveBackgroundAppearance(step?.background, presentation.meta.slug, theme) ??
    resolveBackgroundAppearance(cluster?.background, presentation.meta.slug, theme) ??
    resolveBackgroundAppearance(presentation.background, presentation.meta.slug, theme) ??
    themeAppearance ??
    defaultAppearance;

  return {
    appearance,
    transition: getBackgroundTransition(presentation, theme)
  };
}
