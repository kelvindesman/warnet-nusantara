// OS chrome that looks clickable must do something: explorer search, address crumb, back/forward,
// navigation pane, menu bars, the Win 7 command bar, the Win 10 ribbon, taskbar search and tray icons.
import { readFileSync } from 'node:fs';
import { test, expect, toDesktop, boot, openBrowser } from './fixtures.mjs';

const GAMES = JSON.parse(readFileSync(new URL('../../data/games.json', import.meta.url), 'utf8'));
const dlg = (page, name) => page.getByRole('dialog', { name, exact: true });
const open = (page, id) => page.evaluate((d) => window.dispatchEvent(new CustomEvent('launch', { detail: d })), id);
const menu = (page) => page.locator('.ctx.drop');
const pick = async (page, anchor, label) => {
  await anchor.click();
  await menu(page).getByRole('menuitem', { name: label, exact: true }).click();
  await expect(menu(page)).toHaveCount(0);
};
const closeBox = async (page, title, text) => {
  const box = dlg(page, title);
  await expect(box).toContainText(text);
  await box.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(box).toHaveCount(0);
};
const closeWin = (page, title) => dlg(page, title).getByRole('button', { name: 'Close', exact: true }).click();
/** Games whose icon text (name + year) matches, as the folder search does. */
const matching = (q) => GAMES.filter((g) => `${g.name}${g.year}`.toLowerCase().includes(q));

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:games 2015 search box filters Game Warnet by name, hides empty groups and says when nothing matches', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  await open(page, 'games');
  const win = dlg(page, 'Game Warnet');
  const q = win.getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await expect(q).toHaveAttribute('placeholder', 'Cari di Game Warnet');
  const shown = win.locator('.ex-main .icon:visible');

  await win.locator('[data-g="doom"]').click(); // selected, then filtered away: the selection goes with it
  await q.fill('pinball');
  await expect(shown).toHaveCount(matching('pinball').length);
  await expect(win.locator('.statusbar .st')).toHaveText(`${matching('pinball').length} item`);
  await expect(win.locator('.ex-main .sel')).toHaveCount(0);
  await expect(win.locator('.group:visible')).toHaveText(['Main di sini (port web & emulator)']);
  await expect(win.locator('.fp-disc')).toBeHidden();

  await win.locator('[data-g="epicpinball"]').click(); // still visible: it stays selected
  await q.fill('epic');
  await expect(win.locator('.ex-main .sel')).toHaveAttribute('data-g', 'epicpinball');
  await q.fill('DOOM');
  await expect(shown).toHaveCount(matching('doom').length);
  await expect(win.locator('.group:visible')).toHaveText(['Main di sini (port web & emulator)', 'Online beneran (buka tab baru)']);
  await q.fill('port fan');
  await expect(shown).toHaveCount(matching('port fan').length);
  await expect(win.locator('.group:visible')).toHaveText(['Port Fan (tidak resmi, buka tab baru)']);
  await expect(win.locator('.fp-disc')).toBeVisible();

  await q.fill('zzz');
  await expect(shown).toHaveCount(0);
  await expect(win.locator('.ex-empty')).toHaveText('Tidak ada yang cocok dengan "zzz".');
  await expect(win.locator('.statusbar .st')).toHaveText('0 item');
  await pick(page, win.getByRole('button', { name: 'View', exact: true }), 'Refresh'); // clears the search
  await expect(q).toHaveValue('');
  await expect(shown).toHaveCount(GAMES.length);
  await expect(win.locator('.ex-empty')).toBeHidden();
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:games @app:computer 2015 ribbon, address crumb, greyed back/forward and every navigation pane entry work', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  await open(page, 'games');
  const win = dlg(page, 'Game Warnet');
  for (const l of ['Back', 'Forward']) await expect(win.getByRole('button', { name: l, exact: true })).toBeDisabled();

  const file = win.getByRole('button', { name: 'File', exact: true });
  await file.click();
  await expect(menu(page).getByRole('menuitem', { name: 'Open' })).toBeDisabled(); // nothing selected yet
  await page.keyboard.press('Escape');
  await expect(menu(page)).toHaveCount(0);
  await win.locator('[data-g="ranjau"]').click();
  await pick(page, file, 'Open');
  await expect(dlg(page, 'Ranjau')).toBeVisible();
  await closeWin(page, 'Ranjau');

  await pick(page, win.getByRole('button', { name: 'Home', exact: true }), 'New folder');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, win.getByRole('button', { name: 'Home', exact: true }), 'Delete');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, win.getByRole('button', { name: 'Share', exact: true }), 'Burn to disc');
  await closeBox(page, 'CD-RW', 'cuma bisa baca');
  await pick(page, win.getByRole('button', { name: 'Share', exact: true }), 'Email');
  await closeBox(page, 'Network', 'Sharing dimatikan');

  await win.locator('.ex-nav p', { hasText: 'Network' }).click();
  await closeBox(page, 'Network', 'Sharing dimatikan');
  await win.locator('.ex-nav p', { hasText: 'Quick access' }).click();
  await expect(dlg(page, 'My Documents')).toBeVisible();
  await closeWin(page, 'My Documents');
  await win.getByRole('button', { name: 'This PC', exact: true }).click(); // address bar crumb
  await expect(dlg(page, 'My Computer')).toBeVisible();

  await dlg(page, 'My Computer').locator('.ex-nav p', { hasText: 'Desktop' }).click(); // Show desktop: every window minimized
  for (const t of ['Game Warnet', 'My Computer']) await expect(dlg(page, t)).toBeHidden();
  await expect(page.locator('.task.w')).toHaveCount(2);
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:computer @app:docs 2011 command bar: Open follows the selection, Burn, New folder, Organize, Share with, Downloads', async ({ page }) => {
  await toDesktop(page, 'era=2011');
  await open(page, 'computer');
  const win = dlg(page, 'My Computer');
  const openBtn = win.locator('.ex-cmd [data-cmd="open"]');
  await expect(openBtn).toBeDisabled();
  await win.locator('.ex-main .icon', { hasText: 'My Documents' }).click();
  await expect(openBtn).toBeEnabled();
  await openBtn.click();
  await expect(dlg(page, 'My Documents')).toBeVisible();
  await closeWin(page, 'My Documents');
  await win.locator('.ex-main').click({ position: { x: 400, y: 200 } }); // empty space: deselects
  await expect(openBtn).toBeDisabled();

  await win.getByRole('button', { name: 'Burn', exact: true }).click();
  await closeBox(page, 'CD-RW', 'cuma bisa baca');
  await win.getByRole('button', { name: 'New folder', exact: true }).click();
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, win.getByRole('button', { name: 'Share with ▾' }), 'Homegroup');
  await closeBox(page, 'Network', 'Sharing dimatikan');
  await pick(page, win.getByRole('button', { name: 'Share with ▾' }), 'Specific people...');
  await closeBox(page, 'Network', 'Sharing dimatikan');
  await win.locator('.ex-nav p', { hasText: 'Downloads' }).click();
  await closeBox(page, 'Downloads', 'Folder Downloads kosong');

  const q = win.getByRole('searchbox', { name: 'Cari di My Computer' });
  await q.fill('disk');
  await expect(win.locator('.ex-main .icon:visible')).toHaveText([/Disket/, /Local Disk \(C:\)/]);
  await expect(win.locator('.statusbar .st')).toHaveText('2 item');

  const organize = win.getByRole('button', { name: 'Organize ▾' });
  await organize.click();
  await expect(menu(page).getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await win.locator('.ex-main .icon', { hasText: 'Local Disk (C:)' }).click();
  await pick(page, organize, 'Delete');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, organize, 'New folder');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, organize, 'Open');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, organize, 'Close');
  await expect(win).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:games @app:docs 2003 Search pane and File/Edit/View/Favorites/Tools/Help menus work in XP folders', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="games"]').dblclick();
  const win = dlg(page, 'Game Warnet');
  const q = win.locator('.ex-find').getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await q.fill('sango');
  await expect(win.locator('.ex-main .icon:visible')).toHaveCount(matching('sango').length);
  await expect(win.locator('.statusbar .st')).toHaveText(`${matching('sango').length} objek`);

  const bar = (l) => win.locator('.menubar').getByRole('button', { name: l, exact: true });
  await pick(page, bar('View'), 'Refresh');
  await expect(win.locator('.ex-main .icon:visible')).toHaveCount(GAMES.length);
  await pick(page, bar('Edit'), 'Search...');
  await expect(q).toBeFocused();
  await bar('File').click();
  await menu(page).locator('hr').click(); // a separator is not an item: the menu stays
  await expect(menu(page)).toBeVisible();
  await win.locator('.ex-main').click({ position: { x: 5, y: 5 } }); // a click elsewhere closes it
  await expect(menu(page)).toHaveCount(0);
  await bar('Tools').click();
  await menu(page).getByRole('menuitem', { name: 'Folder Options...' }).press('ArrowDown'); // other keys keep it open
  await expect(menu(page)).toBeVisible();
  await menu(page).getByRole('menuitem', { name: 'Folder Options...' }).click();
  await closeBox(page, 'Administrator', 'dikunci mas operator');
  await pick(page, bar('Help'), 'About Windows');
  await expect(dlg(page, 'System Properties')).toBeVisible();
  await closeWin(page, 'System Properties');
  await pick(page, bar('Favorites'), 'Lagu MP3');
  await expect(dlg(page, 'Lagu MP3')).toBeVisible();
  await closeWin(page, 'Lagu MP3');
  await pick(page, bar('Favorites'), 'Game Warnet');
  await pick(page, bar('Favorites'), 'My Documents');
  const docs = dlg(page, 'My Documents');
  await expect(docs).toBeVisible();
  await docs.locator('.ex-main .icon', { hasText: 'puisi_buat_dia.txt' }).click();
  await pick(page, docs.locator('.menubar').getByRole('button', { name: 'File', exact: true }), 'Open');
  await expect(dlg(page, 'puisi_buat_dia.txt - Notepad')).toBeVisible();
  await closeWin(page, 'puisi_buat_dia.txt - Notepad');
  await pick(page, docs.locator('.menubar').getByRole('button', { name: 'File', exact: true }), 'Close');
  await expect(docs).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:notepad Notepad menus: New, Save (Deep Freeze), Exit, Select All, Word Wrap, greyed Status Bar, About', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="rules"]').dblclick();
  const win = dlg(page, 'ATURAN_WARNET.txt - Notepad');
  const ta = win.locator('textarea');
  const bar = (l) => win.locator('.menubar').getByRole('button', { name: l, exact: true });
  await pick(page, bar('Edit'), 'Select All');
  expect(await ta.evaluate((x) => x.selectionEnd - x.selectionStart)).toBe((await ta.inputValue()).length);
  await pick(page, bar('Format'), '✓ Word Wrap');
  await expect(ta).toHaveAttribute('wrap', 'off');
  await pick(page, bar('Format'), 'Word Wrap');
  await expect(ta).toHaveAttribute('wrap', 'soft');
  await bar('View').click();
  await expect(menu(page).getByRole('menuitem', { name: 'Status Bar' })).toBeDisabled();
  await page.keyboard.press('Escape'); // nothing to focus in the menu, so Escape goes to the page
  await bar('View').click(); // the bar still opens it again
  await expect(menu(page)).toHaveCount(1);
  await pick(page, bar('File'), 'Save');
  await closeBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await pick(page, bar('File'), 'New');
  await expect(ta).toHaveValue('');
  await expect(ta).toBeFocused();
  await pick(page, bar('Help'), 'About Notepad');
  await expect(dlg(page, 'System Properties')).toBeVisible();
  await closeWin(page, 'System Properties');
  await pick(page, bar('File'), 'Exit');
  await expect(win).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:browser browser menu bar: Favorites navigates, View Stop/Refresh, Edit, Tools, Help, File', async ({ page }) => {
  await toDesktop(page);
  await openBrowser(page);
  const win = page.locator('.win', { hasText: 'Penjelajah Internet' });
  const bar = (l) => win.locator('.menubar').getByRole('button', { name: l, exact: true });
  const addr = win.locator('.br-addr input');
  await pick(page, bar('Favorites'), 'Friendster');
  await expect(addr).toHaveValue('http://www.friendster.com/');
  await pick(page, bar('View'), 'Stop');
  await expect(win.locator('.statusbar .st')).toHaveText('Dihentikan');
  await pick(page, bar('View'), 'Refresh');
  await expect(win.locator('.br-view iframe')).toHaveAttribute('src', /friendster\.com/);
  await pick(page, bar('Favorites'), 'Home');
  await expect(addr).toHaveValue('about:home');
  await pick(page, bar('Edit'), 'Select Address');
  await expect(addr).toBeFocused();
  await pick(page, bar('Tools'), 'Internet Options...');
  await closeBox(page, 'Administrator', 'dikunci mas operator');
  await pick(page, bar('Help'), 'About Internet Explorer');
  await expect(dlg(page, 'System Properties')).toBeVisible();
  await closeWin(page, 'System Properties');
  const popup = page.waitForEvent('popup');
  await pick(page, bar('File'), 'Buka di tab asli');
  await (await popup).close();
  await pick(page, bar('File'), 'Close');
  await expect(win).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:games 2015 taskbar search finds apps and games, Enter opens the first hit; tray Deep Freeze and clock answer a click', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  const box = page.locator('.tb-search'), q = box.getByRole('searchbox', { name: 'Ketik di sini untuk mencari' });
  const sm = page.locator('.startmenu');
  await q.press('Enter'); // nothing typed, Start closed: nothing happens
  await expect(sm).toHaveCount(0);
  await q.fill('counter'); // typing opens Start in search mode; the desktop shortcut and its game share a name, listed once
  await expect(sm).toHaveClass(/searching/);
  await expect(sm.locator('.sm-results .sm-item', { hasText: 'Counter-Strike 1.6' })).toHaveCount(1);
  await expect(sm.locator('.cols')).toBeHidden();
  await box.click(); // a click while searching keeps Start open
  await expect(sm).toHaveCount(1);
  await q.fill('zzz');
  await expect(sm.locator('.sm-none')).toHaveText('Tidak ada yang cocok dengan "zzz".');
  await q.press('Enter');
  await expect(sm).toHaveCount(1);
  await q.fill('');
  await expect(sm).not.toHaveClass(/searching/);
  await expect(sm.locator('.cols')).toBeVisible();
  await q.fill('ranjau');
  await q.press('Enter');
  await expect(dlg(page, 'Ranjau')).toBeVisible();
  await expect(sm).toHaveCount(0);
  await expect(q).toHaveValue('');

  await page.locator('.tray .df').click();
  await expect(page.locator('.balloon')).toContainText('Status: FROZEN');
  await page.locator('.tray .clock').click();
  await expect(page.locator('.balloon h4')).toHaveText(/Date and Time/);
  await expect(page.locator('.balloon')).toContainText(String(new Date().getFullYear()));
});

// source: Kelvin request 2026-11-08 "ensure all OS feature functional" (Search Game Warnet box was decoration)
test('@app:boot the billing window close button explains it cannot be closed', async ({ page }) => {
  await boot(page, '', '#lock');
  await page.locator('.billing').getByRole('button', { name: 'Tutup' }).click();
  await expect(page.locator('.billing .err')).toHaveText('Billing nggak bisa ditutup, mas. Masukkan voucher dulu!');
  await expect(page.locator('.lock')).toBeVisible();
});

// source: Kelvin request 2026-11-08 "subtle thin height running text somewhere in the ui top or botom without sacrificing user experience"
test('@app:donate supporters running text sits inside the taskbar, pauses on hover, opens Dukung Warnet Ini, and steps aside on phones and reduced motion', async ({ page }) => {
  await toDesktop(page);
  const bar = page.locator('.taskbar'), tick = page.getByRole('button', { name: /pendukung|Jadilah|Terima kasih/ }).and(page.locator('.tb-ticker'));
  await expect(tick).toBeVisible();
  await expect(tick).toHaveAttribute('title', 'Terima kasih para pendukung — klik untuk ikut patungan');
  await expect(tick.locator('span')).toContainText('★');
  // thin and inside the taskbar: no extra height, nothing covering the windows' work area
  const [tb, tk] = [await bar.boundingBox(), await tick.boundingBox()];
  expect(tb.height).toBe(32);
  expect(tk.height).toBeLessThanOrEqual(16);
  expect(tk.y).toBeGreaterThanOrEqual(tb.y);
  expect(tk.y + tk.height).toBeLessThanOrEqual(tb.y + tb.height);
  const anim = () => tick.locator('span').evaluate((s) => [getComputedStyle(s).animationName, getComputedStyle(s).animationPlayState]);
  expect(await anim()).toEqual(['marquee', 'running']);
  await tick.hover();
  expect(await anim()).toEqual(['marquee', 'paused']);
  await tick.click();
  await expect(dlg(page, 'Dukung Warnet Ini')).toBeVisible();
  // phones keep the taskbar for tasks; reduced motion gets a still line
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(tick).toBeHidden();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await anim())[0]).toBe('none');
});

// source: Kelvin request 2026-11-08 "fix it" for "On phone widths the folder search box stays hidden (as before), and the Win 10 taskbar search shrinks to an icon that only opens Start"
test('@app:games folder search and Win 10 taskbar search stay usable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await toDesktop(page, 'era=2015');
  await open(page, 'games');
  let win = dlg(page, 'Game Warnet');
  let q = win.getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await expect(q).toBeVisible();
  await expect(win.locator('.ex-path')).toBeHidden();
  await q.fill('pinball');
  await expect(win.locator('.ex-main .icon:visible')).toHaveCount(matching('pinball').length);
  await closeWin(page, 'Game Warnet');
  // Win 10 taskbar: the box stays typable, typing searches, Enter opens the first hit
  const tq = page.locator('.tb-search').getByRole('searchbox', { name: 'Ketik di sini untuk mencari' });
  await expect(tq).toBeVisible();
  await tq.click();
  await tq.fill('ranjau');
  await expect(page.locator('.startmenu.searching .sm-results [data-app="ranjau"]')).toBeVisible();
  await tq.press('Enter');
  await expect(dlg(page, 'Ranjau')).toBeVisible();
  // XP: the Search Companion folds into a strip above the files, the rest of the task pane stays hidden
  await toDesktop(page, 'era=2003');
  await open(page, 'games');
  win = dlg(page, 'Game Warnet');
  q = win.getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await expect(q).toBeVisible();
  await expect(win.locator('.ex-side .ex-box:not(.ex-find)').first()).toBeHidden();
  await q.fill('doom');
  await expect(win.locator('.ex-main .icon:visible')).toHaveCount(matching('doom').length);
  // other XP folders get the same strip: search shown, "Tempat Lain" links folded away
  await open(page, 'computer');
  const pc = dlg(page, 'My Computer');
  await expect(pc.getByRole('searchbox', { name: 'Cari di My Computer' })).toBeVisible();
  await expect(pc.getByText('▸ My Documents')).toBeHidden();
});

// source: Kelvin request 2026-11-08 "fix it" for "A few hint lines in the XP task pane ("Klik 2x untuk main") are still plain text"
test('@app:games @app:music XP task pane hint lines do what they say', async ({ page }) => {
  await page.route('https://archive.org/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>IA</title>' }));
  await page.route('https://unpkg.com/**', (r) => r.abort('blockedbyclient'));
  await toDesktop(page, 'era=2003');
  await open(page, 'games');
  const win = dlg(page, 'Game Warnet'), side = win.locator('.ex-side'), main = win.locator('.ex-main');
  await side.locator('.det').click(); // plain text in the pane does nothing
  await expect(page.getByRole('dialog')).toHaveCount(1);
  // "Klik 2x untuk main": nothing picked yet, so it says how; with a pick it plays it
  await side.getByText('▸ Klik 2x untuk main').click();
  await closeBox(page, 'Tugas Game', 'Pilih dulu game-nya, terus klik 2x ikonnya.');
  await win.locator('[data-g="ranjau"]').click();
  await side.getByText('▸ Klik 2x untuk main').click();
  await expect(dlg(page, 'Ranjau')).toBeVisible();
  await closeWin(page, 'Ranjau');
  // "Game DOS ... Internet Archive" opens the IA MS-DOS library in a new tab
  const ia = side.getByRole('link', { name: '▸ Game DOS jalan via emulator Internet Archive' });
  await expect(ia).toHaveAttribute('href', 'https://archive.org/details/softwarelibrary_msdos_games');
  await expect(ia).toHaveAttribute('rel', 'noopener');
  const [tab] = await Promise.all([page.waitForEvent('popup'), ia.click()]);
  await tab.close();
  // "Ikon panah = buka di tab baru" scrolls to the new-tab group
  expect(await main.evaluate((m) => m.scrollTop)).toBe(0);
  await side.getByText('▸ Ikon panah = buka di tab baru').click();
  await expect.poll(() => main.evaluate((m) => Math.abs(m.querySelector('.g-tab').getBoundingClientRect().top - m.getBoundingClientRect().top))).toBeLessThan(12);
  // Lagu MP3: the MP3 tip opens Winamp
  await open(page, 'music');
  await dlg(page, 'Lagu MP3').getByText('Tips: seret file MP3 kamu ke jendela Winamp!').click();
  await expect(dlg(page, 'Winamp')).toBeVisible();
});
