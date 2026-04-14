import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import YAML from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BackgroundPresetConfig } from '@/lib/types/background-preset';

async function createPresetHarness() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-background-route-'));
  const backgroundsDir = path.join(root, 'backgrounds');
  const registriesDir = path.join(root, 'registries');
  const skillManifestPath = path.join(root, 'skill-manifest.json');

  await fs.mkdir(backgroundsDir, { recursive: true });
  await fs.mkdir(registriesDir, { recursive: true });
  await fs.writeFile(
    path.join(backgroundsDir, 'grain-demo.yaml'),
    `name: Grain Demo
shader: grain-gradient
preset: wave
params:
  speed: 0.08
`,
    'utf8'
  );
  await fs.writeFile(skillManifestPath, JSON.stringify({ lastRegistryCounts: { backgrounds: 1 } }, null, 2));

  return {
    root,
    backgroundsDir,
    registriesDir,
    skillManifestPath
  };
}

describe('background preset route', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('updates an existing preset by slug', async () => {
    const harness = await createPresetHarness();

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        BACKGROUNDS_DIR: harness.backgroundsDir,
        PROJECT_ROOT: harness.root
      };
    });

    const { POST } = await import('@/app/api/background-presets/[slug]/route');
    const response = await POST(
      new Request('http://localhost/api/background-presets/grain-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Grain Demo Refined',
          shader: 'grain-gradient',
          preset: 'wave',
          params: {
            speed: 0.12
          }
        })
      }),
      { params: Promise.resolve({ slug: 'grain-demo' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      preset: {
        slug: 'grain-demo',
        name: 'Grain Demo Refined'
      }
    });

    const persisted = YAML.parse(
      await fs.readFile(path.join(harness.backgroundsDir, 'grain-demo.yaml'), 'utf8')
    ) as BackgroundPresetConfig;
    expect(persisted.name).toBe('Grain Demo Refined');
    expect(persisted.params?.speed).toBe(0.12);
  });
});
