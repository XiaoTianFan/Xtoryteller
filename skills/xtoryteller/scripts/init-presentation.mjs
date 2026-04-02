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
  console.error('Usage: node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk [--mode stage|map] [--example simple|complex] [--theme <slug>] [--title "My Talk"] [--description "..."] [--author "..."] [--tags a,b] [--force]');
  console.error('Omit --theme so the presentation inherits the dashboard-selected global theme (matches SKILL guidance). Pass --theme <slug> only when locking to a reusable theme.');
  process.exit(1);
}

const mode = options.mode === 'map' ? 'map' : 'stage';
const exampleFamily = options.example === 'complex' ? 'complex' : 'simple';
const themeArg =
  typeof options.theme === 'string' && String(options.theme).trim()
    ? String(options.theme).trim()
    : undefined;
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
  }
};

if (themeArg !== undefined) {
  output.theme = themeArg;
}

await ensureDir(targetDir);
await writeYaml(path.join(targetDir, 'presentation.yaml'), output);
await copyDirIfExists(path.join(sourcePresentationDir, 'assets'), path.join(targetDir, 'assets'));

console.log(`Initialized presentations/${slug}/presentation.yaml from ${exampleFamily}-${mode}.yaml`);
console.log(
  themeArg !== undefined
    ? `Theme: ${themeArg} (locked in YAML)`
    : 'Theme: (omit — inherits dashboard global theme)'
);
console.log(`Next: node scripts/validate.mjs presentations/${slug}/presentation.yaml`);
