import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

import { generateRegistries } from './generate-registries.mjs';
import { syncPresentationAssets } from './presentation-assets.mjs';

const port = Number(process.env.NEXT_PUBLIC_WS_PORT ?? 3001);
const server = new WebSocketServer({ port });

await syncPresentationAssets();
await generateRegistries();

let assetSyncTimer;
function scheduleAssetSync() {
  clearTimeout(assetSyncTimer);
  assetSyncTimer = setTimeout(() => {
    syncPresentationAssets().catch((error) => {
      console.error('Failed to sync presentation assets.');
      console.error(error);
    });
  }, 100);
}

let registrySyncTimer;
function scheduleRegistrySync() {
  clearTimeout(registrySyncTimer);
  registrySyncTimer = setTimeout(() => {
    generateRegistries().catch((error) => {
      console.error('Failed to regenerate skill registries.');
      console.error(error);
    });
  }, 100);
}

const watcher = chokidar.watch([
  'presentations/**/presentation.yaml',
  'presentations/**/assets/**/*',
  'presentations/**/components/*/manifest.yaml',
  'presentations/**/layouts/*/manifest.yaml',
  'presentations/**/transitions/*/manifest.yaml',
  'themes/*.yaml',
  'components/*/manifest.yaml',
  'layouts/*/manifest.yaml',
  'transitions/*/manifest.yaml'
], {
  ignoreInitial: true
});

watcher.on('all', (_eventName, filePath) => {
  if (/[/\\]assets[/\\]/.test(filePath)) {
    scheduleAssetSync();
  }

  if (
    /^themes[/\\].+\.yaml$/i.test(filePath) ||
    /^(components|layouts|transitions)[/\\][^/\\]+[/\\]manifest\.yaml$/i.test(filePath) ||
    /^presentations[/\\][^/\\]+[/\\](components|layouts|transitions)[/\\][^/\\]+[/\\]manifest\.yaml$/i.test(filePath)
  ) {
    scheduleRegistrySync();
  }

  const payload = JSON.stringify({ type: 'content-changed', filePath });
  for (const client of server.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});

console.log(`Xtoryteller watcher listening on ws://localhost:${port}`);
