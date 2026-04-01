import path from 'node:path';

import { generateRegistries } from './generate-registries.mjs';
import {
  COMPONENTS_DIR,
  copyDirectory,
  ensureDir,
  exists,
  parseArgs,
  PRESENTATIONS_DIR
} from './portability-utils.mjs';

const { positional, options } = parseArgs(process.argv.slice(2));
const [slug, componentName] = positional;

if (!slug || !componentName) {
  console.error('Usage: node scripts/promote-component.mjs <presentation-slug> <component-name> [--force]');
  process.exit(1);
}

const sourcePath = path.join(PRESENTATIONS_DIR, slug, 'components', componentName);
const targetPath = path.join(COMPONENTS_DIR, componentName);

if (!(await exists(sourcePath))) {
  console.error(`Presentation-scoped component not found: presentations/${slug}/components/${componentName}`);
  process.exit(1);
}

if ((await exists(targetPath)) && !options.force) {
  console.error(`Global component ${componentName} already exists. Re-run with --force to overwrite.`);
  process.exit(1);
}

await ensureDir(COMPONENTS_DIR);
await copyDirectory(sourcePath, targetPath);
const counts = await generateRegistries();

console.log(`Promoted ${componentName} from presentations/${slug}/components to components/${componentName}`);
console.log(
  `Registries refreshed (${counts.components} components, ${counts.layouts} layouts, ${counts.transitions} transitions, ${counts.themes} themes).`
);
