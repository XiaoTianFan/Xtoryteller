import { LAYOUTS_DIR } from '@/lib/engine/constants';
import { deriveNameFromPath, scanManifestDirectory } from '@/lib/engine/registry-utils';
import { LayoutManifest } from '@/lib/types/manifest';

export async function loadLayoutRegistry() {
  const entries = await scanManifestDirectory<LayoutManifest>(LAYOUTS_DIR);

  return entries.map(({ filePath, manifest }) => ({
    ...manifest,
    name: manifest.name || deriveNameFromPath(filePath)
  }));
}
