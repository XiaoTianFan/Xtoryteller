import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolvePresentationBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { resolveBackgroundState } from '@/lib/runtime/background-config';
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
