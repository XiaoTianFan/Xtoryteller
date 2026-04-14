import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { parseYamlFile } from '@/lib/engine/yaml';
import {
  BackgroundPresetSaveError,
  saveBackgroundPreset,
  updateBackgroundPresetBySlug
} from '@/lib/engine/background-preset-save';
import type { BackgroundPresetConfig } from '@/lib/types/background-preset';

async function createTempHarness() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-background-preset-'));
  const backgroundsDir = path.join(root, 'backgrounds');
  const registriesDir = path.join(root, 'registries');
  const skillManifestPath = path.join(root, 'skill-manifest.json');

  await fs.mkdir(backgroundsDir, { recursive: true });
  await fs.mkdir(registriesDir, { recursive: true });
  await fs.writeFile(
    skillManifestPath,
    JSON.stringify(
      {
        lastRegistryCounts: {
          backgrounds: 0
        }
      },
      null,
      2
    )
  );

  return {
    root,
    backgroundsDir,
    registriesDir,
    skillManifestPath
  };
}

describe('background preset save helper', () => {
  it('writes a reusable YAML preset and refreshes the background registry artifact', async () => {
    const harness = await createTempHarness();

    const preset = await saveBackgroundPreset(
      {
        name: 'Dashboard Signal',
        description: 'A saved dashboard preset',
        tags: ['dashboard', 'signal'],
        shader: 'warp',
        preset: 'default',
        params: {
          speed: 0.35,
          colors: ['#111111', '#eeeeee']
        }
      },
      harness
    );

    expect(preset.slug).toBe('dashboard-signal');

    const yamlPath = path.join(harness.backgroundsDir, 'dashboard-signal.yaml');
    await expect(fs.access(yamlPath)).resolves.toBeUndefined();
    await expect(parseYamlFile<BackgroundPresetConfig>(yamlPath)).resolves.toMatchObject({
      name: 'Dashboard Signal',
      shader: 'warp',
      preset: 'default',
      params: {
        speed: 0.35,
        colors: ['#111111', '#eeeeee']
      }
    });

    const registry = JSON.parse(await fs.readFile(path.join(harness.registriesDir, 'background-registry.json'), 'utf8')) as {
      count: number;
      backgrounds: Array<{ slug: string }>;
    };
    expect(registry.count).toBe(1);
    expect(registry.backgrounds[0]?.slug).toBe('dashboard-signal');

    const manifest = JSON.parse(await fs.readFile(harness.skillManifestPath, 'utf8')) as {
      lastRegistryCounts?: { backgrounds?: number };
    };
    expect(manifest.lastRegistryCounts?.backgrounds).toBe(1);
  });

  it('rejects duplicate preset slugs', async () => {
    const harness = await createTempHarness();

    await saveBackgroundPreset(
      {
        name: 'Duplicate Name',
        shader: 'paper-texture',
        preset: 'abstract',
        params: {
          scale: 0.75
        }
      },
      harness
    );

    await expect(
      saveBackgroundPreset(
        {
          name: 'Duplicate Name',
          shader: 'paper-texture',
          preset: 'abstract',
          params: {
            scale: 0.8
          }
        },
        harness
      )
    ).rejects.toMatchObject<BackgroundPresetSaveError>({
      status: 409
    });
  });

  it('rejects unsupported shader params', async () => {
    const harness = await createTempHarness();

    await expect(
      saveBackgroundPreset(
        {
          name: 'Broken Preset',
          shader: 'waves',
          params: {
            unsupported: true
          }
        },
        harness
      )
    ).rejects.toMatchObject<BackgroundPresetSaveError>({
      status: 400
    });
  });

  it('updates an existing preset in place while preserving its slug', async () => {
    const harness = await createTempHarness();

    await saveBackgroundPreset(
      {
        name: 'Dashboard Signal',
        shader: 'warp',
        preset: 'default',
        params: {
          speed: 0.35
        }
      },
      harness
    );

    const updated = await updateBackgroundPresetBySlug(
      'dashboard-signal',
      {
        name: 'Dashboard Signal Refined',
        shader: 'warp',
        preset: 'default',
        params: {
          speed: 0.5
        }
      },
      harness
    );

    expect(updated.slug).toBe('dashboard-signal');
    expect(updated.name).toBe('Dashboard Signal Refined');

    await expect(
      parseYamlFile<BackgroundPresetConfig>(path.join(harness.backgroundsDir, 'dashboard-signal.yaml'))
    ).resolves.toMatchObject({
      name: 'Dashboard Signal Refined',
      params: {
        speed: 0.5
      }
    });
  });
});
