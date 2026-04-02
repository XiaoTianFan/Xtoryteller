import {
  FALLBACK_THEME_SLUG,
  loadThemeRegistry,
  loadThemeWithFallback,
  resolveAvailableThemeSlug
} from '@/lib/engine/theme-registry';

describe('theme registry resolution', () => {
  it('falls back to xinimalist-paper when no theme candidates are available', async () => {
    await expect(resolveAvailableThemeSlug()).resolves.toBe(FALLBACK_THEME_SLUG);
  });

  it('uses a persisted global theme when it exists', async () => {
    await expect(resolveAvailableThemeSlug('xinimalist-dark')).resolves.toBe('xinimalist-dark');
  });

  it('lets an explicit presentation theme override the persisted global theme', async () => {
    await expect(resolveAvailableThemeSlug('xinimalist-paper', 'xinimalist-dark')).resolves.toBe('xinimalist-paper');
  });

  it('falls back from a missing presentation theme to the persisted global theme', async () => {
    await expect(resolveAvailableThemeSlug('does-not-exist', 'xinimalist-dark')).resolves.toBe('xinimalist-dark');
  });

  it('falls back to xinimalist-paper when all requested themes are missing', async () => {
    const resolved = await loadThemeWithFallback('missing-theme', 'another-missing-theme');
    expect(resolved.slug).toBe(FALLBACK_THEME_SLUG);
    expect(resolved.theme.name).toBe('Xinimalist Paper');
  });

  it('includes the frontend-slides preset theme families in the registry', async () => {
    const registry = await loadThemeRegistry();
    const slugs = registry.map((entry) => entry.slug);

    expect(slugs).toEqual(
      expect.arrayContaining([
        'bold-signal',
        'electric-studio',
        'creative-voltage',
        'dark-botanical',
        'notebook-tabs',
        'pastel-geometry',
        'split-pastel',
        'vintage-editorial',
        'neon-cyber',
        'terminal-green',
        'swiss-modern',
        'paper-and-ink'
      ])
    );
  });

  it('resolves theme-owned background preset refs when loading themes', async () => {
    const resolved = await loadThemeWithFallback('xinimalist-paper');

    expect(resolved.theme.background).toMatchObject({
      type: 'paper-shader',
      shader: 'paper-texture',
      preset: 'abstract'
    });
  });
});
