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

  it('places arc chips at distinct angles with approximately equal edge gaps within each arc (width-aware margins)', () => {
    const phases = [
      mkPhase('sm', { strategy: 0, actors: 6, support: 0 }),
      mkPhase('md', { strategy: 0, actors: 0, support: 0 }),
      mkPhase('lg', { strategy: 0, actors: 0, support: 0 })
    ] as unknown[];
    const geoms = computePhaseGeometry(phases as Parameters<typeof computePhaseGeometry>[0]);
    const g = geoms[0];
    const p = phases[0] as NormalizedPhaseLike;
    const layouts = layoutArcChips('actors', p.actors.items, g, 0, []);

    const cx = g.centerX;
    const cy = g.centerY;
    const angles = layouts.map((l) => (Math.atan2(l.y - cy, l.x - cx) * 180) / Math.PI);
    const uniq = new Set(angles.map((a) => a.toFixed(4)));
    expect(uniq.size).toBe(angles.length);

    const rMean = layouts.reduce((s, l) => s + Math.hypot(l.x - cx, l.y - cy), 0) / layouts.length;
    const withEdge = layouts
      .map((l) => {
        const c = (Math.atan2(l.y - cy, l.x - cx) * 180) / Math.PI;
        const half = chipHalfAngleFromLayout(l, rMean);
        return { left: c - half, right: c + half };
      })
      .sort((a, b) => a.left - b.left);

    const runs: typeof withEdge[] = [];
    let run: typeof withEdge = [withEdge[0]!];
    for (let i = 1; i < withEdge.length; i += 1) {
      const prev = withEdge[i - 1]!;
      const gapBetweenArcs = withEdge[i]!.left - prev.right;
      if (gapBetweenArcs > 40) {
        runs.push(run);
        run = [];
      }
      run.push(withEdge[i]!);
    }
    runs.push(run);

    for (const seg of runs) {
      if (seg.length < 2) {
        continue;
      }
      const gaps: number[] = [];
      for (let i = 0; i < seg.length - 1; i += 1) {
        gaps.push(seg[i + 1]!.left - seg[i]!.right);
      }
      const mean = gaps.reduce((s, x) => s + x, 0) / gaps.length;
      for (const x of gaps) {
        expect(Math.abs(x - mean)).toBeLessThan(mean * 0.4 + 0.35);
      }
    }
  });
});

function chipHalfAngleFromLayout(l: { width: number }, r: number): number {
  const ratio = Math.min(1, Math.max(-1, l.width / (2 * r)));
  return (Math.asin(ratio) * 180) / Math.PI;
}
