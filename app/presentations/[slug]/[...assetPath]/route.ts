import fs from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  '.webp': 'image/webp'
};

function resolvePresentationAsset(slug: string, assetPath: string[]) {
  const presentationRoot = path.resolve(process.cwd(), 'presentations', slug);
  const target = path.resolve(presentationRoot, ...assetPath.map((segment) => decodeURIComponent(segment)));

  if (target !== presentationRoot && !target.startsWith(`${presentationRoot}${path.sep}`)) {
    return null;
  }

  return target;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; assetPath: string[] }> }
) {
  const { slug, assetPath } = await params;
  const target = resolvePresentationAsset(slug, assetPath);

  if (!target) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) {
      return new Response('Not found', { status: 404 });
    }

    const extension = path.extname(target).toLowerCase();
    const body = await fs.readFile(target);

    return new Response(body, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
