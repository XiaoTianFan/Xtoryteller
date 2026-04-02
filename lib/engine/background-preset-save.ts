import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

import { BACKGROUNDS_DIR, PROJECT_ROOT } from '@/lib/engine/constants';
import { parseYamlFile } from '@/lib/engine/yaml';
import {
  BackgroundPresetConfig,
  BackgroundPresetDefinitionEntry
} from '@/lib/types/background-preset';
import { CreateBackgroundPresetPayload } from '@/lib/types/dashboard-background';

import paperShaderSupportData from '@/lib/runtime/paper-shader-support.json';

interface PaperShaderSupportEntry {
  presets: string[];
  allowedParams: string[];
}

interface PaperShaderSupportFile {
  aliases: Record<string, string>;
  shaders: Record<string, PaperShaderSupportEntry>;
}

const XTORYTELLER_REGISTRIES_DIR = path.join(PROJECT_ROOT, 'skills', 'xtoryteller', 'references', 'registries');
const XTORYTELLER_SKILL_MANIFEST_PATH = path.join(PROJECT_ROOT, 'skills', 'xtoryteller', 'skill-manifest.json');

const paperShaderSupport = paperShaderSupportData as PaperShaderSupportFile;
const paperShaderNames = new Set(Object.keys(paperShaderSupport.shaders));

export class BackgroundPresetSaveError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'BackgroundPresetSaveError';
    this.status = status;
  }
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function slugifyPresetName(value: string) {
  const normalized = normalizeKey(value);
  return normalized || 'background-preset';
}

function normalizePaperShaderName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return paperShaderSupport.aliases[normalized] ?? (paperShaderNames.has(normalized) ? normalized : null);
}

function normalizePaperShaderPresetName(shader: string, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const normalized = normalizeKey(value);
  return paperShaderSupport.shaders[shader]?.presets.find((preset) => normalizeKey(preset) === normalized);
}

function cleanStringArray(value: string[] | undefined) {
  const normalized = (value ?? []).map((entry) => entry.trim()).filter(Boolean);
  return normalized.length ? normalized : undefined;
}

function cleanParams(shader: string, params: Record<string, unknown> | undefined) {
  const support = paperShaderSupport.shaders[shader];
  const allowedParams = new Set(support.allowedParams);
  const cleanedEntries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== '');

  for (const [key] of cleanedEntries) {
    if (!allowedParams.has(key)) {
      throw new BackgroundPresetSaveError(400, `Background parameter "${key}" is not supported for shader "${shader}".`);
    }
  }

  return Object.fromEntries(cleanedEntries);
}

function buildPresetConfig(payload: CreateBackgroundPresetPayload): BackgroundPresetConfig {
  const name = payload.name.trim();
  if (!name) {
    throw new BackgroundPresetSaveError(400, 'Preset name is required.');
  }

  const shader = normalizePaperShaderName(payload.shader);
  if (!shader) {
    throw new BackgroundPresetSaveError(400, `Unsupported Paper shader "${payload.shader}".`);
  }

  const preset = normalizePaperShaderPresetName(shader, payload.preset);
  if (payload.preset && !preset) {
    throw new BackgroundPresetSaveError(
      400,
      `Unsupported preset "${payload.preset}" for shader "${shader}".`
    );
  }

  const config: BackgroundPresetConfig = {
    name,
    ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
    ...(cleanStringArray(payload.tags) ? { tags: cleanStringArray(payload.tags) } : {}),
    shader,
    ...(preset ? { preset } : {}),
    ...(Object.keys(cleanParams(shader, payload.params)).length
      ? { params: cleanParams(shader, payload.params) }
      : {})
  };

  return config;
}

async function writeBackgroundRegistryArtifacts(
  backgroundsDir: string,
  registriesDir: string,
  skillManifestPath: string
) {
  const presetPaths = await fg('*.yaml', {
    cwd: backgroundsDir,
    absolute: true,
    onlyFiles: true
  });

  const backgrounds = await Promise.all(
    presetPaths.map(async (presetPath) => {
      const preset = await parseYamlFile<BackgroundPresetConfig>(presetPath);
      return {
        slug: path.basename(presetPath, '.yaml'),
        name: preset.name,
        description: preset.description,
        tags: preset.tags ?? [],
        shader: preset.shader,
        preset: preset.preset
      };
    })
  );
  backgrounds.sort((left, right) => left.slug.localeCompare(right.slug));

  await fs.mkdir(registriesDir, { recursive: true });
  await fs.writeFile(
    path.join(registriesDir, 'background-registry.json'),
    `${JSON.stringify({ count: backgrounds.length, backgrounds }, null, 2)}\n`,
    'utf8'
  );

  const manifestSource = await fs.readFile(skillManifestPath, 'utf8').catch(() => '{}');
  const manifest = JSON.parse(manifestSource) as {
    lastRegistryCounts?: Record<string, number>;
    lastRegistryGeneration?: string;
  };

  await fs.writeFile(
    skillManifestPath,
    `${JSON.stringify(
      {
        ...manifest,
        lastRegistryGeneration: new Date().toISOString(),
        lastRegistryCounts: {
          ...(manifest.lastRegistryCounts ?? {}),
          backgrounds: backgrounds.length
        }
      },
      null,
      2
    )}\n`,
    'utf8'
  );
}

export async function saveBackgroundPreset(
  payload: CreateBackgroundPresetPayload,
  options?: {
    backgroundsDir?: string;
    registriesDir?: string;
    skillManifestPath?: string;
  }
): Promise<BackgroundPresetDefinitionEntry> {
  const backgroundsDir = options?.backgroundsDir ?? BACKGROUNDS_DIR;
  const registriesDir = options?.registriesDir ?? XTORYTELLER_REGISTRIES_DIR;
  const skillManifestPath = options?.skillManifestPath ?? XTORYTELLER_SKILL_MANIFEST_PATH;
  const config = buildPresetConfig(payload);
  const slug = slugifyPresetName(config.name);
  const targetPath = path.join(backgroundsDir, `${slug}.yaml`);

  try {
    await fs.access(targetPath);
    throw new BackgroundPresetSaveError(409, `A background preset named "${slug}" already exists.`);
  } catch (error) {
    if (error instanceof BackgroundPresetSaveError) {
      throw error;
    }
  }

  await fs.mkdir(backgroundsDir, { recursive: true });
  await fs.writeFile(targetPath, YAML.stringify(config), 'utf8');
  await writeBackgroundRegistryArtifacts(backgroundsDir, registriesDir, skillManifestPath);

  return {
    slug,
    name: config.name,
    description: config.description,
    tags: config.tags ?? [],
    shader: config.shader,
    preset: config.preset,
    config
  };
}

export { slugifyPresetName };
