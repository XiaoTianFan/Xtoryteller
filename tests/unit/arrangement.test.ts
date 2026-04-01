import { frameCluster, frameClusters, resolveClusterPositions } from '@/lib/engine/arrangement';
import { ClusterDefinition } from '@/lib/types/presentation';

describe('cluster arrangement', () => {
  it('lays out flow-arranged clusters in rows', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'a', layout: 'single-content', arrangement: { algorithm: 'flow', columns: 2, spacing: 100 }, components: [] },
      { id: 'b', layout: 'single-content', components: [] },
      { id: 'c', layout: 'single-content', components: [] }
    ];

    const positions = resolveClusterPositions(clusters, { spacing: 100 });
    expect(positions.map((cluster) => ({ id: cluster.id, x: cluster.x, y: cluster.y }))).toEqual([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 640, y: 0 },
      { id: 'c', x: 0, y: 460 }
    ]);
  });

  it('creates stable tree positions and camera frames', () => {
    const clusters: ClusterDefinition[] = [
      { id: 'root', layout: 'single-content', components: [] },
      { id: 'child-1', layout: 'single-content', anchor: { relativeTo: 'root' }, components: [] },
      { id: 'child-2', layout: 'single-content', anchor: { relativeTo: 'root' }, components: [] }
    ];

    const positions = resolveClusterPositions(
      clusters.map((cluster, index) => ({
        ...cluster,
        arrangement: index === 0 ? { algorithm: 'tree', spacing: 120 } : undefined
      })),
      { spacing: 120 }
    );

    expect(positions).toHaveLength(3);
    const root = positions.find((cluster) => cluster.id === 'root');
    expect(root?.y).toBe(0);
    expect(frameClusters(positions, { spacing: 120 }).zoom).toBeGreaterThan(0);
    expect(frameCluster(positions[0], { spacing: 120 }).zoom).toBeGreaterThan(0);
  });
});
