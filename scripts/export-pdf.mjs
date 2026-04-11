#!/usr/bin/env node
/**
 * Exports a presentation to PDF using Chromium's PDF print pipeline.
 *
 * This is intentionally not a screenshot workflow: the dedicated PDF route renders
 * DOM/SVG/text pages, then Playwright calls page.pdf().
 *
 * Usage: node scripts/export-pdf.mjs --slug <slug> [--output exports] [--base-url <url>]
 * Env: BASE_URL or NEXT_PUBLIC_BASE_URL as default when --base-url is omitted.
 * Env: PDF_DRY_RUN=1 — skip browser and file writes (for smoke tests).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PRESENTATIONS_DIR = path.join(ROOT, 'presentations');
const READY_SELECTOR = 'main.pdfExportShell[data-pdf-ready="true"]';

function parseArgs(argv) {
  const args = argv.slice(2);
  let slug = '';
  let output = path.join(ROOT, 'exports');
  let baseUrl = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3000';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--slug' && args[index + 1]) {
      slug = String(args[++index]).trim();
      continue;
    }

    if (arg === '--output' && args[index + 1]) {
      output = String(args[++index]).trim();
      continue;
    }

    if (arg === '--base-url' && args[index + 1]) {
      baseUrl = String(args[++index]).trim().replace(/\/$/, '');
      continue;
    }

    if (!arg.startsWith('--') && !slug) {
      slug = String(arg).trim();
    }
  }

  return {
    slug,
    output: path.resolve(output),
    baseUrl: baseUrl.replace(/\/$/, '')
  };
}

function presentationPdfUrl(baseUrl, slug) {
  return `${baseUrl}/${encodeURIComponent(slug)}/export/pdf`;
}

async function readPdfWarnings(page) {
  return page.locator('[data-pdf-warning]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      code: node.getAttribute('data-pdf-warning') ?? 'warning',
      message: node.textContent?.trim() ?? ''
    }))
  );
}

async function main() {
  const { slug, output, baseUrl } = parseArgs(process.argv);
  if (!slug) {
    console.error('Usage: node scripts/export-pdf.mjs --slug <slug> [--output exports] [--base-url <url>]');
    process.exit(1);
  }

  if (process.env.PDF_DRY_RUN === '1') {
    console.log('PDF_DRY_RUN=1 — skipping PDF export.');
    process.exit(0);
  }

  const presentationDir = path.join(PRESENTATIONS_DIR, slug);
  const yamlPath = path.join(presentationDir, 'presentation.yaml');
  await fs.access(yamlPath).catch(() => {
    throw new Error(`No presentation at ${yamlPath}`);
  });

  await fs.mkdir(output, { recursive: true });

  const targetUrl = presentationPdfUrl(baseUrl, slug);
  const pdfPath = path.join(output, `${slug}.pdf`);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 120_000 });
    await page.waitForSelector(READY_SELECTOR, { timeout: 60_000 });
    await page.evaluate(async () => {
      await document.fonts?.ready;
    });

    const warnings = await readPdfWarnings(page);
    for (const warning of warnings) {
      if (warning.message) {
        console.warn(`[pdf:${warning.code}] ${warning.message}`);
      }
    }

    await page.pdf({
      path: pdfPath,
      width: '13.333in',
      height: '7.5in',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
      tagged: true,
      outline: true
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`Exported PDF: ${pdfPath}`);
  console.log(`Source route: ${targetUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
