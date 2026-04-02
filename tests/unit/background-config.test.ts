import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolvePresentationBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { resolveBackgroundState } from '@/lib/runtime/background-config';
import type { BackgroundPresetConfig } from '@/lib/types/background-preset';
import type { PresentationConfig } from '@/lib/types/presentation';

function createStagePresentation(background?: PresentationConfig['background'], backgroundSections?: PresentationConfig['backgroundSections']): PresentationConfig {
  return {
    meta: {
      title: 'Background test',
      slug: 'background-test'
    },
    mode: 'stage',
    theme: 'default',
    background,
    backgroundSections,
    steps: [
      { layout: 'single-content', components: [{ type: 'headline', content: 'One' }] },
      { layout: 'single-content', components: [{ type: 'headline', content: 'Two' }] },
      { layout: 'single-content', components: [{ type: 'headline', content: 'Three' }] }
    ]
  };
}

async function withResolvedBackgroundPresets(presentation: PresentationConfig) {
  return resolvePresentationBackgroundPresetRefs(presentation, await loadBackgroundPresetMap());
}

describe('background config', () => {
  it('supports direct Paper shader names and shader asset params', () => {
    const presentation = createStagePresentation({
      type: 'paper-shader',
      shader: 'paper-texture',
      params: {
        image: 'assets/noise.png'
      }
    });

    const state = resolveBackgroundState(presentation, 0, null);
    expect(state.appearance.kind).toBe('paper-shader');
    expect(state.appearance.shader).toBe('paper-texture');
    expect(state.appearance.params).toMatchObject({
      image: '/presentations/background-test/assets/noise.png'
    });
  });

  it('supports css background strings and none shorthands', () => {
    const cssPresentation = createStagePresentation('linear-gradient(180deg, #fff, #eee)');
    expect(resolveBackgroundState(cssPresentation, 0, null).appearance).toMatchObject({
      kind: 'css',
      value: 'linear-gradient(180deg, #fff, #eee)'
    });

    const nonePresentation = createStagePresentation('none');
    expect(resolveBackgroundState(nonePresentation, 0, null).appearance.kind).toBe('none');
  });

  it('normalizes structured css gradients and curated paper shader mappings', () => {
    const presentation = createStagePresentation({
      type: 'paper-shader',
      shader: 'grain-gradient',
      preset: 'Wave',
      colorStops: ['#101820', '#3a506b', '#f4d35e'],
      intensity: 0.72,
      grain: 0.28,
      contrast: 0.66,
      speed: 1.1
    });

    const state = resolveBackgroundState(presentation, 0, null);
    expect(state.appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'grain-gradient',
      preset: 'wave'
    });
    expect(state.appearance.params).toMatchObject({
      colorBack: '#101820',
      colors: ['#3a506b', '#f4d35e'],
      intensity: 0.72,
      noise: 0.28,
      softness: 0.66,
      speed: 1.1
    });
  });

  it('matches legacy backgroundSections step ranges as 1-based values', () => {
    const presentation = createStagePresentation(
      { type: 'css', value: 'linear-gradient(180deg, #fff, #eee)' },
      [{ match: { stepRange: [2, 3] }, shader: 'water' }]
    );

    expect(resolveBackgroundState(presentation, 0, null).appearance.kind).toBe('css');
    expect(resolveBackgroundState(presentation, 1, null).appearance.shader).toBe('water');
  });

  it('matches APRD stage ranges as zero-based values', () => {
    const presentation = createStagePresentation({
      type: 'css',
      value: 'linear-gradient(180deg, #fff, #eee)',
      stages: [
        {
          steps: [1, 2],
          shader: 'waves',
          params: { speed: 2.5 }
        }
      ]
    });

    expect(resolveBackgroundState(presentation, 0, null).appearance.kind).toBe('css');
    expect(resolveBackgroundState(presentation, 1, null).appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'waves'
    });
  });

  it('matches APRD map regions by cluster group', () => {
    const presentation: PresentationConfig = {
      meta: {
        title: 'Map background',
        slug: 'map-background'
      },
      mode: 'map',
      theme: 'default',
      background: {
        type: 'css',
        value: 'linear-gradient(180deg, #fff, #eee)',
        regions: [
          {
            group: 'focus',
            shader: 'water',
            intensity: 0.7
          }
        ]
      },
      clusters: [
        {
          id: 'overview',
          group: 'overview',
          layout: 'single-content',
          components: [{ type: 'headline', content: 'Overview' }]
        },
        {
          id: 'detail',
          group: 'focus',
          layout: 'single-content',
          components: [{ type: 'headline', content: 'Detail' }]
        }
      ]
    };

    expect(resolveBackgroundState(presentation, 0, 'overview').appearance.kind).toBe('css');
    expect(resolveBackgroundState(presentation, 0, 'detail').appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'water'
    });
  });

  it('resolves top-level preset refs before background rendering', async () => {
    const presentation = await withResolvedBackgroundPresets(
      createStagePresentation({
        type: 'paper-shader',
        presetRef: 'editorial-paper',
        intensity: 0.6
      })
    );

    const state = resolveBackgroundState(presentation, 0, null);
    expect(state.appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'paper-texture',
      preset: 'abstract'
    });
    expect(state.appearance.params).toMatchObject({
      fiber: 0.6,
      roughness: 0.2
    });
  });

  it('applies preset-backed filters and lets inline filter fields override shallowly', () => {
    const presetMap = new Map<string, BackgroundPresetConfig>([
      [
        'filtered-paper',
        {
          name: 'Filtered Paper',
          shader: 'paper-texture',
          preset: 'default',
          filter: {
            mode: 'radial',
            opacity: 0.18,
            steepness: 0.7,
            radialSize: {
              width: 0.6,
              height: 0.42
            }
          }
        }
      ]
    ]);

    const presentation = resolvePresentationBackgroundPresetRefs(
      createStagePresentation({
        type: 'paper-shader',
        presetRef: 'filtered-paper',
        filter: {
          mode: 'radial',
          opacity: 0.3,
          steepness: 0.25,
          radialSize: {
            width: 0.72
          }
        }
      }),
      presetMap
    );

    const state = resolveBackgroundState(presentation, 0, null);

    expect(state.appearance.filter).toMatchObject({
      mode: 'radial',
      opacity: 0.3,
      steepness: 0.25,
      radialSize: {
        width: 0.72,
        height: 0.42
      }
    });
  });

  it('resolves paper-shader filter color from shader params and theme fallbacks', async () => {
    const theme = await loadThemeBySlug('split-pastel');

    const explicitColorState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'radial'
        }
      }),
      0,
      null,
      theme
    );
    expect(explicitColorState.appearance.filter).toMatchObject({
      color: '#112233'
    });

    const themeColorState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'warp',
        params: {
          colors: [],
          distortion: 0.1
        },
        filter: {
          mode: 'linear-horizontal'
        }
      }),
      0,
      null,
      theme
    );
    expect(themeColorState.appearance.filter).toMatchObject({
      color: '#f5ede7'
    });
  });

  it('preserves the current filter gradient strings when steepness is omitted', () => {
    const radialState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'radial',
          opacity: 0.2
        }
      }),
      0,
      null
    );
    expect(radialState.appearance.filter).toMatchObject({
      steepness: 0
    });
    expect(radialState.appearance.filter?.value).toBe(
      'radial-gradient(ellipse 70.0% 55.0% at center, transparent 0%, transparent 54%, rgba(17, 34, 51, 0.200) 100%)'
    );

    const linearState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'linear-horizontal',
          opacity: 0.2,
          linearProportion: 0.5
        }
      }),
      0,
      null
    );
    expect(linearState.appearance.filter).toMatchObject({
      steepness: 0
    });
    expect(linearState.appearance.filter?.value).toBe(
      'linear-gradient(90deg, rgba(17, 34, 51, 0.200) 0%, transparent 25.0%, transparent 75.0%, rgba(17, 34, 51, 0.200) 100%)'
    );
  });

  it('supports configurable radial filter steepness', () => {
    const state = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'radial',
          opacity: 0.2,
          steepness: 0.5,
          radialSize: {
            width: 0.72,
            height: 0.56
          }
        }
      }),
      0,
      null
    );

    expect(state.appearance.filter).toMatchObject({
      steepness: 0.5
    });
    expect(state.appearance.filter?.value).toBe(
      'radial-gradient(ellipse 72.0% 56.0% at center, transparent 0%, transparent 77.0%, rgba(17, 34, 51, 0.200) 100%)'
    );
  });

  it('builds horizontal and vertical linear filter gradients with the expected direction', () => {
    const horizontalState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        filter: {
          mode: 'linear-horizontal',
          linearProportion: 0.5
        }
      }),
      0,
      null
    );
    expect(horizontalState.appearance.filter?.value).toContain('linear-gradient(90deg');

    const verticalState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        filter: {
          mode: 'linear-vertical',
          linearProportion: 0.5
        }
      }),
      0,
      null
    );
    expect(verticalState.appearance.filter?.value).toContain('linear-gradient(180deg');
  });

  it('supports configurable linear filter steepness in forward and reverse modes', () => {
    const forwardState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'linear-horizontal',
          opacity: 0.2,
          linearProportion: 0.5,
          steepness: 0.5
        }
      }),
      0,
      null
    );
    expect(forwardState.appearance.filter).toMatchObject({
      steepness: 0.5
    });
    expect(forwardState.appearance.filter?.value).toBe(
      'linear-gradient(90deg, rgba(17, 34, 51, 0.200) 0%, rgba(17, 34, 51, 0.200) 12.5%, transparent 25.0%, transparent 75.0%, rgba(17, 34, 51, 0.200) 87.5%, rgba(17, 34, 51, 0.200) 100%)'
    );

    const reverseState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        params: {
          colorBack: '#112233'
        },
        filter: {
          mode: 'linear-horizontal-reverse',
          opacity: 0.2,
          linearProportion: 0.5,
          steepness: 0.5
        }
      }),
      0,
      null
    );
    expect(reverseState.appearance.filter).toMatchObject({
      steepness: 0.5
    });
    expect(reverseState.appearance.filter?.value).toBe(
      'linear-gradient(90deg, transparent 0%, transparent 12.5%, rgba(17, 34, 51, 0.200) 25.0%, rgba(17, 34, 51, 0.200) 75.0%, transparent 87.5%, transparent 100%)'
    );
  });

  it('builds reverse filter gradients that cover the center instead of the edges', () => {
    const radialReverseState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        filter: {
          mode: 'radial-reverse'
        }
      }),
      0,
      null
    );
    expect(radialReverseState.appearance.filter?.value).toContain('rgba(');
    expect(radialReverseState.appearance.filter?.value).toContain('transparent 100%');

    const horizontalReverseState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        filter: {
          mode: 'linear-horizontal-reverse',
          linearProportion: 0.5
        }
      }),
      0,
      null
    );
    expect(horizontalReverseState.appearance.filter?.value).toContain('linear-gradient(90deg');
    expect(horizontalReverseState.appearance.filter?.value).toContain('transparent 0%');

    const verticalReverseState = resolveBackgroundState(
      createStagePresentation({
        type: 'paper-shader',
        shader: 'paper-texture',
        filter: {
          mode: 'linear-vertical-reverse',
          linearProportion: 0.5
        }
      }),
      0,
      null
    );
    expect(verticalReverseState.appearance.filter?.value).toContain('linear-gradient(180deg');
    expect(verticalReverseState.appearance.filter?.value).toContain('transparent 0%');
  });

  it('supports preset refs in stage overrides, step backgrounds, and legacy sections', async () => {
    const basePresentation = createStagePresentation(
      {
        type: 'css',
        value: 'linear-gradient(180deg, #fff, #eee)',
        stages: [
          {
            steps: [1, 1],
            presetRef: 'focus-grain'
          }
        ]
      },
      [
        {
          match: { stepRange: [3, 3] },
          shader: {
            type: 'paper-shader',
            presetRef: 'tidal-waves'
          }
        }
      ]
    );
    basePresentation.steps![0].background = {
      type: 'paper',
      presetRef: 'editorial-paper'
    };

    const presentation = await withResolvedBackgroundPresets(basePresentation);

    expect(resolveBackgroundState(presentation, 0, null).appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'paper-texture'
    });
    expect(resolveBackgroundState(presentation, 1, null).appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'grain-gradient'
    });
    expect(resolveBackgroundState(presentation, 2, null).appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'waves'
    });
  });

  it('supports preset refs in cluster backgrounds and map regions', async () => {
    const presentation = await withResolvedBackgroundPresets({
      meta: {
        title: 'Map preset background',
        slug: 'map-preset-background'
      },
      mode: 'map',
      theme: 'default',
      background: {
        type: 'paper-shader',
        presetRef: 'tidal-waves',
        regions: [
          {
            group: 'focus',
            presetRef: 'focus-grain',
            intensity: 0.7
          }
        ]
      },
      clusters: [
        {
          id: 'overview',
          group: 'overview',
          layout: 'single-content',
          components: [{ type: 'headline', content: 'Overview' }]
        },
        {
          id: 'detail',
          group: 'focus',
          layout: 'single-content',
          background: {
            type: 'paper-shader',
            presetRef: 'editorial-paper'
          },
          components: [{ type: 'headline', content: 'Detail' }]
        }
      ]
    });

    expect(resolveBackgroundState(presentation, 0, 'overview').appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'waves'
    });
    expect(resolveBackgroundState(presentation, 0, 'detail').appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'grain-gradient'
    });
  });

  it('falls back to the active theme background when the presentation does not define one', async () => {
    const paperTheme = await loadThemeBySlug('xinimalist-paper');
    const presentation = createStagePresentation();

    const state = resolveBackgroundState(presentation, 0, null, paperTheme);

    expect(state.appearance).toMatchObject({
      kind: 'paper-shader',
      shader: 'paper-texture',
      preset: 'abstract'
    });
  });
});
