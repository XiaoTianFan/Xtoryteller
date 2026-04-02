import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  XTORYTELLER_GUIDES_DIR,
  XTORYTELLER_SKILL_DIR,
  XTORYTELLER_SKILL_MANIFEST_PATH
} from './skill-paths.mjs';

const root = process.cwd();

export class SkillConsistencyError extends Error {
  constructor(message) {
    super(`skill-consistency: ${message}`);
    this.name = 'SkillConsistencyError';
  }
}

function fail(message) {
  throw new SkillConsistencyError(message);
}

export async function validateSkillConsistency() {
  const initPath = path.join(
    root,
    'skills',
    'xtoryteller',
    'scripts',
    'init-presentation.mjs'
  );
  const initSource = await fs.readFile(initPath, 'utf8');

  if (!initSource.includes('themeArg')) {
    fail('init-presentation.mjs must use themeArg for optional theme locking.');
  }
  if (initSource.includes("options.theme ?? 'default'") || initSource.includes('options.theme ?? "default"')) {
    fail('init-presentation.mjs must not default theme to "default"; omit theme for dashboard inheritance.');
  }
  if (!initSource.includes('if (themeArg !== undefined)')) {
    fail('init-presentation.mjs must only set output.theme when --theme is provided.');
  }

  for (const requiredGuide of [
    'quick-route-matrix.md',
    'co-design-intake.md',
    'deploy-to-vercel.md',
  ]) {
    try {
      await fs.access(path.join(XTORYTELLER_GUIDES_DIR, requiredGuide));
    } catch {
      fail(`Missing ${path.relative(root, path.join(XTORYTELLER_GUIDES_DIR, requiredGuide))}`);
    }
  }

  try {
    const raw = await fs.readFile(XTORYTELLER_SKILL_MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(raw);
    if (typeof manifest.skillPackageVersion !== 'string' || !manifest.skillPackageVersion) {
      fail('skill-manifest.json must include a non-empty skillPackageVersion string.');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      fail(`Missing ${path.relative(root, XTORYTELLER_SKILL_MANIFEST_PATH)} (run npm run registries)`);
    }
    throw error;
  }

  const skillMd = await fs.readFile(path.join(XTORYTELLER_SKILL_DIR, 'SKILL.md'), 'utf8');
  if (!skillMd.includes('guides/quick-route-matrix.md')) {
    fail('SKILL.md should link to quick-route-matrix.md for Phase 2 routing.');
  }
  if (!skillMd.includes('guides/co-design-intake.md')) {
    fail('SKILL.md should link to co-design-intake.md for Phase 1.');
  }
  if (!skillMd.includes('guides/deploy-to-vercel.md')) {
    fail('SKILL.md should link to deploy-to-vercel.md for Phase 6.');
  }
  if (!skillMd.includes('## Execution flow (phases)')) {
    fail('SKILL.md should define the phased execution flow.');
  }

  console.log('skill-consistency: OK');
}

function isCliEntry() {
  return (
    Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  );
}

if (isCliEntry()) {
  try {
    await validateSkillConsistency();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
