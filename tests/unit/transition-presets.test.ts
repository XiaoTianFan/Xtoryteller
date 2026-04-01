import { DEFAULT_THEME } from '@/lib/engine/default-theme';
import { getMapCameraMotion, getRuntimeTransition, getStageSceneMotion } from '@/lib/runtime/transition-presets';

describe('transition presets', () => {
  it('falls back to fade for unknown stage transitions', () => {
    expect(getRuntimeTransition('does-not-exist').center).toEqual(getRuntimeTransition('fade').center);
  });

  it('returns named scene variants for stage transitions', () => {
    const motion = getStageSceneMotion('slide-left', DEFAULT_THEME, false);
    expect(motion.initial).toMatchObject({ opacity: 0, x: 40 });
    expect(motion.animate).toMatchObject({ opacity: 1, x: 0 });
  });

  it('honors reduced motion and map timing overrides', () => {
    expect(getMapCameraMotion({ duration: 1200, easing: 'linear' }, DEFAULT_THEME, false)).toMatchObject({ duration: 1.2, ease: 'linear' });
    expect(getMapCameraMotion({ type: 'none' }, DEFAULT_THEME, false)).toMatchObject({ duration: 0.01 });
    expect(getStageSceneMotion('slide-left', DEFAULT_THEME, true)).toMatchObject({ transition: { duration: 0.01 } });
  });
});
