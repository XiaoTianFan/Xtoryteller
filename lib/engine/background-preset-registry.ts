import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';

import { BACKGROUNDS_DIR } from '@/lib/engine/constants';
import { parseYamlFile } from '@/lib/engine/yaml';
import {
  BackgroundPresetConfig,
  BackgroundPresetDefinitionEntry,
  BackgroundPresetRegistryEntry
} from '@/lib/types/background-preset';

export async function loadBackgroundPresetRegistry(): Promise<BackgroundPresetRegistryEntry[]> {
  const presetPaths = await fg('*.yaml', {
    cwd: BACKGROUNDS_DIR,
    absolute: true,
    onlyFiles: true
  });

  const presets = await Promise.all(
    presetPaths.map(async (presetPath) => {
      const preset = await parseYamlFile<BackgroundPresetConfig>(presetPath);
      return {
        slug: path.basename(presetPath, '.yaml'),
        name: preset.name,
        description: preset.description,
        tags: preset.tags ?? [],
        shader: preset.shader,
        preset: preset.preset
      } satisfies BackgroundPresetRegistryEntry;
    })
  );

  return presets.sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function loadBackgroundPresetDefinitionRegistry(): Promise<BackgroundPresetDefinitionEntry[]> {
  const presetPaths = await fg('*.yaml', {
    cwd: BACKGROUNDS_DIR,
    absolute: true,
    onlyFiles: true
  });

  const presets = await Promise.all(
    presetPaths.map(async (presetPath) => {
      const preset = await parseYamlFile<BackgroundPresetConfig>(presetPath);
      return {
        slug: path.basename(presetPath, '.yaml'),
        name: preset.name,
        description: preset.description,
        tags: preset.tags ?? [],
        shader: preset.shader,
        preset: preset.preset,
        config: preset
      } satisfies BackgroundPresetDefinitionEntry;
    })
  );

  return presets.sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function loadBackgroundPresetMap(): Promise<Map<string, BackgroundPresetConfig>> {
  const presetPaths = await fg('*.yaml', {
    cwd: BACKGROUNDS_DIR,
    absolute: true,
    onlyFiles: true
  });

  const presets = await Promise.all(
    presetPaths.map(async (presetPath) => {
      const preset = await parseYamlFile<BackgroundPresetConfig>(presetPath);
      return [path.basename(presetPath, '.yaml'), preset] as const;
    })
  );

  return new Map(
    presets.sort(([left], [right]) => left.localeCompare(right))
  );
}

export async function backgroundPresetExists(slug: string | null | undefined) {
  if (!slug) {
    return false;
  }

  try {
    await fs.access(path.join(BACKGROUNDS_DIR, `${slug}.yaml`));
    return true;
  } catch {
    return false;
  }
}
