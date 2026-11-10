// PC eras: 2003 (Win XP), 2011 (Win 7), 2015 (Win 10), picked on the billing screen.
import { test, expect, boot, toDesktop } from './fixtures.mjs';

const REQ = 'Kelvin request 2026-11-08 "support multiple eras the current xp and abit before modern internet era until 2012,2013,2014,2015 windows 7 windows 10"';
const era = (page) => page.evaluate(() => document.documentElement.dataset.era);

async function toLock(page, query = '') {
  await boot(page, query);
  await page.locator('.bios').click();
  await expect(page.locator('.lock form.billing')).toBeVisible();
}

async function login(page) {
  await page.locator('.sticky').click();
  await page.locator('form.billing [type=submit]').click();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 10_000 });
}

// source: REQ (era picked on the billing screen; rate, theme and Wayback year follow it)
test('@app:boot picking 2011 on the billing screen switches theme, rate, wallpaper, Wayback year and About box', async ({ page }) => {
  await toLock(page);
  expect(await era(page)).toBe('2003');
  const lock = page.locator('.lock');
  await expect(lock.locator('.eras [data-era="2003"]')).toHaveAttribute('aria-pressed', 'true');
  // source: Kelvin request 2026-11-08 "win xp, win 7 win 10" (picker labels, screenshot of the 2003/2011/2015 buttons)
  await expect(lock.locator('.eras small')).toHaveText(['Win XP', 'Win 7', 'Win 10']);
  await expect(lock.locator('table.tarif')).toContainText('Rp 3.000/jam');

  await lock.locator('.eras [data-era="2011"]').click();
  expect(await era(page)).toBe('2011');
  await expect(lock.locator('.eras [data-era="2011"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(lock.locator('table.tarif')).toContainText('Rp 4.000/jam');
  await expect(lock.locator('table.tarif')).toContainText('Rp 15.000');
  await expect(lock.locator('.marquee').last()).toContainText('Paket malam Rp 15.000');
  expect(new URL(page.url()).searchParams.get('era')).toBe('2011');
  expect(await page.evaluate(() => localStorage.getItem('era'))).toBe('2011');
  await lock.locator('[data-be="paket"]').click();
  await expect(lock.locator('.billing .err')).toContainText('Paket: Rp 4.000/jam · Paket malam Rp 15.000');
  await page.locator('.lock .eras [data-era="2011"]').click(); // same era again: no re-render, the message stays
  await expect(page.locator('.lock .billing .err')).toContainText('Paket: Rp 4.000/jam');

  await login(page);
  await expect(page.locator('.desktop')).toHaveClass(/wp-aurora/);
  expect(await page.locator('.taskbar').evaluate((e) => e.getBoundingClientRect().height)).toBe(40);
  await page.locator('.startbtn').click();
  await expect(page.locator('.startmenu')).toContainText('Jalan-jalan ke tahun 2010');
  await page.locator('.startmenu [data-app="about"]').click();
  const about = page.locator('.win', { hasText: 'Sistem:' });
  // source: Kelvin request 2026-11-08 "rename jendela 7 jendela 10 jendela xp, win 7 win 10 win xp"
  await expect(about).toContainText('Win 7');
  await expect(about).toContainText('Intel Core i3-2100');

  await expect(page.locator('.balloon')).toContainText('internet tahun 2010'); // the welcome balloon comes first, then replaces whatever is showing
  await page.locator('.tray .bill').click();
  await page.getByRole('button', { name: 'Nambah 1 jam' }).click();
  await expect(page.locator('.balloon')).toContainText('Waktu ditambah 1 jam (Rp 4.000)');

  await page.locator('.icon[data-app="browser"]').dblclick();
  await expect(page.locator('.br-addr select')).toHaveValue('2010');
});

// source: REQ (newer PCs: a modern POST and the OS splash, rate Rp 5.000; the URL keeps the era across a reload)
test('@app:boot ?era=2015 boots with UEFI POST and the Win 10 splash, survives a reload, and switches back to 2003', async ({ page }) => {
  await boot(page, 'era=2015');
  await expect(page.locator('.bios')).toContainText('UEFI Fast Boot');
  // source: Kelvin request 2026-11-08 "rename jendela 7 jendela 10 jendela xp, win 7 win 10 win xp"
  await expect(page.locator('.bios .splash')).toContainText('Memulai Win 10...', { timeout: 10_000 });
  await expect(page.locator('.lock form.billing')).toBeVisible({ timeout: 10_000 });
  expect(await era(page)).toBe('2015');
  await expect(page.locator('.lock table.tarif')).toContainText('Rp 5.000/jam');

  await page.reload();
  await page.locator('.bios').click();
  await expect(page.locator('.lock .eras [data-era="2015"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.lock .eras [data-era="2003"]').click();
  expect(await era(page)).toBe('2003');
  expect(new URL(page.url()).searchParams.get('era')).toBe('2003');
  await expect(page.locator('.lock table.tarif')).toContainText('Rp 3.000/jam');
  await login(page);
  await expect(page.locator('.desktop')).toHaveClass(/wp-bukit/);
});

// source: REQ (skipping the POST on a newer PC also skips its splash)
test('@app:boot skipping the 2011 BIOS goes straight to the billing screen, no splash', async ({ page }) => {
  await toLock(page, 'era=2011');
  await expect(page.locator('.bios')).toHaveCount(0);
  expect(await era(page)).toBe('2011');
});

// source: REQ (the visitor's pick is remembered on the device)
test('@app:boot a saved era is used when the URL has no ?era=', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('era', '2015'));
  await toLock(page);
  expect(await era(page)).toBe('2015');
});

// source: REQ (private mode: storage throws; the pick still switches and the URL carries it)
test('@app:boot picking an era works when localStorage throws (private mode)', async ({ page }) => {
  await page.addInitScript(() => {
    const no = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.getItem = no; Storage.prototype.setItem = no;
  });
  await toLock(page);
  expect(await era(page)).toBe('2003');
  await page.locator('.lock .eras [data-era="2011"]').click();
  expect(await era(page)).toBe('2011');
  expect(new URL(page.url()).searchParams.get('era')).toBe('2011');
});

const REQ2 = 'Kelvin request 2026-11-08 "yes please fix all of this win 7 win 10 should clone as much possible" (Explorer task panes, menu bar, "objects" status still XP)';
const open = (page, id) => page.evaluate((d) => window.dispatchEvent(new CustomEvent('launch', { detail: d })), id);

// source: REQ2 (Win 10 Explorer: ribbon, address + search, Quick access / This PC pane, "items"; taskbar search box)
test('@app:games @app:computer 2015 Explorer has a ribbon, address bar, navigation pane and item count; the taskbar search opens Start', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  await open(page, 'games');
  const win = page.locator('.win', { hasText: 'Game Warnet' }).last();
  await expect(win.locator('.ex-ribbon')).toHaveText(/File\s*Home\s*Share\s*View/);
  await expect(win.locator('.ex-path')).toContainText('This PC › Game Warnet');
  await expect(win.locator('.ex-search input')).toHaveAttribute('placeholder', 'Cari di Game Warnet');
  await expect(win.locator('.menubar')).toBeHidden();
  await expect(win.locator('.ex-side')).toBeHidden();
  await expect(win.locator('.statusbar .st')).toHaveText(/^\d+ item$/);
  await win.locator('.ex-nav [data-go="computer"]').click();
  const pc = page.locator('.win', { hasText: 'Local Disk (C:)' });
  await expect(pc.locator('.statusbar .st')).toHaveText('6 item');
  await pc.locator('.ex-nav [data-go="recycle"]').click();
  await expect(page.locator('.win', { hasText: 'foto_mantan.jpg' })).toBeVisible();

  await page.locator('.tb-search').click();
  await expect(page.locator('.startmenu')).toBeVisible();
  await page.locator('.tb-search').click();
  await expect(page.locator('.startmenu')).toHaveCount(0);
});

// source: REQ2 (Win 7 Explorer: command bar and Favorites / Libraries / Computer pane)
test('@app:docs 2011 Explorer has a command bar and navigation pane that opens folders', async ({ page }) => {
  await toDesktop(page, 'era=2011');
  await open(page, 'computer');
  const win = page.locator('.win', { hasText: 'Local Disk (C:)' });
  await expect(win.locator('.ex-cmd')).toContainText('Organize ▾');
  await expect(win.locator('.ex-path')).toContainText('Computer › My Computer');
  await expect(win.locator('.ex-ribbon')).toHaveCount(0);
  await expect(win.locator('.ex-nav')).toContainText('Libraries');
  await win.locator('.ex-nav p', { hasText: 'Documents' }).click();
  await expect(page.locator('.win', { hasText: 'tugas_sejarah_FINAL_revisi3.doc' })).toBeVisible();
  await open(page, 'games');
  const games = page.locator('.win', { hasText: 'Suggest' }).or(page.locator('.win', { hasText: 'Usul game ke operator' }));
  await games.locator('.ex-nav [data-go="music"]').click();
  await expect(page.locator('.win', { hasText: 'Chiptune buatan sendiri' }).first()).toBeVisible();
});

const REQ3 = 'Kelvin request 2026-11-08 "Next queued: era-specific content (bookmarks, games and IRC chat per era). yes"';

// source: REQ3 (bookmarks and portal follow the PC era)
test('@app:browser 2011 favorites and portal show 2010-era sites, not the 2003 ones', async ({ page }) => {
  await toDesktop(page, 'era=2011');
  await page.locator('.icon[data-app="browser"]').dblclick();
  const win = page.locator('.win', { hasText: 'Penjelajah Internet' });
  await expect(win.locator('.br-links')).toContainText('Facebook');
  await expect(win.locator('.br-links')).not.toContainText('Friendster');
  await expect(win.locator('.br-view iframe')).toHaveAttribute('src', 'home.html?era=2011');
  const portal = page.frameLocator('.br-view iframe');
  await expect(portal.locator('#side')).toContainText('Plurk');
  await expect(portal.locator('#side')).not.toContainText('GeoCities');
  await expect(portal.locator('#hits')).toContainText('Ngejar karma Plurk');
  await expect(portal.locator('#cari input')).toHaveAttribute('placeholder', 'Cari di Google 2010...');
  await win.locator('.br-links button', { hasText: 'Plurk' }).click();
  await expect(win.locator('.br-addr input')).toHaveValue('http://www.plurk.com/');
  await expect(win.locator('.br-addr select')).toHaveValue('2010');
});

// source: REQ3 (games the booths played on that PC come first)
test('@app:games 2015 Game Warnet opens with a "Lagi rame" group: Dota 2 and CS:GO memorials first; 2003 has none', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  await open(page, 'games');
  const win = page.locator('.win', { hasText: 'Game Warnet' }).last();
  await expect(win.locator('.group').first()).toHaveText('Lagi rame di warnet 2015');
  await expect(win.locator('.ex-main [data-g]').nth(0)).toContainText('Point Blank');
  await expect(win.locator('[data-g="dota2"]')).toHaveCount(1);
  await expect(win.locator('[data-g="csgo"]')).toHaveCount(1);
  await win.locator('[data-g="dota2"]').dblclick();
  const shrine = page.locator('.win', { hasText: 'report mid' });
  await expect(shrine.locator('.sh-st')).toContainText('maintenance', { timeout: 5000 });
  await expect(shrine.locator('[data-site]')).toContainText('2013');
});

// source: REQ3 (the 2003 catalog keeps its original layout)
test('@app:games 2003 Game Warnet has no "Lagi rame" group', async ({ page }) => {
  await toDesktop(page);
  await open(page, 'games');
  await expect(page.locator('.win', { hasText: 'Game Warnet' }).last().locator('.group.rame')).toHaveCount(0);
});

// source: REQ3 (IRC bots talk about that era's games and apps)
test('@app:chat 2015 IRC: channel topic from 2015 and bots reply with 2015 lines', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  await page.evaluate(() => { Math.random = () => 0; }); // first reply line, every message answered
  await page.locator('.icon[data-app="chat"]').dblclick();
  const log = page.locator('.irc-log');
  await expect(log).toContainText('Set by ChanServ on Sat Jan 10 2015');
  const input = page.getByRole('textbox', { name: 'Pesan' });
  await input.fill('halo'); await input.press('Enter');
  await expect(log).toContainText(/follow ig \S+/);
});
