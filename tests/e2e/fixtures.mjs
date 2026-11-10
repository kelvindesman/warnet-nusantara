// Shared e2e fixtures.
// - Blocks every request that leaves the local test server, so runs are
//   deterministic and offline-safe. Tests that need an external host stub it
//   with page.route before navigating.
// - Fails the test on any first-party 404 or uncaught page error.
// - Collects V8 JS coverage on Chromium for the 100% coverage gate.
import { test as base, expect } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
/** The repo file a first-party URL serves, or null. */
const onDisk = (url, base) => {
  const u = new URL(url), b = new URL(base);
  if (u.origin !== b.origin || !u.pathname.startsWith(b.pathname)) return null;
  try { return readFileSync(new URL(u.pathname.slice(b.pathname.length) || 'index.html', ROOT), 'utf8'); } catch { return null; }
};

export const test = base.extend({
  external: [async ({}, use) => { await use([]); }, { scope: 'test' }],
  // Paths (relative to the layout base) a test deliberately serves as errors, e.g. to
  // drive an error screen. Only exact matches are excused; every other 4xx still fails.
  expectedErrors: [[], { option: true }],
  page: async ({ page, baseURL, external, browserName, expectedErrors }, use, testInfo) => {
    const origin = new URL(baseURL).origin;
    const problems = [];
    await page.route((url) => url.origin !== origin && !url.protocol.startsWith('data') && !url.protocol.startsWith('blob'), (route) => {
      external.push(route.request().url());
      return route.abort('blockedbyclient');
    });
    const excused = new Set(expectedErrors.map((p) => new URL(p, baseURL).href));
    page.on('response', (r) => { if (r.url().startsWith(origin) && r.status() >= 400 && !excused.has(r.url())) problems.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    const cover = browserName === 'chromium';
    // Chromium drops the counters of a document's scripts once the page navigates away,
    // so collect coverage before every page.goto/reload, not only at the end of the test.
    const collect = async () => {
      // Drop scripts a test replaced with a stub (page.route): they are not the shipped code
      // and would otherwise stand in for the real file in the report.
      const real = (e) => {
        const file = onDisk(e.url, baseURL);
        return file === null || file === e.source || (!e.url.endsWith('.js') && file.includes(e.source));
      };
      const cov = (await page.coverage.stopJSCoverage().catch(() => null))?.filter(real);
      if (cov?.length) await addCoverageReport(cov, testInfo);
    };
    if (cover) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      for (const nav of ['goto', 'reload']) {
        const orig = page[nav].bind(page);
        page[nav] = async (...args) => {
          await collect();
          await page.coverage.startJSCoverage({ resetOnNavigation: false });
          return orig(...args);
        };
      }
    }
    await use(page);
    if (cover) await collect();
    expect(problems, 'first-party 404s / page errors').toEqual([]);
  },
});
export { expect };

/** Open the app with deterministic switches. `path` is relative to the layout's base URL. */
export async function boot(page, query = '', hash = '') {
  const q = new URLSearchParams(query);
  if (!q.has('seed')) q.set('seed', '7');
  q.set('nosound', '');
  // Hash-only changes do not reload; start from a blank page so every boot is a real boot.
  if (page.url() !== 'about:blank') await page.goto('about:blank');
  await page.goto(`./?${q.toString().replace(/=(&|$)/g, '$1')}${hash}`);
}

/** Skip BIOS + login and land on the desktop. */
export async function toDesktop(page, query = '') {
  await boot(page, query, '#desktop');
  await expect(page.locator('.desktop')).toBeVisible();
}

/** Open the time-travel browser. Muted runs finish the dial-up on their own,
 *  so "Lewati" may already be gone; either way we end on the portal. */
export async function openBrowser(page) {
  await page.locator('.icon[data-app="browser"]').dblclick();
  const skip = page.getByRole('button', { name: 'Lewati' });
  const frame = page.locator('.br-view iframe');
  await expect(skip.or(frame)).toBeVisible();
  if (await skip.isVisible()) await skip.click({ timeout: 2000 }).catch(() => { /* dial-up finished itself */ });
  await expect(frame).toBeVisible();
  return page.frameLocator('.br-view iframe');
}
