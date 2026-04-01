import { ComponentType } from 'react';

import { runtimeComponentMap } from '@/lib/runtime/component-registry';
import { presentationComponentOverrides, presentationLayoutOverrides, presentationTransitionOverrides } from '@/lib/runtime/generated-presentation-registry';
import { runtimeLayoutMap } from '@/lib/runtime/layout-registry';
import { RuntimeTransitionPreset, runtimeTransitionMap } from '@/lib/runtime/transition-presets';

const componentOverrides = presentationComponentOverrides as Record<string, Record<string, ComponentType<any>>>;
const layoutOverrides = presentationLayoutOverrides as Record<string, Record<string, ComponentType<any>>>;
const transitionOverrides = presentationTransitionOverrides as Record<string, Record<string, RuntimeTransitionPreset>>;

export function resolveRuntimeComponent(slug: string, type: string): ComponentType<any> | undefined {
  return componentOverrides[slug]?.[type] ?? runtimeComponentMap[type as keyof typeof runtimeComponentMap];
}

export function resolveRuntimeLayout(slug: string, type: string): ComponentType<any> | undefined {
  return layoutOverrides[slug]?.[type] ?? runtimeLayoutMap[type as keyof typeof runtimeLayoutMap];
}

export function resolveRuntimeTransition(slug: string, type?: string): RuntimeTransitionPreset {
  if (type && transitionOverrides[slug]?.[type]) {
    return transitionOverrides[slug][type];
  }

  const key = (type ?? 'fade') as keyof typeof runtimeTransitionMap;
  return runtimeTransitionMap[key] ?? runtimeTransitionMap.fade;
}
