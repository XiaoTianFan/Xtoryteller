import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

const port = Number(process.env.NEXT_PUBLIC_WS_PORT ?? 3001);
const server = new WebSocketServer({ port });
const watcher = chokidar.watch([
  'presentations/**/presentation.yaml',
  'themes/*.yaml',
  'components/*/manifest.yaml',
  'layouts/*/manifest.yaml',
  'transitions/*/manifest.yaml'
], {
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  const payload = JSON.stringify({ type: 'content-changed', filePath });
  for (const client of server.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});

console.log(`Xtoryteller watcher listening on ws://localhost:${port}`);
