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
  console.error('Usage: node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve [--scope global|presentation] [--presentation my-talk] [--category custom] [--force]');
  process.exit(1);
}

if (scope === 'presentation' && !options.presentation) {
  console.error('Presentation scope requires --presentation <slug>.');
  process.exit(1);
}

const root = resolveWorkspaceRoot(import.meta.url);
const componentRoot = scope === 'presentation'
  ? path.join(root, 'presentations', String(options.presentation), 'components')
  : path.join(root, 'components');
const targetDir = path.join(componentRoot, name);
const componentName = toPascalCase(name);
const displayName = toTitleCase(name);
const category = String(options.category ?? 'custom');

if ((await exists(targetDir)) && !options.force) {
  console.error(`Component directory already exists: ${targetDir}`);
  process.exit(1);
}

if (options.force) {
  await removeDir(targetDir);
}

await ensureDir(targetDir);

await writeYaml(path.join(targetDir, 'manifest.yaml'), {
  name,
  displayName,
  description: `${displayName} component scaffold. Replace this with a precise agent-readable description.`,
  category,
  content: true,
  props: {
    tone: {
      type: 'string',
      description: 'Optional visual variant or tone.'
    }
  },
  density: {
    recommendation: 'Use one instance per slot until the final design proves denser compositions remain readable.'
  }
});

await fs.writeFile(
  path.join(targetDir, 'index.tsx'),
  `import styles from './styles.module.css';\n\nexport default function ${componentName}({\n  content,\n  props,\n  style\n}: {\n  content?: string;\n  props?: Record<string, unknown>;\n  style?: React.CSSProperties;\n}) {\n  const tone = String(props?.tone ?? 'default');\n\n  return (\n    <section className={[styles.root, styles[tone as keyof typeof styles]].filter(Boolean).join(' ')} style={style}>\n      {content ? <p className={styles.content}>{content}</p> : <p className={styles.content}>Replace this scaffold with the real ${displayName} implementation.</p>}\n    </section>\n  );\n}\n`
);

await fs.writeFile(
  path.join(targetDir, 'styles.module.css'),
  `.root {\n  padding: var(--spacing-gap);\n  border: var(--border-subtle);\n  border-radius: var(--radius-medium);\n  background: var(--color-surface);\n  color: var(--color-foreground);\n  box-shadow: var(--shadow-soft);\n}\n\n.content {\n  margin: 0;\n  font-size: var(--text-body);\n  line-height: 1.6;\n}\n\n.default {}\n\n.accent {\n  border-color: var(--color-primary);\n}\n`
);

console.log(`Initialized ${scope} component scaffold at ${targetDir}`);
console.log('Next: implement the component, then run node scripts/generate-registries.mjs and validate a presentation that uses it.');
