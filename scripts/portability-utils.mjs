import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fg from 'fast-glob';
import YAML from 'yaml';

export const ROOT = process.cwd();
export const PRESENTATIONS_DIR = path.join(ROOT, 'presentations');
export const COMPONENTS_DIR = path.join(ROOT, 'components');
export const LAYOUTS_DIR = path.join(ROOT, 'layouts');
export const TRANSITIONS_DIR = path.join(ROOT, 'transitions');
export const THEMES_DIR = path.join(ROOT, 'themes');

const ASSET_KEYS = new Set(['src', 'poster', 'avatar', 'file', 'href']);

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

export async function ensureCleanDir(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
  await ensureDir(targetPath);
}

export async function parseYamlFile(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

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
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    if (inlineValue != null) {
      options[key] = inlineValue;
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue && !nextValue.startsWith('--')) {
      options[key] = nextValue;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  return { options, positional };
}

function presentationUnits(config) {
  return [...(config.steps ?? []), ...(config.clusters ?? [])];
}

export function collectDependencyNames(config) {
  const components = new Set();
  const layouts = new Set();
  const transitions = new Set();

  for (const unit of presentationUnits(config)) {
    layouts.add(unit.layout);

    if (unit.transition) {
      transitions.add(unit.transition);
    }

    for (const component of unit.components ?? []) {
      components.add(component.type);
    }
  }

  return {
    components: [...components].sort(),
    layouts: [...layouts].sort(),
    transitions: [...transitions].sort()
  };
}

function isLocalAssetPath(value) {
  return typeof value === 'string' && value.trim() && !/^(https?:|data:|\/)/i.test(value) && !value.startsWith('#');
}

function scanForAssets(value, output) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      scanForAssets(entry, output);
    }
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (ASSET_KEYS.has(key) && isLocalAssetPath(nested)) {
      output.add(String(nested).replace(/^\.\//, ''));
    }

    scanForAssets(nested, output);
  }
}

export function collectAssetReferences(config) {
  const assets = new Set();

  if (config.meta?.thumbnail && isLocalAssetPath(config.meta.thumbnail)) {
    assets.add(String(config.meta.thumbnail).replace(/^\.\//, ''));
  }

  for (const unit of presentationUnits(config)) {
    for (const component of unit.components ?? []) {
      scanForAssets(component.props, assets);
    }
  }

  return [...assets].sort();
}

export async function resolvePresentationSource(input) {
  if (!input) {
    throw new Error('A presentation path or slug is required.');
  }

  const direct = path.resolve(input);
  if (await exists(direct)) {
    return direct;
  }

  const inPresentations = path.join(PRESENTATIONS_DIR, input);
  if (await exists(inPresentations)) {
    return inPresentations;
  }

  throw new Error(`Presentation source not found: ${input}`);
}

async function runCommand(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 'unknown'}.`));
    });
    child.on('error', reject);
  });
}

export async function createArchive(sourceDir, archivePath) {
  await ensureDir(path.dirname(archivePath));
  await fs.rm(archivePath, { force: true });

  const sourceParent = path.dirname(sourceDir);
  const sourceName = path.basename(sourceDir);

  if (process.platform === 'win32') {
    await runCommand('powershell', ['-NoProfile', '-Command', `Compress-Archive -LiteralPath '${sourceName}' -DestinationPath '${archivePath}' -Force`], sourceParent);
    return;
  }

  await runCommand('tar', ['-a', '-cf', archivePath, sourceName], sourceParent);
}

export async function extractArchive(archivePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-import-'));

  if (process.platform === 'win32') {
    await runCommand('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${tempDir}' -Force`], ROOT);
  } else {
    await runCommand('tar', ['-xf', archivePath, '-C', tempDir], ROOT);
  }

  return tempDir;
}

export async function findPackageRoot(sourcePath) {
  const stats = await fs.stat(sourcePath);
  if (!stats.isDirectory()) {
    throw new Error(`Package path is not a directory: ${sourcePath}`);
  }

  const directPresentation = path.join(sourcePath, 'presentation.yaml');
  if (await exists(directPresentation)) {
    return sourcePath;
  }

  const matches = await fg('**/presentation.yaml', {
    cwd: sourcePath,
    absolute: true,
    deep: 3,
    onlyFiles: true
  });

  const bestMatch = matches.sort((left, right) => left.length - right.length)[0];
  if (!bestMatch) {
    throw new Error(`No presentation.yaml found inside ${sourcePath}`);
  }

  return path.dirname(bestMatch);
}

async function dependencyExists(packageDir, subdir, name, globalDir) {
  const inPackage = await exists(path.join(packageDir, subdir, name));
  const inGlobal = await exists(path.join(globalDir, name));
  return { inPackage, inGlobal };
}

export async function validatePackageDirectory(packageDir, options = {}) {
  const presentationPath = path.join(packageDir, 'presentation.yaml');
  if (!(await exists(presentationPath))) {
    throw new Error(`Missing presentation.yaml in ${packageDir}`);
  }

  const config = await parseYamlFile(presentationPath);
  const dependencies = collectDependencyNames(config);
  const issues = [];
  const checkSlugConflict = options.checkSlugConflict ?? true;

  let packagedComponents = 0;
  let globalComponents = 0;
  for (const name of dependencies.components) {
    const resolution = await dependencyExists(packageDir, 'components', name, COMPONENTS_DIR);
    if (resolution.inPackage) {
      packagedComponents += 1;
    } else if (resolution.inGlobal) {
      globalComponents += 1;
    } else {
      issues.push({ severity: 'error', message: `Component "${name}" is not available in the package or global library.` });
    }
  }

  let packagedLayouts = 0;
  let globalLayouts = 0;
  for (const name of dependencies.layouts) {
    const resolution = await dependencyExists(packageDir, 'layouts', name, LAYOUTS_DIR);
    if (resolution.inPackage) {
      packagedLayouts += 1;
    } else if (resolution.inGlobal) {
      globalLayouts += 1;
    } else {
      issues.push({ severity: 'error', message: `Layout "${name}" is not available in the package or global library.` });
    }
  }

  let packagedTransitions = 0;
  let globalTransitions = 0;
  for (const name of dependencies.transitions) {
    const resolution = await dependencyExists(packageDir, 'transitions', name, TRANSITIONS_DIR);
    if (resolution.inPackage) {
      packagedTransitions += 1;
    } else if (resolution.inGlobal) {
      globalTransitions += 1;
    } else {
      issues.push({ severity: 'error', message: `Transition "${name}" is not available in the package or global library.` });
    }
  }

  const themeInPackage = await exists(path.join(packageDir, 'theme.yaml'));
  const themeInGlobal = await exists(path.join(THEMES_DIR, `${config.theme}.yaml`));
  if (!themeInPackage && !themeInGlobal) {
    issues.push({ severity: 'warning', message: `Theme "${config.theme}" is missing. The import will fall back unless the theme is provided.` });
  }

  const assetReferences = collectAssetReferences(config);
  for (const assetRef of assetReferences) {
    const assetPath = path.join(packageDir, assetRef);
    if (!(await exists(assetPath))) {
      issues.push({ severity: 'error', message: `Referenced asset "${assetRef}" is missing from the package.` });
    }
  }

  const targetPresentationDir = path.join(PRESENTATIONS_DIR, config.meta.slug);
  if (checkSlugConflict && (await exists(targetPresentationDir))) {
    issues.push({ severity: 'warning', message: `Slug conflict: presentations/${config.meta.slug} already exists.` });
  }

  return {
    config,
    issues,
    valid: !issues.some((issue) => issue.severity === 'error'),
    summary: {
      packagedComponents,
      globalComponents,
      packagedLayouts,
      globalLayouts,
      packagedTransitions,
      globalTransitions,
      themeInPackage,
      themeInGlobal,
      assetCount: assetReferences.length
    }
  };
}

export async function copyDirectory(sourcePath, destinationPath, force = true) {
  await fs.rm(destinationPath, { recursive: true, force: true });
  await ensureDir(path.dirname(destinationPath));
  await fs.cp(sourcePath, destinationPath, { recursive: true, force });
}

export async function copyNamedDependencies(sourceRoot, destinationRoot, names, force = true) {
  const copied = [];

  for (const name of names) {
    const sourcePath = path.join(sourceRoot, name);
    if (!(await exists(sourcePath))) {
      continue;
    }

    const destinationPath = path.join(destinationRoot, name);
    await copyDirectory(sourcePath, destinationPath, force);
    copied.push(name);
  }

  return copied;
}

export async function listDirectoryNames(targetPath) {
  if (!(await exists(targetPath))) {
    return [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
