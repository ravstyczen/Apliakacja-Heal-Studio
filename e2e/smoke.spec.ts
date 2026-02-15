import { test, expect } from '@playwright/test';
import {
  assertNoErrors,
  collectConsoleErrors,
  collectNetworkErrors,
  goToCalendar,
  clickTab,
  waitForLoading,
} from './helpers';

test.describe('Smoke tests - all pages load without errors', () => {
  let consoleErrors: string[];
  let networkErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = collectConsoleErrors(page);
    networkErrors = collectNetworkErrors(page);
  });

  test.afterEach(async () => {
    // Filter out known benign console errors
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Download the React DevTools')
    );
    if (realErrors.length > 0) {
      console.warn('Console errors:', realErrors);
    }
    expect(networkErrors).toEqual([]);
  });

  test('login page loads', async ({ page }) => {
    // Visit root without auth - should show login screen
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Either we see login button or we're redirected to calendar (already logged in)
    const loginBtn = page.locator('text=Zaloguj się przez Google');
    const logoutBtn = page.locator('text=Wyloguj');
    await expect(loginBtn.or(logoutBtn)).toBeVisible({ timeout: 15_000 });
  });

  test('calendar page loads and shows weekly grid', async ({ page }) => {
    await goToCalendar(page);
    await waitForLoading(page);

    // Verify week navigation exists
    await expect(page.locator('text=Dziś')).toBeVisible();

    // Verify day headers are present (Mon-Sun abbreviated in Polish)
    const dayHeaders = page.locator('.text-\\[10px\\].font-medium.uppercase');
    await expect(dayHeaders.first()).toBeVisible();

    // Verify time slots are rendered (8:00 through 20:00)
    await expect(page.locator('text=8:00')).toBeVisible();
    await expect(page.locator('text=12:00')).toBeVisible();
    await expect(page.locator('text=20:00')).toBeVisible();

    // No errors on the page
    await assertNoErrors(page);
  });

  test('clients tab loads', async ({ page }) => {
    await goToCalendar(page);
    await clickTab(page, 'Klienci');
    await waitForLoading(page);

    // Should see the "Klienci" header
    await expect(page.locator('h2:has-text("Klienci")')).toBeVisible();

    // Filter buttons should be visible
    await expect(page.locator('text=Wszyscy')).toBeVisible();
    await expect(page.locator('text=Zaakceptowali')).toBeVisible();

    await assertNoErrors(page);
  });

  test('settlements tab loads', async ({ page }) => {
    await goToCalendar(page);
    await clickTab(page, 'Rozliczenia');
    await waitForLoading(page);

    // Should see the "Rozliczenia" header
    await expect(page.locator('h2:has-text("Rozliczenia")')).toBeVisible();

    await assertNoErrors(page);
  });

  test('instructors tab loads (admin only)', async ({ page }) => {
    await goToCalendar(page);

    // This tab only appears for owner/admin
    const instrTab = page.locator('nav >> text=Instruktorzy');
    if (await instrTab.isVisible()) {
      await instrTab.click();
      await waitForLoading(page);

      await expect(page.locator('h2:has-text("Instruktorzy")')).toBeVisible();
      await assertNoErrors(page);
    }
  });

  test('no JavaScript errors on any tab', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await goToCalendar(page);
    await waitForLoading(page);

    // Visit each tab
    for (const tab of ['Klienci', 'Rozliczenia']) {
      await clickTab(page, tab);
      await waitForLoading(page);
    }

    const instrTab = page.locator('nav >> text=Instruktorzy');
    if (await instrTab.isVisible()) {
      await instrTab.click();
      await waitForLoading(page);
    }

    expect(errors).toEqual([]);
  });

  test('no 4xx/5xx API responses on page load', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await goToCalendar(page);
    await waitForLoading(page);

    // Visit all tabs to trigger all API calls
    for (const tab of ['Klienci', 'Rozliczenia']) {
      await clickTab(page, tab);
      await waitForLoading(page);
    }

    const instrTab = page.locator('nav >> text=Instruktorzy');
    if (await instrTab.isVisible()) {
      await instrTab.click();
      await waitForLoading(page);
    }

    expect(failedRequests).toEqual([]);
  });
});
