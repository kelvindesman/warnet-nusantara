// Window manager: drag, resize, minimize, maximize, restore, z-order, close, taskbar.
import { test, expect, toDesktop } from './fixtures.mjs';

const open = async (page, app) => {
  await page.locator(`.icon[data-app="${app}"]`).dblclick();
};
const box = async (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }));

// source: AGENTS.md architecture map "js/wm.js window manager: openWindow(opts), msgbox(), focus/minimize/maximize/close, drag + resize, taskbar sync via onChange()"
test('@app:rules windows drag by the title bar and resize from the grip, clamped to the desktop', async ({ page }) => {
  await toDesktop(page);
  await open(page, 'rules');
  const win = page.getByRole('dialog', { name: 'ATURAN_WARNET.txt - Notepad' });
  await expect(win).toBeVisible();
  const before = await box(win);
  const tt = await win.locator('.tt').boundingBox();
  await page.mouse.move(tt.x + 10, tt.y + 5);
  await page.mouse.down();
  await page.mouse.move(tt.x + 60, tt.y + 45, { steps: 4 });
  await expect(page.locator('body')).toHaveClass(/dragging/);
  await page.mouse.up();
  await expect(page.locator('body')).not.toHaveClass(/dragging/);
  const moved = await box(win);
  expect(moved.x - before.x).toBe(50);
  expect(moved.y - before.y).toBe(40);
  // dragging far up-left clamps to the desktop edge
  const tt2 = await win.locator('.tt').boundingBox();
  await page.mouse.move(tt2.x + 10, tt2.y + 5);
  await page.mouse.down();
  await page.mouse.move(tt2.x - 3000, tt2.y - 3000, { steps: 2 });
  await page.mouse.up();
  const clamped = await box(win);
  expect(clamped.y).toBe(0);
  expect(clamped.x).toBe(-clamped.w + 60);
  // right button on the title bar does not drag
  const tt3 = await win.locator('.tt').boundingBox();
  await page.mouse.move(tt3.x + 100, tt3.y + 5);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(tt3.x + 300, tt3.y + 200);
  await page.mouse.up({ button: 'right' });
  expect(await box(win)).toEqual(clamped);

  // resize from the grip, with a minimum size
  await win.evaluate((el) => { el.style.left = '100px'; el.style.top = '50px'; });
  const grip = await win.locator('.resize').boundingBox();
  const s = await box(win);
  await page.mouse.move(grip.x + 8, grip.y + 8);
  await page.mouse.down();
  await page.mouse.move(grip.x + 108, grip.y + 58, { steps: 3 });
  await page.mouse.up();
  const r = await box(win);
  expect(r.w - s.w).toBe(100);
  expect(r.h - s.h).toBe(50);
  const grip2 = await win.locator('.resize').boundingBox();
  await page.mouse.move(grip2.x + 8, grip2.y + 8);
  await page.mouse.down();
  await page.mouse.move(grip2.x - 2000, grip2.y - 2000, { steps: 2 });
  await page.mouse.up();
  expect(await box(win)).toMatchObject({ w: 220, h: 140 });
});

// source: README "Others ... Start menu" (XP-style desktop windows) and AGENTS.md "focus/minimize/maximize/close ... taskbar sync"
test('@app:rules @app:memories maximize, restore, minimize, taskbar toggle, z-order and close', async ({ page }) => {
  await toDesktop(page);
  const a = page.locator('.win[aria-label="ATURAN_WARNET.txt - Notepad"]');
  const b = page.locator('.win[aria-label="Kenangan Warnet.txt - Notepad"]');
  await open(page, 'rules');
  await expect(a).toBeVisible(); // apps load lazily; without this wait a busy machine can open the two windows in the other order
  await open(page, 'memories');
  await expect(b).not.toHaveClass(/inactive/);
  await expect(a).toHaveClass(/inactive/);
  const tasks = page.locator('.tasks .task.w');
  await expect(tasks).toHaveCount(2);
  await expect(tasks.filter({ hasText: 'Kenangan' })).toHaveClass(/\bon\b/);

  // maximize button and title-bar double click toggle
  await b.getByRole('button', { name: 'Maximize' }).click();
  await expect(b).toHaveClass(/\bmax\b/);
  // dragging a maximized window does nothing
  const tt = await b.locator('.tt').boundingBox();
  await page.mouse.move(tt.x + 10, tt.y + 5); await page.mouse.down(); await page.mouse.move(tt.x + 80, tt.y + 80); await page.mouse.up();
  await expect(b).toHaveClass(/\bmax\b/);
  await b.locator('.tt').dblclick();
  await expect(b).not.toHaveClass(/\bmax\b/);
  await b.locator('.tt').dblclick();
  await expect(b).toHaveClass(/\bmax\b/);
  await b.getByRole('button', { name: 'Maximize' }).dispatchEvent('dblclick'); // a double click on a title-bar button is not a title-bar double click
  await expect(b).toHaveClass(/\bmax\b/);
  await b.getByRole('button', { name: 'Maximize' }).click();
  await expect(b).not.toHaveClass(/\bmax\b/);

  // clicking the back window raises it
  const zA = Number(await a.evaluate((el) => el.style.zIndex));
  await a.locator('.titlebar').click({ position: { x: 5, y: 5 } });
  await expect(a).not.toHaveClass(/inactive/);
  expect(Number(await a.evaluate((el) => el.style.zIndex))).toBeGreaterThan(zA);
  const zA2 = await a.evaluate((el) => el.style.zIndex);
  await a.locator('.titlebar').click({ position: { x: 5, y: 5 } }); // already on top: z stays
  expect(await a.evaluate((el) => el.style.zIndex)).toBe(zA2);

  // taskbar: active → minimize, minimized → restore, inactive → focus
  const taskA = tasks.filter({ hasText: 'ATURAN' });
  const taskB = tasks.filter({ hasText: 'Kenangan' });
  await taskA.click();
  await expect(a).toHaveClass(/\bmin\b/);
  await expect(a).toBeHidden();
  await taskA.click();
  await expect(a).toBeVisible();
  await expect(a).not.toHaveClass(/inactive/);
  await taskB.click();
  await expect(b).not.toHaveClass(/inactive/);
  await expect(a).toHaveClass(/inactive/);

  // minimize button; opening the app again restores the single instance
  await b.getByRole('button', { name: 'Minimize' }).click();
  await expect(b).toBeHidden();
  await open(page, 'memories');
  await expect(b).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Kenangan Warnet.txt - Notepad' })).toHaveCount(1);

  // closing the active window focuses the top remaining one
  await b.getByRole('button', { name: 'Close' }).click();
  await expect(b).toHaveCount(0);
  await expect(a).not.toHaveClass(/inactive/);
  await expect(tasks).toHaveCount(1);
  // closing an inactive window keeps the active one
  await open(page, 'memories');
  await a.getByRole('button', { name: 'Close' }).click({ force: true });
  await expect(a).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Kenangan Warnet.txt - Notepad' })).toBeVisible();
});

test.describe('phone', () => {
  test.use({ viewport: { width: 420, height: 800 } });
  // source: README "Supports touch: windows open maximized on phones"
  test('@app:rules @app:ranjau windows open maximized on a phone-sized screen; fixed-size dialogs do not', async ({ page }) => {
    await toDesktop(page);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'rules' })));
    await expect(page.getByRole('dialog', { name: 'ATURAN_WARNET.txt - Notepad' })).toHaveClass(/\bmax\b/);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'ranjau' })));
    await expect(page.getByRole('dialog', { name: 'Ranjau' })).not.toHaveClass(/\bmax\b/);
  });
});

// source: AGENTS.md architecture map "js/wm.js window manager: openWindow(opts), msgbox(), focus/minimize/maximize/close"
test('@app:notepad window API: veto close, failing cleanup, focus/minimize/maximize edge cases', async ({ page }) => {
  await toDesktop(page);
  const r = await page.evaluate(async () => {
    const wm = await import(new URL('js/wm.js', document.baseURI).href);
    const out = {};
    let veto = true;
    const w = wm.openWindow({ id: 'api', title: 'API', onClose: () => !veto && undefined });
    w.onClose = () => (veto ? false : undefined);
    w.cleanup.push(() => { throw new Error('cleanup boom'); });
    wm.close(w);
    out.vetoed = !!wm.getWin('api');
    const f = wm.openWindow({ id: 'fixed', title: 'Fixed', maximizable: false, resizable: false });
    wm.toggleMax(f);
    out.fixedMax = f.el.classList.contains('max') && !f.el.querySelector('.mx');
    wm.minimize(w); // not the active window
    out.minInactive = w.el.classList.contains('min') && wm.activeWin() === f;
    wm.focus(undefined);
    out.active = wm.activeWin()?.id;
    out.all = wm.allWins().map((x) => x.id);
    w.setTitle('API 2');
    out.title = w.el.querySelector('.tt').textContent;
    w.shake();
    out.shake = w.el.classList.contains('shake');
    veto = false;
    wm.close(w); wm.close(w); // second close is a no-op
    out.closed = !wm.getWin('api');
    const p = wm.openWindow({ title: 'Placed', x: 11, y: 12, single: false });
    out.placed = [p.el.offsetLeft, p.el.offsetTop];
    return out;
  });
  expect(r).toEqual({ vetoed: true, fixedMax: true, minInactive: true, active: 'fixed', all: ['api', 'fixed'], title: 'API 2', shake: true, closed: true, placed: [11, 12] });
});
