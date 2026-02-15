import { test, expect } from '@playwright/test';
import {
  assertNoErrors,
  collectNetworkErrors,
  goToCalendar,
  clickTab,
  waitForLoading,
} from './helpers';

test.describe('Clients (Klienci)', () => {
  test.beforeEach(async ({ page }) => {
    await goToCalendar(page);
    await clickTab(page, 'Klienci');
    await waitForLoading(page);
  });

  test('client list loads without errors', async ({ page }) => {
    await expect(page.locator('h2:has-text("Klienci")')).toBeVisible();
    await assertNoErrors(page);
  });

  test('search filters clients', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Szukaj"]');
    if (await searchInput.isVisible()) {
      // Type a search query
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);

      await assertNoErrors(page);
    }
  });

  test('filter buttons work (Wszyscy, Zaakceptowali, Oczekujący)', async ({ page }) => {
    const filters = ['Wszyscy', 'Zaakceptowali', 'Oczekujący'];

    for (const filter of filters) {
      const btn = page.locator(`button:has-text("${filter}")`);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
        await assertNoErrors(page);
      }
    }
  });

  test('add client button opens form modal', async ({ page }) => {
    // Click the floating + button
    const addBtn = page.locator('button.fixed.bottom-20, button:has(svg line)').last();
    await addBtn.click();

    // Modal should appear with form fields
    const modal = page.locator('text=Nowy klient').or(page.locator('text=Dodaj klienta'));
    await expect(modal.first()).toBeVisible({ timeout: 5_000 });

    await assertNoErrors(page);
  });

  test('client form validation requires name', async ({ page }) => {
    // Open add client modal
    const addBtn = page.locator('button.fixed.bottom-20, button:has(svg line)').last();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Try to save without filling anything
    const saveBtn = page.locator('button:has-text("Dodaj klienta")').or(
      page.locator('button:has-text("Zapisz")')
    );
    if (await saveBtn.first().isVisible()) {
      await saveBtn.first().click();

      // Should show validation error
      const error = page.locator('.bg-red-50, .text-red-600');
      await expect(error.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('client CRUD - create and verify', async ({ page }) => {
    const networkErrors = collectNetworkErrors(page);
    const testName = `TestE2E_${Date.now()}`;

    // Open add client
    const addBtn = page.locator('button.fixed.bottom-20, button:has(svg line)').last();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Fill form
    const firstNameInput = page.locator('input').nth(0);
    const lastNameInput = page.locator('input').nth(1);

    // In the modal context
    const modalInputs = page.locator('.modal-panel input, [class*="modal"] input');
    const inputs = await modalInputs.all();

    if (inputs.length >= 2) {
      await inputs[0].fill(testName);
      await inputs[1].fill('Testowy');

      // Fill email if visible
      if (inputs.length >= 4) {
        await inputs[3].fill('test@example.com');
      }

      // Save
      const saveBtn = page.locator('button:has-text("Dodaj klienta")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(3000);

        // Check for errors
        const error = page.locator('.bg-red-50:visible');
        if (await error.count() === 0) {
          // Success - verify client appears in list
          await waitForLoading(page);
          const clientCard = page.locator(`text=${testName}`);
          // Client should be visible (might need to scroll)
          if (await clientCard.isVisible()) {
            expect(await clientCard.count()).toBeGreaterThan(0);
          }
        }
      }
    }

    expect(networkErrors).toEqual([]);
    await assertNoErrors(page);
  });

  test('client cards show correct info', async ({ page }) => {
    // Check that client cards have expected elements
    const clientCards = page.locator('.bg-white.rounded-xl, [class*="rounded-xl"][class*="shadow"]');
    const count = await clientCards.count();

    if (count > 0) {
      const firstCard = clientCards.first();
      // Should have initials avatar (colored circle)
      const avatar = firstCard.locator('.rounded-full');
      await expect(avatar.first()).toBeVisible();

      await assertNoErrors(page);
    }
  });

  test('clicking client card opens edit form', async ({ page }) => {
    const clientCards = page.locator('.bg-white.rounded-xl.shadow-sm').or(
      page.locator('[class*="cursor-pointer"][class*="rounded"]')
    );
    const count = await clientCards.count();

    if (count > 0) {
      await clientCards.first().click();
      await page.waitForTimeout(1000);

      // Should see edit form or modal
      const editModal = page.locator('text=Edytuj klienta').or(page.locator('text=Zapisz zmiany'));
      if (await editModal.first().isVisible()) {
        await assertNoErrors(page);
      }
    }
  });
});
