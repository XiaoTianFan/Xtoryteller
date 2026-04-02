'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

import {
  ResolvedBackgroundAppearance,
  ResolvedBackgroundTransition,
  ResolvedCssGradientConfig,
  buildCssBackgroundValue,
  resolveBackgroundState,
  resolveThemeBackgroundState
} from '@/lib/runtime/background-config';
import {
  getPaperShaderSupport,
  isPaperShaderParamInterpolable,
  normalizePaperShaderName,
  resolvePaperShaderDefinition
} from '@/lib/runtime/paper-shaders';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { resolveMotionEasing } from '@/lib/runtime/transition-presets';
import { ThemeConfig } from '@/lib/types/theme';

const surfaceStyle: CSSProperties = {
  position: 'absolute',
  inset: 0
};

type BackgroundRenderState =
  | { mode: 'stable'; appearance: ResolvedBackgroundAppearance }
  | {
      mode: 'crossfade' | 'interpolate';
      from: ResolvedBackgroundAppearance;
      to: ResolvedBackgroundAppearance;
      progress: number;
    };

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function valuesAreEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function parseCssColor(value: string): [number, number, number, number] | null {
  const trimmed = value.trim();
  const hex = trimmed.match(/^#([\da-f]{3,8})$/i);
  if (hex) {
    const normalized = hex[1].length <= 4
      ? hex[1]
          .split('')
          .map((part) => part + part)
          .join('')
      : hex[1];
    if (normalized.length === 6 || normalized.length === 8) {
      const red = Number.parseInt(normalized.slice(0, 2), 16);
      const green = Number.parseInt(normalized.slice(2, 4), 16);
      const blue = Number.parseInt(normalized.slice(4, 6), 16);
      const alpha = normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;
      return [red, green, blue, alpha];
    }
  }

  const rgb = trimmed.match(/^rgba?\((.+)\)$/i);
  if (!rgb) {
    return null;
  }

  const parts = rgb[1].split(',').map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const red = Number.parseFloat(parts[0]);
  const green = Number.parseFloat(parts[1]);
  const blue = Number.parseFloat(parts[2]);
  const alpha = parts[3] == null ? 1 : Number.parseFloat(parts[3]);
  return [red, green, blue, alpha].every((entry) => Number.isFinite(entry))
    ? [red, green, blue, alpha]
    : null;
}

function formatCssColor([red, green, blue, alpha]: [number, number, number, number]): string {
  const rounded = [red, green, blue].map((entry) => Math.round(entry));
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${rounded[0]}, ${rounded[1]}, ${rounded[2]}, ${normalizedAlpha.toFixed(3)})`;
}

function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function interpolateValue(from: unknown, to: unknown, progress: number): unknown {
  if (typeof from === 'number' && typeof to === 'number') {
    return interpolateNumber(from, to, progress);
  }

  if (typeof from === 'string' && typeof to === 'string') {
    const fromColor = parseCssColor(from);
    const toColor = parseCssColor(to);
    if (fromColor && toColor) {
      return formatCssColor([
        interpolateNumber(fromColor[0], toColor[0], progress),
        interpolateNumber(fromColor[1], toColor[1], progress),
        interpolateNumber(fromColor[2], toColor[2], progress),
        interpolateNumber(fromColor[3], toColor[3], progress)
      ]);
    }
  }

  if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
    const next = from.map((entry, index) => interpolateValue(entry, to[index], progress));
    return next.every((entry) => entry != null) ? next : null;
  }

  return null;
}

function canInterpolateCssAppearance(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance
): boolean {
  if (from.kind !== 'css' || to.kind !== 'css' || !from.cssConfig || !to.cssConfig) {
    return false;
  }

  if (
    from.cssConfig.type !== to.cssConfig.type ||
    from.cssConfig.angle !== to.cssConfig.angle ||
    from.cssConfig.position !== to.cssConfig.position ||
    from.cssConfig.stops.length !== to.cssConfig.stops.length
  ) {
    return false;
  }

  return from.cssConfig.stops.every((stop, index) => {
    const target = to.cssConfig?.stops[index];
    return Boolean(parseCssColor(stop) && target && parseCssColor(target));
  });
}

function canInterpolatePaperAppearance(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance
): boolean {
  if (
    from.kind !== 'paper-shader' ||
    to.kind !== 'paper-shader' ||
    !from.shader ||
    !to.shader ||
    from.shader !== to.shader ||
    from.preset !== to.preset
  ) {
    return false;
  }

  const normalizedShader = normalizePaperShaderName(from.shader);
  if (!normalizedShader) {
    return false;
  }

  const keys = new Set([
    ...Object.keys(from.params ?? {}),
    ...Object.keys(to.params ?? {})
  ]);

  for (const key of keys) {
    const left = from.params?.[key];
    const right = to.params?.[key];

    if (valuesAreEqual(left, right)) {
      continue;
    }

    if (!isPaperShaderParamInterpolable(normalizedShader, key)) {
      return false;
    }

    if (interpolateValue(left, right, 0.5) == null) {
      return false;
    }
  }

  return true;
}

function interpolateCssAppearance(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance,
  progress: number
): ResolvedBackgroundAppearance {
  const fromConfig = from.cssConfig!;
  const toConfig = to.cssConfig!;
  const cssConfig: ResolvedCssGradientConfig = {
    type: toConfig.type,
    angle: toConfig.angle,
    position: toConfig.position,
    stops: fromConfig.stops.map((stop, index) =>
      interpolateValue(stop, toConfig.stops[index], progress) as string
    )
  };
  const value = buildCssBackgroundValue({ gradient: cssConfig }, undefined).value;

  return {
    ...to,
    opacity: interpolateNumber(from.opacity, to.opacity, progress),
    value,
    cssConfig,
    key: `${to.key}:interp:${progress.toFixed(3)}`
  };
}

function interpolatePaperAppearance(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance,
  progress: number
): ResolvedBackgroundAppearance {
  const params: Record<string, unknown> = {};
  const keys = new Set([
    ...Object.keys(from.params ?? {}),
    ...Object.keys(to.params ?? {})
  ]);

  for (const key of keys) {
    const left = from.params?.[key];
    const right = to.params?.[key];
    params[key] = valuesAreEqual(left, right)
      ? right
      : interpolateValue(left, right, progress) ?? right;
  }

  return {
    ...to,
    opacity: interpolateNumber(from.opacity, to.opacity, progress),
    params,
    key: `${to.key}:interp:${progress.toFixed(3)}`
  };
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function resolveAnimatedPaperShaderParams(
  shader: string | undefined,
  params: Record<string, unknown> | undefined,
  elapsedSeconds: number,
  prefersReducedMotion: boolean
): Record<string, unknown> {
  if (!shader || prefersReducedMotion) {
    return params ?? {};
  }

  const normalizedShader = normalizePaperShaderName(shader);
  if (!normalizedShader) {
    return params ?? {};
  }

  const support = getPaperShaderSupport(normalizedShader);
  const allowedParams = new Set(support.allowedParams);
  const baseParams = params ?? {};
  const nextParams: Record<string, unknown> = { ...baseParams };
  const baseSpeed = toFiniteNumber(baseParams.speed, 0);
  const animationSpeed = Math.max(baseSpeed, 0.03);
  const drift = elapsedSeconds * (0.22 + animationSpeed * 0.4);
  const baseOffsetX = toFiniteNumber(baseParams.offsetX, 0);
  const baseOffsetY = toFiniteNumber(baseParams.offsetY, 0);

  if (allowedParams.has('speed') && baseSpeed <= 0) {
    nextParams.speed = animationSpeed;
  }

  if (allowedParams.has('frame')) {
    nextParams.frame = elapsedSeconds;
  }

  if (allowedParams.has('offsetX')) {
    nextParams.offsetX = baseOffsetX + Math.sin(drift * 0.8) * 0.018;
  }

  if (allowedParams.has('offsetY')) {
    nextParams.offsetY = baseOffsetY + Math.cos(drift * 0.65) * 0.014;
  }

  if (!allowedParams.has('frame') && allowedParams.has('rotation')) {
    nextParams.rotation = toFiniteNumber(baseParams.rotation, 0) + Math.sin(drift * 0.4) * 0.03;
  }

  return nextParams;
}

function useBackgroundAnimationClock(active: boolean, prefersReducedMotion: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      setElapsedSeconds(0);
      return;
    }

    let animationFrameId = 0;
    let startTime = 0;
    let lastCommitTime = 0;

    const step = (now: number) => {
      if (startTime === 0) {
        startTime = now;
      }

      if (now - lastCommitTime >= 1000 / 24) {
        setElapsedSeconds((now - startTime) / 1000);
        lastCommitTime = now;
      }

      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [active, prefersReducedMotion]);

  return elapsedSeconds;
}

function BackgroundSurface({
  kind,
  value,
  shader,
  params,
  elapsedSeconds,
  prefersReducedMotion
}: {
  kind: 'css' | 'none' | 'paper-shader';
  value?: string;
  shader?: string;
  params?: Record<string, unknown>;
  elapsedSeconds: number;
  prefersReducedMotion: boolean;
}) {
  if (kind === 'none') {
    return null;
  }

  if (kind === 'css') {
    return (
      <>
        <div className="backgroundSurface" style={{ ...surfaceStyle, background: value }} />
        <div className="backgroundNoise" />
        <div className="backgroundPattern" />
      </>
    );
  }

  const definition = resolvePaperShaderDefinition(shader);
  if (!definition || !shader) {
    return (
      <>
        <div className="backgroundSurface" style={{ ...surfaceStyle, background: value }} />
        <div className="backgroundNoise" />
        <div className="backgroundPattern" />
      </>
    );
  }

  const ShaderComponent = definition.component;
  const shaderProps = resolveAnimatedPaperShaderParams(
    shader,
    params,
    elapsedSeconds,
    prefersReducedMotion
  );
  const mergedStyle =
    shaderProps.style && typeof shaderProps.style === 'object'
      ? {
          ...(shaderProps.style as Record<string, unknown>),
          ...surfaceStyle,
          width: '100%',
          height: '100%',
          display: 'block'
        }
      : {
          ...surfaceStyle,
          width: '100%',
          height: '100%',
          display: 'block'
        };

  return (
    <>
      <div className="backgroundSurface backgroundSurfaceShader" style={surfaceStyle}>
        <ShaderComponent
          {...shaderProps}
          aria-hidden="true"
          className={
            typeof shaderProps.className === 'string'
              ? `paperShaderCanvas ${shaderProps.className}`
              : 'paperShaderCanvas'
          }
          width="100%"
          height="100%"
          style={mergedStyle}
        />
      </div>
      <div className="backgroundPattern" />
    </>
  );
}

function BackgroundAppearanceLayer({
  appearance,
  opacity,
  elapsedSeconds,
  prefersReducedMotion
}: {
  appearance: ResolvedBackgroundAppearance;
  opacity: number;
  elapsedSeconds: number;
  prefersReducedMotion: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="backgroundLayer"
      data-background-kind={appearance.kind}
      data-background-key={appearance.key}
      data-background-shader={appearance.shader ?? ''}
      data-background-preset={appearance.preset ?? ''}
      style={{ opacity }}
    >
      <BackgroundSurface
        kind={appearance.kind}
        value={appearance.value}
        shader={appearance.shader}
        params={appearance.params}
        elapsedSeconds={elapsedSeconds}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  );
}

export function getBackgroundTransitionMode(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance
): 'interpolate' | 'crossfade' {
  if (canInterpolatePaperAppearance(from, to) || canInterpolateCssAppearance(from, to)) {
    return 'interpolate';
  }

  return 'crossfade';
}

export function getInterpolatedBackgroundAppearance(
  from: ResolvedBackgroundAppearance,
  to: ResolvedBackgroundAppearance,
  progress: number
): ResolvedBackgroundAppearance {
  if (canInterpolatePaperAppearance(from, to)) {
    return interpolatePaperAppearance(from, to, progress);
  }

  if (canInterpolateCssAppearance(from, to)) {
    return interpolateCssAppearance(from, to, progress);
  }

  return to;
}

export function ResolvedBackgroundLayer({
  targetAppearance,
  transition
}: {
  targetAppearance: ResolvedBackgroundAppearance;
  transition: ResolvedBackgroundTransition;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [renderState, setRenderState] = useState<BackgroundRenderState>({
    mode: 'stable',
    appearance: targetAppearance
  });
  const activeAppearance = useMemo(
    () => (renderState.mode === 'stable' ? renderState.appearance : renderState.to),
    [renderState]
  );
  const activeAppearanceRef = useRef(activeAppearance);
  const isPaperShaderActive =
    renderState.mode === 'stable'
      ? renderState.appearance.kind === 'paper-shader'
      : renderState.from.kind === 'paper-shader' || renderState.to.kind === 'paper-shader';
  const elapsedSeconds = useBackgroundAnimationClock(isPaperShaderActive, Boolean(prefersReducedMotion));

  useEffect(() => {
    activeAppearanceRef.current = activeAppearance;
  }, [activeAppearance]);

  useEffect(() => {
    const previous = activeAppearanceRef.current;
    if (previous.key === targetAppearance.key) {
      return;
    }

    if (prefersReducedMotion) {
      activeAppearanceRef.current = targetAppearance;
      setRenderState({ mode: 'stable', appearance: targetAppearance });
      return;
    }

    const mode = getBackgroundTransitionMode(previous, targetAppearance);
    setRenderState({
      mode,
      from: previous,
      to: targetAppearance,
      progress: 0
    });

    const controls = animate(0, 1, {
      duration: transition.duration / 1000,
      ease: resolveMotionEasing(transition.easing),
      onUpdate: (progress) => {
        setRenderState((current) =>
          current.mode === mode &&
          current.from.key === previous.key &&
          current.to.key === targetAppearance.key
            ? { ...current, progress }
            : current
        );
      },
      onComplete: () => {
        activeAppearanceRef.current = targetAppearance;
        setRenderState({ mode: 'stable', appearance: targetAppearance });
      }
    });

    return () => {
      controls.stop();
    };
  }, [
    prefersReducedMotion,
    targetAppearance,
    transition.duration,
    transition.easing
  ]);

  if (renderState.mode === 'stable') {
    return (
      <BackgroundAppearanceLayer
        appearance={renderState.appearance}
        opacity={renderState.appearance.opacity}
        elapsedSeconds={elapsedSeconds}
        prefersReducedMotion={Boolean(prefersReducedMotion)}
      />
    );
  }

  if (renderState.mode === 'interpolate') {
    const interpolated = getInterpolatedBackgroundAppearance(
      renderState.from,
      renderState.to,
      renderState.progress
    );
    return (
      <BackgroundAppearanceLayer
        appearance={interpolated}
        opacity={interpolated.opacity}
        elapsedSeconds={elapsedSeconds}
        prefersReducedMotion={Boolean(prefersReducedMotion)}
      />
    );
  }

  return (
    <>
      <BackgroundAppearanceLayer
        appearance={renderState.from}
        opacity={(1 - renderState.progress) * renderState.from.opacity}
        elapsedSeconds={elapsedSeconds}
        prefersReducedMotion={Boolean(prefersReducedMotion)}
      />
      <BackgroundAppearanceLayer
        appearance={renderState.to}
        opacity={renderState.progress * renderState.to.opacity}
        elapsedSeconds={elapsedSeconds}
        prefersReducedMotion={Boolean(prefersReducedMotion)}
      />
    </>
  );
}

export function BackgroundLayer() {
  const { presentation, theme, machine } = usePresentationRuntime();
  const backgroundState = resolveBackgroundState(
    presentation,
    machine.state.context.currentStepIndex,
    machine.state.context.currentClusterId,
    theme
  );

  return (
    <ResolvedBackgroundLayer
      targetAppearance={backgroundState.appearance}
      transition={backgroundState.transition}
    />
  );
}

export function ThemeBackgroundLayer({
  theme,
  slug = 'dashboard'
}: {
  theme: ThemeConfig;
  slug?: string;
}) {
  const backgroundState = useMemo(
    () => resolveThemeBackgroundState(theme, slug),
    [slug, theme]
  );

  return (
    <ResolvedBackgroundLayer
      targetAppearance={backgroundState.appearance}
      transition={backgroundState.transition}
    />
  );
}
