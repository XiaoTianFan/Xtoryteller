import fs from 'node:fs/promises';
import path from 'node:path';

import { generateRegistries } from './generate-registries.mjs';
import {
  COMPONENTS_DIR,
  copyDirectory,
  ensureDir,
  exists,
  extractArchive,
  findPackageRoot,
  LAYOUTS_DIR,
  listDirectoryNames,
  parseArgs,
  PRESENTATIONS_DIR,
  THEMES_DIR,
  TRANSITIONS_DIR,
  validatePackageDirectory
} from './portability-utils.mjs';

const { positional, options } = parseArgs(process.argv.slice(2));
const sourceArg = positional[0];

if (!sourceArg) {
  console.error('Usage: node scripts/import.mjs <package-folder-or-zip> [--confirm] [--force]');
  process.exit(1);
}

const resolvedSource = path.resolve(sourceArg);
const isArchive = /\.zip$/i.test(resolvedSource);
const extractedDir = isArchive ? await extractArchive(resolvedSource) : null;
const packageRoot = await findPackageRoot(extractedDir ?? resolvedSource);
const validation = await validatePackageDirectory(packageRoot);

console.log(`Importing presentation: ${validation.config.meta.title}`);
console.log(`Slug: ${validation.config.meta.slug}`);
console.log(`Components: ${validation.summary.packagedComponents} packaged, ${validation.summary.globalComponents} global fallback`);
console.log(`Layouts: ${validation.summary.packagedLayouts} packaged, ${validation.summary.globalLayouts} global fallback`);
console.log(`Transitions: ${validation.summary.packagedTransitions} packaged, ${validation.summary.globalTransitions} global fallback`);
console.log(`Assets: ${validation.summary.assetCount}`);
for (const issue of validation.issues) {
  console.log(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
}

if (!validation.valid) {
  if (extractedDir) {
    await fs.rm(extractedDir, { recursive: true, force: true });
  }
  process.exit(1);
}

if (!options.confirm) {
  console.log('Import ready. Re-run with --confirm to apply changes.');
  if (extractedDir) {
    await fs.rm(extractedDir, { recursive: true, force: true });
  }
  process.exit(0);
}

const presentationTarget = path.join(PRESENTATIONS_DIR, validation.config.meta.slug);
if ((await exists(presentationTarget)) && !options.force) {
  console.error(`Presentation slug ${validation.config.meta.slug} already exists. Re-run with --force to overwrite.`);
  if (extractedDir) {
    await fs.rm(extractedDir, { recursive: true, force: true });
  }
  process.exit(1);
}

await copyDirectory(packageRoot, presentationTarget);

const themePath = path.join(packageRoot, 'theme.yaml');
if (await exists(themePath)) {
  await ensureDir(THEMES_DIR);
  const themeTarget = path.join(THEMES_DIR, `${validation.config.theme}.yaml`);
  if (!(await exists(themeTarget)) || options.force) {
    await fs.copyFile(themePath, themeTarget);
  }
}

for (const [subdir, targetRoot] of [
  ['components', COMPONENTS_DIR],
  ['layouts', LAYOUTS_DIR],
  ['transitions', TRANSITIONS_DIR]
]) {
  const sourceRoot = path.join(packageRoot, subdir);
  const names = await listDirectoryNames(sourceRoot);
  for (const name of names) {
    const target = path.join(targetRoot, name);
    if ((await exists(target)) && !options.force) {
      continue;
    }

    await copyDirectory(path.join(sourceRoot, name), target);
  }
}

const counts = await generateRegistries();

console.log(`Imported to presentations/${validation.config.meta.slug}`);
console.log('Packaged components, layouts, and transitions were copied into the global libraries when needed.');
console.log(
  `Registries refreshed (${counts.components} components, ${counts.layouts} layouts, ${counts.transitions} transitions, ${counts.themes} themes).`
);

if (extractedDir) {
  await fs.rm(extractedDir, { recursive: true, force: true });
}
