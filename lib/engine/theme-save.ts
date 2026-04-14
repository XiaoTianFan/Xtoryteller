import fs from 'node:fs/promises';
import path from 'node:path';

import YAML from 'yaml';

import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolveThemeBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { THEMES_DIR } from '@/lib/engine/constants';
import { validateThemeConfig, ThemeValidationError } from '@/lib/engine/theme-validation';
import type { ThemeSavePayload } from '@/lib/types/theme-editor';
import type { DashboardThemeEntry } from '@/lib/types/dashboard-background';
import type { ThemeConfig } from '@/lib/types/theme';

export class ThemeSaveError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ThemeSaveError';
    this.status = status;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => stripUndefinedDeep(entry)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)])
  ) as T;
}

function resolveThemeYamlPath(slug: string, themesDir: string) {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    throw new ThemeSaveError(400, 'Theme slug is required.');
  }

  const baseDir = path.resolve(themesDir);
  const targetPath = path.resolve(baseDir, `${trimmedSlug}.yaml`);
  if (!targetPath.startsWith(baseDir)) {
    throw new ThemeSaveError(400, 'Theme slug is invalid.');
  }

  return targetPath;
}

function readThemePayload(payload: ThemeSavePayload | null | undefined): ThemeConfig {
  if (!payload?.theme || typeof payload.theme !== 'object') {
    throw new ThemeSaveError(400, 'Request body must include a theme object.');
  }

  return payload.theme;
}

export async function saveThemeBySlug(
  slug: string,
  payload: ThemeSavePayload | null | undefined,
  options?: {
    themesDir?: string;
    projectRoot?: string;
  }
): Promise<DashboardThemeEntry> {
  const themesDir = options?.themesDir ?? THEMES_DIR;
  const theme = stripUndefinedDeep(readThemePayload(payload));
  const targetPath = resolveThemeYamlPath(slug, themesDir);

  try {
    await fs.access(targetPath);
  } catch {
    throw new ThemeSaveError(404, `Theme "${slug}" does not exist.`);
  }

  try {
    await validateThemeConfig(theme, { projectRoot: options?.projectRoot });
  } catch (error) {
    if (error instanceof ThemeValidationError) {
      throw new ThemeSaveError(400, error.issues.join(' '));
    }

    throw error;
  }

  await fs.writeFile(targetPath, YAML.stringify(theme), 'utf8');

  const presetMap = await loadBackgroundPresetMap();

  return {
    slug,
    name: theme.name,
    sourceTheme: theme,
    theme: resolveThemeBackgroundPresetRefs(theme, presetMap)
  };
}
