import {
  getBackgroundTransitionMode,
  getInterpolatedBackgroundAppearance
} from '@/lib/runtime/ui/background-layer';
import type { ResolvedBackgroundAppearance } from '@/lib/runtime/background-config';

describe('background transitions', () => {
  it('cross-fades renderer changes and interpolates compatible paper shader states', () => {
    const cssAppearance: ResolvedBackgroundAppearance = {
      kind: 'css',
      key: 'css:start',
      opacity: 1,
      value: 'linear-gradient(180deg, #fff, #eee)',
      cssConfig: {
        type: 'linear',
        angle: '180deg',
        stops: ['#ffffff', '#eeeeee']
      }
    };
    const paperAppearance: ResolvedBackgroundAppearance = {
      kind: 'paper-shader',
      key: 'paper:one',
      opacity: 1,
      shader: 'grain-gradient',
      preset: 'wave',
      params: {
        colorBack: '#101820',
        colors: ['#3a506b', '#f4d35e'],
        intensity: 0.4,
        noise: 0.2,
        speed: 1
      }
    };
    const paperAppearanceNext: ResolvedBackgroundAppearance = {
      ...paperAppearance,
      key: 'paper:two',
      params: {
        colorBack: '#1b263b',
        colors: ['#415a77', '#e0e1dd'],
        intensity: 0.8,
        noise: 0.6,
        speed: 1.4
      }
    };

    expect(getBackgroundTransitionMode(cssAppearance, paperAppearance)).toBe('crossfade');
    expect(getBackgroundTransitionMode(paperAppearance, paperAppearanceNext)).toBe('interpolate');
  });

  it('interpolates supported numeric and color paper shader props', () => {
    const from: ResolvedBackgroundAppearance = {
      kind: 'paper-shader',
      key: 'from',
      opacity: 0.8,
      shader: 'grain-gradient',
      preset: 'wave',
      params: {
        colorBack: '#000000',
        colors: ['#111111', '#333333'],
        intensity: 0.2,
        noise: 0.1
      }
    };
    const to: ResolvedBackgroundAppearance = {
      ...from,
      key: 'to',
      opacity: 1,
      params: {
        colorBack: '#ffffff',
        colors: ['#999999', '#cccccc'],
        intensity: 0.8,
        noise: 0.5
      }
    };

    const result = getInterpolatedBackgroundAppearance(from, to, 0.5);
    expect(result.opacity).toBeCloseTo(0.9);
    expect(result.params?.intensity).toBeCloseTo(0.5);
    expect(result.params?.noise).toBeCloseTo(0.3);
    expect((result.params?.colorBack as string).startsWith('rgba(')).toBe(true);
    expect(Array.isArray(result.params?.colors)).toBe(true);
  });
});
