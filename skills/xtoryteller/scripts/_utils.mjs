import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export function parseArgs(argv) {
  const options = {};
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }

    const [rawKey, inlineValue] = value.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

    if (inlineValue != null) {
      options[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  return { options, positional };
}

export async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function removeDir(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export async function writeYaml(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, YAML.stringify(value, { lineWidth: 0 }));
}

export async function readYaml(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function toTitleCase(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function toPascalCase(name) {
  return String(name)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function resolveWorkspaceRoot(metaUrl) {
  let current = path.dirname(fileURLToPath(metaUrl));

  while (true) {
    const packageJson = path.join(current, 'package.json');
    if (existsSync(packageJson)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Could not find workspace root containing package.json.');
    }
    current = parent;
  }
}

export async function copyDirIfExists(sourcePath, targetPath) {
  if (!(await exists(sourcePath))) {
    return false;
  }

  await ensureDir(path.dirname(targetPath));
  await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
  return true;
}

export function normalizeList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
