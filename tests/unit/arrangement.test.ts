import { frameCluster, frameClusters, resolveClusterPositions } from '@/lib/engine/arrangement';
import { ClusterDefinition } from '@/lib/types/presentation';

describe('cluster arrangement', () => {
  it('uses first-class cluster frames for mixed-size manual anchoring', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'root', layout: 'single-content', frame: { width: 800, height: 500 }, anchor: { x: 0, y: 0 }, components: [] },
      {
        id: 'right-child',
        layout: 'single-content',
        frame: { width: 320, height: 220 },
        anchor: { relativeTo: 'root', direction: 'right', distance: 100 },
        components: []
      },
      {
        id: 'below-child',
        layout: 'single-content',
        frame: { width: 260, height: 260 },
        anchor: { relativeTo: 'root', direction: 'below', distance: 80 },
        components: []
      }
    ];

    const positions = resolveClusterPositions(clusters, { spacing: 100 });
    expect(positions.map((cluster) => ({ id: cluster.id, x: cluster.x, y: cluster.y }))).toEqual([
      { id: 'root', x: 0, y: 0 },
      { id: 'right-child', x: 900, y: 140 },
      { id: 'below-child', x: 270, y: 580 }
    ]);
  });

  it('lays out mixed-size flow arrangements using canvas.arrangement', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'a', layout: 'single-content', frame: { width: 400, height: 240 }, components: [] },
      { id: 'b', layout: 'single-content', frame: { width: 300, height: 360 }, components: [] },
      { id: 'c', layout: 'single-content', frame: { width: 500, height: 200 }, components: [] }
    ];

    const positions = resolveClusterPositions(clusters, {
      spacing: 80,
      arrangement: { algorithm: 'flow', columns: 2, spacing: 100 }
    });

    expect(positions.map((cluster) => ({ id: cluster.id, x: cluster.x, y: cluster.y }))).toEqual([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 500, y: 0 },
      { id: 'c', x: 0, y: 460 }
    ]);
  });

  it('computes grid positions from row and column spans', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'a', layout: 'single-content', frame: { width: 200, height: 300 }, components: [] },
      { id: 'b', layout: 'single-content', frame: { width: 400, height: 200 }, components: [] },
      { id: 'c', layout: 'single-content', frame: { width: 350, height: 500 }, components: [] },
      { id: 'd', layout: 'single-content', frame: { width: 250, height: 250 }, components: [] }
    ];

    const positions = resolveClusterPositions(clusters, {
      arrangement: { algorithm: 'grid', spacing: 50 }
    });

    expect(positions.map((cluster) => ({ id: cluster.id, x: cluster.x, y: cluster.y }))).toEqual([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 400, y: 0 },
      { id: 'c', x: 0, y: 350 },
      { id: 'd', x: 400, y: 350 }
    ]);
  });

  it('places radial clusters around their centers instead of top-left points', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'a', layout: 'single-content', frame: { width: 200, height: 120 }, components: [] },
      { id: 'b', layout: 'single-content', frame: { width: 100, height: 100 }, components: [] }
    ];

    const positions = resolveClusterPositions(clusters, {
      arrangement: { algorithm: 'radial', radius: 300, spacing: 120 }
    });

    expect(positions[0]).toMatchObject({ id: 'a', x: 200, y: -60, width: 200, height: 120 });
    expect(positions[1]).toMatchObject({ id: 'b', x: -350, width: 100, height: 100 });
    expect(positions[1].y).toBeCloseTo(-50, 6);
  });

  it('prefers canvas.arrangement over deprecated cluster-level arrangement', () => {
    const clusters: ClusterDefinition[] = [
      {
        id: 'a',
        layout: 'single-content',
        frame: { width: 320, height: 180 },
        arrangement: { algorithm: 'tree', spacing: 999 },
        components: []
      },
      { id: 'b', layout: 'single-content', frame: { width: 280, height: 200 }, components: [] }
    ];

    const positions = resolveClusterPositions(clusters, {
      arrangement: { algorithm: 'flow', columns: 2, spacing: 90 }
    });

    expect(positions.map((cluster) => ({ id: cluster.id, x: cluster.x, y: cluster.y }))).toEqual([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 410, y: 0 }
    ]);
  });

  it('creates stable tree positions and camera frames for mixed sizes', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'root', layout: 'single-content', frame: { width: 420, height: 180 }, components: [] },
      { id: 'child-1', layout: 'single-content', frame: { width: 260, height: 240 }, anchor: { relativeTo: 'root' }, components: [] },
      { id: 'child-2', layout: 'single-content', frame: { width: 300, height: 220 }, anchor: { relativeTo: 'root' }, components: [] }
    ];

    const positions = resolveClusterPositions(clusters, {
      arrangement: { algorithm: 'tree', spacing: 120 }
    });

    expect(positions).toHaveLength(3);
    const root = positions.find((cluster) => cluster.id === 'root');
    const leftChild = positions.find((cluster) => cluster.id === 'child-1');
    const rightChild = positions.find((cluster) => cluster.id === 'child-2');
    expect(root?.y).toBe(0);
    expect(leftChild?.y).toBeGreaterThan(root?.y ?? 0);
    expect(rightChild?.x).toBeGreaterThan(leftChild?.x ?? 0);
    expect(frameClusters(positions, { spacing: 120 }).zoom).toBeGreaterThan(0);
    expect(frameCluster(positions[0], { spacing: 120 }).zoom).toBeGreaterThan(0);
  });
});
