// System apps (js/apps/misc.js): My Computer, My Documents, Lagu MP3, Recycle Bin, Display, About;
// plus the remaining Game Warnet and operator-corner wiring.
import { test, expect, toDesktop } from './fixtures.mjs';

const dlg = (page, name) => page.getByRole('dialog', { name, exact: true });
const openIcon = async (page, app, title) => {
  await page.locator(`.icon[data-app="${app}"]`).dblclick();
  await expect(dlg(page, title)).toBeVisible();
  return dlg(page, title);
};
const item = (win, name) => win.locator('.ex-main .icon', { hasText: name });
const closeBox = async (page, title, button = 'OK') => {
  const box = dlg(page, title);
  await expect(box).toBeVisible();
  await box.getByRole('button', { name: button, exact: true }).click();
  await expect(box).toHaveCount(0);
};

// source: README "Others: My Computer (Deep Freeze!), My Documents, Recycle Bin"
test('@app:computer My Computer: floppy error, Deep Freeze on C:, D:/E:/Documents/Control Panel shortcuts, side links', async ({ page }) => {
  await toDesktop(page);
  const win = await openIcon(page, 'computer', 'My Computer');
  await expect(win.locator('.statusbar .st')).toHaveText('6 objek');
  await item(win, 'Disket').click();
  await expect(item(win, 'Disket')).toHaveClass(/\bsel\b/);
  await expect(win.locator('.statusbar .st')).toHaveText('Masukkan disket...');
  await item(win, 'My Documents').click();
  await expect(win.locator('.statusbar .st')).toHaveText('My Documents'); // no subtitle: shows the name
  await win.locator('.ex-main').click({ position: { x: 5, y: 300 } });
  await expect(win.locator('.ex-main .sel')).toHaveCount(0);
  await item(win, 'Disket').dblclick();
  await expect(dlg(page, 'A:\\')).toContainText('Disketnya jamuran ya?');
  await closeBox(page, 'A:\\', 'Retry');
  await item(win, 'Local Disk (C:)').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(dlg(page, 'Deep Freeze')).toContainText('DIBEKUKAN');
  await closeBox(page, 'Deep Freeze');
  for (const [name, title] of [['DATA (D:)', 'Game Warnet'], ['CD Drive (E:)', 'Lagu MP3'], ['My Documents', 'My Documents'], ['Control Panel', 'Display Properties']]) {
    await item(win, name).dblclick();
    await expect(dlg(page, title)).toBeVisible();
    await dlg(page, title).getByRole('button', { name: 'Close' }).click();
  }
  await win.locator('.ex-main').dblclick({ position: { x: 5, y: 300 } }); // empty space opens nothing
  await win.locator('.ex-main').press('Enter');
  await expect(page.locator('.win')).toHaveCount(1);
  await win.locator('.ex-side').click({ position: { x: 3, y: 3 } });
  for (const [go, title] of [['about', 'System Properties'], ['display', 'Display Properties'], ['docs', 'My Documents'], ['games', 'Game Warnet']]) {
    await win.locator(`[data-go="${go}"]`).dispatchEvent('click');
    await expect(dlg(page, title)).toBeVisible();
  }
  await win.locator('[data-go="computer"]').dispatchEvent('click'); // already open: comes to front
  await expect(win).not.toHaveClass(/inactive/);
});

// source: README "Others: ... My Documents, Recycle Bin, Notepad (warnet rules + a memories file)"
test('@app:docs My Documents and Recycle Bin open every file', async ({ page }) => {
  await toDesktop(page);
  const docs = await openIcon(page, 'docs', 'My Documents');
  for (const [name, title] of [
    ['ATURAN_WARNET.txt', 'ATURAN_WARNET.txt - Notepad'], ['Kenangan Warnet.txt', 'Kenangan Warnet.txt - Notepad'],
    ['tugas_sejarah', 'tugas_sejarah_FINAL_revisi3.doc - Notepad'], ['puisi_buat_dia', 'puisi_buat_dia.txt - Notepad'],
    ['Lagu MP3', 'Lagu MP3'], ['Game Warnet', 'Game Warnet'],
  ]) {
    await item(docs, name).dblclick();
    await expect(dlg(page, title)).toBeVisible();
    await dlg(page, title).getByRole('button', { name: 'Close' }).click();
  }
  await page.locator('.icon[data-app="docs"]').dblclick();
  await item(docs, 'puisi_buat_dia').dblclick();
  await expect(page.getByRole('textbox', { name: 'puisi_buat_dia.txt' })).toHaveValue(/Kau bagai modem 56k di hatiku/);

  const bin = await openIcon(page, 'recycle', 'Recycle Bin');
  await item(bin, 'foto_mantan').dblclick();
  await expect(dlg(page, 'foto_mantan.jpg')).toContainText('move on');
  await closeBox(page, 'foto_mantan.jpg');
  await item(bin, 'crack_nero').dblclick();
  await expect(dlg(page, 'Antivirus')).toContainText('W32/Brontok.A terdeteksi!');
  await closeBox(page, 'Antivirus');
  await item(bin, 'save_GTA_SA').dblclick();
  await closeBox(page, 'Deep Freeze');
});

// source: README "Winamp: ... The playlist is 4 chiptunes generated in the browser"
test('@app:music Lagu MP3 lists the 4 chiptunes and opens Winamp', async ({ page }) => {
  await page.route('https://unpkg.com/**', (r) => r.abort('blockedbyclient'));
  await toDesktop(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'music' })));
  const win = dlg(page, 'Lagu MP3');
  await expect(win.locator('.ex-main .icon')).toHaveCount(4);
  await item(win, 'Billing Habis Lagi').dblclick();
  await expect(dlg(page, 'Winamp')).toContainText('Winamp gagal dimuat'); // unpkg blocked in tests
  await closeBox(page, 'Winamp');
  await win.getByText('▸ Putar semua di Winamp').click();
  await expect(dlg(page, 'Winamp')).toBeVisible();
});

// source: README "Others: ... Display Properties (dolphin wallpaper)"
test('@app:display Display Properties switches the desktop wallpaper', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.startbtn').click();
  await page.locator('.startmenu [data-app="display"]').click();
  const win = dlg(page, 'Display Properties');
  await expect(win.locator('[data-w="bukit"]')).toHaveClass(/\bon\b/);
  for (const k of ['dolphin', 'teal', 'friendster', 'bukit', 'dolphin']) {
    await win.locator(`[data-w="${k}"]`).click();
    await expect(page.locator('.desktop')).toHaveClass(new RegExp(`wp-${k}`));
    await expect(win.locator('[data-w].on')).toHaveAttribute('data-w', k);
  }
  await win.locator('.wp-list').dispatchEvent('click');
  await expect(page.locator('.desktop')).toHaveClass(/wp-dolphin/);
  await win.getByRole('button', { name: 'OK' }).click();
  await expect(win).toHaveCount(0);
  await page.locator('.startbtn').click();
  await page.locator('.startmenu [data-app="display"]').click();
  await expect(dlg(page, 'Display Properties').locator('[data-w="dolphin"]')).toHaveClass(/\bon\b/); // remembered
});

// source: README "Others: My Computer ..." (System Properties shows the session) + Kelvin request 2026-11-07 "100% testing coverage +e2e + matrix all use case should be covered"
test('@app:about System Properties shows user, PC and uptime; clicks outside links do nothing', async ({ page }) => {
  await toDesktop(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'about' })));
  const win = dlg(page, 'System Properties');
  // source: Kelvin request 2026-11-08 "rename jendela 7 jendela 10 jendela xp, win 7 win 10 win xp"
  await expect(win).toContainText('Win XP');
  await expect(win).toContainText(/PC-\d\d/);
  await expect(win).toContainText(/Uptime sesi:\d\d:\d\d:\d\d/);
  await expect(win).toContainText('belum ada pendukung');
  await win.locator('table').click({ position: { x: 3, y: 3 } });
  await expect(page.locator('.win')).toHaveCount(1);
});

// source: README "Game Warnet ... DOS classics run inside the window" (+ "Ranjau / Ular HP: Built-in" games launched from the folder)
test('@app:games folder: Enter launches, built-in games open, embedded window has Layar penuh and Tab baru', async ({ page }) => {
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const win = await openIcon(page, 'games', 'Game Warnet');
  await win.locator('.ex-main').click({ position: { x: 3, y: 3 } });
  await expect(win.locator('.ex-main .sel')).toHaveCount(0);
  await win.locator('.ex-main').press('Enter');
  await win.locator('[data-g="ular"]').focus();
  await page.keyboard.press('Enter');
  await expect(dlg(page, 'Ular HP')).toBeVisible();
  await dlg(page, 'Ular HP').getByRole('button', { name: 'Close' }).click();
  await win.locator('[data-g="ranjau"]').dblclick();
  await expect(dlg(page, 'Ranjau')).toBeVisible();
  await dlg(page, 'Ranjau').getByRole('button', { name: 'Close' }).click();
  await win.locator('[data-g="doom"]').dblclick();
  const doom = page.locator('.win', { has: page.locator('iframe') });
  await expect(doom).toBeVisible();
  const url = await doom.locator('iframe').getAttribute('src');
  await doom.getByRole('button', { name: 'Tab baru' }).click();
  expect(await page.evaluate(() => window.__opened)).toEqual([[url, '_blank', 'noopener']]);
  await doom.locator('iframe').evaluate((f) => { f.requestFullscreen = () => { window.__full = true; return Promise.resolve(); }; });
  await doom.getByRole('button', { name: 'Layar penuh' }).click();
  expect(await page.evaluate(() => window.__full)).toBe(true);
  await doom.locator('iframe').evaluate((f) => { delete f.requestFullscreen; Object.defineProperty(f, 'requestFullscreen', { value: undefined }); });
  await doom.getByRole('button', { name: 'Layar penuh' }).click(); // browsers without fullscreen: no error
  await doom.locator('iframe').evaluate((f) => f.dispatchEvent(new Event('load')));
  await expect(doom.locator('iframe')).toBeFocused();
});

// source: Kelvin request 2026-11-07 "donation model" + "if any inquiry from the web automatically create issue on the github repo" (clicks are counted)
test('@app:donate @app:contact pay and contact clicks are tracked; other clicks are not', async ({ page }) => {
  await page.route('**/data/links.json', async (r) => {
    const links = await (await r.fetch()).json();
    await r.fulfill({ json: { ...links, goatcounter: 'https://warnet.goatcounter.com/count', donate: { ...links.donate, trakteer: 'https://trakteer.id/warnet' } } });
  });
  await page.route('https://gc.zgo.at/count.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.__gc = []; window.goatcounter.count = (v) => window.__gc.push(v.path);' }));
  await toDesktop(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'donate' })));
  const donate = dlg(page, 'Dukung Warnet Ini');
  await page.evaluate(() => { window.open = () => null; });
  await donate.locator('a.op-pay[data-pay="trakteer"]').click();
  await donate.locator('.op-pay.off[data-pay="githubSponsors"]').click();
  await donate.locator('.op-btns').dispatchEvent('click');
  await donate.locator('[data-free="star"]').evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault()); a.click(); });
  await donate.locator('.op-free').dispatchEvent('click');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'contact' })));
  const contact = dlg(page, 'Hubungi Operator');
  await contact.locator('[data-contact="bug"]').evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault()); a.click(); });
  await contact.locator('.op-soon').click();
  await expect.poll(() => page.evaluate(() => window.__gc)).toEqual(['boot', 'app:donate', 'cta:pay:trakteer', 'cta:pay:githubsponsors', 'cta:free:star', 'app:contact', 'cta:contact:bug']);
});
