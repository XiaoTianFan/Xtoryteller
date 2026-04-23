import { describe, expect, it } from 'vitest';

import {
  computeBandLabelPlacement,
  computePhaseGeometry,
  layoutArcChips,
  layoutInnerStrategyChips
} from '@/components/roadmap-rings';

type NormalizedPhaseLike = {
  label: string;
  dateRange: string;
  size: 'sm' | 'md' | 'lg';
  strategy: { title: string; subtitle: string; items: { key: string; label: string; detail: string }[] };
  actors: { title: string; subtitle: string; items: { key: string; label: string; detail: string }[] };
  support: { title: string; subtitle: string; items: { key: string; label: string; detail: string }[] };
};

function mkItem(i: number, prefix: string) {
  return { key: `${prefix}-${i}`, label: `Item ${i} ${prefix}`, detail: '' };
}

function mkPhase(
  size: 'sm' | 'md' | 'lg',
  counts: { strategy?: number; actors?: number; support?: number }
): NormalizedPhaseLike {
  const n = (c: number | undefined, prefix: string) =>
    Array.from({ length: c ?? 0 }, (_, i) => mkItem(i, prefix));
  return {
    label: 'Phase',
    dateRange: '2024',
    size,
    strategy: {
      title: 'Strategy title',
      subtitle: 'Strategy subtitle line',
      items: n(counts.strategy, 's')
    },
    actors: {
      title: 'Actors / Stakeholders',
      subtitle: '',
      items: n(counts.actors, 'a')
    },
    support: {
      title: 'System Support',
      subtitle: '',
      items: n(counts.support, 'u')
    }
  };
}

function aabbOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  const ax1 = a.x - a.width / 2;
  const ax2 = a.x + a.width / 2;
  const ay1 = a.y - a.height / 2;
  const ay2 = a.y + a.height / 2;
  const bx1 = b.x - b.width / 2;
  const bx2 = b.x + b.width / 2;
  const by1 = b.y - b.height / 2;
  const by2 = b.y + b.height / 2;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

describe('roadmap-rings layout', () => {
  it('keeps two strategy rows with distinct Y for four or more items (pilot / scale)', () => {
    const phases = [mkPhase('sm', { strategy: 4 }), mkPhase('md', { strategy: 4 }), mkPhase('lg', { strategy: 1 })] as unknown[];
    const geoms = computePhaseGeometry(phases as Parameters<typeof computePhaseGeometry>[0]);
    for (const phaseIndex of [0, 1]) {
      const g = geoms[phaseIndex];
      const titleBottom = g.centerY + 55;
      const items = (phases[phaseIndex] as NormalizedPhaseLike).strategy.items;
      const layouts = layoutInnerStrategyChips(items, g, phaseIndex, titleBottom);
      const rowYs = [...new Set(layouts.map((l) => l.y))].sort((a, b) => a - b);
      expect(rowYs.length).toBe(2);
      expect(rowYs[1]! - rowYs[0]!).toBeGreaterThan(20);
    }
  });

  it('keeps a single row for three or fewer strategy items', () => {
    const phases = [mkPhase('sm', { strategy: 3 }), mkPhase('md', { strategy: 0 }), mkPhase('lg', { strategy: 0 })] as unknown[];
    const geoms = computePhaseGeometry(phases as Parameters<typeof computePhaseGeometry>[0]);
    const g = geoms[0];
    const titleBottom = g.centerY + 55;
    const items = (phases[0] as NormalizedPhaseLike).strategy.items;
    const layouts = layoutInnerStrategyChips(items, g, 0, titleBottom);
    const rowYs = [...new Set(layouts.map((l) => l.y))];
    expect(rowYs.length).toBe(1);
  });

  it('layoutArcChips avoids overlaps between actors, support, strategy chips, and band labels', () => {
    const phases = [
      mkPhase('sm', { strategy: 3, actors: 8, support: 8 }),
      mkPhase('md', { strategy: 0, actors: 0, support: 0 }),
      mkPhase('lg', { strategy: 0, actors: 0, support: 0 })
    ] as unknown[];
    const geoms = computePhaseGeometry(phases as Parameters<typeof computePhaseGeometry>[0]);
    const g = geoms[0];
    const p = phases[0] as NormalizedPhaseLike;
    const titleBottom = g.centerY + 55;
    const strategyLayouts = layoutInnerStrategyChips(p.strategy.items, g, 0, titleBottom);
    const actorPlacement = computeBandLabelPlacement(g, 0, 'actors', p.actors.title.toUpperCase());
    const supportPlacement = computeBandLabelPlacement(g, 0, 'support', p.support.title.toUpperCase());
    const toObs = (x: { x: number; y: number; width: number; height: number }) => x;
    const baseObstacles = [
      ...strategyLayouts.map((it) => toObs({ x: it.x, y: it.y, width: it.width, height: it.height })),
      toObs(actorPlacement),
      toObs(supportPlacement)
    ];
    const actorLayouts = layoutArcChips('actors', p.actors.items, g, 0, baseObstacles);
    const supportObstacles = [...baseObstacles, ...actorLayouts.map((it) => toObs(it))];
    const supportLayouts = layoutArcChips('support', p.support.items, g, 0, supportObstacles);
    const all = [...strategyLayouts, ...actorLayouts, ...supportLayouts];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        expect(aabbOverlap(all[i]!, all[j]!)).toBe(false);
      }
    }
  });
});
