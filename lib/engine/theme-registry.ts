import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';

import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolveThemeBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { THEMES_DIR } from '@/lib/engine/constants';
import { parseYamlFile } from '@/lib/engine/yaml';
import type { ThemeConfig } from '@/lib/types/theme';

export const FALLBACK_THEME_SLUG = 'xinimalist-paper';
export const GLOBAL_THEME_COOKIE_NAME = 'xtoryteller-active-theme';

export interface ThemeRegistryEntry {
  slug: string;
  name: string;
  fonts: ThemeConfig['fonts'];
  background?: ThemeConfig['background'];
}

export async function loadThemeRegistry() {
  const presetMap = await loadBackgroundPresetMap();
  const themePaths = await fg('*.yaml', {
    cwd: THEMES_DIR,
    absolute: true,
    onlyFiles: true
  });

  const themes = await Promise.all(
    themePaths.map(async (themePath) => {
      const theme = resolveThemeBackgroundPresetRefs(
        await parseYamlFile<ThemeConfig>(themePath),
        presetMap
      );
      return {
        slug: path.basename(themePath, '.yaml'),
        name: theme.name,
        fonts: theme.fonts,
        background: theme.background
      } satisfies ThemeRegistryEntry;
    })
  );

  return themes.sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function loadThemeBySlug(slug: string): Promise<ThemeConfig> {
  const [theme, presetMap] = await Promise.all([loadThemeSourceBySlug(slug), loadBackgroundPresetMap()]);

  return resolveThemeBackgroundPresetRefs(theme, presetMap);
}

export async function loadThemeSourceBySlug(slug: string): Promise<ThemeConfig> {
  return parseYamlFile<ThemeConfig>(path.join(THEMES_DIR, `${slug}.yaml`));
}

export async function themeExists(slug: string | null | undefined) {
  if (!slug) {
    return false;
  }

  try {
    await fs.access(path.join(THEMES_DIR, `${slug}.yaml`));
    return true;
  } catch {
    return false;
  }
}

export async function resolveAvailableThemeSlug(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (await themeExists(candidate)) {
      return candidate!;
    }
  }

  return FALLBACK_THEME_SLUG;
}

export async function loadThemeWithFallback(...candidates: Array<string | null | undefined>) {
  const slug = await resolveAvailableThemeSlug(...candidates);
  return {
    slug,
    theme: await loadThemeBySlug(slug)
  };
}
