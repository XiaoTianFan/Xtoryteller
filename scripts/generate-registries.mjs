import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';
import YAML from 'yaml';

import { XTORYTELLER_REGISTRIES_DIR } from './skill-paths.mjs';

const root = process.cwd();

async function parseYaml(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

async function scanManifests(baseDir) {
  const manifestPaths = await fg('*/manifest.yaml', {
    cwd: path.join(root, baseDir),
    absolute: true,
    onlyFiles: true,
  });

  const entries = await Promise.all(
    manifestPaths.map(async (manifestPath) => {
      const manifest = await parseYaml(manifestPath);
      return {
        ...manifest,
        name: manifest.name || path.basename(path.dirname(manifestPath)),
      };
    })
  );

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

async function scanThemes() {
  const themePaths = await fg('*.yaml', {
    cwd: path.join(root, 'themes'),
    absolute: true,
    onlyFiles: true,
  });

  const themes = await Promise.all(
    themePaths.map(async (themePath) => {
      const theme = await parseYaml(themePath);
      return {
        slug: path.basename(themePath, '.yaml'),
        name: theme.name,
        fonts: theme.fonts,
        background: theme.background,
      };
    })
  );

  return themes.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function scanBackgroundPresets() {
  const presetPaths = await fg('*.yaml', {
    cwd: path.join(root, 'backgrounds'),
    absolute: true,
    onlyFiles: true,
  });

  const presets = await Promise.all(
    presetPaths.map(async (presetPath) => {
      const preset = await parseYaml(presetPath);
      return {
        slug: path.basename(presetPath, '.yaml'),
        name: preset.name,
        description: preset.description,
        tags: preset.tags ?? [],
        shader: preset.shader,
        preset: preset.preset,
      };
    })
  );

  return presets.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function writeJson(fileName, data) {
  await fs.mkdir(XTORYTELLER_REGISTRIES_DIR, { recursive: true });
  await fs.writeFile(
    path.join(XTORYTELLER_REGISTRIES_DIR, fileName),
    JSON.stringify(data, null, 2)
  );
}

export async function generateRegistries() {
  const [components, layouts, transitions, themes, backgrounds] = await Promise.all([
    scanManifests('components'),
    scanManifests('layouts'),
    scanManifests('transitions'),
    scanThemes(),
    scanBackgroundPresets(),
  ]);

  await Promise.all([
    writeJson('component-registry.json', {
      count: components.length,
      components,
    }),
    writeJson('layout-registry.json', { count: layouts.length, layouts }),
    writeJson('transition-registry.json', {
      count: transitions.length,
      transitions,
    }),
    writeJson('theme-registry.json', { count: themes.length, themes }),
    writeJson('background-registry.json', { count: backgrounds.length, backgrounds }),
  ]);

  return {
    components: components.length,
    layouts: layouts.length,
    transitions: transitions.length,
    themes: themes.length,
    backgrounds: backgrounds.length,
  };
}

function isCliEntry() {
  return (
    Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  );
}

if (isCliEntry()) {
  const counts = await generateRegistries();
  console.log(
    `Generated ${counts.components} components, ${counts.layouts} layouts, ${counts.transitions} transitions, ${counts.themes} themes, and ${counts.backgrounds} backgrounds at ${new Date().toISOString()}.`
  );
}
