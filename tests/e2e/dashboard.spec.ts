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

  await page.getByRole('combobox').nth(0).selectOption('map');
  await expect(page.getByRole('link', { name: /Xtoryteller Simple Map Demo/i })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});
