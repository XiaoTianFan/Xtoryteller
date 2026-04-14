import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import YAML from 'yaml';

import { ThemeSaveError, saveThemeBySlug } from '@/lib/engine/theme-save';
import type { ThemeConfig } from '@/lib/types/theme';

async function createThemeHarness() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-theme-save-'));
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

describe('theme save helper', () => {
  it('writes edited theme values and removes optional keys from YAML', async () => {
    const harness = await createThemeHarness();
    const theme = YAML.parse(
      await fs.readFile(path.join(harness.themesDir, 'xinimalist-paper.yaml'), 'utf8')
    ) as ThemeConfig;

    theme.colors.primary = '#123456';
    delete (theme.colors.chrome as Record<string, unknown>)['noise-opacity'];

    const savedTheme = await saveThemeBySlug(
      'xinimalist-paper',
      { theme },
      {
        themesDir: harness.themesDir,
        projectRoot: process.cwd()
      }
    );

    expect(savedTheme.slug).toBe('xinimalist-paper');
    expect(savedTheme.theme.colors.primary).toBe('#123456');

    const persisted = YAML.parse(
      await fs.readFile(path.join(harness.themesDir, 'xinimalist-paper.yaml'), 'utf8')
    ) as ThemeConfig;
    expect(persisted.colors.primary).toBe('#123456');
    expect((persisted.colors.chrome as Record<string, unknown>)['noise-opacity']).toBeUndefined();
  });

  it('rejects themes that remove required paths', async () => {
    const harness = await createThemeHarness();
    const theme = YAML.parse(
      await fs.readFile(path.join(harness.themesDir, 'xinimalist-paper.yaml'), 'utf8')
    ) as ThemeConfig;

    delete theme.colors.background;

    await expect(
      saveThemeBySlug(
        'xinimalist-paper',
        { theme },
        {
          themesDir: harness.themesDir,
          projectRoot: process.cwd()
        }
      )
    ).rejects.toMatchObject<ThemeSaveError>({
      status: 400
    });
  });
});
