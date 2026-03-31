import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const root = process.cwd();

async function parseYaml(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

async function scanNames(baseDir) {
  const manifestPaths = await fg('*/manifest.yaml', {
    cwd: path.join(root, baseDir),
    absolute: true,
    onlyFiles: true
  });
  return new Set(
    await Promise.all(
      manifestPaths.map(async (manifestPath) => {
        const manifest = await parseYaml(manifestPath);
        return manifest.name || path.basename(path.dirname(manifestPath));
      })
    )
  );
}

async function themeNames() {
  const themePaths = await fg('*.yaml', {
    cwd: path.join(root, 'themes'),
    absolute: true,
    onlyFiles: true
  });
  return new Set(themePaths.map((themePath) => path.basename(themePath, '.yaml')));
}

function collectTransitions(config) {
  return [
    ...(config.steps?.map((step) => step.transition).filter(Boolean) ?? []),
    ...(config.clusters?.map((cluster) => cluster.transition).filter(Boolean) ?? [])
  ];
}

export async function validatePresentation(targetPath) {
  const [schema, componentSet, layoutSet, transitionSet, themeSet] = await Promise.all([
    JSON.parse(await fs.readFile(path.join(root, 'skills', 'references', 'schema.json'), 'utf8')),
    scanNames('components'),
    scanNames('layouts'),
    scanNames('transitions'),
    themeNames()
  ]);

  const config = await parseYaml(targetPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(config);
  const errors = [];

  if (!valid && validate.errors) {
    for (const error of validate.errors) {
      errors.push(`${error.instancePath || '/'} ${error.message}`);
    }
  }

  if (!themeSet.has(config.theme)) {
    errors.push(`Unknown theme \"${config.theme}\".`);
  }

  for (const step of config.steps ?? []) {
    if (!layoutSet.has(step.layout)) {
      errors.push(`Unknown layout \"${step.layout}\".`);
    }
    for (const component of step.components ?? []) {
      if (!componentSet.has(component.type)) {
        errors.push(`Unknown component \"${component.type}\".`);
      }
    }
  }

  for (const cluster of config.clusters ?? []) {
    if (!layoutSet.has(cluster.layout)) {
      errors.push(`Unknown layout \"${cluster.layout}\".`);
    }
    for (const component of cluster.components ?? []) {
      if (!componentSet.has(component.type)) {
        errors.push(`Unknown component \"${component.type}\".`);
      }
    }
  }

  for (const transition of collectTransitions(config)) {
    if (!transitionSet.has(transition)) {
      errors.push(`Unknown transition \"${transition}\".`);
    }
  }

  if (errors.length) {
    console.error(`Validation failed for ${targetPath}:`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    throw new Error(`Validation failed for ${targetPath}`);
  }

  const count = config.mode === 'map' ? config.clusters?.length ?? 0 : config.steps?.length ?? 0;
  console.log(`OK ${targetPath} (${config.mode}, ${count} units)`);
}

const target = process.argv[2];
if (target) {
  validatePresentation(path.resolve(target)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
