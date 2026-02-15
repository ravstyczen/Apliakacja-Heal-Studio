import { test, expect } from '@playwright/test';
import {
  assertNoErrors,
  collectNetworkErrors,
  goToCalendar,
  clickTab,
  waitForLoading,
} from './helpers';

test.describe('Settlements (Rozliczenia)', () => {
  test.beforeEach(async ({ page }) => {
    await goToCalendar(page);
    await clickTab(page, 'Rozliczenia');
    await waitForLoading(page);
  });

  test('settlements page loads with summary cards', async ({ page }) => {
    await expect(page.locator('h2:has-text("Rozliczenia")')).toBeVisible();
    await assertNoErrors(page);
  });

  test('month navigation works', async ({ page }) => {
    // Navigate to previous month
    const prevBtn = page.locator('button:has(polyline[points="15 18 9 12 15 6"])');
    if (await prevBtn.count() > 0) {
      await prevBtn.first().click();
      await waitForLoading(page);
      await assertNoErrors(page);
    }

    // Navigate to next month
    const nextBtn = page.locator('button:has(polyline[points="9 18 15 12 9 6"])');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await waitForLoading(page);
      await assertNoErrors(page);
    }
  });

  test('no API errors on month change', async ({ page }) => {
    const networkErrors = collectNetworkErrors(page);

    // Navigate through a few months
    const prevBtn = page.locator('button:has(polyline[points="15 18 9 12 15 6"])');
    if (await prevBtn.count() > 0) {
      for (let i = 0; i < 3; i++) {
        await prevBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    expect(networkErrors).toEqual([]);
    await assertNoErrors(page);
  });

  test('instructor rows are expandable', async ({ page }) => {
    // Look for instructor rows that might be clickable
    const rows = page.locator('.bg-white.rounded-xl, [class*="cursor-pointer"]');
    const count = await rows.count();

    if (count > 0) {
      await rows.first().click();
      await page.waitForTimeout(500);
      await assertNoErrors(page);
    }
  });
});
