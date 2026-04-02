import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function readMapCanvasState(page: Page) {
  return page.locator('.mapCanvas').evaluate((element) => ({
    behavior: element.getAttribute('data-camera-behavior'),
    transform: getComputedStyle(element).transform
  }));
}

function extractScale(transform: string) {
  const match = transform.match(/^matrix\(([^,]+)/);
  return match ? Number.parseFloat(match[1]) : Number.NaN;
}

test('stage viewer supports keyboard-only navigation and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/complex-stage');

  const liveRegion = page.locator('[aria-live="polite"]');
  const backgroundLayer = page.locator('[data-background-key]').last();
  await expect(liveRegion).toContainText('Step 1 of 15: Opening');
  await expect(backgroundLayer).toHaveAttribute('data-background-kind', 'paper-shader');

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  await expect(liveRegion).toContainText('Step 2 of 15: North Star');
  await expect(backgroundLayer).toHaveAttribute('data-background-key', /.+/);
  await expect(page.locator('[data-background-key]')).toHaveCount(1);
});

test('stage viewer escape returns to the dashboard from the first step', async ({ page }) => {
  await page.goto('/simple-stage');

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /Agent-first presentation infrastructure/i })).toBeVisible();
});

test('map viewer supports guided navigation and accessibility', async ({ page }) => {
  await page.goto('/simple-map');

  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(page.getByRole('button', { name: 'Guided' })).toBeVisible();
  await expect(liveRegion).toContainText('overview');

  await page.getByRole('button', { name: 'Guided' }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('button', { name: 'Free roam' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(liveRegion).toContainText('philosophy');

  await page.getByRole('button', { name: /3\. system-loop/i }).click();
  await expect(liveRegion).toContainText('system-loop', { timeout: 5000 });
});

test('map viewer supports immediate wheel zoom and drag pan in free roam', async ({ page }) => {
  await page.goto('/simple-map');
  await expect(page.getByRole('button', { name: 'Guided' })).toBeVisible();

  const viewport = page.locator('.mapViewport');
  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error('Map viewport not found');
  }

  const before = await readMapCanvasState(page);
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.36);
  await page.mouse.wheel(0, -320);
  await page.waitForTimeout(100);

  const afterWheel = await readMapCanvasState(page);
  expect(afterWheel.behavior).toBe('interactive');
  expect(extractScale(afterWheel.transform)).toBeGreaterThan(extractScale(before.transform));

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2 + 120, { steps: 8 });
  await page.waitForTimeout(60);

  const duringDrag = await readMapCanvasState(page);
  expect(duringDrag.behavior).toBe('interactive');
  expect(duringDrag.transform).not.toBe(afterWheel.transform);

  await page.mouse.up();
});

test('map viewer guided mode allows temporary free navigation and snaps back on next', async ({ page }) => {
  await page.goto('/simple-map');

  const liveRegion = page.locator('[aria-live="polite"]');
  await page.getByRole('button', { name: 'Guided' }).click();
  await expect(page.getByRole('button', { name: 'Free roam' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(liveRegion).toContainText('philosophy');

  const viewport = page.locator('.mapViewport');
  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error('Map viewport not found');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 + 80, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.mapCanvas')).toHaveAttribute('data-camera-behavior', 'flight');
  await expect(liveRegion).toContainText('system-loop', { timeout: 5000 });
});

test('map viewer responds to touch-style dragging', async ({ page }) => {
  await page.goto('/simple-map');
  await expect(page.getByRole('button', { name: 'Guided' })).toBeVisible();

  const before = await readMapCanvasState(page);

  await page.locator('.mapViewport').evaluate((viewport) => {
    const rect = viewport.getBoundingClientRect();
    const dispatch = (type: string, clientX: number, clientY: number, buttons: number) =>
      viewport.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 7,
          pointerType: 'touch',
          isPrimary: true,
          clientX,
          clientY,
          buttons
        })
      );

    dispatch('pointerdown', rect.left + rect.width * 0.55, rect.top + rect.height * 0.5, 1);
    dispatch('pointermove', rect.left + rect.width * 0.68, rect.top + rect.height * 0.62, 1);
    dispatch('pointerup', rect.left + rect.width * 0.68, rect.top + rect.height * 0.62, 0);
  });

  await page.waitForTimeout(100);
  const after = await readMapCanvasState(page);
  expect(after.behavior).toBe('interactive');
  expect(after.transform).not.toBe(before.transform);
});

test('canonical demos inherit the dashboard-selected global theme background', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Global theme').selectOption('neon-cyber');
  await expect(page.getByLabel('Global theme')).toHaveValue('neon-cyber');

  await page.getByRole('link', { name: /Xtoryteller Complex Map Demo/i }).click();
  await expect(page).toHaveURL(/\/complex-map$/);
  const backgroundLayer = page.locator('[data-background-key]').last();
  await expect(backgroundLayer).toHaveAttribute('data-background-kind', 'paper-shader');
  await expect(backgroundLayer).toHaveAttribute('data-background-shader', 'mesh-gradient');
});





