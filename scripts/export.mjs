import fs from 'node:fs/promises';
import path from 'node:path';

import {
  collectDependencyNames,
  copyDirectory,
  copyNamedDependencies,
  createArchive,
  ensureCleanDir,
  exists,
  listDirectoryNames,
  parseArgs,
  parseYamlFile,
  resolvePresentationSource,
  ROOT,
  THEMES_DIR,
  COMPONENTS_DIR,
  LAYOUTS_DIR,
  TRANSITIONS_DIR,
  validatePackageDirectory
} from './portability-utils.mjs';

const { positional, options } = parseArgs(process.argv.slice(2));
const sourceArg = positional[0];

if (!sourceArg) {
  console.error('Usage: node scripts/export.mjs <presentation-path-or-slug> [--output exports]');
  process.exit(1);
}

const sourceDir = await resolvePresentationSource(sourceArg);
const presentationPath = path.join(sourceDir, 'presentation.yaml');
const config = await parseYamlFile(presentationPath);
const { components, layouts, transitions } = collectDependencyNames(config);
const outputRoot = path.resolve(String(options.output ?? path.join(ROOT, 'exports')));
const packageBaseName = config.meta.slug.endsWith('-complete') ? config.meta.slug : `${config.meta.slug}-complete`;
const packageDir = path.join(outputRoot, packageBaseName);
const archivePath = path.join(outputRoot, `${packageBaseName}.zip`);

await ensureCleanDir(packageDir);
await copyDirectory(sourceDir, packageDir);

const localComponentNames = await listDirectoryNames(path.join(sourceDir, 'components'));
const localLayoutNames = await listDirectoryNames(path.join(sourceDir, 'layouts'));
const localTransitionNames = await listDirectoryNames(path.join(sourceDir, 'transitions'));

await copyNamedDependencies(COMPONENTS_DIR, path.join(packageDir, 'components'), components.filter((name) => !localComponentNames.includes(name)));
await copyNamedDependencies(LAYOUTS_DIR, path.join(packageDir, 'layouts'), layouts.filter((name) => !localLayoutNames.includes(name)));
await copyNamedDependencies(TRANSITIONS_DIR, path.join(packageDir, 'transitions'), transitions.filter((name) => !localTransitionNames.includes(name)));

const themeSource = path.join(THEMES_DIR, `${config.theme}.yaml`);
if (await exists(themeSource)) {
  await fs.copyFile(themeSource, path.join(packageDir, 'theme.yaml'));
}

const validation = await validatePackageDirectory(packageDir, { checkSlugConflict: false });
if (!validation.valid) {
  for (const issue of validation.issues) {
    console.error(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
  }
  process.exit(1);
}

await createArchive(packageDir, archivePath);

console.log(`Exported ${config.meta.title}`);
console.log(`Package folder: ${packageDir}`);
console.log(`Archive: ${archivePath}`);
console.log(`Dependencies bundled: ${components.length} components, ${layouts.length} layouts, ${transitions.length} transitions.`);
for (const issue of validation.issues) {
  console.log(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
}
