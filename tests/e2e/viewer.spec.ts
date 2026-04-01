import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('stage viewer supports keyboard-only navigation and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/complex-stage');

  const liveRegion = page.locator('[aria-live="polite"]');
  const backgroundLayer = page.locator('[data-background-key]').last();
  const initialBackgroundKey = await backgroundLayer.getAttribute('data-background-key');
  await expect(liveRegion).toContainText('Step 1 of 15: Opening');

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  await expect(liveRegion).toContainText('Step 2 of 15: North Star');
  await expect(backgroundLayer).toHaveAttribute('data-background-key', /.+/);
  await expect(page.locator('[data-background-key]')).toHaveCount(1);
  expect(await backgroundLayer.getAttribute('data-background-key')).not.toBe(initialBackgroundKey);

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('stage viewer escape returns to the dashboard from the first step', async ({ page }) => {
  await page.goto('/simple-stage');

  await page.keyboard.press('Escape');
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

  await page.getByRole('button', { name: 'Next' }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(liveRegion).toContainText('philosophy');

  await page.getByRole('button', { name: /3\. system-loop/i }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(liveRegion).toContainText('system-loop', { timeout: 5000 });

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('complex map switches background sections across cluster groups', async ({ page }) => {
  await page.goto('/complex-map');

  const backgroundLayer = page.locator('[data-background-key]').last();
  const initialBackgroundKey = await backgroundLayer.getAttribute('data-background-key');

  await page.getByRole('button', { name: /4\. feedback-loops/i }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('[aria-live="polite"]')).toContainText('feedback-loops', { timeout: 5000 });
  expect(await backgroundLayer.getAttribute('data-background-key')).not.toBe(initialBackgroundKey);
});





