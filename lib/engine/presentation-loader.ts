import path from 'node:path';

import { PRESENTATIONS_DIR } from '@/lib/engine/constants';
import { readDirectoryNames } from '@/lib/engine/fs';
import { applyTemplateExpressions } from '@/lib/engine/template-engine';
import { parseYamlFile } from '@/lib/engine/yaml';
import { PresentationConfig, PresentationIndexEntry } from '@/lib/types/presentation';

function countPresentationUnits(config: PresentationConfig): number {
  return config.mode === 'map' ? config.clusters?.length ?? 0 : config.steps?.length ?? 0;
}

export async function loadPresentationBySlug(slug: string): Promise<PresentationConfig> {
  const filePath = path.join(PRESENTATIONS_DIR, slug, 'presentation.yaml');
  const config = await parseYamlFile<PresentationConfig>(filePath);

  if (config.data) {
    return applyTemplateExpressions(config, config.data) as PresentationConfig;
  }

  return config;
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
        thumbnail: config.meta.thumbnail
      } satisfies PresentationIndexEntry;
    })
  );

  return entries.sort((left, right) => left.title.localeCompare(right.title));
}

export async function listPresentationSlugs(): Promise<string[]> {
  const entries = await loadPresentationIndex();
  return entries.map((entry) => entry.slug);
}
