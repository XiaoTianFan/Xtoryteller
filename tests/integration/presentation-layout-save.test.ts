import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import YAML from 'yaml';

import { resolveClusterPositions } from '@/lib/engine/arrangement';
import {
  savePresentationLayoutAtPath,
  type ClusterLayoutGeometry
} from '@/lib/engine/presentation-layout-save';
import { parseYamlFile } from '@/lib/engine/yaml';
import { PresentationConfig } from '@/lib/types/presentation';
import { validatePresentation } from '@/scripts/validate.mjs';

describe('presentation layout save integration', () => {
  it('saves an arranged map as manual geometry that still validates and reloads', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-layout-save-'));
    const presentationDir = path.join(tempRoot, 'map-canvas-arrangement-precedence');
    const sourcePath = path.join(
      process.cwd(),
      'tests',
      'fixtures',
      'presentations',
      'valid',
      'map-canvas-arrangement-precedence',
      'presentation.yaml'
    );
    const targetPath = path.join(presentationDir, 'presentation.yaml');

    await fs.mkdir(presentationDir, { recursive: true });
    await fs.copyFile(sourcePath, targetPath);

    const geometry: ClusterLayoutGeometry[] = [
      { id: 'root', x: 40, y: 60, width: 620, height: 360 },
      { id: 'child', x: 760, y: 120, width: 420, height: 260 }
    ];

    await savePresentationLayoutAtPath(targetPath, geometry, {
      now: new Date(2026, 3, 3, 12, 0, 0)
    });

    const validation = await validatePresentation(targetPath, {
      report: false,
      throwOnError: false
    });
    expect(validation.valid).toBe(true);

    const saved = await parseYamlFile<PresentationConfig>(targetPath);
    expect(saved.meta.updatedAt).toBe('2026-04-03');
    expect(saved.canvas?.arrangement).toBeUndefined();
    expect(saved.clusters?.every((cluster) => !cluster.arrangement)).toBe(true);
    expect(saved.clusters?.map((cluster) => cluster.anchor)).toEqual([
      { x: 40, y: 60 },
      { x: 760, y: 120 }
    ]);
    expect(saved.clusters?.map((cluster) => cluster.frame)).toEqual([
      { width: 620, height: 360 },
      { width: 420, height: 260 }
    ]);

    const reloadedPositions = resolveClusterPositions(saved.clusters ?? [], saved.canvas);
    expect(reloadedPositions).toEqual(geometry);

    const raw = YAML.parse(await fs.readFile(targetPath, 'utf8')) as {
      clusters: Array<{ anchor?: Record<string, unknown> }>;
    };
    expect(raw.clusters[1].anchor?.relativeTo).toBeUndefined();
  });
});
