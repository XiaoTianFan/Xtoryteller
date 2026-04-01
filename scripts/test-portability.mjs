import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  COMPONENTS_DIR,
  copyDirectory,
  copyNamedDependencies,
  createArchive,
  ensureCleanDir,
  extractArchive,
  findPackageRoot,
  LAYOUTS_DIR,
  TRANSITIONS_DIR,
  validatePackageDirectory
} from './portability-utils.mjs';

const root = process.cwd();
const tempRoot = path.join(root, 'output', 'qa-portability');

async function main() {
  await ensureCleanDir(tempRoot);

  const packageDir = path.join(tempRoot, 'simple-stage-package');
  const archivePath = path.join(tempRoot, 'simple-stage-package.zip');
  const importedRoot = path.join(tempRoot, 'imported');
  const tmpDir = path.join(tempRoot, 'tmp');

  await ensureCleanDir(packageDir);
  await ensureCleanDir(importedRoot);
  await ensureCleanDir(tmpDir);

  await copyDirectory(path.join(root, 'presentations', 'simple-stage'), packageDir);
  await copyNamedDependencies(COMPONENTS_DIR, path.join(packageDir, 'components'), ['headline']);
  await copyNamedDependencies(LAYOUTS_DIR, path.join(packageDir, 'layouts'), ['single-content']);
  await copyNamedDependencies(TRANSITIONS_DIR, path.join(packageDir, 'transitions'), ['fade']);

  const exported = await validatePackageDirectory(packageDir, { checkSlugConflict: false });
  assert.equal(exported.valid, true, 'expected the exported package to validate');
  assert.ok(exported.summary.packagedComponents > 0, 'expected packaged components to be detected');
  assert.ok(exported.summary.packagedLayouts > 0, 'expected packaged layouts to be detected');
  assert.ok(exported.summary.packagedTransitions > 0, 'expected packaged transitions to be detected');

  await createArchive(packageDir, archivePath);
  await fs.access(archivePath);

  const originalTmpdir = {
    TMPDIR: process.env.TMPDIR,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP
  };

  process.env.TMPDIR = tmpDir;
  process.env.TEMP = tmpDir;
  process.env.TMP = tmpDir;

  try {
    const extractedDir = await extractArchive(archivePath);
    const packageRoot = await findPackageRoot(extractedDir);
    await copyDirectory(packageRoot, importedRoot);

    const imported = await validatePackageDirectory(importedRoot, { checkSlugConflict: false });
    assert.equal(imported.valid, true, 'expected the imported package copy to validate');
    assert.ok(imported.summary.assetCount > 0, 'expected assets to survive the round-trip');
  } finally {
    process.env.TMPDIR = originalTmpdir.TMPDIR;
    process.env.TEMP = originalTmpdir.TEMP;
    process.env.TMP = originalTmpdir.TMP;
  }

  console.log('Portability round-trip QA passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

