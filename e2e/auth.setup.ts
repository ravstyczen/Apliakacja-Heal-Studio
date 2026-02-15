import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

/**
 * Authentication setup for E2E tests.
 *
 * This opens a real browser so you can log in via Google OAuth.
 * The session is saved and reused by all subsequent tests.
 *
 * First run:
 *   npx playwright test --project=auth-setup --headed
 *
 * This opens a browser where you:
 *   1. Click "Zaloguj się przez Google"
 *   2. Sign in with your Google account
 *   3. Wait for redirect to /calendar
 *   4. The browser closes and session is saved
 *
 * Re-run auth setup when the session expires (~30 days).
 */
setup('authenticate via Google OAuth', async ({ page }) => {
  // Skip if we already have a valid auth file (less than 7 days old)
  if (fs.existsSync(AUTH_FILE)) {
    const stats = fs.statSync(AUTH_FILE);
    const ageMs = Date.now() - stats.mtimeMs;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (ageMs < sevenDays) {
      // Verify the saved session still works
      await page.goto('/calendar');
      await page.waitForTimeout(3000);

      const logoutBtn = page.locator('text=Wyloguj');
      if (await logoutBtn.isVisible()) {
        console.log('Existing auth session is still valid, skipping login.');
        return;
      }
      console.log('Saved session expired, re-authenticating...');
    }
  }

  // Navigate to app
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click the Google sign-in button
  const signInButton = page.locator('text=Zaloguj się przez Google');
  await expect(signInButton).toBeVisible({ timeout: 15_000 });
  await signInButton.click();

  // Wait for Google OAuth flow to complete and redirect back
  // The user must interact with Google's login page manually
  // when running with --headed flag
  await page.waitForURL('**/calendar**', { timeout: 120_000 });

  // Verify we're logged in - "Wyloguj" button should be visible
  await expect(page.locator('text=Wyloguj')).toBeVisible({ timeout: 15_000 });

  console.log('Authentication successful! Saving session...');

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });
});
