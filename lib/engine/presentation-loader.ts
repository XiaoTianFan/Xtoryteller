import path from 'node:path';

import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolvePresentationBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { PRESENTATIONS_DIR } from '@/lib/engine/constants';
import { readDirectoryNames } from '@/lib/engine/fs';
import { applyTemplateExpressions } from '@/lib/engine/template-engine';
import { parseYamlFile } from '@/lib/engine/yaml';
import { ComponentInstance, PresentationConfig, PresentationIndexEntry } from '@/lib/types/presentation';

function countPresentationUnits(config: PresentationConfig): number {
  return config.mode === 'map' ? config.clusters?.length ?? 0 : config.steps?.length ?? 0;
}

function extractValues(value: unknown, output: string[]): void {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }

  if (typeof value === 'number') {
    output.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractValues(item, output);
    }
    return;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      extractValues(nested, output);
    }
  }
}

function collectComponentSearchText(component: ComponentInstance): string[] {
  const values: string[] = [component.type];

  if (component.content) {
    values.push(component.content);
  }

  extractValues(component.props, values);
  return values;
}

function buildSearchText(config: PresentationConfig): string {
  const values: string[] = [
    config.meta.title,
    config.meta.description ?? '',
    config.meta.author ?? '',
    ...(config.meta.tags ?? [])
  ];

  for (const step of config.steps ?? []) {
    values.push(step.id ?? '', step.title ?? '', step.layout);
    for (const component of step.components) {
      values.push(...collectComponentSearchText(component));
    }
  }

  for (const cluster of config.clusters ?? []) {
    values.push(cluster.id, cluster.title ?? '', cluster.description ?? '', cluster.group ?? '', cluster.layout);
    for (const component of cluster.components) {
      values.push(...collectComponentSearchText(component));
    }
  }

  return values.join(' ').toLowerCase();
}

function findComponentPreviewAsset(slug: string, component: ComponentInstance): string | undefined {
  const src = typeof component.props?.src === 'string' ? component.props.src : null;
  if (!src) {
    return undefined;
  }

  if (component.type === 'image' || component.type === 'video' || component.type === 'svg-graphic') {
    return resolveAssetPath(slug, src);
  }

  return undefined;
}

function findPreviewAsset(config: PresentationConfig): string | undefined {
  if (config.meta.thumbnail) {
    return resolveAssetPath(config.meta.slug, config.meta.thumbnail);
  }

  for (const step of config.steps ?? []) {
    for (const component of step.components) {
      const preview = findComponentPreviewAsset(config.meta.slug, component);
      if (preview) {
        return preview;
      }
    }
  }

  for (const cluster of config.clusters ?? []) {
    for (const component of cluster.components) {
      const preview = findComponentPreviewAsset(config.meta.slug, component);
      if (preview) {
        return preview;
      }
    }
  }

  return undefined;
}

export async function loadPresentationBySlug(slug: string): Promise<PresentationConfig> {
  const filePath = path.join(PRESENTATIONS_DIR, slug, 'presentation.yaml');
  const config = await parseYamlFile<PresentationConfig>(filePath);
  const presetMap = await loadBackgroundPresetMap();
  const hydratedConfig = config.data
    ? (applyTemplateExpressions(config, config.data) as PresentationConfig)
    : config;

  return resolvePresentationBackgroundPresetRefs(hydratedConfig, presetMap);
}

export async function loadPresentationIndex(): Promise<PresentationIndexEntry[]> {
  const slugs = await readDirectoryNames(PRESENTATIONS_DIR);

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const config = await loadPresentationBySlug(slug);
      return {
        slug: config.meta.slug,
        title: config.meta.title,
        description: config.meta.description,
        tags: config.meta.tags ?? [],
        author: config.meta.author,
        mode: config.mode,
        stepCount: countPresentationUnits(config),
        updatedAt: config.meta.updatedAt,
        createdAt: config.meta.createdAt,
        thumbnail: config.meta.thumbnail,
        previewAsset: findPreviewAsset(config),
        searchText: buildSearchText(config)
      } satisfies PresentationIndexEntry;
    })
  );

  return entries.sort((left, right) => left.title.localeCompare(right.title));
}

export async function listPresentationSlugs(): Promise<string[]> {
  const entries = await loadPresentationIndex();
  return entries.map((entry) => entry.slug);
}
