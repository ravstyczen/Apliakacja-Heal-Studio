import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = resolve(__dirname, 'screenshots');
mkdirSync(screenshotDir, { recursive: true });

const BASE = 'http://localhost:3099';

const VIEWS = [
  { name: '01-login',          view: 'login',          fullPage: false },
  { name: '02-google-warning', view: 'google-warning', fullPage: false },
  { name: '03-calendar',       view: 'calendar',       fullPage: false },
  { name: '04-clients',        view: 'clients',        fullPage: true },
  { name: '05-new-session',    view: 'new-session',    fullPage: false },
  { name: '06-open-session',   view: 'open-session',   fullPage: false },
  { name: '07-new-client',     view: 'new-client',     fullPage: false },
  { name: '08-booking',        view: 'booking',        fullPage: false },
];

const browser = await chromium.launchPersistentContext(
  resolve('/home/user/tmp-chrome/profile'),
  {
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
    ],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    headless: true,
  }
);

for (const v of VIEWS) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/screenshot?view=${v.view}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const path = resolve(screenshotDir, `${v.name}.png`);
  await page.screenshot({ path, fullPage: v.fullPage });
  console.log(`  ✓ ${v.name}.png`);
  await page.close();
}

await browser.close();
console.log(`\nAll screenshots saved to: ${screenshotDir}`);
