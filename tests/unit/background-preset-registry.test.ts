import {
  backgroundPresetExists,
  loadBackgroundPresetMap,
  loadBackgroundPresetRegistry
} from '@/lib/engine/background-preset-registry';

describe('background preset registry', () => {
  it('loads the shared background preset registry', async () => {
    const registry = await loadBackgroundPresetRegistry();

    expect(registry.some((entry) => entry.slug === 'editorial-paper')).toBe(true);
    expect(registry.some((entry) => entry.slug === 'tidal-waves')).toBe(true);
  });

  it('loads preset definitions by slug and reports existence', async () => {
    const presetMap = await loadBackgroundPresetMap();

    expect(presetMap.get('focus-grain')).toMatchObject({
      shader: 'grain-gradient',
      preset: 'wave'
    });
    await expect(backgroundPresetExists('editorial-paper')).resolves.toBe(true);
    await expect(backgroundPresetExists('missing-background-preset')).resolves.toBe(false);
  });
});
