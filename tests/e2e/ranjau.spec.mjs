// Ranjau (minesweeper): first click is safe, flags, chording, win, lose, modes, long-press.
import { test, expect, toDesktop } from './fixtures.mjs';

/** Make the next mine placement land exactly on `cells` (Pemula board is 9×9). */
const plantAt = (page, cells, size = 81) => page.evaluate(([q, n]) => {
  const orig = Math.random;
  const queue = [...q];
  Math.random = () => (queue.length ? (queue.shift() + 0.5) / n : orig());
}, [cells, size]);
const cell = (win, i) => win.locator(`.rj-c[data-i="${i}"]`);
const openRanjau = async (page) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="ranjau"]').dblclick();
  const win = page.getByRole('dialog', { name: 'Ranjau' });
  await expect(win.locator('.rj-c')).toHaveCount(81);
  return win;
};
// A wall of mines down column 4 plus the top-right corner.
const WALL = [4, 13, 22, 31, 40, 49, 58, 67, 76, 8];

// source: README "Ranjau / Ular HP: Built-in minesweeper and Nokia-style snake games."
test('@app:ranjau flood fill, flags, chording onto the far side wins the game', async ({ page }) => {
  const win = await openRanjau(page);
  const face = win.locator('.rj-face');
  const left = win.locator('[data-left]');
  await expect(left).toHaveText('010');
  await plantAt(page, [1, 10, ...WALL]); // 1 and 10 touch the first click, so they are skipped
  await cell(win, 0).click();
  await expect(cell(win, 0)).toHaveClass(/open/);
  await expect(cell(win, 30)).toHaveClass(/open/); // flood fill reached the wall
  await expect(cell(win, 3)).toHaveText('2');
  await expect(cell(win, 5)).not.toHaveClass(/open/);
  await expect(win.locator('[data-time]')).toHaveText('001', { timeout: 3000 });

  // flag, unflag, flags block clicks; an open cell cannot be flagged
  await cell(win, 4).click({ button: 'right' });
  await expect(cell(win, 4)).toHaveText('🚩');
  await expect(left).toHaveText('009');
  await cell(win, 4).click();
  await expect(cell(win, 4)).not.toHaveClass(/open/);
  await cell(win, 4).click({ button: 'right' });
  await expect(cell(win, 4)).toHaveText('');
  await cell(win, 0).click({ button: 'right' });
  await expect(cell(win, 0)).not.toHaveText('🚩');

  // chord with too few flags does nothing
  await cell(win, 5).click();
  await expect(cell(win, 5)).toHaveText('2');
  await cell(win, 4).click({ button: 'right' });
  await cell(win, 5).click();
  await expect(cell(win, 6)).not.toHaveClass(/open/);
  // chord with matching flags opens the rest of the board
  await cell(win, 13).click({ button: 'right' });
  await cell(win, 5).click();
  await expect(face).toHaveText('😎');
  await expect(left).toHaveText('000');
  await expect(cell(win, 8)).toHaveText('🚩');
  await cell(win, 7).click({ button: 'right' }); // game over: no more flags
  await expect(cell(win, 7)).not.toHaveText('🚩');
  // the face shows surprise only while the game runs
  const box = await cell(win, 7).boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5); await page.mouse.down();
  await expect(face).toHaveText('😎');
  await page.mouse.up();
});

// source: README "Ranjau / Ular HP: Built-in minesweeper and Nokia-style snake games."
test('@app:ranjau stepping on a mine ends the game; the face starts a new one', async ({ page }) => {
  const win = await openRanjau(page);
  const face = win.locator('.rj-face');
  await plantAt(page, WALL);
  const box = await cell(win, 0).boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5); await page.mouse.down();
  await expect(face).toHaveText('😮');
  await page.mouse.up();
  await expect(face).toHaveText('🙂');
  await expect(cell(win, 0)).toHaveClass(/open/);
  await cell(win, 13).click();
  await expect(face).toHaveText('😵');
  await expect(cell(win, 13)).toHaveClass(/boom/);
  await expect(win.locator('.rj-c', { hasText: '💣' })).toHaveCount(10);
  await expect(win).toHaveClass(/shake/);
  await cell(win, 7).click(); // game over: clicks do nothing
  await expect(cell(win, 7)).not.toHaveClass(/open/);
  await face.click();
  await expect(face).toHaveText('🙂');
  await expect(win.locator('.rj-c.open')).toHaveCount(0);
  await expect(win.locator('[data-time]')).toHaveText('000');
  await win.locator('.rj-grid').dispatchEvent('click'); // between cells: nothing
  await win.locator('.rj-grid').dispatchEvent('contextmenu');
  await expect(win.locator('.rj-c.open')).toHaveCount(0);
});

// source: README "Supports touch: ... long-press places a flag in Ranjau"
test('@app:ranjau long-press flags a cell on touch without opening it; a short tap does not flag', async ({ page }) => {
  const win = await openRanjau(page);
  const touch = (i, type) => cell(win, i).dispatchEvent(type, { pointerType: 'touch', bubbles: true });
  await touch(40, 'pointerdown');
  await page.waitForTimeout(500);
  await expect(cell(win, 40)).toHaveText('🚩');
  await touch(40, 'pointerup');
  await cell(win, 40).dispatchEvent('click'); // the click that ends a long-press is swallowed
  await expect(cell(win, 40)).not.toHaveClass(/open/);
  await touch(41, 'pointerdown');
  await touch(41, 'pointerup');
  await page.waitForTimeout(500);
  await expect(cell(win, 41)).toHaveText('');
  await win.locator('.rj-grid').dispatchEvent('pointerdown', { pointerType: 'touch' });
  await win.locator('.rj-grid').dispatchEvent('pointerleave');
});

// source: README "Ranjau / Ular HP: Built-in minesweeper" (Pemula / Menengah / Jago board sizes)
test('@app:ranjau difficulty buttons reopen the window with a bigger board', async ({ page }) => {
  const win = await openRanjau(page);
  await win.locator('[data-m="Pemula"]').click(); // already on it: nothing happens
  await expect(win.locator('.rj-c')).toHaveCount(81);
  await win.locator('.rj-modes').dispatchEvent('click');
  await win.locator('[data-m="Menengah"]').click();
  await expect(page.getByRole('dialog', { name: 'Ranjau' }).locator('.rj-c')).toHaveCount(256);
  await page.getByRole('dialog', { name: 'Ranjau' }).locator('[data-m="Jago"]').click();
  const jago = page.getByRole('dialog', { name: 'Ranjau' });
  await expect(jago.locator('.rj-c')).toHaveCount(480);
  await expect(jago.locator('[data-left]')).toHaveText('099');
  await jago.locator('.rj-c').first().click();
  await jago.getByRole('button', { name: 'Close' }).click();
  await expect(jago).toHaveCount(0);
});
