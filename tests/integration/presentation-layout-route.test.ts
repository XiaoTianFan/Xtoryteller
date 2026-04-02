import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import YAML from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('presentation layout route', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('persists absolute anchors and frame sizes while clearing arrangement fields', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-layout-route-'));
    const presentationsDir = path.join(tempRoot, 'presentations');
    const slug = 'route-save';
    const deckDir = path.join(presentationsDir, slug);
    const deckPath = path.join(deckDir, 'presentation.yaml');

    await fs.mkdir(deckDir, { recursive: true });
    await fs.writeFile(
      deckPath,
      `meta:
  title: Route save fixture
  slug: route-save
  updatedAt: '2026-01-10'
mode: map
canvas:
  arrangement:
    algorithm: flow
    columns: 2
clusters:
  - id: root
    layout: single-content
    arrangement:
      algorithm: tree
    anchor:
      x: 0
      y: 0
    components:
      - type: headline
        content: Root
  - id: child
    layout: single-content
    anchor:
      relativeTo: root
      direction: right
      distance: 120
    components:
      - type: headline
        content: Child
`,
      'utf8'
    );

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        PRESENTATIONS_DIR: presentationsDir
      };
    });

    const { POST } = await import('@/app/api/presentations/[slug]/layout/route');
    const response = await POST(
      new Request('http://localhost/api/presentations/route-save/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clusters: [
            { id: 'root', x: 12, y: 18, width: 610, height: 390 },
            { id: 'child', x: 742, y: 148, width: 440, height: 280 }
          ]
        })
      }),
      { params: Promise.resolve({ slug }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      updatedAt: '2026-04-02',
      clusterCount: 2
    });

    const saved = YAML.parse(await fs.readFile(deckPath, 'utf8')) as {
      meta: { updatedAt?: string };
      canvas?: { arrangement?: unknown };
      clusters: Array<{
        id: string;
        arrangement?: unknown;
        anchor?: Record<string, unknown>;
        frame?: Record<string, unknown>;
      }>;
    };

    expect(saved.meta.updatedAt).toBe('2026-04-02');
    expect(saved.canvas?.arrangement).toBeUndefined();
    expect(saved.clusters[0].arrangement).toBeUndefined();
    expect(saved.clusters[1].arrangement).toBeUndefined();
    expect(saved.clusters[0].anchor).toEqual({ x: 12, y: 18 });
    expect(saved.clusters[0].frame).toEqual({ width: 610, height: 390 });
    expect(saved.clusters[1].anchor).toEqual({ x: 742, y: 148 });
    expect(saved.clusters[1].frame).toEqual({ width: 440, height: 280 });
    expect(saved.clusters[1].anchor?.relativeTo).toBeUndefined();
    expect(saved.clusters[1].anchor?.direction).toBeUndefined();
    expect(saved.clusters[1].anchor?.distance).toBeUndefined();
  });

  it('persists stage component geometry and converts the edited step to scattered layout', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-stage-layout-route-'));
    const presentationsDir = path.join(tempRoot, 'presentations');
    const slug = 'stage-route-save';
    const deckDir = path.join(presentationsDir, slug);
    const deckPath = path.join(deckDir, 'presentation.yaml');

    await fs.mkdir(deckDir, { recursive: true });
    await fs.writeFile(
      deckPath,
      `meta:
  title: Stage route save fixture
  slug: stage-route-save
  updatedAt: '2026-01-10'
mode: stage
steps:
  - id: intro
    title: Intro
    layout: two-column
    layoutProps:
      gap: 2rem
      ratio: 60-40
      width: 900
    components:
      - type: headline
        content: Intro title
      - type: body-text
        content: Intro body
  - id: outro
    title: Outro
    layout: single-content
    components:
      - type: headline
        content: Outro
`,
      'utf8'
    );

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        PRESENTATIONS_DIR: presentationsDir
      };
    });

    const { POST } = await import('@/app/api/presentations/[slug]/layout/route');
    const response = await POST(
      new Request('http://localhost/api/presentations/stage-route-save/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stepIndex: 0,
          components: [
            { index: 0, x: 0.08, y: 0.12, width: 0.36, height: 0.28 },
            { index: 1, x: 0.54, y: 0.2, width: 0.26, height: 0.32 }
          ]
        })
      }),
      { params: Promise.resolve({ slug }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      updatedAt: '2026-04-02',
      stepIndex: 0,
      componentCount: 2
    });

    const saved = YAML.parse(await fs.readFile(deckPath, 'utf8')) as {
      meta: { updatedAt?: string };
      steps: Array<{
        id?: string;
        layout?: string;
        layoutProps?: Record<string, unknown>;
        components: Array<{ position?: Record<string, unknown> }>;
      }>;
    };

    expect(saved.meta.updatedAt).toBe('2026-04-02');
    expect(saved.steps[0].layout).toBe('scattered');
    expect(saved.steps[0].layoutProps).toEqual({
      gap: '2rem',
      width: 900
    });
    expect(saved.steps[0].components[0].position).toEqual({
      x: 0.08,
      y: 0.12,
      width: 0.36,
      height: 0.28
    });
    expect(saved.steps[0].components[1].position).toEqual({
      x: 0.54,
      y: 0.2,
      width: 0.26,
      height: 0.32
    });
    expect(saved.steps[1].layout).toBe('single-content');
  });

  it('accepts full stage component definitions so added components can be persisted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-stage-layout-route-full-'));
    const presentationsDir = path.join(tempRoot, 'presentations');
    const slug = 'stage-route-full-save';
    const deckDir = path.join(presentationsDir, slug);
    const deckPath = path.join(deckDir, 'presentation.yaml');

    await fs.mkdir(deckDir, { recursive: true });
    await fs.writeFile(
      deckPath,
      `meta:
  title: Stage route save fixture
  slug: stage-route-full-save
  updatedAt: '2026-01-10'
mode: stage
steps:
  - id: intro
    title: Intro
    layout: two-column
    components:
      - type: headline
        content: Intro title
      - type: body-text
        content: Intro body
`,
      'utf8'
    );

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        PRESENTATIONS_DIR: presentationsDir
      };
    });

    const { POST } = await import('@/app/api/presentations/[slug]/layout/route');
    const response = await POST(
      new Request('http://localhost/api/presentations/stage-route-full-save/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stepIndex: 0,
          components: [
            { index: 0, type: 'headline', content: 'Intro title', x: 0.08, y: 0.12, width: 0.36, height: 0.28 },
            { index: 1, type: 'body-text', content: 'Intro body', x: 0.52, y: 0.18, width: 0.3, height: 0.3 },
            { index: 2, type: 'subtitle', content: 'Added subtitle', x: 0.14, y: 0.56, width: 0.28, height: 0.18 }
          ]
        })
      }),
      { params: Promise.resolve({ slug }) }
    );

    expect(response.status).toBe(200);

    const saved = YAML.parse(await fs.readFile(deckPath, 'utf8')) as {
      steps: Array<{
        layout?: string;
        components: Array<{ type: string; content?: string; position?: Record<string, unknown> }>;
      }>;
    };

    expect(saved.steps[0].layout).toBe('scattered');
    expect(saved.steps[0].components).toHaveLength(3);
    expect(saved.steps[0].components[2].type).toBe('subtitle');
    expect(saved.steps[0].components[2].content).toBe('Added subtitle');
    expect(saved.steps[0].components[2].position).toEqual({
      x: 0.14,
      y: 0.56,
      width: 0.28,
      height: 0.18
    });
  });

  it('accepts full cluster definitions so map content edits and duplicated clusters can be persisted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-map-layout-route-full-'));
    const presentationsDir = path.join(tempRoot, 'presentations');
    const slug = 'map-route-full-save';
    const deckDir = path.join(presentationsDir, slug);
    const deckPath = path.join(deckDir, 'presentation.yaml');

    await fs.mkdir(deckDir, { recursive: true });
    await fs.writeFile(
      deckPath,
      `meta:
  title: Route save fixture
  slug: map-route-full-save
  updatedAt: '2026-01-10'
mode: map
clusters:
  - id: root
    layout: single-content
    components:
      - type: headline
        content: Root
  - id: child
    layout: single-content
    components:
      - type: headline
        content: Child
`,
      'utf8'
    );

    vi.doMock('@/lib/engine/constants', async () => {
      const actual = await vi.importActual<typeof import('@/lib/engine/constants')>('@/lib/engine/constants');
      return {
        ...actual,
        PRESENTATIONS_DIR: presentationsDir
      };
    });

    const { POST } = await import('@/app/api/presentations/[slug]/layout/route');
    const response = await POST(
      new Request('http://localhost/api/presentations/map-route-full-save/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clusters: [
            {
              id: 'root',
              title: 'Root',
              layout: 'scattered',
              x: 12,
              y: 18,
              width: 610,
              height: 390,
              components: [
                { type: 'headline', content: 'Root', x: 0.08, y: 0.12, width: 0.34, height: 0.22 },
                { type: 'body-text', content: 'Expanded detail', x: 0.5, y: 0.2, width: 0.3, height: 0.24 }
              ]
            },
            {
              id: 'child',
              title: 'Child',
              layout: 'single-content',
              x: 742,
              y: 148,
              width: 440,
              height: 280,
              components: [{ type: 'headline', content: 'Child' }]
            },
            {
              id: 'root-copy',
              title: 'Root copy',
              layout: 'single-content',
              x: 860,
              y: 440,
              width: 500,
              height: 300,
              components: [{ type: 'headline', content: 'Root copy' }]
            }
          ]
        })
      }),
      { params: Promise.resolve({ slug }) }
    );

    expect(response.status).toBe(200);

    const saved = YAML.parse(await fs.readFile(deckPath, 'utf8')) as {
      clusters: Array<{
        id: string;
        layout?: string;
        anchor?: Record<string, unknown>;
        frame?: Record<string, unknown>;
        components: Array<{ type: string; position?: Record<string, unknown> }>;
      }>;
    };

    expect(saved.clusters).toHaveLength(3);
    expect(saved.clusters[0].layout).toBe('scattered');
    expect(saved.clusters[0].components[1].type).toBe('body-text');
    expect(saved.clusters[0].components[1].position).toEqual({
      x: 0.5,
      y: 0.2,
      width: 0.3,
      height: 0.24
    });
    expect(saved.clusters[2].id).toBe('root-copy');
    expect(saved.clusters[2].anchor).toEqual({ x: 860, y: 440 });
    expect(saved.clusters[2].frame).toEqual({ width: 500, height: 300 });
  });
});
