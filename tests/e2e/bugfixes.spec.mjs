// Regressions for bugs found by the 2026-11-07 coverage sweep. Each test failed before its fix.
import { test, expect, boot, toDesktop, openBrowser } from './fixtures.mjs';

// source: bug ref coverage sweep 2026-11-07 #1 "if any data/*.json request fails, the page stays blank with no message"
test('@app:boot a data file that fails to load shows a message instead of a blank page', async ({ page }) => {
  await page.route('**/data/games.json', (r) => r.abort('failed'));
  await boot(page);
  await expect(page.getByRole('alert')).toContainText('Koneksi warnet putus.');
  await expect(page.locator('.bios')).toHaveCount(0);
});

test.describe(() => {
  test.use({ expectedErrors: ['data/irc.json'] });
  // source: bug ref coverage sweep 2026-11-07 #1 (same screen when the server answers with an HTTP error)
  test('@app:boot a data file answering 404 shows the same message', async ({ page }) => {
    await page.route('**/data/irc.json', (r) => r.fulfill({ status: 404, body: 'not found' }));
    await boot(page);
    await expect(page.getByRole('alert')).toContainText('Data warnet gagal dimuat.');
  });
});

// source: bug ref coverage sweep 2026-11-07 #2 "Browser Stop: the \"Dihentikan\" status is immediately overwritten by \"Selesai\""
test('@app:browser Stop keeps the "Dihentikan" status; Reload loads again', async ({ page }) => {
  await toDesktop(page);
  await openBrowser(page);
  const win = page.getByRole('dialog', { name: /Penjelajah Internet/ });
  const st = win.locator('.statusbar .st');
  await expect(st).toHaveText('Selesai');
  await win.locator('[data-a="stop"]').click();
  await expect(st).toHaveText('Dihentikan');
  await page.waitForTimeout(300); // the about:blank load event has fired by now
  await expect(st).toHaveText('Dihentikan');
  await win.locator('[data-a="reload"]').click();
  await expect(st).toHaveText('Selesai');
});

// source: bug ref coverage sweep 2026-11-07 #3 "IRC log: the on-screen log grows past 300 lines until the next re-render"
test('@app:chat the visible IRC log is capped at 300 lines like the channel history', async ({ page }) => {
  test.setTimeout(90_000); // 320 typed messages; slow under a full parallel gate run
  await page.clock.install();
  await toDesktop(page);
  await page.locator('.icon[data-app="chat"]').dblclick();
  const input = page.getByRole('textbox', { name: 'Pesan' });
  for (let i = 0; i < 320; i++) { await input.fill(`/me baris ${i}`); await input.press('Enter'); }
  const log = page.locator('.irc-log p');
  await expect(log).toHaveCount(300);
  // bots keep chatting in real time, so the newest typed line need not be the very last one
  await expect(log.filter({ hasText: /baris 319$/ })).toHaveCount(1);
  await expect(log.filter({ hasText: /baris 0$/ })).toHaveCount(0);
});

// source: bug ref coverage sweep 2026-11-07 #4 "each new desktop adds another listener in onWinampChange and old ones are never removed"
test('@app:winamp after logging off and on, only the current desktop reacts to Winamp', async ({ page }) => {
  await page.route('https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.mjs', (r) => r.fulfill({
    contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' },
    body: `export default class { static browserIsSupported() { return true; } async renderWhenReady(h) { const e = document.createElement('div'); e.id = 'webamp'; h.appendChild(e); } onClose(cb) { this.close = cb; } onMinimize(cb) { this.min = cb; } dispose() {} }`,
  }));
  await page.clock.install();
  await toDesktop(page);
  await page.waitForFunction(() => window.__oldTasks = [document.querySelector('.tasks')]);
  for (let i = 0; i < 2; i++) {
    await page.locator('.startbtn').click();
    await page.locator('[data-p="logoff"]').click();
    await page.locator('.sticky').click();
    await page.locator('form.billing [type=submit]').click();
    await page.clock.runFor(10_000);
    await expect(page.locator('.desktop')).toBeVisible();
    await page.evaluate(() => window.__oldTasks.push(document.querySelector('.tasks')));
  }
  await page.locator('.icon[data-app="winamp"]').dblclick();
  await expect(page.locator('.tasks .task.wa')).toHaveCount(1);
  const stale = await page.evaluate(() => window.__oldTasks.slice(0, -1).map((t) => t.querySelectorAll('.task.wa').length));
  expect(stale).toEqual([0, 0]);
});

// source: bug ref coverage sweep 2026-11-07 #5 "pressing Enter on the voucher note both fills the form and submits it"
test('@app:boot Enter on the voucher note only fills the form, like a click', async ({ page }) => {
  await boot(page);
  await page.locator('.bios').click();
  await expect(page.locator('form.billing [name=u]')).toBeFocused(); // the lock screen autofocuses Username after 50 ms; wait so it cannot steal focus from the note
  await page.locator('.sticky').focus();
  await page.keyboard.press('Enter');
  const form = page.locator('form.billing');
  await expect(form.locator('[name=u]')).toHaveValue(await page.locator('.sticky .vu').textContent());
  await page.waitForTimeout(300);
  await expect(page.locator('.billing')).toBeVisible();
  await expect(page.locator('.desktop')).toHaveCount(0);
  await expect(form.locator('[type=submit]')).toBeFocused();
});

// source: bug ref coverage sweep 2026-11-07 #6 "Ranjau: the mine counter shows \"0-1\" when you place more flags than there are mines"
test('@app:ranjau more flags than mines shows a negative counter like the original (-01)', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="ranjau"]').dblclick();
  const win = page.getByRole('dialog', { name: 'Ranjau' });
  for (let i = 0; i < 11; i++) await win.locator(`.rj-c[data-i="${i}"]`).click({ button: 'right' });
  await expect(win.locator('[data-left]')).toHaveText('-01');
  await win.locator('.rj-c[data-i="0"]').click({ button: 'right' });
  await expect(win.locator('[data-left]')).toHaveText('000');
});
