import { createActor } from 'xstate';
import { describe, expect, it, vi } from 'vitest';

import {
  clampCameraZoom,
  getWorldPointAtViewportPoint,
  panCameraByScreenDelta,
  zoomCameraAtViewportPoint
} from '@/lib/engine/arrangement';
import { presentationMachine } from '@/lib/machines/presentation-machine';
import { PresentationConfig } from '@/lib/types/presentation';

describe('map camera helpers', () => {
  it('preserves the world point under the cursor when zooming', () => {
    const camera = { x: 120, y: -40, zoom: 1 };
    const viewport = { width: 1280, height: 720 };
    const point = { x: 1040, y: 220 };
    const before = getWorldPointAtViewportPoint(camera, point, viewport);

    const nextCamera = zoomCameraAtViewportPoint(camera, 2.5, point, viewport);
    const after = getWorldPointAtViewportPoint(nextCamera, point, viewport);

    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
    expect(nextCamera.zoom).toBeCloseTo(2.5, 6);
  });

  it('applies pan deltas continuously in screen space', () => {
    const startCamera = { x: 10, y: 20, zoom: 2 };

    const nextCamera = panCameraByScreenDelta(startCamera, 80, -40);

    expect(nextCamera.x).toBeCloseTo(-30, 6);
    expect(nextCamera.y).toBeCloseTo(40, 6);
  });

  it('uses freer zoom defaults while still respecting authored limits', () => {
    expect(clampCameraZoom(10, {})).toBe(6);
    expect(clampCameraZoom(0.01, {})).toBe(0.12);
    expect(clampCameraZoom(10, { maxZoom: 3 })).toBe(3);
    expect(clampCameraZoom(0.2, { minZoom: 0.5 })).toBe(0.5);
  });
});

describe('presentation machine map navigation', () => {
  it('keeps guided index stable during temporary free navigation', async () => {
    vi.useFakeTimers();

    const presentation: PresentationConfig = {
      meta: { title: 'Map test', slug: 'map-test' },
      mode: 'map',
      navigation: { sequence: ['overview', 'detail'] },
      clusters: [
        { id: 'overview', layout: 'single-content', components: [] },
        { id: 'detail', layout: 'single-content', components: [] }
      ]
    };

    const actor = createActor(presentationMachine, {
      input: {
        presentation,
        initialCamera: { x: 0, y: 0, zoom: 1 },
        overviewCamera: { x: 0, y: 0, zoom: 1 },
        clusterCameras: {
          overview: { x: 0, y: 0, zoom: 1 },
          detail: { x: 200, y: 120, zoom: 1.4 }
        }
      }
    });

    actor.start();
    actor.send({ type: 'ENTER_GUIDED' });
    actor.send({ type: 'NEXT' });
    await vi.advanceTimersByTimeAsync(710);

    actor.send({ type: 'BEGIN_INTERACTION' });
    actor.send({ type: 'PAN_BY', deltaX: 160, deltaY: -40 });
    actor.send({
      type: 'ZOOM_TO_POINT',
      zoom: 2.8,
      point: { x: 900, y: 260 },
      viewport: { width: 1280, height: 720 }
    });
    actor.send({ type: 'END_INTERACTION' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.guided).toBe(true);
    expect(snapshot.context.guidedIndex).toBe(1);
    expect(snapshot.context.currentClusterId).toBe('detail');
    expect(snapshot.context.camera.zoom).toBeCloseTo(2.8, 6);

    actor.stop();
    vi.useRealTimers();
  });
});
