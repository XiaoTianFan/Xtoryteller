import { collectAssetReferences, collectDependencyNames, parseArgs } from '@/scripts/portability-utils.mjs';

describe('portability helpers', () => {
  it('collects dependency names from stage and map presentations', () => {
    const dependencies = collectDependencyNames({
      mode: 'stage',
      steps: [
        {
          layout: 'single-content',
          transition: 'fade',
          components: [{ type: 'headline', enter: 'slide-left' }, { type: 'bullet-list', exit: 'scale' }]
        }
      ]
    });

    expect(dependencies).toEqual({
      components: ['bullet-list', 'headline'],
      layouts: ['single-content'],
      transitions: ['fade', 'scale', 'slide-left']
    });
  });

  it('collects local asset references from component props and backgrounds', () => {
    expect(
      collectAssetReferences({
        meta: { slug: 'human-ai-and-music-insight-brief', thumbnail: './assets/thumb.svg' },
        mode: 'stage',
        background: {
          type: 'paper-shader',
          shader: 'paper-texture',
          params: {
            image: 'assets/background.webp'
          }
        },
        steps: [
          {
            layout: 'single-content',
            background: 'assets/scene-overlay.svg',
            components: [
              {
                type: 'image',
                props: {
                  src: 'assets/hero.svg',
                  poster: 'assets/poster.webp',
                  nested: {
                    href: 'assets/nested.svg'
                  }
                }
              }
            ]
          }
        ]
      })
    ).toEqual([
      'assets/background.webp',
      'assets/hero.svg',
      'assets/nested.svg',
      'assets/poster.webp',
      'assets/scene-overlay.svg',
      'assets/thumb.svg'
    ]);
  });

  it('parses command-line arguments into positional and named options', () => {
    expect(parseArgs(['--confirm', '--output=exports', 'human-ai-and-music-insight-brief'])).toEqual({
      options: { confirm: true, output: 'exports' },
      positional: ['human-ai-and-music-insight-brief']
    });
  });
});
