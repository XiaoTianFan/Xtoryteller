import { resolveTheme } from '@/lib/engine/theme-resolver';
import { FontRoleConfig, ThemeConfig } from '@/lib/types/theme';

export interface ResolvedThemeAssets {
  theme: ThemeConfig;
  cssVariables: Record<string, string>;
  fontFaceCss: string;
  stylesheetUrls: string[];
  preconnectOrigins: string[];
}

function uniqueSorted(values: Array<string | number | undefined | null>) {
  return Array.from(new Set(values.filter((value): value is string | number => value != null))).sort((left, right) =>
    String(left).localeCompare(String(right), undefined, { numeric: true })
  );
}

function normalizeCssPath(filePath: string) {
  if (!filePath) {
    return filePath;
  }

  return filePath.startsWith('/') ? filePath : `/${filePath.replace(/^\.\//, '')}`;
}

function cssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function inferFontFormat(filePath: string) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'woff2':
      return 'woff2';
    case 'woff':
      return 'woff';
    case 'ttf':
      return 'truetype';
    case 'otf':
      return 'opentype';
    default:
      return 'woff2';
  }
}

function buildLocalFontFaceCss(role: FontRoleConfig) {
  const files = role.files ?? [];

  return files
    .map((file) => {
      const style = file.style ?? 'normal';
      const src = normalizeCssPath(file.path);
      return [
        '@font-face {',
        `  font-family: "${cssString(role.family)}";`,
        `  src: url("${src}") format("${inferFontFormat(src)}");`,
        `  font-style: ${style};`,
        `  font-weight: ${file.weight};`,
        `  font-display: ${role.display ?? 'swap'};`,
        '}'
      ].join('\n');
    })
    .join('\n');
}

export function buildGoogleFontStylesheetUrl(role: FontRoleConfig) {
  const weights = uniqueSorted(role.weights?.length ? role.weights : [400]).map((weight) => Number(weight));
  const styleSet = new Set(role.styles?.length ? role.styles : ['normal']);
  const styles = ['normal', 'italic'].filter((style) => styleSet.has(style as 'normal' | 'italic'));
  const family = role.family.replace(/[\'"]/g, '').trim().replace(/\s+/g, '+');
  const display = role.display ?? 'swap';
  const values = styles.flatMap((style) => {
    const ital = style === 'italic' ? 1 : 0;
    return weights.map((weight) => `${ital},${weight}`);
  });

  return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${values.join(';')}&display=${display}`;
}

function originFor(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getRoleDedupKey(role: FontRoleConfig) {
  return role.family.replace(/[\'"]/g, '').trim().toLowerCase();
}

function collectFontAssetMetadata(
  role: FontRoleConfig,
  stylesheets: Set<string>,
  preconnects: Set<string>,
  localFontFaces: Map<string, string>
) {
  switch (role.source) {
    case 'local': {
      const fontFaceCss = buildLocalFontFaceCss(role);
      if (fontFaceCss) {
        localFontFaces.set(`${getRoleDedupKey(role)}::${fontFaceCss}`, fontFaceCss);
      }
      break;
    }
    case 'google': {
      const stylesheetUrl = buildGoogleFontStylesheetUrl(role);
      stylesheets.add(stylesheetUrl);
      preconnects.add('https://fonts.googleapis.com');
      preconnects.add('https://fonts.gstatic.com');
      break;
    }
    case 'fontshare': {
      if (role.cssUrl) {
        stylesheets.add(role.cssUrl);
        const origin = originFor(role.cssUrl);
        if (origin) {
          preconnects.add(origin);
        }
      }
      break;
    }
    default:
      break;
  }
}

export function resolveThemeAssets(theme: ThemeConfig, overrides?: unknown): ResolvedThemeAssets {
  const resolved = resolveTheme(theme, overrides);
  const stylesheets = new Set<string>();
  const preconnects = new Set<string>();
  const localFontFaces = new Map<string, string>();

  for (const role of [resolved.theme.fonts.heading, resolved.theme.fonts.body, resolved.theme.fonts.mono]) {
    collectFontAssetMetadata(role, stylesheets, preconnects, localFontFaces);
  }

  return {
    theme: resolved.theme,
    cssVariables: resolved.cssVariables,
    fontFaceCss: Array.from(localFontFaces.values()).filter(Boolean).join('\n'),
    stylesheetUrls: Array.from(stylesheets),
    preconnectOrigins: Array.from(preconnects)
  };
}
