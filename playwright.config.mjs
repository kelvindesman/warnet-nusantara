// E2E matrix: URL layout × browser × device.
//   npm run e2e         -> chromium desktop, both layouts (fast local loop)
//   npm run e2e:full    -> every browser × device × layout (CI)
import { defineConfig, devices } from '@playwright/test';

const FULL = !!process.env.FULL;
// E2E_PORT lets two checkouts (e.g. agent worktrees) run e2e side by side without
// reusing each other's server, which would silently test the wrong tree.
const PORT = Number(process.env.E2E_PORT) || 4173;
const LAYOUTS = [
  { name: 'root', port: PORT, prefix: '/' },
  { name: 'pages', port: PORT + 1, prefix: '/warnet/' },
];
const BROWSERS = FULL
  ? [
      { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
      { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } } },
      { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } } },
      { name: 'chromium-tablet', use: { ...devices['Galaxy Tab S4'] } },
      { name: 'android-phone', use: { ...devices['Pixel 7'] } },
      { name: 'iphone', use: { ...devices['iPhone 14'] } },
    ]
  : [{ name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } }];

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 2, // laptop has 8 GB
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['monocart-reporter', {
      name: 'Warnet Nusantara.Net e2e',
      outputFile: './test-results/report/index.html',
      coverage: {
        outputDir: './coverage/e2e',
        reports: ['v8', 'console-summary', 'json-summary', 'lcovonly'],
        entryFilter: (entry) => /\/js\/.+\.js$/.test(new URL(entry.url).pathname) || /home\.html$/.test(entry.url),
        sourceFilter: (path) => /(^|\/)js\//.test(path) || /home\.html/.test(path),
      },
    }],
  ],
  // Indonesian is the source language; i18n.spec.mjs opens its own contexts for other locales.
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'id-ID' },
  webServer: LAYOUTS.map((l) => ({
    command: `node tests/serve.mjs ${l.port} ${l.prefix}`,
    url: `http://127.0.0.1:${l.port}${l.prefix}`,
    reuseExistingServer: !process.env.CI,
  })),
  projects: LAYOUTS.flatMap((l) => BROWSERS.map((b) => ({
    name: `${l.name}:${b.name}`,
    use: { ...b.use, baseURL: `http://127.0.0.1:${l.port}${l.prefix}` },
  }))),
});
