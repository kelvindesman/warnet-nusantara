// Right-click menus on the desktop shell and the Windows Task Manager (js/apps/taskmgr.js).
import { test, expect, toDesktop, boot } from './fixtures.mjs';

const dlg = (page, name) => page.getByRole('dialog', { name, exact: true });
const open = (page, id) => page.evaluate((d) => window.dispatchEvent(new CustomEvent('launch', { detail: d })), id);
const menu = (page) => page.locator('.ctx.pop');
const entry = (page, label) => menu(page).getByRole('menuitem', { name: label, exact: true });
const pick = async (page, label) => { await entry(page, label).click(); await expect(menu(page)).toHaveCount(0); };
const okBox = async (page, title, text) => {
  const box = dlg(page, title);
  await expect(box).toContainText(text);
  await box.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(box).toHaveCount(0);
};
const task = (page, title) => page.locator('.task.w', { hasText: title });
const rightTaskbar = async (page) => { const b = await page.locator('.tasks').boundingBox(); await page.mouse.click(b.x + b.width - 6, b.y + 12, { button: 'right' }); };

// source: Kelvin request 2026-11-08 "support right click?"
test('@app:desktop right-click menus on desktop icons, folder items, task buttons, Start and the taskbar', async ({ page }) => {
  await toDesktop(page);
  // desktop icon: selected, then Open / Rename / Delete / Properties
  const rules = page.locator('.icons > .icon[data-app="rules"]');
  await rules.click({ button: 'right' });
  await expect(rules).toHaveClass(/\bsel\b/);
  await expect(menu(page).getByRole('menuitem')).toHaveText(['Open', 'Rename', 'Delete', 'Properties']);
  await expect(entry(page, 'Open')).toBeFocused();
  await page.keyboard.press('Escape'); // Escape closes it
  await expect(menu(page)).toHaveCount(0);
  await rules.click({ button: 'right' });
  await menu(page).locator('hr').first().click(); // the separator is not an item
  await expect(menu(page)).toHaveCount(1);
  await pick(page, 'Rename');
  await okBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await rules.click({ button: 'right' });
  await pick(page, 'Delete');
  await okBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await rules.click({ button: 'right' });
  await pick(page, 'Properties');
  await okBox(page, 'ATURAN_WARNET.txt', 'Jenis: Shortcut');
  await rules.click({ button: 'right' });
  await pick(page, 'Open');
  await expect(dlg(page, 'ATURAN_WARNET.txt - Notepad')).toBeVisible();

  // folder item: Open / Delete / Properties
  await open(page, 'docs');
  const docs = page.locator('.win[aria-label="My Documents"]'), poem = docs.locator('.ex-main .icon', { hasText: 'puisi_buat_dia.txt' });
  await poem.click({ button: 'right' });
  await expect(poem).toHaveClass(/\bsel\b/);
  await pick(page, 'Properties');
  await okBox(page, 'puisi_buat_dia.txt', 'Lokasi: My Documents');
  await poem.click({ button: 'right' });
  await pick(page, 'Delete');
  await okBox(page, 'Deep Freeze', 'DIBEKUKAN');
  await poem.click({ button: 'right' });
  await pick(page, 'Open');
  await expect(dlg(page, 'puisi_buat_dia.txt - Notepad')).toBeVisible();

  // task button: Restore / Minimize / Maximize / Close follow the window state
  const items = () => menu(page).getByRole('menuitem');
  await task(page, 'My Documents').click({ button: 'right' });
  await expect(entry(page, 'Restore')).toBeDisabled();
  await pick(page, 'Minimize');
  await expect(docs).toHaveClass(/\bmin\b/);
  await task(page, 'My Documents').click({ button: 'right' });
  await expect(entry(page, 'Minimize')).toBeDisabled();
  await pick(page, 'Restore');
  await expect(docs).not.toHaveClass(/\bmin\b/);
  await task(page, 'My Documents').click({ button: 'right' });
  await pick(page, 'Maximize');
  await expect(docs).toHaveClass(/\bmax\b/);
  await task(page, 'My Documents').click({ button: 'right' });
  await expect(entry(page, 'Maximize')).toBeDisabled();
  await pick(page, 'Restore');
  await expect(docs).not.toHaveClass(/\bmax\b/);
  await task(page, 'My Documents').click({ button: 'right' });
  await expect(items()).toHaveText(['Restore', 'Minimize', 'Maximize', 'Close']);
  await pick(page, 'Close');
  await expect(docs).toHaveCount(0);
  await open(page, 'donate'); // a window that cannot be maximized
  await task(page, 'Dukung Warnet Ini').click({ button: 'right' });
  await expect(entry(page, 'Maximize')).toBeDisabled();
  await page.keyboard.press('Escape');

  // Start button: Open shows the Start menu, Explore opens My Computer
  await page.locator('.startbtn').click({ button: 'right' });
  await pick(page, 'Open');
  await expect(page.locator('.startmenu')).toBeVisible();
  await page.locator('.startbtn').click({ button: 'right' });
  await pick(page, 'Explore');
  await expect(dlg(page, 'My Computer')).toBeVisible();
  await expect(page.locator('.startmenu')).toHaveCount(0);

  // taskbar: Show the Desktop minimizes everything, Properties is locked, Task Manager opens it
  await rightTaskbar(page);
  await expect(items()).toHaveText(['Task Manager', 'Show the Desktop', 'Properties']);
  await pick(page, 'Show the Desktop');
  await expect(page.locator('.win:not(.min)')).toHaveCount(0);
  await rightTaskbar(page);
  await pick(page, 'Properties');
  await okBox(page, 'Administrator', 'dikunci');
  await page.locator('.tb-ticker').click({ button: 'right' });
  await pick(page, 'Task Manager');
  await expect(dlg(page, 'Windows Task Manager')).toBeVisible();
});

// source: Kelvin request 2026-11-08 "support right click?"
test('@app:desktop the Win 10 taskbar search keeps the browser menu for copy and paste', async ({ page }) => {
  await toDesktop(page, 'era=2015');
  const q = page.locator('.tb-search input');
  const prevented = await q.evaluate((i) => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); i.dispatchEvent(e); return e.defaultPrevented; });
  expect(prevented).toBe(false);
  await expect(page.locator('.ctx')).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "task manager?"
test('@app:taskmgr Task Manager lists windows and processes, ends tasks, guards the operator\'s processes, graphs the CPU', async ({ page }) => {
  await boot(page, '', '#lock');
  await page.keyboard.press('Control+Shift+Escape'); // no desktop yet: nothing opens
  await toDesktop(page, 'era=2003');
  await page.keyboard.press('Escape');
  await expect(dlg(page, 'Windows Task Manager')).toHaveCount(0);
  await open(page, 'notepad');
  await open(page, 'games');
  await page.keyboard.press('Control+Shift+Escape');
  const tm = dlg(page, 'Windows Task Manager');
  await expect(tm).toBeVisible();
  const rows = tm.locator('.tm-list tbody tr');
  const btn = (name) => tm.getByRole('button', { name, exact: true });

  // Applications
  await expect(tm.getByRole('tab', { name: 'Applications' })).toHaveAttribute('aria-selected', 'true');
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Untitled.txt - Notepad' })).toContainText('Running');
  await expect(rows.filter({ hasText: 'Game Warnet' })).toContainText('Running');
  await expect(btn('End Task')).toBeDisabled();
  await btn('New Task...').click();
  await okBox(page, 'Administrator', 'dikunci');
  await rows.filter({ hasText: 'Untitled.txt' }).click();
  await expect(rows.filter({ hasText: 'Untitled.txt' })).toHaveClass('sel');
  await btn('Switch To').click();
  await expect(dlg(page, 'Untitled.txt - Notepad')).not.toHaveClass(/inactive/);
  await expect(tm).toBeHidden(); // minimized on use, as XP does by default
  await task(page, 'Windows Task Manager').click();
  await btn('End Task').click();
  await expect(dlg(page, 'Untitled.txt - Notepad')).toHaveCount(0);
  await expect(rows).toHaveCount(1);
  await expect(btn('End Task')).toBeDisabled(); // the picked window is gone
  await open(page, 'ranjau'); // windows opened elsewhere show up on the next tick
  await expect(rows.filter({ hasText: 'Ranjau' })).toHaveCount(1, { timeout: 3000 });
  // an idle tick only updates the CPU text: the list is not rebuilt under the mouse
  await rows.first().evaluate((r) => r.setAttribute('data-kept', ''));
  const cpuNow = await tm.locator('.tm-cpu').textContent();
  await page.waitForTimeout(2200);
  await expect(tm.locator('tr[data-kept]')).toHaveCount(1);
  expect(await tm.locator('.tm-cpu').textContent()).toMatch(/^CPU Usage: \d+%$/);
  expect(cpuNow).toMatch(/^CPU Usage: \d+%$/);

  // Processes: the operator's ones refuse to die, an app's process closes its window
  await tm.getByRole('tab', { name: 'Processes' }).click();
  await expect(tm.locator('.tm-list th')).toHaveText(['Image Name', 'User Name', 'CPU', 'Mem Usage']);
  await expect(rows.locator('td:first-child')).toHaveText(['System Idle Process', 'explorer.exe', 'billing.exe', 'DeepFrz.exe', 'games.exe', 'ranjau.exe']);
  await expect(tm.locator('.tm-st')).toHaveText('Processes: 6');
  for (const [p, text] of [['billing.exe', 'di-banned seminggu'], ['DeepFrz.exe', 'Deep Freeze nggak bisa'], ['explorer.exe', 'desktopnya hilang'], ['System Idle Process', 'ngambek']]) {
    await rows.filter({ hasText: p }).click();
    await btn('End Process').click();
    await okBox(page, 'Unable to Terminate Process', text);
  }
  await rows.filter({ hasText: 'ranjau.exe' }).click();
  await btn('End Process').click();
  await expect(dlg(page, 'Ranjau')).toHaveCount(0);
  await expect(rows).toHaveCount(5);
  await open(page, 'chat'); // real program names where the warnet had one
  await open(page, 'notepad');
  for (const name of ['mirc32.exe', 'notepad.exe']) await expect(rows.filter({ hasText: name })).toHaveCount(1, { timeout: 3000 });
  await task(page, 'Windows Task Manager').click(); // back on top of the new windows

  // Performance: a CPU meter and history graph that move, memory of a 2003 booth PC
  await tm.getByRole('tab', { name: 'Performance' }).click();
  await expect(tm.locator('.tm-perf dl')).toContainText('262,144 K');
  await expect(tm.locator('.tm-btns button')).toHaveCount(0);
  const line = tm.locator('.tm-graph polyline');
  const first = await line.getAttribute('points');
  await expect.poll(() => line.getAttribute('points'), { timeout: 3000 }).not.toBe(first);
  await expect(tm.locator('.tm-cpu')).toHaveText(/^CPU Usage: \d+%$/);
  await tm.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(tm).toHaveCount(0);
});
