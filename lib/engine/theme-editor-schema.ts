import schemaData from '@/lib/engine/theme-schema.json';
import type { ThemeConfig } from '@/lib/types/theme';

type ThemeSchemaData = {
  requiredColorKeys: string[];
  requiredTypographyPaths: string[];
  requiredSpacingPaths: string[];
  requiredSizingPaths: string[];
  requiredRadiiPaths: string[];
  requiredShadowPaths: string[];
  requiredBorderPaths: string[];
  requiredMotionPaths: string[];
};

export type ThemeEditorControlKind =
  | 'color'
  | 'text'
  | 'number'
  | 'boolean'
  | 'color-list'
  | 'text-list'
  | 'number-list'
  | 'json';

export interface ThemeEditablePathEntry {
  path: string;
  value: unknown;
  control: ThemeEditorControlKind;
  required: boolean;
}

const themeSchema = schemaData as ThemeSchemaData;

export const REQUIRED_COLOR_KEYS = themeSchema.requiredColorKeys;
export const REQUIRED_TYPOGRAPHY_PATHS = themeSchema.requiredTypographyPaths;
export const REQUIRED_SPACING_PATHS = themeSchema.requiredSpacingPaths;
export const REQUIRED_SIZING_PATHS = themeSchema.requiredSizingPaths;
export const REQUIRED_RADII_PATHS = themeSchema.requiredRadiiPaths;
export const REQUIRED_SHADOW_PATHS = themeSchema.requiredShadowPaths;
export const REQUIRED_BORDER_PATHS = themeSchema.requiredBorderPaths;
export const REQUIRED_MOTION_PATHS = themeSchema.requiredMotionPaths;

const STATIC_REQUIRED_PATHS = new Set<string>([
  'name',
  'fonts.heading.family',
  'fonts.body.family',
  'fonts.mono.family',
  ...REQUIRED_COLOR_KEYS.map((key) => `colors.${key}`),
  ...REQUIRED_TYPOGRAPHY_PATHS.map((path) => `typography.${path}`),
  ...REQUIRED_SPACING_PATHS.map((path) => `spacing.${path}`),
  ...REQUIRED_SIZING_PATHS.map((path) => `sizing.${path}`),
  ...REQUIRED_RADII_PATHS.map((path) => `radii.${path}`),
  ...REQUIRED_SHADOW_PATHS.map((path) => `shadows.${path}`),
  ...REQUIRED_BORDER_PATHS.map((path) => `borders.${path}`),
  ...REQUIRED_MOTION_PATHS.map((path) => `motion.${path}`)
]);

const COLOR_SEGMENT_PATTERN =
  /(color|background|foreground|surface|panel|border|primary|secondary|accent|success|warning|error|overlay|scrim|thumb|track|series|start|end|rgb)/i;
const HEX_COLOR_PATTERN = /^#([\da-f]{3}|[\da-f]{6})$/i;
const CSS_COLOR_PATTERN = /^rgba?\(/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneTheme<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function walkThemeValue(
  value: unknown,
  prefix: string,
  output: ThemeEditablePathEntry[],
  theme: ThemeConfig
) {
  if (!prefix) {
    return;
  }

  if (Array.isArray(value) || !isPlainObject(value)) {
    output.push({
      path: prefix,
      value,
      control: inferThemeEditorControl(prefix, value),
      required: isRequiredThemePath(prefix, theme)
    });
    return;
  }

  const entries = Object.entries(value);
  if (!entries.length) {
    output.push({
      path: prefix,
      value,
      control: 'json',
      required: isRequiredThemePath(prefix, theme)
    });
    return;
  }

  for (const [key, nestedValue] of entries) {
    walkThemeValue(nestedValue, `${prefix}.${key}`, output, theme);
  }
}

function pruneEmptyParents(root: Record<string, unknown>, segments: string[]) {
  for (let depth = segments.length - 1; depth > 0; depth -= 1) {
    const parentSegments = segments.slice(0, depth);
    const currentKey = segments[depth];
    const parent = getThemePathValue(root, parentSegments.join('.'));
    if (!isPlainObject(parent)) {
      break;
    }

    const currentValue = parent[currentKey];
    if (!isPlainObject(currentValue) || Object.keys(currentValue).length > 0) {
      continue;
    }

    delete parent[currentKey];
  }
}

export function getThemePathValue(theme: unknown, path: string): unknown {
  if (!path) {
    return theme;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isPlainObject(current) && !Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, theme);
}

export function hasThemePath(theme: unknown, path: string): boolean {
  if (!path) {
    return false;
  }

  const segments = path.split('.');
  let current: unknown = theme;

  for (const segment of segments) {
    if (!isPlainObject(current) && !Array.isArray(current)) {
      return false;
    }

    if (!(segment in (current as Record<string, unknown>))) {
      return false;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

export function setThemePathValue<T extends ThemeConfig>(
  theme: T,
  path: string,
  value: unknown
): T {
  const nextTheme = cloneTheme(theme) as Record<string, unknown>;
  const segments = path.split('.');
  let current = nextTheme;

  for (const segment of segments.slice(0, -1)) {
    const nested = current[segment];
    if (!isPlainObject(nested)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]!] = cloneTheme(value);
  return nextTheme as T;
}

export function deleteThemePathValue<T extends ThemeConfig>(theme: T, path: string): T {
  const nextTheme = cloneTheme(theme) as Record<string, unknown>;
  const segments = path.split('.');
  const parentPath = segments.slice(0, -1).join('.');
  const parent = (parentPath ? getThemePathValue(nextTheme, parentPath) : nextTheme) as
    | Record<string, unknown>
    | undefined;

  if (!parent || !isPlainObject(parent)) {
    return nextTheme as T;
  }

  delete parent[segments[segments.length - 1]!];
  pruneEmptyParents(nextTheme, segments);
  return nextTheme as T;
}

export function listThemeEditablePaths(theme: ThemeConfig): ThemeEditablePathEntry[] {
  const paths: ThemeEditablePathEntry[] = [];

  walkThemeValue(theme.name, 'name', paths, theme);
  walkThemeValue(theme.background, 'background', paths, theme);
  walkThemeValue(theme.fonts, 'fonts', paths, theme);
  walkThemeValue(theme.colors, 'colors', paths, theme);
  walkThemeValue(theme.typography, 'typography', paths, theme);
  walkThemeValue(theme.spacing, 'spacing', paths, theme);
  walkThemeValue(theme.sizing, 'sizing', paths, theme);
  walkThemeValue(theme.radii, 'radii', paths, theme);
  walkThemeValue(theme.shadows, 'shadows', paths, theme);
  walkThemeValue(theme.borders, 'borders', paths, theme);
  walkThemeValue(theme.motion, 'motion', paths, theme);

  return paths.sort((left, right) => left.path.localeCompare(right.path));
}

export function listThemeEditablePathStrings(theme: ThemeConfig) {
  return listThemeEditablePaths(theme).map((entry) => entry.path);
}

export function getConditionallyRequiredThemePaths(theme: ThemeConfig) {
  const required = new Set<string>(STATIC_REQUIRED_PATHS);

  for (const role of ['heading', 'body', 'mono'] as const) {
    const source = theme.fonts[role]?.source;
    if (source === 'google') {
      required.add(`fonts.${role}.weights`);
    }
    if (source === 'fontshare') {
      required.add(`fonts.${role}.cssUrl`);
    }
    if (source === 'local') {
      required.add(`fonts.${role}.files`);
    }
  }

  return required;
}

export function isRequiredThemePath(path: string, theme?: ThemeConfig) {
  if (STATIC_REQUIRED_PATHS.has(path)) {
    return true;
  }

  return theme ? getConditionallyRequiredThemePaths(theme).has(path) : false;
}

export function isLikelyColorValue(path: string, value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  return (
    path.startsWith('colors.') ||
    COLOR_SEGMENT_PATTERN.test(path) ||
    HEX_COLOR_PATTERN.test(value.trim()) ||
    CSS_COLOR_PATTERN.test(value.trim())
  );
}

export function inferThemeEditorControl(path: string, value: unknown): ThemeEditorControlKind {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === 'string') && value.every((entry) => isLikelyColorValue(path, entry))) {
      return 'color-list';
    }

    if (value.every((entry) => typeof entry === 'string')) {
      return 'text-list';
    }

    if (value.every((entry) => typeof entry === 'number')) {
      return 'number-list';
    }

    return 'json';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'string') {
    return isLikelyColorValue(path, value) ? 'color' : 'text';
  }

  return 'json';
}

export function formatThemePathLabel(path: string) {
  return path
    .split('.')
    .map((segment) =>
      segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    )
    .join(' / ');
}
