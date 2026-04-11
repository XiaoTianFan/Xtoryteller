import {
  buildMapPdfPage,
  buildStagePdfPages,
  collectPdfExportWarnings,
  getMapPdfTransform,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_REVEAL_ALL
} from '@/lib/runtime/pdf-export';
import type { PresentationConfig } from '@/lib/types/presentation';

describe('pdf export model', () => {
  it('builds one final-state Stage PDF page per step', () => {
    const presentation: PresentationConfig = {
      meta: { slug: 'pdf-stage', title: 'PDF Stage' },
      mode: 'stage',
      steps: [
        {
          id: 'one',
          layout: 'single-content',
          components: [
            { type: 'headline', content: 'Opening' },
            { type: 'bullet-list', build: 'sequential', props: { items: ['a', 'b', 'c'] } }
          ]
        },
        {
          id: 'two',
          layout: 'single-content',
          components: [{ type: 'body-text', content: 'Second step' }]
        }
      ]
    };

    const pages = buildStagePdfPages(presentation);

    expect(pages).toHaveLength(2);
    expect(pages.map((page) => page.step.id)).toEqual(['one', 'two']);
    expect(pages[0].items.map((item) => item.revealCount)).toEqual([PDF_REVEAL_ALL, 3]);
    expect(pages[1].items[0].revealCount).toBe(PDF_REVEAL_ALL);
  });

  it('computes a map overview transform that fits all clusters into the PDF page', () => {
    const transform = getMapPdfTransform([
      { id: 'left', x: -400, y: -200, width: 300, height: 180 },
      { id: 'right', x: 900, y: 520, width: 420, height: 240 }
    ]);

    const clusters = [
      { x: -400, y: -200, width: 300, height: 180 },
      { x: 900, y: 520, width: 420, height: 240 }
    ];

    for (const cluster of clusters) {
      const left = cluster.x * transform.scale + transform.x;
      const top = cluster.y * transform.scale + transform.y;
      const right = (cluster.x + cluster.width) * transform.scale + transform.x;
      const bottom = (cluster.y + cluster.height) * transform.scale + transform.y;

      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(PDF_PAGE_WIDTH);
      expect(bottom).toBeLessThanOrEqual(PDF_PAGE_HEIGHT);
    }
  });

  it('builds one Map PDF overview page with positioned clusters', () => {
    const presentation: PresentationConfig = {
      meta: { slug: 'pdf-map', title: 'PDF Map' },
      mode: 'map',
      clusters: [
        {
          id: 'alpha',
          layout: 'single-content',
          anchor: { x: 0, y: 0 },
          components: [{ type: 'headline', content: 'Alpha' }]
        },
        {
          id: 'beta',
          layout: 'single-content',
          anchor: { relativeTo: 'alpha', direction: 'right', distance: 240 },
          components: [{ type: 'headline', content: 'Beta' }]
        }
      ]
    };

    const page = buildMapPdfPage(presentation);

    expect(page.pageIndex).toBe(0);
    expect(page.clusters.map((cluster) => cluster.id)).toEqual(['alpha', 'beta']);
    expect(page.transform.scale).toBeGreaterThan(0);
  });

  it('collects warnings for decorative shader backgrounds and static media fallbacks', () => {
    const presentation: PresentationConfig = {
      meta: { slug: 'warnings', title: 'Warnings' },
      mode: 'stage',
      background: { type: 'paper-shader', shader: 'mesh-gradient' },
      steps: [
        {
          layout: 'single-content',
          components: [
            { type: 'video', props: { src: 'assets/demo.mp4' } },
            { type: 'iframe-embed', props: { src: 'https://example.com' } },
            { type: 'custom-canvas', content: 'draw' }
          ]
        }
      ]
    };

    expect(collectPdfExportWarnings(presentation).map((warning) => warning.code)).toEqual([
      'paper-background',
      'media-fallback',
      'media-fallback',
      'canvas-like-component'
    ]);
  });
});
