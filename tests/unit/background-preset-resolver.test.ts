import { resolveBackgroundShaderConfigPresetRefs } from '@/lib/engine/background-preset-resolver';
import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';

describe('background preset resolver helpers', () => {
  it('leaves direct background configs unchanged', async () => {
    const presetMap = await loadBackgroundPresetMap();
    const input = {
      type: 'paper-shader' as const,
      shader: 'waves',
      preset: 'groovy',
      params: {
        amplitude: 0.25
      }
    };

    expect(resolveBackgroundShaderConfigPresetRefs(input, presetMap)).toEqual(input);
  });

  it('resolves a single presetRef-backed background config', async () => {
    const presetMap = await loadBackgroundPresetMap();

    expect(
      resolveBackgroundShaderConfigPresetRefs(
        {
          type: 'paper-shader',
          presetRef: 'editorial-paper'
        },
        presetMap
      )
    ).toMatchObject({
      type: 'paper-shader',
      shader: 'paper-texture',
      preset: 'abstract'
    });
  });
});
