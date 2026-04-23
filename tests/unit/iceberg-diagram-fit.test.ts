import { describe, expect, it } from 'vitest';

import { computeIcebergContainFit } from '@/components/iceberg-diagram';

describe('computeIcebergContainFit', () => {
  it('fits to width when width is the limiting dimension', () => {
    const fit = computeIcebergContainFit({
      containerWidth: 300,
      containerHeight: 500,
      visibleWidth: 200,
      visibleHeight: 100
    });

    expect(fit.left).toBe(0);
    expect(fit.top).toBe(0);
    expect(fit.scale).toBeCloseTo(1.5, 4);
    expect(fit.renderWidth).toBeCloseTo(300, 4);
    expect(fit.renderHeight).toBeCloseTo(150, 4);
  });

  it('fits to height when height is the limiting dimension', () => {
    const fit = computeIcebergContainFit({
      containerWidth: 900,
      containerHeight: 300,
      visibleWidth: 200,
      visibleHeight: 400
    });

    expect(fit.left).toBe(0);
    expect(fit.top).toBe(0);
    expect(fit.scale).toBeCloseTo(0.75, 4);
    expect(fit.renderWidth).toBeCloseTo(150, 4);
    expect(fit.renderHeight).toBeCloseTo(300, 4);
  });

  it('uses the hidden-label viewport width for compact cluster fitting', () => {
    const fit = computeIcebergContainFit({
      containerWidth: 420,
      containerHeight: 240,
      visibleWidth: 842,
      visibleHeight: 1206
    });

    expect(fit.left).toBe(0);
    expect(fit.top).toBe(0);
    expect(fit.scale).toBeCloseTo(240 / 1206, 4);
    expect(fit.renderWidth).toBeCloseTo(842 * (240 / 1206), 4);
    expect(fit.renderHeight).toBeCloseTo(240, 4);
  });
});
