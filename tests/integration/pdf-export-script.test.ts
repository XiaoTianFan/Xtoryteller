import { describe, expect, it } from 'vitest';

describe('export-pdf.mjs', () => {
  it('exits 0 when PDF_DRY_RUN=1', async () => {
    const { spawnSync } = await import('node:child_process');
    const path = await import('node:path');
    const script = path.join(process.cwd(), 'scripts', 'export-pdf.mjs');
    const result = spawnSync(process.execPath, [script, '--slug', 'simple-stage'], {
      cwd: process.cwd(),
      env: { ...process.env, PDF_DRY_RUN: '1' },
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PDF_DRY_RUN=1');
  });
});
