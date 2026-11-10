// Synthesized sound (js/sound.js): every sound plays without errors when sound is on.
import { test, expect } from './fixtures.mjs';

/** Boot with sound ON (the shared boot() helper always mutes). */
const bootLoud = (page, hash = '') => page.goto(`./?seed=7${hash}`);
/** Count oscillators/noise sources started, to prove sounds really play. */
const countNodes = (page) => page.addInitScript(() => {
  window.__osc = 0; window.__noise = 0;
  const C = window.AudioContext || window.webkitAudioContext;
  const o = C.prototype.createOscillator, b = C.prototype.createBufferSource;
  C.prototype.createOscillator = function () { window.__osc++; return o.call(this); };
  C.prototype.createBufferSource = function () { window.__noise++; return b.call(this); };
});
const nodes = (page) => page.evaluate(() => window.__osc + window.__noise);

// source: AGENTS.md "Sounds are synthesized. No audio files in the repo." + README "every sound (boot chime, dial-up, buzz, music) is synthesized with WebAudio"
test('@app:boot sound on: error ding, boot chime, message box ding, BUZZ, minesweeper ding, Log Off door', async ({ page }) => {
  await countNodes(page);
  await bootLoud(page);
  await page.locator('.bios').click();
  await page.getByRole('button', { name: 'Masuk' }).click(); // empty form: error ding
  await expect(page.locator('.billing .err')).toHaveText('Username tidak terdaftar. Tanya mas operator!');
  const afterDing = await nodes(page);
  expect(afterDing).toBeGreaterThan(0);
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click(); // boot chime
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
  expect(await nodes(page)).toBeGreaterThan(afterDing);
  const vol = page.locator('.tray .vol');
  await expect(vol).toHaveCSS('opacity', '1');
  await page.locator('.taskbar .bill').click(); // info ding
  await page.getByRole('dialog', { name: 'Billing' }).getByRole('button', { name: 'OK' }).click();
  await page.locator('.icon[data-app="ym"]').dblclick();
  const before = await nodes(page);
  await page.getByRole('button', { name: 'BUZZ!' }).click();
  expect(await nodes(page)).toBeGreaterThan(before);
  await vol.click(); // mute: the running AudioContext is suspended
  await expect.poll(() => page.evaluate(async () => (await import(new URL('js/sound.js', document.baseURI).href)).audio().state)).toBe('suspended');
  const muted = await nodes(page);
  await page.getByRole('button', { name: 'BUZZ!' }).click();
  expect(await nodes(page)).toBe(muted); // muted: nothing plays
  await vol.click(); // unmute resumes
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click(); // door
  await expect(page.locator('.lock')).toBeVisible();
  expect(await nodes(page)).toBeGreaterThan(muted);
});

// source: AGENTS.md "js/sound.js every sound synthesized with WebAudio: chime, ding, buzz, door, dialup, renderSong (chiptunes)"
test('@app:winamp sound kit API: click, door open, a suspended context resumes, chiptune renders a WAV', async ({ page }) => {
  await countNodes(page);
  await bootLoud(page, '#desktop');
  await expect(page.locator('.desktop')).toBeVisible();
  const r = await page.evaluate(async () => {
    const s = await import(new URL('js/sound.js', document.baseURI).href);
    const out = {};
    await s.audio().suspend();
    s.click(); // a suspended context is resumed before playing
    s.door(true);
    s.door();
    s.setMuted(true); s.click(); s.setMuted(false); // muted: no click
    out.nodes = window.__osc + window.__noise;
    const { wav, duration } = s.renderSong({ prog: [[57, 'min'], [53, 'maj']], bars: 17, swing: 0.1 });
    out.duration = duration;
    out.type = wav.type;
    out.head = new TextDecoder().decode((await wav.arrayBuffer()).slice(0, 4));
    out.def = s.renderSong({ prog: [[60, 'm7'], [65, 'sus']] }).duration;
    return out;
  });
  expect(r).toMatchObject({ duration: 32, type: 'audio/wav', head: 'RIFF', def: 45 });
  expect(r.nodes).toBeGreaterThan(5);
});

// source: README "Supports touch ... works on a phone" (older Safari only has webkitAudioContext)
test('@app:boot sound works with the prefixed webkitAudioContext', async ({ page }) => {
  await page.addInitScript(() => { window.webkitAudioContext = window.AudioContext; delete window.AudioContext; });
  await bootLoud(page);
  await page.locator('.bios').click();
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
  expect(await page.evaluate(async () => (await import(new URL('js/sound.js', document.baseURI).href)).audio().constructor.name)).toBe('AudioContext');
});

// source: README "No install, no account, works on a phone" (a browser without Web Audio still logs in, just silently)
test('@app:boot no Web Audio at all: login and the Kilas Balik button still work', async ({ page }) => {
  await page.addInitScript(() => { delete window.AudioContext; delete window.webkitAudioContext; });
  await page.goto('./?seed=7&nosound&speed=10');
  await page.locator('.bios').click();
  await page.locator('[data-demo]').click();
  await expect(page.locator('.demo-text')).toContainText('Tahun 2003');
  await page.locator('.demo-skip').click();
  await expect(page.locator('.desktop')).toBeVisible();
  await page.goto('./?seed=7&nosound');
  await page.locator('.bios').click();
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
});
