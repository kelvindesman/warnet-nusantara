// Ular HP (snake): movement, eating, growing, self-collision, high score, controls.
import { test, expect, toDesktop } from './fixtures.mjs';

/** Next Math.random() results are the given grid cells (20×20), one coordinate per call. */
const foodAt = (page, coords) => page.evaluate((q) => {
  const orig = Math.random;
  const queue = q.map((c) => (c + 0.5) / 20);
  Math.random = () => (queue.length ? queue.shift() : orig());
}, coords);

async function openUlar(page) {
  await page.clock.install();
  await toDesktop(page);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  // food first lands on the snake (8,10) and is re-rolled to (10,10), then (11,10), then far away
  await foodAt(page, [8, 10, 10, 10, 11, 10, 0, 0, 0, 0]);
  await page.locator('.icon[data-app="ular"]').dblclick();
  const win = page.getByRole('dialog', { name: 'Ular HP' });
  await expect(win.locator('canvas')).toBeVisible();
  return win;
}

/** Eat twice (length 5), then turn up, left, down into its own body. */
async function playToDeath(page, win) {
  const tick = (ms) => page.clock.runFor(ms);
  await page.keyboard.press('ArrowRight'); // start: head (9,10)
  await expect(win.locator('[data-m]')).toHaveText('Jangan nabrak!');
  await tick(140); // (10,10) eat
  await expect(win.locator('[data-s]')).toContainText('SKOR 9');
  await tick(137); // (11,10) eat
  await expect(win.locator('[data-s]')).toContainText('SKOR 18');
  await page.keyboard.press('ArrowUp'); await tick(134); // (11,9)
  await page.keyboard.press('ArrowLeft'); await tick(134); // (10,9)
  await page.keyboard.press('ArrowDown'); await tick(134); // (10,10) is body → game over
  await expect(win.locator('[data-m]')).toHaveText('GAME OVER! Tekan arah untuk main lagi.');
  await expect(win).toHaveClass(/shake/);
}

// source: README "Ranjau / Ular HP: Built-in minesweeper and Nokia-style snake games."
test('@app:ular snake eats, grows, dies on its own tail and keeps the high score', async ({ page }) => {
  const win = await openUlar(page);
  await expect(win.locator('[data-s]')).toHaveText('SKOR 0 · REKOR 0');
  await playToDeath(page, win);
  expect(await page.evaluate(() => localStorage.getItem('ular-best'))).toBe('18');
  await win.getByRole('button', { name: 'Close' }).dispatchEvent('click');
  await foodAt(page, [10, 10, 11, 10, 0, 0]);
  await page.locator('.icon[data-app="ular"]').dblclick();
  const again = page.getByRole('dialog', { name: 'Ular HP' });
  await expect(again.locator('[data-s]')).toHaveText('SKOR 0 · REKOR 18');
  await playToDeath(page, again); // same score: the record stays
  expect(await page.evaluate(() => localStorage.getItem('ular-best'))).toBe('18');
});

// source: README "Ranjau / Ular HP: Built-in minesweeper and Nokia-style snake games." (WASD, arrow keys, on-screen pad)
test('@app:ular WASD and the on-screen pad steer; reversing and other keys are ignored; inactive window ignores keys', async ({ page }) => {
  const win = await openUlar(page);
  const msg = win.locator('[data-m]');
  await page.keyboard.press('x');
  await expect(msg).toHaveText('Tekan panah / WASD / swipe untuk mulai');
  await win.locator('[data-d="U"]').dispatchEvent('click'); // start moving up
  await expect(msg).toHaveText('Jangan nabrak!');
  for (const k of ['s', 'a', 'w', 'd']) { await page.keyboard.press(k); await page.clock.runFor(140); }
  await win.locator('.pad').dispatchEvent('click');
  await win.locator('[data-d="L"]').dispatchEvent('click'); // reverse of R: ignored
  await page.clock.runFor(140 * 25); // wraps around the screen edge
  await expect(msg).toHaveText('Jangan nabrak!');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'rules' })));
  await expect(win).toHaveClass(/inactive/);
  await page.keyboard.press('ArrowDown');
  await win.getByRole('button', { name: 'Close' }).dispatchEvent('click');
  await expect(win).toHaveCount(0);
  await page.clock.runFor(1000); // closing stops the game loop
});

// source: README "Ranjau / Ular HP" (game must still work when the browser blocks storage, e.g. private mode)
test('@app:ular works without localStorage (high score just is not saved)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
  const win = await openUlar(page);
  await expect(win.locator('[data-s]')).toHaveText('SKOR 0 · REKOR 0');
  await playToDeath(page, win);
});

test.describe('touch', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'isMobile is not supported in Firefox');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 900, height: 700 } });
  // source: README "Supports touch: ... Ular HP has swipe controls"
  test('@app:ular swipes steer the snake; tiny swipes are ignored', async ({ page }) => {
    await toDesktop(page);
    await page.locator('.icon[data-app="ular"]').tap();
    const win = page.getByRole('dialog', { name: 'Ular HP' });
    const msg = win.locator('[data-m]');
    const swipe = (dx, dy, start = true) => win.locator('canvas').evaluate((cv, [x, y, s]) => {
      const r = cv.getBoundingClientRect();
      const t = (ox, oy) => new Touch({ identifier: 1, target: cv, clientX: r.left + 100 + ox, clientY: r.top + 100 + oy });
      if (s) cv.dispatchEvent(new TouchEvent('touchstart', { touches: [t(0, 0)], changedTouches: [t(0, 0)] }));
      cv.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(x, y)] }));
    }, [dx, dy, start]);
    await swipe(80, 0, false); // no touchstart yet
    await swipe(5, 5); // too short
    await expect(msg).toHaveText('Tekan panah / WASD / swipe untuk mulai');
    await swipe(0, -60); // up
    await expect(msg).toHaveText('Jangan nabrak!');
    await swipe(-60, 0); // left
    await swipe(0, 60); // down
    await swipe(60, 10); // right
  });
});
