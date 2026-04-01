import { beforeAll } from 'vitest';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { getMapCameraMotion, getRuntimeTransition, getStageSceneMotion } from '@/lib/runtime/transition-presets';

describe('transition presets', () => {
  let paperTheme: Awaited<ReturnType<typeof loadThemeBySlug>>;

  beforeAll(async () => {
    paperTheme = await loadThemeBySlug('xinimalist-paper');
  });

  it('falls back to fade for unknown stage transitions', () => {
    expect(getRuntimeTransition('does-not-exist').center).toEqual(getRuntimeTransition('fade').center);
  });

  it('returns named scene variants for stage transitions', () => {
    const motion = getStageSceneMotion('slide-left', paperTheme, false);
    expect(motion.initial).toMatchObject({ opacity: 0, x: 40 });
    expect(motion.animate).toMatchObject({ opacity: 1, x: 0 });
  });

  it('honors reduced motion and map timing overrides', () => {
    expect(getMapCameraMotion({ duration: 1200, easing: 'linear' }, paperTheme, false)).toMatchObject({ duration: 1.2, ease: 'linear' });
    expect(getMapCameraMotion({ type: 'none' }, paperTheme, false)).toMatchObject({ duration: 0.01 });
    expect(getStageSceneMotion('slide-left', paperTheme, true)).toMatchObject({ transition: { duration: 0.01 } });
  });
});
