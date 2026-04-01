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
});
