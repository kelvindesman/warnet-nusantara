// Winamp via Webamp. unpkg is stubbed with a tiny fake that exposes the Webamp API
// winamp.js uses, so the app code (tracks, taskbar, minimize, close) runs offline.
import { test, expect, toDesktop } from './fixtures.mjs';

const WEBAMP = 'https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.mjs';
const fake = (exportName) => `
class Webamp {
  static browserIsSupported() { return !window.__waUnsupported; }
  constructor(opts) { window.__wa = { opts, disposed: 0, inst: this }; }
  async renderWhenReady(host) {
    if (window.__waThrowText) throw window.__waThrowText;
    if (window.__waHold) await window.__waHold;
    const el = document.createElement('div'); el.id = 'webamp';
    el.textContent = 'WEBAMP ' + this.constructor.name + ' ' + window.__wa.opts.initialTracks.map((t) => t.metaData.title).join(' | ');
    host.appendChild(el);
  }
  onClose(cb) { this.close = () => cb(); }
  onMinimize(cb) { this.minimize = () => cb(); }
  dispose() { window.__wa.disposed++; document.getElementById('webamp')?.remove(); if (window.__waDisposeThrows) throw new Error('dispose'); }
}
${exportName === 'default' ? 'export default Webamp;' : 'export { Webamp };'}`;
const stub = (page, exportName = 'default') => page.route(WEBAMP, (r) => r.fulfill({
  contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fake(exportName),
}));
const task = (page) => page.locator('.tasks .task.wa');
const wa = (page, js) => page.evaluate(js);

// source: README "Winamp: Real Winamp 2 via Webamp (MIT), lazy-loaded from unpkg. The playlist is 4 chiptunes generated in the browser"
test('@app:winamp loads with 4 generated chiptunes, minimizes to the taskbar, restores, closes', async ({ page }) => {
  await stub(page);
  await toDesktop(page);
  // a second launch while the first is still loading is ignored
  await page.evaluate(() => { for (let i = 0; i < 2; i++) window.dispatchEvent(new CustomEvent('launch', { detail: 'winamp' })); });
  await expect(task(page)).toBeVisible();
  await expect(page.locator('#webamp')).toContainText('Billing Habis Lagi (8-bit) | Paket Malam 00.00-06.00 | Dial-Up Love | Testimonial Dong');
  await expect(task(page)).toHaveText('Winamp');
  await expect(task(page)).toHaveClass(/\bon\b/);
  const tracks = await wa(page, () => window.__wa.opts.initialTracks.map((t) => [t.url.slice(0, 5), t.duration > 30]));
  expect(tracks).toEqual(Array(4).fill(['blob:', true]));
  expect(await page.locator('.desktop .wa-host').count()).toBe(1);

  await wa(page, () => window.__wa.inst.minimize());
  await expect(page.locator('#webamp')).toBeHidden();
  await expect(task(page)).not.toHaveClass(/\bon\b/);
  await task(page).click();
  await expect(page.locator('#webamp')).toBeVisible();
  await expect(task(page)).toHaveClass(/\bon\b/);
  await task(page).click();
  await expect(page.locator('#webamp')).toBeHidden();
  await page.locator('.quick [data-app="winamp"]').click(); // launching again shows it
  await expect(page.locator('#webamp')).toBeVisible();

  await wa(page, () => window.__wa.inst.close());
  await expect(task(page)).toHaveCount(0);
  expect(await wa(page, () => window.__wa.disposed)).toBe(1);
  // reopening reuses the player layer and the already generated songs
  await page.locator('.quick [data-app="winamp"]').click();
  await expect(page.locator('#webamp')).toBeVisible();
  expect(await page.locator('.desktop .wa-host').count()).toBe(1);
  // the player element can be gone (e.g. removed by Webamp itself); minimize/restore must not throw
  await page.locator('#webamp').evaluate((el) => el.remove());
  await wa(page, () => window.__wa.inst.minimize());
  await page.locator('.quick [data-app="winamp"]').click();
  await task(page).click(); // no player element: opens again
  // Log Off closes Winamp
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  await expect(page.locator('.lock')).toBeVisible();
  await expect.poll(() => wa(page, () => window.__wa.disposed)).toBe(1); // the second player was disposed too
});

// source: README "Winamp: Real Winamp 2 via Webamp (MIT), lazy-loaded from unpkg" (named export build)
test('@app:winamp works with a Webamp build that uses a named export; Turn Off closes it even if dispose fails', async ({ page }) => {
  await stub(page, 'named');
  await toDesktop(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'winamp' })));
  await expect(page.locator('#webamp')).toContainText('WEBAMP Webamp');
  expect(await page.evaluate(async () => (await import(new URL('js/apps/winamp.js', document.baseURI).href)).winampOpen())).toBe(true);
  await wa(page, () => { window.__waDisposeThrows = true; });
  await page.locator('.startbtn').click();
  await page.locator('[data-p="off"]').click();
  await page.locator('[data-s="off"]').click();
  await expect(page.locator('.bye')).toBeVisible();
  expect(await page.evaluate(async () => (await import(new URL('js/apps/winamp.js', document.baseURI).href)).winampOpen())).toBe(false);
});

// source: README "Winamp ... lazy-loaded from unpkg" (unsupported browsers get a message, not a crash)
test('@app:winamp unsupported browser shows an error box and no taskbar button', async ({ page }) => {
  await stub(page);
  await page.addInitScript(() => { window.__waUnsupported = true; });
  page.on('console', () => {});
  await toDesktop(page);
  await page.locator('.icon[data-app="winamp"]').dblclick();
  await expect(page.getByRole('dialog', { name: 'Winamp' })).toContainText('Browser tidak didukung Webamp');
  await expect(task(page)).toHaveCount(0);
});

// source: README "Winamp ... lazy-loaded from unpkg" (any loading failure ends in a readable message)
test('@app:winamp a failure without an Error object still shows its text', async ({ page }) => {
  await stub(page);
  await page.addInitScript(() => { window.__waThrowText = 'skin rusak'; });
  page.on('console', () => {});
  await toDesktop(page);
  await page.locator('.icon[data-app="winamp"]').dblclick();
  await expect(page.getByRole('dialog', { name: 'Winamp' })).toContainText('skin rusak');
  await expect(task(page)).toHaveCount(0);
});

const login = async (page) => {
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
};
const logoff = async (page) => {
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  await expect(page.locator('.lock')).toBeVisible();
};

// source: README "Winamp: Real Winamp 2 via Webamp (MIT), lazy-loaded from unpkg" + AGENTS.md "Lazy loading"
// (bug: logging off while Webamp was still loading left a player nobody could see or reopen)
test('@app:winamp logging off while Webamp is still loading leaves nothing behind; Winamp opens again after login', async ({ page }) => {
  await stub(page);
  await page.addInitScript(() => { window.__waHold = new Promise((r) => { window.__waRelease = r; }); });
  await toDesktop(page);
  await page.locator('.quick [data-app="winamp"]').click();
  await expect(task(page)).toHaveText('Memuat Winamp...');
  await expect.poll(() => wa(page, () => !!window.__wa)).toBe(true); // rendering has started
  await logoff(page);
  await wa(page, () => { window.__waHold = null; window.__waRelease(); });
  await page.waitForTimeout(100);
  expect(await wa(page, () => window.__wa.disposed)).toBe(1); // the late player is thrown away
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await login(page);
  await page.locator('.quick [data-app="winamp"]').click();
  await expect(page.locator('#webamp')).toBeVisible();
  await expect(task(page)).toHaveText('Winamp');
});

// source: README "Winamp ... lazy-loaded from unpkg" (a slow unpkg download must not pop errors over the billing screen)
test('@app:winamp logging off before the Webamp download finishes shows no error on the lock screen', async ({ page }) => {
  let release;
  const held = new Promise((r) => { release = r; });
  await page.route(WEBAMP, async (r) => { await held; await r.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fake('default') }); });
  await toDesktop(page);
  await page.locator('.quick [data-app="winamp"]').click();
  await expect(task(page)).toHaveText('Memuat Winamp...');
  await logoff(page);
  release();
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await wa(page, () => window.__wa ?? null)).toBe(null); // no player is built without a desktop
  await login(page);
  await page.locator('.quick [data-app="winamp"]').click();
  await expect(page.locator('#webamp')).toBeVisible();
});
