import type { Transition } from 'framer-motion';

import blur from '@/transitions/blur';
import fade from '@/transitions/fade';
import none from '@/transitions/none';
import scale from '@/transitions/scale';
import scaleOut from '@/transitions/scale-out';
import slideDown from '@/transitions/slide-down';
import slideLeft from '@/transitions/slide-left';
import slideRight from '@/transitions/slide-right';
import slideUp from '@/transitions/slide-up';
import wipeLeft from '@/transitions/wipe-left';
import { MapNavigationConfig } from '@/lib/types/presentation';
import { ThemeConfig } from '@/lib/types/theme';

export interface RuntimeTransitionPreset {
  enter: Record<string, string | number>;
  center: Record<string, string | number>;
  exit: Record<string, string | number>;
}

export type MotionEase =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | [number, number, number, number]
  | readonly [number, number, number, number];

export const runtimeTransitionMap = {
  blur,
  fade,
  none,
  scale,
  'scale-out': scaleOut,
  'slide-down': slideDown,
  'slide-left': slideLeft,
  'slide-right': slideRight,
  'slide-up': slideUp,
  'wipe-left': wipeLeft
} satisfies Record<string, RuntimeTransitionPreset>;

const DEFAULT_EASING = [0.22, 1, 0.36, 1] as const;
const REDUCED_TRANSITION: Transition = { duration: 0.01 };

function getNestedValue(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

export function resolveMotionDurationMs(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith('ms')) {
    const parsed = Number.parseFloat(normalized.slice(0, -2));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (normalized.endsWith('s')) {
    const parsed = Number.parseFloat(normalized.slice(0, -1));
    return Number.isFinite(parsed) ? parsed * 1000 : fallback;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveMotionNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function resolveMotionEasing(value?: unknown): MotionEase {
  if (Array.isArray(value) && value.length === 4) {
    return value.map((entry) => Number(entry)) as [number, number, number, number];
  }

  if (typeof value !== 'string') {
    return DEFAULT_EASING;
  }

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'linear':
      return 'linear';
    case 'ease-in':
    case 'easein':
      return 'easeIn';
    case 'ease-out':
    case 'easeout':
      return 'easeOut';
    case 'ease-in-out':
    case 'easeinout':
      return 'easeInOut';
    default: {
      const match = normalized.match(/^cubic-bezier\(([^)]+)\)$/);
      if (!match) {
        return DEFAULT_EASING;
      }

      const points = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      return points.length === 4 && points.every((point) => Number.isFinite(point))
        ? (points as [number, number, number, number])
        : DEFAULT_EASING;
    }
  }
}

function getThemeMotion(theme: ThemeConfig, path: string[], fallback: unknown) {
  const resolved = getNestedValue(theme.motion, path);
  return resolved ?? fallback;
}

export function getRuntimeTransition(name?: string): RuntimeTransitionPreset {
  const key = (name ?? 'fade') as keyof typeof runtimeTransitionMap;
  return runtimeTransitionMap[key] ?? fade;
}

export function getStageSceneMotion(
  presetOrName: RuntimeTransitionPreset | string | undefined,
  theme: ThemeConfig,
  prefersReducedMotion: boolean
) {
  if (prefersReducedMotion) {
    return {
      initial: false as const,
      animate: none.center,
      exit: none.exit,
      transition: REDUCED_TRANSITION
    };
  }

  const resolvedPreset = typeof presetOrName === 'string' ? getRuntimeTransition(presetOrName) : presetOrName ?? fade;
  const duration = resolveMotionDurationMs(getThemeMotion(theme, ['scene', 'duration'], getThemeMotion(theme, ['normal'], 350)), 350) / 1000;
  const ease = resolveMotionEasing(getThemeMotion(theme, ['scene', 'easing'], getThemeMotion(theme, ['easing'], DEFAULT_EASING)));

  return {
    initial: resolvedPreset.enter,
    animate: resolvedPreset.center,
    exit: resolvedPreset.exit,
    transition: { duration, ease }
  };
}

export function getMapCameraMotion(
  config: MapNavigationConfig['transition'] | undefined,
  theme: ThemeConfig,
  prefersReducedMotion: boolean
): Transition {
  if (prefersReducedMotion || config?.type === 'none') {
    return REDUCED_TRANSITION;
  }

  const duration = typeof config?.duration === 'number'
    ? config.duration / 1000
    : resolveMotionDurationMs(getThemeMotion(theme, ['scene', 'duration'], getThemeMotion(theme, ['slow'], 700)), 700) / 1000;

  return {
    duration,
    ease: resolveMotionEasing(config?.easing ?? getThemeMotion(theme, ['scene', 'easing'], getThemeMotion(theme, ['easing'], DEFAULT_EASING)))
  };
}

export function getLayoutRevealMotion(theme: ThemeConfig, prefersReducedMotion: boolean, index: number, compact?: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: REDUCED_TRANSITION
    };
  }

  const duration = resolveMotionDurationMs(getThemeMotion(theme, ['reveal', 'duration'], getThemeMotion(theme, ['normal'], 360)), 360) / 1000;
  const delayStep = resolveMotionDurationMs(getThemeMotion(theme, ['reveal', 'delay-step'], 90), 90) / 1000;
  const offsetY = resolveMotionNumber(getThemeMotion(theme, ['reveal', 'offset-y'], compact ? 10 : 20), compact ? 10 : 20);
  const initialOpacity = resolveMotionNumber(getThemeMotion(theme, ['reveal', 'initial-opacity'], 0), 0);
  const ease = resolveMotionEasing(getThemeMotion(theme, ['reveal', 'easing'], getThemeMotion(theme, ['easing'], DEFAULT_EASING)));

  return {
    initial: { opacity: initialOpacity, y: offsetY, scale: 1 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration, delay: index * delayStep, ease }
  };
}

