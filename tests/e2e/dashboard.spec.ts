import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('dashboard supports discovery controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Agent-first presentation infrastructure/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Stage Demo/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Map Demo/i })).toBeVisible();

  await page.getByPlaceholder('Search title, tags, descriptions, or content').fill('simple map');
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Map Demo/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Stage Demo/i })).toHaveCount(0);

  await page.getByLabel('Filter by tag').selectOption('map');
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Map Demo/i })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('dashboard theme switcher persists the global theme choice', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('Global theme')).toHaveValue('xinimalist-paper');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 242, 227)');

  await page.getByLabel('Global theme').selectOption('xinimalist-dark');
  await expect(page.getByLabel('Global theme')).toHaveValue('xinimalist-dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(48, 52, 40)');

  await page.reload();
  await expect(page.getByLabel('Global theme')).toHaveValue('xinimalist-dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(48, 52, 40)');
});
