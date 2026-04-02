import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { resolvePresentationYamlPath } from '@/lib/engine/presentation-layout-save';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { slug } = await params;
  const trimmed = String(slug ?? '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
  }

  try {
    const yamlPath = resolvePresentationYamlPath(trimmed);
    await fs.access(yamlPath);
  } catch {
    return NextResponse.json({ error: 'Presentation not found.' }, { status: 404 });
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000';
  try {
    const body = (await request.json().catch(() => null)) as { baseUrl?: string } | null;
    if (body?.baseUrl && typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      baseUrl = body.baseUrl.trim().replace(/\/$/, '');
    }
  } catch {
    // ignore invalid JSON
  }

  const root = process.cwd();
  const scriptPath = path.join(root, 'scripts', 'generate-presentation-thumbnail.mjs');
  const child = spawn(process.execPath, [scriptPath, '--slug', trimmed, '--base-url', baseUrl], {
    cwd: root,
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const logPrefix = `[thumbnail ${trimmed}]`;
  child.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(`${logPrefix} ${chunk.toString()}`);
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`${logPrefix} ${chunk.toString()}`);
  });
  child.on('error', (error) => {
    console.error(`${logPrefix} spawn error`, error);
  });
  child.unref();

  return NextResponse.json({ accepted: true }, { status: 202 });
}
