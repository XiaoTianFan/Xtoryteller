/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';

import { paperShaderSupportsBuiltInMotion } from '@/lib/runtime/paper-shaders';
import { resolveAnimatedPaperShaderParams } from '@/lib/runtime/ui/background-layer';

describe('background layer paper shader motion', () => {
  it('lets Paper Shader built-in motion drive animated presets', () => {
    expect(paperShaderSupportsBuiltInMotion('paper-texture')).toBe(true);

    const params = resolveAnimatedPaperShaderParams(
      'paper-texture',
      {
        frame: 0,
        offsetX: 0.25,
        offsetY: -0.15,
        speed: 0
      },
      12,
      false
    );

    expect(params).toMatchObject({
      frame: 0,
      offsetX: 0.25,
      offsetY: -0.15,
      speed: 0.03
    });
  });

  it('falls back to wrapper drift only when the shader has no built-in motion channel', () => {
    expect(paperShaderSupportsBuiltInMotion('waves')).toBe(false);

    const params = resolveAnimatedPaperShaderParams(
      'waves',
      {
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      },
      12,
      false
    );

    expect(params).not.toHaveProperty('speed');
    expect(params).not.toHaveProperty('frame');
    expect(params.offsetX).not.toBe(0);
    expect(params.offsetY).not.toBe(0);
    expect(params.rotation).not.toBe(0);
  });

  it('respects reduced motion for both built-in and wrapper-driven shaders', () => {
    const paperTextureParams = { frame: 0, speed: 0 };
    const wavesParams = { offsetX: 0, offsetY: 0, rotation: 0 };

    expect(resolveAnimatedPaperShaderParams('paper-texture', paperTextureParams, 12, true)).toEqual(paperTextureParams);
    expect(resolveAnimatedPaperShaderParams('waves', wavesParams, 12, true)).toEqual(wavesParams);
  });
});
