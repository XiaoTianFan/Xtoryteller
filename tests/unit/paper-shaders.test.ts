import {
  normalizePaperShaderName,
  normalizePaperShaderParams,
  normalizePaperShaderPresetName,
  resolvePaperShaderProps
} from '@/lib/runtime/paper-shaders';

describe('paper shader support', () => {
  it('normalizes curated aliases and preset names', () => {
    expect(normalizePaperShaderName('mesh')).toBe('mesh-gradient');
    expect(normalizePaperShaderName('noise')).toBe('grain-gradient');
    expect(normalizePaperShaderPresetName('static-radial-gradient', 'Cross Section')).toBe('cross-section');
  });

  it('filters unsupported params and maps generic fields intentionally', () => {
    const params = normalizePaperShaderParams(
      'paper-texture',
      {
        image: 'assets/noise.png',
        roughness: 0.12,
        invalid: 123
      },
      {
        colorStops: ['#f8f5ef', '#d6a04d'],
        contrast: 0.44,
        grain: 0.27,
        intensity: 0.61,
        speed: 0.9
      }
    );

    expect(params).toMatchObject({
      image: 'assets/noise.png',
      colorBack: '#f8f5ef',
      colorFront: '#d6a04d',
      contrast: 0.44,
      roughness: 0.12,
      fiber: 0.61,
      speed: 0.9
    });
    expect(params).not.toHaveProperty('invalid');
  });

  it('merges supported presets with normalized params', () => {
    const props = resolvePaperShaderProps('mesh-gradient', 'beach', {
      grainOverlay: 0.42
    });

    expect(props).toMatchObject({
      grainOverlay: 0.42
    });
    expect(Array.isArray(props.colors)).toBe(true);
  });
});
