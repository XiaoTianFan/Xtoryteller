#!/usr/bin/env node
/**
 * Exports a presentation to PDF using Chromium's print pipeline.
 *
 * The dedicated PDF route renders DOM/SVG/text pages. The exporter uses the
 * semantic print path when Chromium can preserve the route faithfully, and
 * switches to rendered-page rasterization for shader/WebGL-heavy decks.
 *
 * Usage: node scripts/export-pdf.mjs --slug <slug> [--output exports] [--base-url <url>] [--raster-scale 1-4]
 * Env: BASE_URL or NEXT_PUBLIC_BASE_URL as default when --base-url is omitted.
 * Env: PDF_RASTER_SCALE or PDF_MAP_SCALE as default when --raster-scale is omitted.
 * Env: PDF_DRY_RUN=1 — skip browser and file writes (for smoke tests).
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PRESENTATIONS_DIR = path.join(ROOT, 'presentations');
const READY_SELECTOR = 'main.pdfExportShell[data-pdf-ready="true"]';
const PDF_WIDTH = '13.333in';
const PDF_HEIGHT = '7.5in';

const PAGE_PDF_OPTIONS = {
  width: PDF_WIDTH,
  height: PDF_HEIGHT,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  printBackground: true,
  tagged: true,
  outline: true
};

const STATIC_STAGE_SHADER_BACKGROUND = `
  radial-gradient(circle at 18% 22%, rgba(100, 122, 255, 0.18), transparent 34%),
  radial-gradient(circle at 82% 72%, rgba(86, 214, 197, 0.13), transparent 38%),
  radial-gradient(circle at 48% 18%, rgba(255, 103, 36, 0.09), transparent 30%),
  repeating-linear-gradient(90deg, rgba(121, 142, 255, 0.045) 0 1px, transparent 1px 96px),
  repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 72px),
  linear-gradient(120deg, #0b101b 0%, #090d14 42%, #06080c 100%)
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  let slug = '';
  let output = path.join(ROOT, 'exports');
  let baseUrl = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3000';
  let rasterScale = Number(process.env.PDF_RASTER_SCALE ?? process.env.PDF_MAP_SCALE ?? 2);

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

    if ((arg === '--raster-scale' || arg === '--map-scale') && args[index + 1]) {
      rasterScale = Number(args[++index]);
      continue;
    }

    if (!arg.startsWith('--') && !slug) {
      slug = String(arg).trim();
    }
  }

  return {
    slug,
    output: path.resolve(output),
    baseUrl: baseUrl.replace(/\/$/, ''),
    rasterScale: Math.min(4, Math.max(1, Number.isFinite(rasterScale) ? rasterScale : 2))
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

async function readPresentationMode(yamlPath) {
  const source = await fs.readFile(yamlPath, 'utf8');
  const config = YAML.parse(source);
  return config?.mode === 'map' ? 'map' : 'stage';
}

async function settleRenderedPage(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      })
  );
}

async function fitRasterizedStagePages(page) {
  await page.evaluate(() => {
    const minScale = 0.72;
    const pageInset = 16;

    const toPixels = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const fitNode = (container, node, pageElement) => {
      if (!container || !node || !pageElement) {
        return;
      }

      node.style.removeProperty('transform');
      node.style.removeProperty('transform-origin');
      node.style.removeProperty('width');
      node.style.removeProperty('margin-left');

      const containerStyles = window.getComputedStyle(container);
      const nodeStyles = window.getComputedStyle(node);
      const verticalPadding =
        toPixels(containerStyles.paddingTop) +
        toPixels(containerStyles.paddingBottom) +
        toPixels(nodeStyles.marginTop) +
        toPixels(nodeStyles.marginBottom);
      const availableHeight = Math.max(1, container.clientHeight - verticalPadding - pageInset);
      const requiredHeight = Math.max(node.scrollHeight, node.getBoundingClientRect().height);

      if (requiredHeight <= availableHeight) {
        return;
      }

      const scale = Math.max(minScale, Math.min(1, availableHeight / requiredHeight));
      node.style.transform = `scale(${scale})`;
      node.style.transformOrigin = 'center top';
      node.style.width = `${100 / scale}%`;
      node.style.marginLeft = `${(100 - 100 / scale) / 2}%`;
      node.dataset.pdfFitScale = scale.toFixed(3);

      const pageRect = pageElement.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      if (nodeRect.bottom > pageRect.bottom - pageInset && scale > minScale) {
        const nextScale = Math.max(minScale, scale * ((pageRect.bottom - pageInset - nodeRect.top) / nodeRect.height));
        node.style.transform = `scale(${nextScale})`;
        node.style.width = `${100 / nextScale}%`;
        node.style.marginLeft = `${(100 - 100 / nextScale) / 2}%`;
        node.dataset.pdfFitScale = nextScale.toFixed(3);
      }
    };

    document.querySelectorAll('.pdfStagePage').forEach((pageElement) => {
      const scene = pageElement.querySelector('.pdfStepScene');
      const body = pageElement.querySelector('.pdfStepSceneBody');
      const layout = body?.firstElementChild;

      fitNode(body, layout, pageElement);

      const pageRect = pageElement.getBoundingClientRect();
      const sceneRect = scene?.getBoundingClientRect();
      const sceneOverflows =
        sceneRect && (sceneRect.bottom > pageRect.bottom - pageInset || scene.scrollHeight > pageElement.clientHeight);
      if (sceneOverflows) {
        fitNode(pageElement, scene, pageElement);
      }
    });
  });
  await settleRenderedPage(page);
}

async function prepareRenderedCapture(page, { useStaticStageShaderFallback = false } = {}) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      next-route-announcer,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dialog],
      [data-nextjs-dev-tools-button],
      [data-nextjs-error-overlay],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      ${
        useStaticStageShaderFallback
          ? `
      .pdfStagePage .paperShaderCanvas {
        display: none !important;
      }

      .pdfStagePage .backgroundSurfaceShader {
        background: ${STATIC_STAGE_SHADER_BACKGROUND} !important;
      }

      .pdfStagePage .pdfStepSceneBody,
      .pdfStagePage .pdfStepSceneBody > * {
        overflow: visible !important;
      }

      .pdfStagePage .pdfBackgroundLayer::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(rgba(255, 255, 255, 0.055) 0.6px, transparent 0.8px),
          linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 28%, rgba(0, 0, 0, 0.16));
        background-size: 9px 9px, 100% 100%;
        mix-blend-mode: screen;
        opacity: 0.46;
      }

      .pdfStagePage [data-pdf-fit-scale] {
        will-change: transform;
      }
      `
          : ''
      }
    `
  });
  if (useStaticStageShaderFallback) {
    await fitRasterizedStagePages(page);
  }
  await settleRenderedPage(page);
}

function shouldRasterizePdf(exportMode, warnings) {
  return (
    exportMode === 'map' ||
    warnings.some((warning) => warning.code === 'paper-background' || warning.code === 'canvas-like-component')
  );
}

async function exportRenderedPagesPdf(page, pdfPath) {
  const pageLocator = page.locator('.pdfPage');
  const pageCount = await pageLocator.count();
  if (pageCount < 1) {
    throw new Error('PDF route did not render any .pdfPage elements.');
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xtoryteller-pdf-'));

  try {
    const imageUrls = [];
    for (let index = 0; index < pageCount; index += 1) {
      const pdfPage = pageLocator.nth(index);
      await pdfPage.waitFor({ state: 'visible', timeout: 60_000 });
      await pdfPage.scrollIntoViewIfNeeded();
      await settleRenderedPage(page);
      const screenshot = await pdfPage.screenshot({
        type: 'png',
        animations: 'disabled'
      });
      const imagePath = path.join(tempDir, `page-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(imagePath, screenshot);
      imageUrls.push(pathToFileURL(imagePath).href);
    }

    const htmlPath = path.join(tempDir, 'rendered-pages.html');
    await fs.writeFile(
      htmlPath,
      `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: ${PDF_WIDTH} ${PDF_HEIGHT};
        margin: 0;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        background: #000;
      }

      .page {
        width: 100vw;
        height: 100vh;
        break-after: page;
        page-break-after: always;
      }

      .page:last-of-type {
        break-after: auto;
        page-break-after: auto;
      }

      img {
        display: block;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
      }
    </style>
  </head>
  <body>
    ${imageUrls
      .map((src, index) => `<section class="page"><img alt="Rendered PDF page ${index + 1}" src="${src}" /></section>`)
      .join('\n    ')}
  </body>
</html>`,
      'utf8'
    );

    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load', timeout: 120_000 });
    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve, reject) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', reject, { once: true });
              })
        )
      );
    });

    await page.pdf({
      path: pdfPath,
      ...PAGE_PDF_OPTIONS,
      tagged: false,
      outline: false
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const { slug, output, baseUrl, rasterScale } = parseArgs(process.argv);
  if (!slug) {
    console.error('Usage: node scripts/export-pdf.mjs --slug <slug> [--output exports] [--base-url <url>] [--raster-scale 1-4]');
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

  const presentationMode = await readPresentationMode(yamlPath);
  const captureScale = rasterScale;
  const targetUrl = presentationPdfUrl(baseUrl, slug);
  const pdfPath = path.join(output, `${slug}.pdf`);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: captureScale
    });
    const page = await context.newPage();
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

    const exportMode = await page.locator(READY_SELECTOR).getAttribute('data-pdf-mode');
    if (shouldRasterizePdf(exportMode, warnings)) {
      if (presentationMode === 'stage') {
        console.warn('[pdf:stage-shader-fallback] Shader-heavy Stage export uses a static theme background fallback because the shader canvas is unstable in headless page capture.');
      }
      console.warn(`[pdf:rendered-raster] Export uses browser-rendered pages as ${captureScale}x raster pages to preserve spatial layout and visual appearance.`);
      await prepareRenderedCapture(page, { useStaticStageShaderFallback: presentationMode === 'stage' });
      await exportRenderedPagesPdf(page, pdfPath);
    } else {
      await page.pdf({
        path: pdfPath,
        ...PAGE_PDF_OPTIONS
      });
    }
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
