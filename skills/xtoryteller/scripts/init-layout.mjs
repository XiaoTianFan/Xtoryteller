import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ensureDir,
  exists,
  parseArgs,
  removeDir,
  resolveWorkspaceRoot,
  toPascalCase,
  toTitleCase,
  writeYaml
} from './_utils.mjs';

const { options } = parseArgs(process.argv.slice(2));
const name = String(options.name ?? '').trim();
const scope = options.scope === 'presentation' ? 'presentation' : 'global';

if (!name) {
  console.error('Usage: node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split [--scope global|presentation] [--presentation my-talk] [--force]');
  process.exit(1);
}

if (scope === 'presentation' && !options.presentation) {
  console.error('Presentation scope requires --presentation <slug>.');
  process.exit(1);
}

const root = resolveWorkspaceRoot(import.meta.url);
const layoutRoot = scope === 'presentation'
  ? path.join(root, 'presentations', String(options.presentation), 'layouts')
  : path.join(root, 'layouts');
const targetDir = path.join(layoutRoot, name);
const layoutName = `${toPascalCase(name)}Layout`;
const displayName = toTitleCase(name);

if ((await exists(targetDir)) && !options.force) {
  console.error(`Layout directory already exists: ${targetDir}`);
  process.exit(1);
}

if (options.force) {
  await removeDir(targetDir);
}

await ensureDir(targetDir);

await writeYaml(path.join(targetDir, 'manifest.yaml'), {
  name,
  displayName,
  description: `${displayName} layout scaffold. Replace this with a precise layout description and slot guidance.`,
  slots: ['main'],
  props: {
    gap: {
      type: 'string',
      description: 'Optional CSS gap override.'
    }
  },
  density: {
    recommendation: 'Up to 1 primary composition until the layout has been exercised with real content.'
  }
});

await fs.writeFile(
  path.join(targetDir, 'index.tsx'),
  `import styles from '@/layouts/_shared/layout.module.css';\nimport { getLayoutStyle, joinLayoutClasses, LayoutProps, wrapPanels } from '@/layouts/_shared/layout-helpers';\n\nexport default function ${layoutName}({ items, compact, layoutProps }: LayoutProps) {\n  return (\n    <div className={joinLayoutClasses(styles.frame, styles.singleContent, compact && styles.compact)} style={getLayoutStyle(layoutProps)}>\n      {wrapPanels(items)}\n    </div>\n  );\n}\n`
);

console.log(`Initialized ${scope} layout scaffold at ${targetDir}`);
console.log('Note: the current viewer primarily resolves global layouts, so prefer global scope unless you have a deliberate portability or promotion workflow.');
