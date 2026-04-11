import { expect, test } from '@playwright/test';

test('stage export route produces a Chromium PDF from the print DOM', async ({ page }) => {
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
  await page.goto('/human-ai-and-music-insight-brief/export/pdf');

  await expect(page.locator('main[data-pdf-ready="true"]')).toBeVisible();
  const stagePages = page.locator('[data-pdf-kind="stage"]');
  await expect(stagePages.first()).toBeVisible();
  expect(await stagePages.count()).toBeGreaterThan(1);
  await expect(page.getByText('Recalibrating the Music System').first()).toBeVisible();

  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({
    width: '13.333in',
    height: '7.5in',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true,
    tagged: true,
    outline: true,
  });

  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(10_000);
});
