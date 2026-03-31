import fg from 'fast-glob';
import path from 'node:path';

import { THEMES_DIR } from '@/lib/engine/constants';
import { parseYamlFile } from '@/lib/engine/yaml';
import { ThemeConfig } from '@/lib/types/theme';

export async function loadThemeRegistry() {
  const themePaths = await fg('*.yaml', {
    cwd: THEMES_DIR,
    absolute: true,
    onlyFiles: true
  });

  const themes = await Promise.all(
    themePaths.map(async (themePath) => {
      const theme = await parseYamlFile<ThemeConfig>(themePath);
      return {
        slug: path.basename(themePath, '.yaml'),
        name: theme.name,
        fonts: theme.fonts
      };
    })
  );

  return themes.sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function loadThemeBySlug(slug: string): Promise<ThemeConfig> {
  return parseYamlFile<ThemeConfig>(path.join(THEMES_DIR, `${slug}.yaml`));
}
