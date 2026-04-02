import { expect, test } from '@playwright/test';

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





