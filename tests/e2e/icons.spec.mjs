// Every launcher a visitor can click opens what it promises: desktop icons
// (double click), Start-menu items and quick-launch buttons. External hosts stay
// blocked (fixture), so games are checked for wiring: the framed URL or the
// new-tab target, not playability.
import { readFileSync } from 'node:fs';
import { test, expect, toDesktop } from './fixtures.mjs';

const GAMES = JSON.parse(readFileSync(new URL('../../data/games.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
const WEBAMP = 'https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.mjs';
const FAKE_WEBAMP = `export default class Webamp {
  static browserIsSupported() { return true; }
  async renderWhenReady(host) { const el = document.createElement('div'); el.id = 'webamp'; el.textContent = 'WEBAMP'; host.appendChild(el); }
  onClose() {} onMinimize() {} dispose() { document.getElementById('webamp')?.remove(); }
}`;

async function fresh(page) {
  await page.route(WEBAMP, (r) => r.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: FAKE_WEBAMP }));
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
}

/** What a launcher opened must be the right thing and never an error box. */
async function checkOpened(page, id) {
  const wins = page.locator('.win');
  if (id === 'winamp') return expect(page.locator('#webamp')).toHaveText('WEBAMP');
  await expect(wins.first(), id).toBeVisible();
  if (id.startsWith('g:') && byId[id.slice(2)].broken) { // known-broken game: the operator note comes first
    await expect(page.locator('.win .dialog').filter({ hasText: byId[id.slice(2)].broken })).toBeVisible();
    await page.getByRole('button', { name: 'Tetap coba' }).click();
  }
  await expect(page.locator('.win .dialog'), `${id}: no error/alert box`).toHaveCount(id.startsWith('g:') && byId[id.slice(2)].mode === 'tab' ? 1 : 0);
  if (!id.startsWith('g:')) return;
  const g = byId[id.slice(2)];
  if (g.mode === 'embed') {
    const win = page.getByRole('dialog', { name: g.name });
    await expect(win.locator('iframe')).toHaveAttribute('src', g.url);
  } else if (g.mode === 'tab') {
    await page.getByRole('dialog', { name: g.name }).getByRole('button', { name: 'Buka' }).click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual([[g.url, '_blank', 'noopener']]);
  } else if (g.mode === 'fanport' && g.console) { // rental PS corner: the launcher, never a frame, then a new tab
    const win = page.getByRole('dialog', { name: g.name, exact: true });
    await expect(win.locator('.op-small')).toContainText('tidak berafiliasi');
    await expect(win.locator('iframe')).toHaveCount(0);
    await win.locator('[data-play]').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual([[g.url, '_blank', 'noopener']]);
  } else {
    throw new Error(`desktop icon for unexpected game mode ${g.mode}: ${id}`);
  }
}

// source: Kelvin request 2026-11-08 "have we tested eveys single icon to ensure its fucntional"
test('@app:desktop every desktop icon opens its app or game on double click', async ({ page }) => {
  test.setTimeout(240_000);
  await fresh(page);
  const ids = await page.locator('.desktop .icons .icon, .desktop .ps-corner .icon').evaluateAll((els) => els.map((e) => e.dataset.app));
  expect(ids.length).toBeGreaterThan(20);
  for (const id of ids) {
    await fresh(page);
    await page.locator(`.desktop .icon[data-app="${id}"]`).dblclick();
    await checkOpened(page, id);
  }
});

// source: Kelvin request 2026-11-08 "have we tested eveys single icon to ensure its fucntional"
test('@app:desktop every Start-menu item and quick-launch button opens its app', async ({ page }) => {
  test.setTimeout(180_000);
  await fresh(page);
  await page.locator('.startbtn').click();
  const ids = await page.locator('.startmenu .sm-item').evaluateAll((els) => els.map((e) => e.dataset.app));
  expect(ids.length).toBeGreaterThan(10);
  for (const id of ids) {
    await fresh(page);
    await page.locator('.startbtn').click();
    await page.locator(`.startmenu .sm-item[data-app="${id}"]`).click();
    await checkOpened(page, id);
  }
  const quick = await page.locator('.taskbar .quick [data-app]').evaluateAll((els) => els.map((e) => e.dataset.app));
  for (const id of quick) {
    await fresh(page);
    await page.locator(`.taskbar .quick [data-app="${id}"]`).click();
    await checkOpened(page, id);
  }
});

// source: Kelvin request 2026-11-08 "make this also visible on the desktop so user who not click start button can also subtly notice" (Dukung Warnet Ini)
test('@app:donate Dukung Warnet Ini has a desktop icon that opens the payment window', async ({ page }) => {
  await toDesktop(page);
  const ic = page.locator('.desktop .icons .icon[data-app="donate"]');
  await expect(ic).toHaveText('Dukung Warnet Ini');
  await ic.dblclick();
  await expect(page.getByRole('dialog', { name: 'Dukung Warnet Ini' }).locator('.op-pay')).toHaveCount(4);
});
