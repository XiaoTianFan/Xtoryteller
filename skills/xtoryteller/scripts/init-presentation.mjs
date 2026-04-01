import path from 'node:path';

import { XTORYTELLER_EXAMPLES_DIR } from '../../../scripts/skill-paths.mjs';
import {
  copyDirIfExists,
  ensureDir,
  exists,
  parseArgs,
  readYaml,
  removeDir,
  resolveWorkspaceRoot,
  todayIsoDate,
  toTitleCase,
  writeYaml
} from './_utils.mjs';

const { options } = parseArgs(process.argv.slice(2));
const slug = String(options.slug ?? '').trim();

if (!slug) {
  console.error('Usage: node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk [--mode stage|map] [--example simple|complex] [--theme default] [--title "My Talk"] [--description "..."] [--author "..."] [--tags a,b] [--force]');
  process.exit(1);
}

const mode = options.mode === 'map' ? 'map' : 'stage';
const exampleFamily = options.example === 'complex' ? 'complex' : 'simple';
const theme = String(options.theme ?? 'default');
const root = resolveWorkspaceRoot(import.meta.url);
const targetDir = path.join(root, 'presentations', slug);
const templateFile = path.join(XTORYTELLER_EXAMPLES_DIR, `${exampleFamily}-${mode}.yaml`);

if ((await exists(targetDir)) && !options.force) {
  console.error(`Presentation directory already exists: presentations/${slug}`);
  process.exit(1);
}

if (options.force) {
  await removeDir(targetDir);
}

const template = await readYaml(templateFile);
const sourceSlug = String(template.meta?.slug ?? `${exampleFamily}-${mode}`);
const sourcePresentationDir = path.join(root, 'presentations', sourceSlug);
const title = String(options.title ?? toTitleCase(slug));
const description = String(
  options.description ??
    `A ${exampleFamily} ${mode === 'map' ? 'Map' : 'Stage'} presentation scaffold for ${title}.`
);
const tags = typeof options.tags === 'string'
  ? options.tags.split(',').map((value) => value.trim()).filter(Boolean)
  : template.meta?.tags ?? [];
const today = todayIsoDate();

const output = {
  ...template,
  meta: {
    ...template.meta,
    title,
    slug,
    description,
    author: options.author ? String(options.author) : template.meta?.author,
    tags,
    createdAt: today,
    updatedAt: today
  },
  theme
};

await ensureDir(targetDir);
await writeYaml(path.join(targetDir, 'presentation.yaml'), output);
await copyDirIfExists(path.join(sourcePresentationDir, 'assets'), path.join(targetDir, 'assets'));

console.log(`Initialized presentations/${slug}/presentation.yaml from ${exampleFamily}-${mode}.yaml`);
console.log(`Theme: ${theme}`);
console.log(`Next: node scripts/validate.mjs presentations/${slug}/presentation.yaml`);
