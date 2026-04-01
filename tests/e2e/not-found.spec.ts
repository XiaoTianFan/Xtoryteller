import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('unknown slugs land on the not-found page', async ({ page }) => {
  await page.goto('/definitely-missing-slug');

  await expect(page.getByRole('heading', { name: /That presentation could not be found/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Back to dashboard/i })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});
