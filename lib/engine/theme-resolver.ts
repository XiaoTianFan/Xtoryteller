import { ThemeConfig, ResolvedTheme } from '@/lib/types/theme';

function flatten(
  prefix: string,
  value: unknown,
  output: Record<string, string>
): void {
  if (Array.isArray(value)) {
    output[prefix] = value.join(', ');
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      flatten(prefix ? `${prefix}-${key}` : key, nestedValue, output);
    }
    return;
  }

  if (value != null) {
    output[prefix] = String(value);
  }
}

function deepMerge<T>(base: T, overrides: unknown): T {
  if (!overrides || typeof overrides !== 'object') {
    return base;
  }

  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(
    overrides as Record<string, unknown>
  )) {
    const current = result[key];
    result[key] =
      current && typeof current === 'object' && !Array.isArray(current)
        ? deepMerge(current as Record<string, unknown>, value)
        : value;
  }

  return result as T;
}

export function resolveTheme(
  theme: ThemeConfig,
  overrides?: unknown
): ResolvedTheme {
  const merged = deepMerge(theme, overrides);
  const cssVariables: Record<string, string> = {};

  flatten('color', merged.colors, cssVariables);
  flatten('text', merged.typography, cssVariables);
  flatten('spacing', merged.spacing, cssVariables);
  flatten('size', merged.sizing, cssVariables);
  flatten('radius', merged.radii, cssVariables);
  flatten('shadow', merged.shadows, cssVariables);
  flatten('border', merged.borders, cssVariables);
  flatten('motion', merged.motion, cssVariables);

  cssVariables['font-heading'] = [
    merged.fonts.heading.family,
    ...(merged.fonts.heading.fallbacks ?? []),
  ].join(', ');
  cssVariables['font-body'] = [
    merged.fonts.body.family,
    ...(merged.fonts.body.fallbacks ?? []),
  ].join(', ');
  cssVariables['font-mono'] = [
    merged.fonts.mono.family,
    ...(merged.fonts.mono.fallbacks ?? []),
  ].join(', ');

  return {
    theme: merged,
    cssVariables: Object.fromEntries(
      Object.entries(cssVariables).map(([key, value]) => [`--${key}`, value])
    ),
  };
}

export function themeVariablesToCss(variables: Record<string, string>): string {
  const declarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}
