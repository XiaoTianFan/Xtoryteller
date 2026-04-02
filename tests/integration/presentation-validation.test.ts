import path from 'node:path';

import { validatePresentation } from '@/scripts/validate.mjs';

describe('presentation validation integration', () => {
  it('validates the canonical human-ai demo presentations', async () => {
    for (const slug of ['human-ai-and-music-insight-brief', 'human-ai-and-music']) {
      const result = await validatePresentation(path.join(process.cwd(), 'presentations', slug, 'presentation.yaml'), {
        report: false,
        throwOnError: false
      });

      expect(result.valid).toBe(true);
      expect(['stage', 'map']).toContain(result.summary.mode);
      expect(result.summary.units).toBeGreaterThan(0);
    }
  });
});
