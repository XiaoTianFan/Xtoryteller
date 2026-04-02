import { describe, expect, it } from 'vitest';

import { resolveFittingFontSize } from '@/components/three-horizons/font-fit';

describe('three-horizons font fit', () => {
  it('returns the largest fitting size within the provided range', () => {
    const result = resolveFittingFontSize({
      min: 10,
      max: 18,
      precision: 0.1,
      fits: (size) => size <= 14.4
    });

    expect(result).toBeGreaterThanOrEqual(14.25);
    expect(result).toBeLessThanOrEqual(14.4);
  });

  it('falls back to the minimum size when nothing fits', () => {
    const result = resolveFittingFontSize({
      min: 9.5,
      max: 16,
      fits: () => false
    });

    expect(result).toBe(9.5);
  });
});
