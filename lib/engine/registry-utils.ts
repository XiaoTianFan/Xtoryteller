import fg from 'fast-glob';
import path from 'node:path';

import { parseYamlFile } from '@/lib/engine/yaml';
import { toPosixPath } from '@/lib/engine/fs';

export interface RegistryEntry<T> {
  filePath: string;
  manifest: T;
}

export async function scanManifestDirectory<T>(directory: string): Promise<RegistryEntry<T>[]> {
  const manifestPaths = await fg('*/manifest.yaml', {
    cwd: directory,
    absolute: true,
    onlyFiles: true
  });

  const entries = await Promise.all(
    manifestPaths.map(async (manifestPath) => ({
      filePath: manifestPath,
      manifest: await parseYamlFile<T>(manifestPath)
    }))
  );

  return entries.sort((left, right) => toPosixPath(left.filePath).localeCompare(toPosixPath(right.filePath)));
}

export function deriveNameFromPath(filePath: string): string {
  return path.basename(path.dirname(filePath));
}
