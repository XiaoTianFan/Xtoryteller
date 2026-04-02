#!/usr/bin/env node
/**
 * Captures the presentation viewer at 1280×720 and writes presentations/<slug>/assets/thumbnail.png,
 * then sets meta.thumbnail to ./assets/thumbnail.png in presentation.yaml.
 *
 * Requires a running Next dev server (or equivalent) so the page is reachable.
 * Uses Playwright Chromium (run `npx playwright install chromium` if browsers are missing).
 *
 * Usage: node scripts/generate-presentation-thumbnail.mjs --slug <slug> [--base-url <url>]
 * Env: BASE_URL or NEXT_PUBLIC_BASE_URL as default when --base-url is omitted.
 * Env: THUMBNAIL_DRY_RUN=1 — skip browser and file writes (for smoke tests).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import YAML, { isMap } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PRESENTATIONS_DIR = path.join(ROOT, 'presentations');
const THUMB_RELATIVE = './assets/thumbnail.png';
const VIEWPORT = { width: 1280, height: 720 };
const READY_SELECTOR = 'main.viewerShell[data-xt-presenter-ready="true"]';

function parseArgs(argv) {
  const args = argv.slice(2);
  let slug = '';
  let baseUrl = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3000';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--slug' && args[i + 1]) {
      slug = String(args[++i]).trim();
      continue;
    }
    if (a === '--base-url' && args[i + 1]) {
      baseUrl = String(args[++i]).trim().replace(/\/$/, '');
      continue;
    }
  }
  return { slug, baseUrl };
}

function presentationUrl(baseUrl, slug) {
  const root = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${root}/${encodeURIComponent(slug)}/`;
}

async function setMetaThumbnail(yamlPath) {
  const source = await fs.readFile(yamlPath, 'utf8');
  const document = YAML.parseDocument(source);
  const metaNode = document.get('meta', true);
  if (!isMap(metaNode)) {
    throw new Error('Presentation YAML is missing the meta block.');
  }
  metaNode.set('thumbnail', THUMB_RELATIVE);
  await fs.writeFile(yamlPath, String(document), 'utf8');
}

async function main() {
  const { slug, baseUrl } = parseArgs(process.argv);
  if (!slug) {
    console.error('Usage: node scripts/generate-presentation-thumbnail.mjs --slug <slug> [--base-url <url>]');
    process.exit(1);
  }

  if (process.env.THUMBNAIL_DRY_RUN === '1') {
    console.log('THUMBNAIL_DRY_RUN=1 — skipping capture.');
    process.exit(0);
  }

  const presentationDir = path.join(PRESENTATIONS_DIR, slug);
  const yamlPath = path.join(presentationDir, 'presentation.yaml');
  const assetsDir = path.join(presentationDir, 'assets');
  const pngPath = path.join(assetsDir, 'thumbnail.png');

  await fs.access(yamlPath).catch(() => {
    throw new Error(`No presentation at ${yamlPath}`);
  });

  await fs.mkdir(assetsDir, { recursive: true });

  const targetUrl = presentationUrl(baseUrl, slug);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize(VIEWPORT);
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 120_000 });
    await page.waitForSelector(READY_SELECTOR, { timeout: 60_000 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.screenshot({ path: pngPath, type: 'png' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  await setMetaThumbnail(yamlPath);

  const { syncPresentationAssets } = await import('./presentation-assets.mjs');
  await syncPresentationAssets();

  console.log(`Wrote ${pngPath} and set meta.thumbnail (${targetUrl})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
