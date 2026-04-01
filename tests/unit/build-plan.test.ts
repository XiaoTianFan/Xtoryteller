import { createBuildPlan, getSequentialRevealCount, getTotalBuildSteps, isComponentVisible } from '@/lib/runtime/build-plan';
import { StepDefinition } from '@/lib/types/presentation';

describe('build plan', () => {
  it('creates contiguous build steps for sequential and anchored components', () => {
    const step: StepDefinition = {
      layout: 'single-content',
      components: [
        { type: 'headline', content: 'Always visible' },
        { type: 'bullet-list', build: 'sequential', props: { items: ['one', 'two', 'three'] } },
        { type: 'callout', build: { with: 2 }, content: 'Anchored note' }
      ]
    };

    const plan = createBuildPlan(step);
    expect(plan.map((entry) => ({ type: entry.component.type, start: entry.start, end: entry.end }))).toEqual([
      { type: 'headline', start: 0, end: 0 },
      { type: 'bullet-list', start: 1, end: 3 },
      { type: 'callout', start: 2, end: 2 }
    ]);
    expect(getTotalBuildSteps(step)).toBe(4);
  });

  it('computes visibility and reveal counts from the build index', () => {
    const step: StepDefinition = {
      layout: 'single-content',
      components: [{ type: 'numbered-list', build: 'sequential', props: { items: ['first', 'second'] } }]
    };

    const plan = createBuildPlan(step)[0];
    expect(isComponentVisible(plan, 0)).toBe(false);
    expect(isComponentVisible(plan, 1)).toBe(true);
    expect(getSequentialRevealCount(plan, 1)).toBe(1);
    expect(getSequentialRevealCount(plan, 2)).toBe(2);
  });
});
