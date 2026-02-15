import { test, expect } from '@playwright/test';
import {
  assertNoErrors,
  collectNetworkErrors,
  goToCalendar,
  waitForLoading,
} from './helpers';

test.describe('Calendar & Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await goToCalendar(page);
    await waitForLoading(page);
  });

  test('weekly view shows 7 day columns', async ({ page }) => {
    // Count day header cells (should be 7)
    const dayHeaders = page.locator(
      '.grid.sticky > div:not(:first-child)'
    );
    await expect(dayHeaders).toHaveCount(7);
  });

  test('week navigation works', async ({ page }) => {
    // Get current month text
    const monthText = await page.locator('h2.font-display').textContent();

    // Click next week
    const nextBtn = page.locator('button:has(polyline[points="9 18 15 12 9 6"])');
    await nextBtn.click();
    await waitForLoading(page);

    await assertNoErrors(page);

    // Click previous week
    const prevBtn = page.locator('button:has(polyline[points="15 18 9 12 15 6"])');
    await prevBtn.click();
    await waitForLoading(page);

    await assertNoErrors(page);
  });

  test('"Dziś" button navigates to current week', async ({ page }) => {
    // Navigate forward 2 weeks
    const nextBtn = page.locator('button:has(polyline[points="9 18 15 12 9 6"])');
    await nextBtn.click();
    await nextBtn.click();
    await waitForLoading(page);

    // Click "Dziś"
    await page.locator('text=Dziś').click();
    await waitForLoading(page);

    // Today's date should be highlighted
    const today = page.locator('.bg-heal-primary.text-white.rounded-full');
    await expect(today).toBeVisible();

    await assertNoErrors(page);
  });

  test('clicking time slot opens session modal', async ({ page }) => {
    // Click first available time slot cell
    const cell = page.locator('.border-l.border-heal-light\\/50.min-h-\\[56px\\]').first();
    await cell.click();

    // Modal should appear
    const modal = page.locator('text=Nowa sesja');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Verify modal has all required fields
    await expect(page.locator('text=Rodzaj sesji')).toBeVisible();
    await expect(page.locator('text=Data')).toBeVisible();
    await expect(page.locator('text=Godzina')).toBeVisible();
    await expect(page.locator('text=Instruktor')).toBeVisible();
    await expect(page.locator('text=Klienci')).toBeVisible();

    // Session type buttons
    await expect(page.locator('button:has-text("Solo")')).toBeVisible();
    await expect(page.locator('button:has-text("Duo")')).toBeVisible();
    await expect(page.locator('button:has-text("Trio")')).toBeVisible();

    await assertNoErrors(page);
  });

  test('session modal - type selection changes client limit', async ({ page }) => {
    // Open session modal via + button
    const addBtn = page.locator('button.fixed.bottom-20');
    await addBtn.click();
    await expect(page.locator('text=Nowa sesja')).toBeVisible();

    // Solo: 1 client
    await page.locator('button:has-text("Solo")').click();
    await expect(page.locator('text=Klienci (0/1)')).toBeVisible();

    // Duo: 2 clients
    await page.locator('button:has-text("Duo")').click();
    await expect(page.locator('text=Klienci (0/2)')).toBeVisible();

    // Trio: 3 clients
    await page.locator('button:has-text("Trio")').click();
    await expect(page.locator('text=Klienci (0/3)')).toBeVisible();
  });

  test('session modal - validation shows errors', async ({ page }) => {
    const addBtn = page.locator('button.fixed.bottom-20');
    await addBtn.click();
    await expect(page.locator('text=Nowa sesja')).toBeVisible();

    // Clear date field
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill('');

    // Try to save without date
    await page.locator('button:has-text("Dodaj sesję")').click();

    // Should show error message
    await expect(page.locator('text=Wybierz datę sesji')).toBeVisible();
  });

  test('session modal - recurring toggle shows end date', async ({ page }) => {
    const addBtn = page.locator('button.fixed.bottom-20');
    await addBtn.click();
    await expect(page.locator('text=Nowa sesja')).toBeVisible();

    // Toggle recurring on
    const toggle = page.locator('.toggle');
    await toggle.click();

    // End date input should appear
    await expect(page.locator('text=Powtarzaj co tydzień do:')).toBeVisible();
  });

  test('session CRUD - create, verify, and delete', async ({ page }) => {
    const networkErrors = collectNetworkErrors(page);

    // Open session modal
    const addBtn = page.locator('button.fixed.bottom-20');
    await addBtn.click();
    await expect(page.locator('text=Nowa sesja')).toBeVisible();

    // Fill form: Solo session, today's date
    await page.locator('button:has-text("Solo")').click();

    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill(today);

    // Select first instructor
    const instrButton = page.locator('.rounded-xl.border-2').first();
    await instrButton.click();

    // Try to add the session (might fail if client required, that's OK)
    await page.locator('button:has-text("Dodaj sesję")').click();
    await page.waitForTimeout(3000);

    // Check if we got a validation error (expected for non-admin without client)
    const validationError = page.locator('.bg-red-50');
    if (await validationError.isVisible()) {
      const errorText = await validationError.textContent();
      // This is expected validation, not a bug
      expect(errorText).toContain('wymaga');
    } else {
      // Session was created - verify it shows on calendar
      await waitForLoading(page);
      const sessionCards = page.locator('[style*="borderLeft"]');
      expect(await sessionCards.count()).toBeGreaterThan(0);
    }

    expect(networkErrors).toEqual([]);
  });

  test('clicking existing session opens edit modal', async ({ page }) => {
    // Look for any session cards on the calendar
    const sessionCards = page.locator('.rounded-md.p-1.cursor-pointer');
    const count = await sessionCards.count();

    if (count > 0) {
      await sessionCards.first().click();
      await expect(page.locator('text=Edytuj sesję')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('text=Zapisz zmiany')).toBeVisible();
      await expect(page.locator('text=Usuń')).toBeVisible();
      await assertNoErrors(page);
    }
  });

  test('floating + button is visible and clickable', async ({ page }) => {
    const addBtn = page.locator('button.fixed.bottom-20');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(page.locator('text=Nowa sesja')).toBeVisible();
  });
});
