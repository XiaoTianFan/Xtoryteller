import type { ComponentType } from 'react';
import { vi } from 'vitest';

const { ScopedComponent, ScopedLayout, ScopedTransition } = vi.hoisted(() => ({
  ScopedComponent: (() => null) as ComponentType<any>,
  ScopedLayout: (() => null) as ComponentType<any>,
  ScopedTransition: {
    enter: { opacity: 0, x: 12 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 }
  }
}));

vi.mock('@/lib/runtime/generated-presentation-registry', () => ({
  presentationComponentOverrides: {
    'scoped-deck': {
      headline: ScopedComponent
    }
  },
  presentationLayoutOverrides: {
    'scoped-deck': {
      'single-content': ScopedLayout
    }
  },
  presentationTransitionOverrides: {
    'scoped-deck': {
      fade: ScopedTransition
    }
  }
}));

import { runtimeComponentMap } from '@/lib/runtime/component-registry';
import { runtimeLayoutMap } from '@/lib/runtime/layout-registry';
import { resolveRuntimeComponent, resolveRuntimeLayout, resolveRuntimeTransition } from '@/lib/runtime/primitive-resolver';
import { runtimeTransitionMap } from '@/lib/runtime/transition-presets';

describe('primitive resolver', () => {
  it('prefers presentation-scoped runtime overrides when present', () => {
    expect(resolveRuntimeComponent('scoped-deck', 'headline')).toBe(ScopedComponent);
    expect(resolveRuntimeLayout('scoped-deck', 'single-content')).toBe(ScopedLayout);
    expect(resolveRuntimeTransition('scoped-deck', 'fade')).toBe(ScopedTransition);
  });

  it('falls back to the global runtime registries otherwise', () => {
    expect(resolveRuntimeComponent('other-deck', 'headline')).toBe(runtimeComponentMap.headline);
    expect(resolveRuntimeLayout('other-deck', 'single-content')).toBe(runtimeLayoutMap['single-content']);
    expect(resolveRuntimeTransition('other-deck', 'fade')).toBe(runtimeTransitionMap.fade);
  });
});
