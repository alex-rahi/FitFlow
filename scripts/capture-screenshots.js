const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'screenshots/mobile');
const ADMIN_OUT = path.join(__dirname, '..', 'screenshots/admin');
const MOBILE_BASE = process.env.MOBILE_BASE || 'http://127.0.0.1:4173';
const ADMIN_BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3001';

const MOBILE_ROUTES = [
  { file: '00_splash', path: '/', wait: 2500 },
  { file: '05_welcome', path: '/welcome', wait: 1500 },
  { file: '06_login', path: '/login', wait: 1200 },
  { file: '07_signup', path: '/signup', wait: 1200 },
  { file: '08_forgot_password', path: '/forgot-password', wait: 1200 },
  { file: '09_verify_email', path: '/verify-email', wait: 1200 },
  { file: '10_feed', path: '/feed', wait: 3000, auth: true },
  { file: '11_upload', path: '/upload', wait: 1800, auth: true },
  { file: '12_profile', path: '/profile', wait: 1800, auth: true },
  { file: '13_settings', path: '/settings', wait: 1800, auth: true },
  { file: '14_edit_profile', path: '/edit-profile', wait: 1800, auth: true },
  { file: '15_search', path: '/search', wait: 1800, auth: true },
  { file: '16_community', path: '/community', wait: 1800, auth: true },
  { file: '17_recipes', path: '/recipes', wait: 1800, auth: true },
  { file: '18_notifications', path: '/notifications', wait: 1800, auth: true },
];

const ADMIN_ROUTES = [
  { file: '01_dashboard', path: '/' },
  { file: '02_review_queue', path: '/review' },
  { file: '03_audit_log', path: '/audit' },
];

async function demoLogin(page, base) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (count >= 2) {
    await inputs.nth(0).fill('demo@gymtok.com');
    await inputs.nth(1).fill('password123');
    const btn = page.getByText(/log in|sign in/i).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(2500);
    }
  }
}

async function captureMobile() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  let loggedIn = false;

  for (const route of MOBILE_ROUTES) {
    if (route.auth && !loggedIn) {
      await demoLogin(page, MOBILE_BASE);
      loggedIn = true;
    }
    try {
      await page.goto(`${MOBILE_BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(route.wait);
      await page.screenshot({ path: path.join(OUT_DIR, `${route.file}.png`) });
      console.log('OK', route.file);
    } catch (e) {
      console.log('FAIL', route.file, e.message);
    }
  }
  await browser.close();
}

async function captureAdmin() {
  fs.mkdirSync(ADMIN_OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const route of ADMIN_ROUTES) {
    try {
      await page.goto(`${ADMIN_BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(ADMIN_OUT, `${route.file}.png`) });
      console.log('OK admin', route.file);
    } catch (e) {
      console.log('FAIL admin', route.file, e.message);
    }
  }
  await browser.close();
}

(async () => {
  await captureMobile();
  if (process.env.ADMIN_BASE) {
    await captureAdmin();
  } else {
    console.log('Skip admin (set ADMIN_BASE to capture)');
  }
})();
