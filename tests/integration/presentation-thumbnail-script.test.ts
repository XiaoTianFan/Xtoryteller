import { describe, expect, it } from 'vitest';

describe('generate-presentation-thumbnail.mjs', () => {
  it('exits 0 when THUMBNAIL_DRY_RUN=1', async () => {
    const { spawnSync } = await import('node:child_process');
    const path = await import('node:path');
    const script = path.join(process.cwd(), 'scripts', 'generate-presentation-thumbnail.mjs');
    const result = spawnSync(process.execPath, [script, '--slug', 'simple-stage'], {
      cwd: process.cwd(),
      env: { ...process.env, THUMBNAIL_DRY_RUN: '1' },
      encoding: 'utf8'
    });
    expect(result.status).toBe(0);
  });
});
