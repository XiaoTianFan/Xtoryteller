import { ComponentInstance, StepDefinition } from '@/lib/types/presentation';

export interface ComponentBuildPlan {
  component: ComponentInstance;
  start: number;
  end: number;
}

function getSequentialLength(component: ComponentInstance): number {
  const props = component.props ?? {};

  if (Array.isArray(props.items)) {
    return props.items.length;
  }

  if (Array.isArray(props.variables)) {
    return props.variables.length;
  }

  if (Array.isArray(props.nodes)) {
    return props.nodes.length;
  }

  if (Array.isArray(props.layers)) {
    return props.layers.length;
  }

  if (Array.isArray(props.branches)) {
    return props.branches.length;
  }

  return 1;
}

function getBuildAnchor(component: ComponentInstance): number | null {
  if (typeof component.build === 'number') {
    return component.build;
  }

  if (component.build && typeof component.build === 'object' && 'with' in component.build) {
    return component.build.with;
  }

  return null;
}

export function createBuildPlan(step: StepDefinition): ComponentBuildPlan[] {
  let cursor = 1;

  return step.components.map((component) => {
    const anchored = getBuildAnchor(component);

    if (anchored != null) {
      const sequentialLength = component.build === 'sequential' ? getSequentialLength(component) : 1;
      cursor = Math.max(cursor, anchored + sequentialLength);
      return {
        component,
        start: anchored,
        end: anchored + sequentialLength - 1
      };
    }

    if (component.build === 'sequential') {
      const length = Math.max(1, getSequentialLength(component));
      const plan = {
        component,
        start: cursor,
        end: cursor + length - 1
      };
      cursor += length;
      return plan;
    }

    return {
      component,
      start: 0,
      end: 0
    };
  });
}

export function getTotalBuildSteps(step: StepDefinition): number {
  const plan = createBuildPlan(step);
  const maxBuild = plan.reduce((highest, entry) => Math.max(highest, entry.end), 0);
  return maxBuild + 1;
}

export function isComponentVisible(plan: ComponentBuildPlan, currentBuildIndex: number): boolean {
  return currentBuildIndex >= plan.start;
}

export function getSequentialRevealCount(plan: ComponentBuildPlan, currentBuildIndex: number): number {
  if (currentBuildIndex < plan.start) {
    return 0;
  }

  return Math.min(plan.end - plan.start + 1, currentBuildIndex - plan.start + 1);
}
