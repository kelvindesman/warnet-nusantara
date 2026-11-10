// Desktop shell (js/main.js): icons, context menu, Start menu, tray, billing, shutdown.
import { readFileSync } from 'node:fs';
import { test, expect, boot, toDesktop } from './fixtures.mjs';

const GAMES = JSON.parse(readFileSync(new URL('../../data/games.json', import.meta.url), 'utf8'));

const launch = (page, id) => page.evaluate((d) => window.dispatchEvent(new CustomEvent('launch', { detail: d })), id);
const freeSpot = async (page) => {
  const d = await page.locator('.desktop').boundingBox();
  return { x: d.width - 60, y: 40 };
};

// source: README "Boot flow: Award BIOS POST → warnet billing lock screen ... → \"selamat datang\" → XP-style desktop"
test('@app:boot BIOS POST runs to the end on its own; any key also skips it', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.bios .txt')).toContainText('Memory Testing : 131072K OK', { timeout: 10_000 });
  await expect(page.locator('.bios .txt')).toContainText('Billing Client v3.1');
  await expect(page.locator('.lock form.billing')).toBeVisible({ timeout: 10_000 });
  await boot(page);
  await expect(page.locator('.bios')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.lock form.billing')).toBeVisible();
});

// source: README "random voucher on a sticky note"
test('@app:boot Voucher baru prints a new voucher; Enter on the sticky note fills the form', async ({ page }) => {
  await boot(page);
  await page.locator('.bios').click();
  const user = await page.locator('.sticky .vu').textContent();
  await page.locator('[data-new]').click();
  await expect(page.locator('.billing .err')).toHaveText('Voucher baru dicetak. Cek kertas kuning.');
  await expect(page.locator('.sticky .vu')).not.toHaveText(user);
  await page.locator('.sticky').press('a');
  await expect(page.locator('[name=u]')).toHaveValue('');
  const user2 = await page.locator('.sticky .vu').textContent();
  await page.locator('.sticky').press('Enter'); // fills the form and focuses Masuk (bug ref coverage sweep 2026-11-07 #5)
  await expect(page.locator('[name=u]')).toHaveValue(user2);
  await page.keyboard.press('Enter'); // a second Enter logs in
  await expect(page.locator('.welcome')).toContainText(user2);
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
});

// source: README "XP-style desktop" (click selects an icon, double click or Enter opens it)
test('@app:desktop icons select on click, open on double click and Enter; quick launch opens apps', async ({ page }) => {
  await toDesktop(page);
  const rules = page.locator('.icon[data-app="rules"]');
  await rules.click();
  await expect(rules).toHaveClass(/\bsel\b/);
  await page.locator('.icon[data-app="memories"]').click();
  await expect(rules).not.toHaveClass(/\bsel\b/);
  const spot = await freeSpot(page);
  await page.locator('.desktop .icons').click({ position: { x: 5, y: (await page.locator('.desktop .icons').boundingBox()).height - 5 } });
  await expect(page.locator('.icon.sel')).toHaveCount(0);
  await rules.click();
  await page.mouse.click(spot.x, spot.y);
  await expect(page.locator('.icon.sel')).toHaveCount(0);
  await rules.press('x');
  await expect(page.locator('.win')).toHaveCount(0);
  await rules.press('Enter');
  await expect(page.getByRole('dialog', { name: 'ATURAN_WARNET.txt - Notepad' })).toBeVisible();
  await page.locator('.quick [data-app="chat"]').click();
  await expect(page.locator('.win', { hasText: 'IRC Chat' }).first()).toBeVisible();
  await page.locator('.quick').evaluate((q) => q.click()); // the gap between buttons opens nothing
  await expect(page.locator('.win')).toHaveCount(2);
  await launch(page, 'tidak-ada'); // unknown ids are ignored
  await expect(page.locator('.win')).toHaveCount(2);
});

// source: README "Others: ... Notepad ..., Display Properties (dolphin wallpaper), Start menu"
test('@app:desktop wallpaper context menu: Refresh, New Text Document, Properties, Tentang PC ini', async ({ page }) => {
  await toDesktop(page);
  const spot = await freeSpot(page);
  const ctx = page.locator('.ctx');
  await page.mouse.click(spot.x, spot.y, { button: 'right' });
  await expect(ctx).toBeVisible();
  await page.mouse.click(spot.x, spot.y, { button: 'right' }); // a second menu replaces the first
  await expect(ctx).toHaveCount(1);
  await ctx.locator('button[data-c="refresh"]').click();
  await expect(ctx).toHaveCount(0);
  await expect(page.locator('.desktop .icons')).toHaveCSS('opacity', '1');
  for (const [c, title] of [['notepad', 'Untitled.txt - Notepad'], ['display', 'Display Properties'], ['about', 'System Properties']]) {
    await page.mouse.click(spot.x, spot.y, { button: 'right' });
    await ctx.locator(`button[data-c="${c}"]`).click();
    await expect(page.getByRole('dialog', { name: title })).toBeVisible();
    await page.getByRole('dialog', { name: title }).getByRole('button', { name: 'Close' }).click();
  }
  await page.mouse.click(spot.x, spot.y, { button: 'right' });
  await ctx.locator('hr').click();
  await expect(ctx).toHaveCount(0);
  await page.mouse.click(spot.x, spot.y, { button: 'right' });
  await expect(ctx).toBeVisible();
  await page.mouse.click(spot.x - 100, spot.y); // clicking elsewhere closes it
  await expect(ctx).toHaveCount(0);
  await page.mouse.click(spot.x, spot.y, { button: 'right' });
  await ctx.locator('button[data-c="refresh"]').hover();
  await page.mouse.down(); // pressing inside the menu keeps it
  await expect(ctx).toBeVisible();
  await page.mouse.up();
});

// source: README "Others: ... Start menu, Log Off / Turn Off"
test('@app:desktop Start menu opens every app it lists, toggles, and closes on outside click', async ({ page }) => {
  await toDesktop(page);
  const start = page.locator('.startbtn');
  const menu = page.locator('.startmenu');
  await start.click();
  await expect(menu).toBeVisible();
  await expect(start).toHaveClass(/\bon\b/);
  await start.click();
  await expect(menu).toHaveCount(0);
  await start.click();
  await menu.locator('.head').click(); // not an item
  await expect(menu).toBeVisible();
  await page.mouse.click(600, 200);
  await expect(menu).toHaveCount(0);
  const ids = ['ym', 'ranjau', 'ular', 'notepad', 'docs', 'music', 'computer', 'display', 'memories', 'rules', 'about'];
  for (const id of ids) {
    await start.click();
    await menu.locator(`[data-app="${id}"]`).click();
    await expect(menu).toHaveCount(0);
  }
  for (const t of ['Instant Message', 'Ranjau', 'Ular HP', 'Untitled.txt - Notepad', 'My Documents', 'Lagu MP3', 'My Computer', 'Display Properties', 'Kenangan Warnet.txt - Notepad', 'ATURAN_WARNET.txt - Notepad', 'System Properties']) {
    await expect(page.locator('.win').filter({ has: page.locator('.tt', { hasText: t }) }).first()).toBeAttached();
  }
});

// source: README "XP-style desktop with a live billing timer" + RULES "Kalau billing habis, PC otomatis terkunci. Mau nambah? Teriak \"MAS, NAMBAH SEJAM!\""
test('@app:desktop billing: 5-minute warning, Nambah 1 jam, then WAKTU HABIS locks the PC', async ({ page }) => {
  await page.clock.install();
  await toDesktop(page);
  const bill = page.locator('.taskbar .bill');
  await expect(bill).toHaveText(/^\d\d:\d\d:\d\d$/);
  const secs = (t) => t.split(':').reduce((a, n) => a * 60 + Number(n), 0);
  await expect(page.locator('.balloon')).toContainText('Selamat datang');
  const left = secs(await bill.textContent());
  await page.clock.fastForward((left - 200) * 1000);
  await expect(bill).toHaveClass(/\blow\b/);
  await expect(page.locator('.balloon')).toContainText('Waktu kamu tinggal 5 menit!');
  await page.clock.fastForward(2000); // still low, warned only once
  await expect(page.locator('.balloon')).toContainText('Waktu kamu tinggal 5 menit!');

  await bill.click();
  const box = page.getByRole('dialog', { name: 'Billing' });
  await expect(box).toContainText('Biaya:');
  await box.getByRole('button', { name: 'OK' }).click();
  await expect(box).toHaveCount(0);
  await expect(bill).toHaveClass(/\blow\b/);
  await bill.click();
  await box.getByRole('button', { name: 'Close' }).click(); // closing the box is like OK
  await expect(box).toHaveCount(0);
  await bill.click();
  await box.getByRole('button', { name: 'Nambah 1 jam' }).click();
  await expect(page.locator('.balloon')).toContainText('MAS, NAMBAH SEJAM!');
  await expect(bill).not.toHaveClass(/\blow\b/);
  expect(secs(await bill.textContent())).toBeGreaterThan(3600);

  await page.clock.fastForward(5 * 3600 * 1000);
  await expect(page.locator('.lock')).toContainText('WAKTU HABIS!');
  await expect(page.locator('.lock .tarif').first()).toContainText('PC terkunci otomatis');
});

// source: README "XP-style desktop" tray (volume, LAN) and balloons
test('@app:desktop tray: volume toggles mute, LAN shows a balloon, balloons close and expire', async ({ page }) => {
  await toDesktop(page);
  await expect(page.locator('.balloon')).toContainText('Selamat datang');
  await page.locator('.balloon .x').click();
  await expect(page.locator('.balloon')).toHaveCount(0);
  const vol = page.locator('.tray .vol');
  await expect(vol).toHaveCSS('opacity', '0.4'); // ?nosound starts muted
  await vol.click();
  await expect(vol).toHaveAttribute('title', 'Volume');
  await expect(vol).toHaveCSS('opacity', '1');
  await vol.click();
  await expect(vol).toHaveAttribute('title', 'Suara mati');
  await page.locator('.tray .net').click();
  await expect(page.locator('.balloon')).toContainText('Dibagi rame-rame 20 PC');
  await expect(page.locator('.balloon')).toHaveCount(0, { timeout: 12_000 });
});

// source: README "Others: ... Log Off / Turn Off (\"Sekarang aman untuk mematikan komputer\")"
test('@app:desktop shutdown dialog: background click stays, Batal, Stand By logs off, Restart reboots', async ({ page }) => {
  await toDesktop(page);
  const turnOff = async () => { await page.locator('.startbtn').click(); await page.locator('[data-p="off"]').click(); };
  await turnOff();
  const ov = page.locator('.shutdown-overlay');
  await expect(ov).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/grayscale/);
  await ov.locator('h3').click();
  await expect(ov).toBeVisible();
  await ov.getByRole('button', { name: 'Batal' }).click();
  await expect(ov).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/grayscale/);
  await expect(page.locator('.desktop')).toBeVisible();
  await turnOff();
  await ov.locator('[data-s="standby"]').click();
  await expect(page.locator('.lock')).toContainText('Terima kasih');
  await toDesktop(page);
  await turnOff();
  await ov.locator('[data-s="restart"]').click();
  await expect(page.locator('.bios')).toBeVisible();
});

// source: README "Boot flow" (Log Off right after logging in must not leave a stray balloon on the lock screen)
test('@app:desktop logging off before the welcome balloon shows keeps the lock screen clean', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  await expect(page.locator('.lock')).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.locator('.balloon')).toHaveCount(0);
});

// source: AGENTS.md "Lazy loading. New apps go in js/apps/<name>.js and are imported inside APPS[id].run"
test('@app:ular an app module that fails to load shows an error box instead of breaking the desktop', async ({ page }) => {
  await page.route('**/js/apps/ular.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export function open() { throw new Error("rusak"); }' }));
  await toDesktop(page);
  await page.locator('.icon[data-app="ular"]').dblclick();
  const err = page.getByRole('dialog', { name: 'Error' });
  await expect(err).toContainText('Gagal membuka Ular HP.');
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'progress');
});

// source: README "Winamp ... lazy-loaded from unpkg" (the lock screen must still work when Winamp cannot load)
test('@app:winamp lock screen survives a Winamp module that fails to load', async ({ page }) => {
  await page.route('**/js/apps/winamp.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export const = ;' }));
  await boot(page);
  await page.locator('.bios').click();
  await expect(page.locator('.lock form.billing')).toBeVisible();
  await page.locator('.sticky').click();
  await expect(page.locator('[name=u]')).toHaveValue(await page.locator('.sticky .vu').textContent());
});

test.describe('touch screen', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'isMobile is not supported in Firefox');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 900, height: 700 } });
  // source: README "Supports touch: ... a single tap opens icons"
  test('@app:desktop a single tap opens desktop and folder icons; the login field is not auto-focused', async ({ page }) => {
    await boot(page);
    await page.locator('.bios').tap();
    await expect(page.locator('.lock form.billing')).toBeVisible();
    await page.waitForTimeout(150);
    await expect(page.locator('[name=u]')).not.toBeFocused();
    await toDesktop(page);
    await page.locator('.icon[data-app="docs"]').tap();
    const docs = page.getByRole('dialog', { name: 'My Documents' });
    await expect(docs).toBeVisible();
    await docs.locator('.ex-main [data-i="0"]').tap();
    await expect(page.getByRole('dialog', { name: 'ATURAN_WARNET.txt - Notepad' })).toBeVisible();
    await page.locator('.icon[data-app="games"]').tap();
    const games = page.getByRole('dialog', { name: 'Game Warnet' });
    await games.locator('[data-g="ranjau"]').tap();
    await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible();
  });
});

// source: Kelvin request 2026-11-10 "randomize game account on desktop so all game fair chance and psx game should be shown at ddesktop icon bottom right or topl eft"
test('@app:desktop game shortcuts are shuffled each session behind fixed system icons; PS1/PS2 fan ports sit in the bottom-right rental PS corner', async ({ page }) => {
  const order = async (seed) => {
    await toDesktop(page, `seed=${seed}`);
    return page.locator('.desktop .icons .icon').evaluateAll((els) => els.map((e) => e.dataset.app));
  };
  const a = await order(1), b = await order(2), c = await order(3);
  const sys = a.filter((id) => !id.startsWith('g:'));
  expect(sys[0]).toBe('computer'); expect(sys.at(-1)).toBe('ular');
  for (const o of [b, c]) {
    expect(o.slice(0, sys.length)).toEqual(sys); // system icons keep their place
    expect([...o].sort()).toEqual([...a].sort()); // same shortcuts, nothing lost
  }
  const games = (o) => o.slice(sys.length).join();
  expect(new Set([games(a), games(b), games(c)]).size).toBeGreaterThan(1); // the order really changes
  expect(a.slice(sys.length).every((id) => id.startsWith('g:'))).toBe(true);

  // the corner: every PS fan port, bottom-right, clear of the main icons and the taskbar
  const corner = page.locator('.desktop .ps-corner');
  await expect(corner).toHaveAttribute('aria-label', 'Pojok Rental PS');
  const ids = await corner.locator('.icon').evaluateAll((els) => els.map((e) => e.dataset.app));
  expect(ids.length).toBeGreaterThanOrEqual(8);
  expect([...ids].sort()).toEqual(GAMES.filter((g) => g.console).map((g) => 'g:' + g.id).sort());
  for (const [w, h] of [[1366, 768], [1280, 720], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    const box = await corner.boundingBox(), bar = await page.locator('.taskbar').boundingBox();
    expect(Math.round(box.x + box.width), `${w}x${h} right edge`).toBeGreaterThanOrEqual(w - 10);
    expect(Math.round(box.y + box.height), `${w}x${h} sits on the taskbar`).toBeLessThanOrEqual(Math.round(bar.y) + 1);
    expect(box.y, `${w}x${h} lower half`).toBeGreaterThan(h / 2 - 100);
    const overlap = await page.locator('.desktop .icons .icon').evaluateAll((els, r) => els.filter((e) => {
      const b = e.getBoundingClientRect();
      return b.right <= innerWidth && b.left < r.x + r.width && b.right > r.x && b.top < r.y + r.height && b.bottom > r.y;
    }).length, box);
    expect(overlap, `${w}x${h} no main icon under the corner`).toBe(0);
  }
  // phone: the corner stays two rows tall and scrolls sideways, so every PS shortcut is still reachable
  await page.setViewportSize({ width: 390, height: 844 });
  const last = corner.locator('.icon').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  expect(new Set(await corner.locator('.icon').evaluateAll((els) => els.map((e) => e.offsetTop))).size).toBe(2);
  await page.setViewportSize({ width: 1366, height: 768 });
  // select, right-click and open like any desktop shortcut; the launcher keeps the not-affiliated note
  const crash = corner.locator('.icon[data-app="g:fpcrashbash"]');
  await crash.click({ button: 'right' });
  await expect(crash).toHaveClass(/sel/);
  await page.keyboard.press('Escape');
  await page.locator('.desktop .icons .icon[data-app="computer"]').click();
  await expect(crash).not.toHaveClass(/sel/);
  await crash.dblclick();
  await expect(page.getByRole('dialog', { name: 'Crash Bash (port fan)', exact: true }).locator('.op-small')).toContainText('tidak berafiliasi');
});
