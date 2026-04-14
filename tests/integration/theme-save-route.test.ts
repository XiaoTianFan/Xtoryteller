import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import YAML from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ThemeConfig } from '@/lib/types/theme';

async function createThemeHarness() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-theme-route-'));
  const themesDir = path.join(root, 'themes');
  const fixturePath = path.join(process.cwd(), 'themes', 'xinimalist-paper.yaml');
  const fixtureContents = await fs.readFile(fixturePath, 'utf8');

  await fs.mkdir(themesDir, { recursive: true });
  await fs.writeFile(path.join(themesDir, 'xinimalist-paper.yaml'), fixtureContents, 'utf8');

  return {
    root,
    themesDir
  };
}

describe('theme save route', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('persists valid theme edits through the route', async () => {
    const harness = await createThemeHarness();
    const fixturePath = path.join(harness.themesDir, 'xinimalist-paper.yaml');
    const theme = YAML.parse(await fs.readFile(fixturePath, 'utf8')) as ThemeConfig;

    theme.colors.secondary = '#654321';
    delete (theme.colors.chrome as Record<string, unknown>)['noise-strength'];

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        THEMES_DIR: harness.themesDir
      };
    });

    const { POST } = await import('@/app/api/themes/[slug]/route');
    const response = await POST(
      new Request('http://localhost/api/themes/xinimalist-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme })
      }),
      { params: Promise.resolve({ slug: 'xinimalist-paper' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      theme: {
        slug: 'xinimalist-paper',
        name: 'Xinimalist Paper'
      }
    });

    const persisted = YAML.parse(await fs.readFile(fixturePath, 'utf8')) as ThemeConfig;
    expect(persisted.colors.secondary).toBe('#654321');
    expect((persisted.colors.chrome as Record<string, unknown>)['noise-strength']).toBeUndefined();
  });

  it('returns 400 when the theme becomes invalid', async () => {
    const harness = await createThemeHarness();
    const fixturePath = path.join(harness.themesDir, 'xinimalist-paper.yaml');
    const theme = YAML.parse(await fs.readFile(fixturePath, 'utf8')) as ThemeConfig;

    delete theme.typography.h1;

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        THEMES_DIR: harness.themesDir
      };
    });

    const { POST } = await import('@/app/api/themes/[slug]/route');
    const response = await POST(
      new Request('http://localhost/api/themes/xinimalist-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme })
      }),
      { params: Promise.resolve({ slug: 'xinimalist-paper' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('typography is missing required key "h1"')
    });
  });
});
