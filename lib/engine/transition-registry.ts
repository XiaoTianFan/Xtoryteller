import { TRANSITIONS_DIR } from '@/lib/engine/constants';
import { deriveNameFromPath, scanManifestDirectory } from '@/lib/engine/registry-utils';
import { TransitionManifest } from '@/lib/types/manifest';

export async function loadTransitionRegistry() {
  const entries = await scanManifestDirectory<TransitionManifest>(TRANSITIONS_DIR);

  return entries.map(({ filePath, manifest }) => ({
    ...manifest,
    name: manifest.name || deriveNameFromPath(filePath)
  }));
}
