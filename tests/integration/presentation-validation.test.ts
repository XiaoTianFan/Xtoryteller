import path from 'node:path';

import { validatePresentation } from '@/scripts/validate.mjs';

describe('presentation validation integration', () => {
  it('validates the canonical stage fixture', async () => {
    const result = await validatePresentation(path.join(process.cwd(), 'presentations', 'simple-stage', 'presentation.yaml'), {
      report: false,
      throwOnError: false
    });

    expect(result.valid).toBe(true);
    expect(result.summary.mode).toBe('stage');
    expect(result.summary.units).toBeGreaterThan(0);
  });

  it('validates the canonical map fixture', async () => {
    const result = await validatePresentation(path.join(process.cwd(), 'presentations', 'simple-map', 'presentation.yaml'), {
      report: false,
      throwOnError: false
    });

    expect(result.valid).toBe(true);
    expect(result.summary.mode).toBe('map');
    expect(result.summary.units).toBeGreaterThan(0);
  });

  it('validates the preset motif stage fixtures', async () => {
    for (const slug of ['preset-dark-hero', 'preset-editorial-rail', 'preset-tech-signal']) {
      const result = await validatePresentation(path.join(process.cwd(), 'presentations', slug, 'presentation.yaml'), {
        report: false,
        throwOnError: false
      });

      expect(result.valid).toBe(true);
      expect(result.summary.mode).toBe('stage');
      expect(result.summary.units).toBeGreaterThan(0);
    }
  });
});
