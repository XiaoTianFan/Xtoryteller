import { COMPONENTS_DIR } from '@/lib/engine/constants';
import { deriveNameFromPath, scanManifestDirectory } from '@/lib/engine/registry-utils';
import { ComponentManifest } from '@/lib/types/manifest';

export async function loadComponentRegistry() {
  const entries = await scanManifestDirectory<ComponentManifest>(COMPONENTS_DIR);

  return entries.map(({ filePath, manifest }) => ({
    ...manifest,
    name: manifest.name || deriveNameFromPath(filePath)
  }));
}
