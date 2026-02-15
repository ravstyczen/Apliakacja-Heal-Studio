import { Page, expect } from '@playwright/test';

/** Ensure page has no visible error indicators */
export async function assertNoErrors(page: Page) {
  // Check for red error banners
  const errorBanners = page.locator('.bg-red-50, .text-red-600, .text-red-500');
  const errorCount = await errorBanners.count();

  for (let i = 0; i < errorCount; i++) {
    const el = errorBanners.nth(i);
    if (await el.isVisible()) {
      const text = await el.textContent();
      // "Usuń" (Delete) button is red but not an error
      if (text && !text.includes('Usuń') && !text.includes('Usuwanie')) {
        throw new Error(`Visible error element found: "${text}"`);
      }
    }
  }

  // Check for #error text anywhere on the page
  const body = await page.locator('body').textContent();
  if (body) {
    const errorPatterns = ['#error', '#ERROR', '#REF!', '#VALUE!', '#NAME?', '#DIV/0!', '#N/A'];
    for (const pattern of errorPatterns) {
      if (body.includes(pattern)) {
        throw new Error(`Google Sheets error "${pattern}" found in page content`);
      }
    }
  }
}

/** Collect all console errors during a page action */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/** Collect all failed network requests */
export function collectNetworkErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 500) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

/** Navigate to /calendar and wait for it to load */
export async function goToCalendar(page: Page) {
  await page.goto('/calendar');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Wyloguj')).toBeVisible({ timeout: 15_000 });
}

/** Click a navigation tab by label text */
export async function clickTab(page: Page, label: string) {
  await page.locator(`nav >> text=${label}`).click();
  await page.waitForTimeout(1000);
}

/** Wait for loading spinner to disappear */
export async function waitForLoading(page: Page) {
  const spinner = page.locator('.spinner');
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 15_000 });
  }
}
