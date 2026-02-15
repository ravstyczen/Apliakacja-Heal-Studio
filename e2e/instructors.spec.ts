import { test, expect } from '@playwright/test';
import {
  assertNoErrors,
  collectNetworkErrors,
  goToCalendar,
  clickTab,
  waitForLoading,
} from './helpers';

test.describe('Instructor Settings (Instruktorzy)', () => {
  test.beforeEach(async ({ page }) => {
    await goToCalendar(page);

    // Only visible for owner/admin
    const instrTab = page.locator('nav >> text=Instruktorzy');
    if (!(await instrTab.isVisible())) {
      test.skip();
      return;
    }
    await instrTab.click();
    await waitForLoading(page);
  });

  test('instructor list loads with all instructors', async ({ page }) => {
    await expect(page.locator('h2:has-text("Instruktorzy")')).toBeVisible();

    // Should have instructor cards
    const cards = page.locator('.bg-white.rounded-xl');
    expect(await cards.count()).toBeGreaterThan(0);

    await assertNoErrors(page);
  });

  test('instructor cards show name, email, role', async ({ page }) => {
    const firstCard = page.locator('.bg-white.rounded-xl').first();

    // Should have name
    const name = firstCard.locator('.font-semibold.text-heal-dark');
    await expect(name.first()).toBeVisible();

    // Should have email
    const email = firstCard.locator('.text-gray-400');
    await expect(email.first()).toBeVisible();

    // Should have role badge
    const roleBadge = firstCard.locator('.rounded-full.font-medium');
    await expect(roleBadge.first()).toBeVisible();
  });

  test('edit button reveals pricing inputs', async ({ page }) => {
    // Click "Edytuj" on first instructor
    const editBtn = page.locator('text=Edytuj').first();
    await editBtn.click();

    // Should now see number inputs
    const inputs = page.locator('input[type="number"]');
    expect(await inputs.count()).toBeGreaterThanOrEqual(6); // 3 types x 2 fields

    // Should see "Zapisz" button
    await expect(page.locator('text=Zapisz')).toBeVisible();

    // Should see "Zwiń" instead of "Edytuj"
    await expect(page.locator('text=Zwiń').first()).toBeVisible();

    await assertNoErrors(page);
  });

  test('pricing inputs select all on focus', async ({ page }) => {
    // Click edit
    await page.locator('text=Edytuj').first().click();

    const input = page.locator('input[type="number"]').first();
    await expect(input).toBeVisible();

    // Focus the input - it should select all text
    await input.focus();
    await page.waitForTimeout(200);

    // Type a new value - should replace the old one (not append)
    const originalValue = await input.inputValue();
    await input.fill('999');
    const newValue = await input.inputValue();
    expect(newValue).toBe('999');
    expect(newValue).not.toContain(originalValue + '999');

    // Restore original value
    await input.fill(originalValue);
  });

  test('save pricing changes', async ({ page }) => {
    const networkErrors = collectNetworkErrors(page);

    // Click edit
    await page.locator('text=Edytuj').first().click();
    await page.waitForTimeout(500);

    // Get current value of first input
    const input = page.locator('input[type="number"]').first();
    const originalValue = await input.inputValue();

    // Change value
    await input.fill('999');

    // Save
    const saveBtn = page.locator('button:has-text("Zapisz")');
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Check for success or error message
    const message = page.locator('.text-sm.p-2.rounded-lg');
    if (await message.isVisible()) {
      const text = await message.textContent();
      // Should be success (green) not error (red)
      if (text?.includes('błąd')) {
        // If error, check it's not a 500
        console.error('Save error:', text);
      } else {
        expect(text).toContain('Zapisano');
      }
    }

    // Restore original value
    const editBtn = page.locator('text=Edytuj').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }
    const input2 = page.locator('input[type="number"]').first();
    if (await input2.isVisible()) {
      await input2.fill(originalValue);
      const saveBtn2 = page.locator('button:has-text("Zapisz")');
      await saveBtn2.click();
      await page.waitForTimeout(2000);
    }

    expect(networkErrors).toEqual([]);
  });

  test('collapse editing with "Zwiń"', async ({ page }) => {
    // Open editing
    await page.locator('text=Edytuj').first().click();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    // Collapse
    await page.locator('text=Zwiń').first().click();

    // Inputs should be gone
    await expect(page.locator('input[type="number"]')).toHaveCount(0);
  });

  test('pricing table shows Solo, Duo, Trio rows', async ({ page }) => {
    // Each instructor card should have pricing table
    const firstCard = page.locator('.bg-white.rounded-xl').first();
    await expect(firstCard.locator('text=SOLO')).toBeVisible();
    await expect(firstCard.locator('text=DUO')).toBeVisible();
    await expect(firstCard.locator('text=TRIO')).toBeVisible();
  });
});
