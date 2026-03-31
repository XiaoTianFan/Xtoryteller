import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

const ROOT = process.cwd();
const PRESENTATIONS_DIR = path.join(ROOT, 'presentations');
const PUBLIC_PRESENTATIONS_DIR = path.join(ROOT, 'public', 'presentations');

export async function syncPresentationAssets() {
  await fs.mkdir(PUBLIC_PRESENTATIONS_DIR, { recursive: true });

  const assetDirs = await fg('*/assets', {
    cwd: PRESENTATIONS_DIR,
    absolute: true,
    onlyDirectories: true
  });

  await Promise.all(
    assetDirs.map(async (assetDir) => {
      const slug = path.basename(path.dirname(assetDir));
      const targetDir = path.join(PUBLIC_PRESENTATIONS_DIR, slug, 'assets');
      await fs.mkdir(path.dirname(targetDir), { recursive: true });
      await fs.cp(assetDir, targetDir, { recursive: true, force: true });
    })
  );
}
