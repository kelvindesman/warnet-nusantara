// IRC Chat (commands, channels, bots) and Messenger (BUZZ!!!).
import { test, expect, toDesktop } from './fixtures.mjs';

async function openApp(page, app, title) {
  await page.clock.install();
  await toDesktop(page);
  await page.locator(`.icon[data-app="${app}"]`).dblclick();
  const win = page.locator('.win').filter({ has: page.locator('.tt', { hasText: title }) });
  await expect(win).toBeVisible();
  return win;
}

// source: README "IRC Chat: mIRC-style DALnet with #jakarta #bandung #warnet bots (\"asl pls\"), plus /me, /nick, /join, /slap."
test('@app:chat /me, /nick, /join, /slap and unknown commands', async ({ page }) => {
  const win = await openApp(page, 'chat', 'IRC Chat');
  const input = win.getByRole('textbox', { name: 'Pesan' });
  const log = win.locator('.irc-log');
  const say = async (t) => { await input.fill(t); await input.press('Enter'); };
  await expect(log).toContainText('* Now talking in #jakarta');
  await expect(win.locator('.tt')).toHaveText(/IRC Chat - \[irc\.dal\.net\] #jakarta \[\d+\]/);

  await say('');
  await say('/me lagi makan indomie');
  await expect(log.locator('p.act').last()).toContainText('lagi makan indomie');
  await say('/nick');
  await expect(log.locator('p.err').last()).toContainText('* Unknown command: nick');
  await say('/nick operator_ganteng_banget_sekali');
  await expect(log.locator('p.sys').last()).toContainText('is now known as operator_ganteng_banget_sekali');
  await expect(win.locator('.irc-nicks')).toContainText('operator_ganten'); // nick is cut to 16 chars
  await say('/slap Bang_Jago');
  await expect(log.locator('p.act').last()).toContainText('slaps Bang_Jago around a bit with a large trout');
  await say('/slap');
  await expect(log.locator('p.act').last()).toContainText('around a bit with a large trout');
  await say('/join warnet');
  await expect(log.locator('p.err').last()).toContainText('* Unknown command: join');
  await say('/kick <b>x</b>');
  await expect(log.locator('p.err').last()).toHaveText(/Unknown command: kick$/);
  await say('/join #kosan');
  await expect(win.locator('.irc-chan [data-c="#kosan"]')).toHaveClass(/\bon\b/);
  await expect(log).toContainText('* Now talking in #kosan');
  await say('/join #jakarta');
  await expect(win.locator('.irc-chan [data-c="#jakarta"]')).toHaveClass(/\bon\b/);
  await input.fill('halo semua, asl pls?');
  await win.getByRole('button', { name: 'Kirim' }).click();
  await expect(log.locator('p.me').last()).toContainText('halo semua, asl pls?');
  for (let i = 0; i < 6; i++) { await say(`pesan ${i}`); await page.clock.runFor(4000); }
  await expect(log.locator('p.me')).toHaveCount(7);
  // bots answer 3 of 4 messages: pin Math.random so both paths run every time (no flaky coverage)
  const lines = async () => log.locator('p').count();
  await page.evaluate(() => { window.__rand = Math.random; Math.random = () => 0.99; });
  let before = await lines();
  await say('sepi amat'); await page.clock.runFor(500);
  expect(await lines()).toBe(before + 1); // only my line, nobody answers
  await page.evaluate(() => { Math.random = () => 0.01; });
  before = await lines();
  await say('woi'); await page.clock.runFor(1000);
  await expect.poll(lines).toBeGreaterThan(before + 1); // a bot answers
  await page.evaluate(() => { Math.random = window.__rand; });
});

// source: README "IRC Chat: mIRC-style DALnet with #jakarta #bandung #warnet bots"
test('@app:chat bots chat, join and quit in every channel; other channels light up; switching channels', async ({ page }) => {
  const win = await openApp(page, 'chat', 'IRC Chat');
  await page.clock.runFor(45 * 60 * 1000); // a long night at the warnet
  const log = win.locator('.irc-log');
  expect(await log.locator('p').count()).toBe(300); // a long night fills the log up to the 300-line cap (bug ref coverage sweep 2026-11-07 #3)
  await expect(log).toContainText('has quit IRC');
  await expect(log).toContainText(/has joined #jakarta/);
  await expect(win.locator('.irc-chan .hl').first()).toBeVisible();
  await win.locator('.irc-chan [data-c="#bandung"]').click();
  await expect(win.locator('.irc-chan [data-c="#bandung"]')).toHaveClass(/\bon\b/);
  await expect(win.locator('.irc-chan [data-c="#bandung"]')).not.toHaveClass(/\bhl\b/);
  await expect(win.locator('.tt')).toContainText('#bandung');
  await win.locator('.irc-chan').dispatchEvent('click'); // not on a channel button
  await expect(win.locator('.tt')).toContainText('#bandung');
  await win.locator('.irc-chan [data-c="#jakarta"]').click();
  await expect(log.locator('p')).toHaveCount(300); // scrollback is capped at 300 lines per channel
  await win.getByRole('button', { name: 'Close' }).click();
  await page.clock.runFor(60_000); // bots stop once the window is closed
  await expect(win).toHaveCount(0);
});

// source: README "Messenger: Instant messaging with BUZZ!!! (it shakes the window)."
test('@app:ym messenger greets, BUZZes back, replies, and sends messages with Enter', async ({ page }) => {
  const win = await openApp(page, 'ym', 'Instant Message');
  const log = win.locator('.ym-log');
  const ta = win.getByRole('textbox', { name: 'Pesan' });
  await expect(log).toContainText('cewe_gaul_2003 sedang online.');
  await page.clock.runFor(1600);
  await expect(log).toContainText('salken ya :)');
  await page.clock.runFor(8000);
  await expect(log.locator('.buzz')).toContainText('cewe_gaul_2003: BUZZ!!!');
  await expect(win).toHaveClass(/shake/);

  await ta.fill('');
  await ta.press('Enter');
  await ta.fill('hai juga');
  await ta.press('Shift+Enter'); // new line, not send
  await expect(ta).toHaveValue('hai juga\n');
  await ta.press('Enter');
  await expect(log.locator('.n1').last()).toHaveText(/:$/);
  await expect(log).toContainText('hai juga');
  await win.locator('button[title="Ketawa"]').click();
  await win.locator('button[title="Senyum"]').click();
  await expect(ta).toHaveValue(':)) :) ');
  await win.getByRole('button', { name: 'Kirim' }).click();
  await win.locator('.ym-tools').dispatchEvent('click');
  const before = await log.locator('p').count();
  for (let i = 0; i < 10; i++) {
    await win.getByRole('button', { name: 'BUZZ!' }).click();
    await page.clock.runFor(4000);
    await ta.fill(`pesan ${i}`); await ta.press('Enter');
    await page.clock.runFor(4000);
  }
  expect(await log.locator('p').count()).toBeGreaterThan(before + 12);
  await expect(log.locator('.n2')).not.toHaveCount(1);
  // sometimes she just reads it and does not reply
  const replies = await log.locator('.n2').count();
  await page.evaluate(() => { const o = Math.random; Math.random = () => { Math.random = o; return 0.9; }; });
  await ta.fill('halo?'); await ta.press('Enter');
  await page.clock.runFor(5000);
  await expect(log.locator('.n2')).toHaveCount(replies);
});

// source: docs/adding-an-app.md "always clean up timers/listeners on close"
test('@app:ym closing Messenger right away cancels the greeting and the BUZZ', async ({ page }) => {
  const win = await openApp(page, 'ym', 'Instant Message');
  await win.getByRole('button', { name: 'Close' }).click();
  await page.clock.runFor(10_000);
  await expect(win).toHaveCount(0);
});
