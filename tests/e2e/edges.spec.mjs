// Edge cases of the use-case matrix: defensive fallbacks, odd community data,
// telemetry failure modes, URL switches and demo scripts that go wrong.
import { test, expect, boot, toDesktop } from './fixtures.mjs';

const mod = (page, path, fn, arg) => page.evaluate(async ([p, f, a]) => {
  const m = await import(new URL(p, document.baseURI).href);
  return new Function('m', 'a', `return (${f})(m, a)`)(m, a);
}, [path, fn.toString(), arg]);
const LINKS = {
  site: 'https://warnet-nusantara.pages.dev/',
  repo: 'https://github.com/kelvindesman/warnet-nusantara',
  discord: '', goatcounter: '', contactEmail: '',
  donate: { trakteer: '', saweria: '', githubSponsors: '', buyMeACoffee: '' },
};
const GC = { ...LINKS, goatcounter: 'https://warnet.goatcounter.com/count' };
const links = (page, json) => page.route('**/data/links.json', (r) => r.fulfill({ json }));
const counter = (page, body, delay = 0) => page.route('https://gc.zgo.at/count.js', async (r) => {
  if (delay) await new Promise((ok) => setTimeout(ok, delay));
  await r.fulfill({ contentType: 'text/javascript', body });
});
const launch = (page, id) => page.evaluate((x) => window.dispatchEvent(new CustomEvent('launch', { detail: x })), id);

// source: Kelvin request 2026-11-07 "include quick killer attractive demo" + data/demo.json is community-editable (AGENTS.md "Content will move ... into data/*.json")
test('@app:demo a broken demo script ends on the desktop instead of hanging', async ({ page }) => {
  await toDesktop(page);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const r = await mod(page, 'js/demo.js', async (m) => {
    const calls = [];
    const api = { boot() {}, launch() {}, balloon() {}, timeout() {}, toDesktop: () => calls.push('desktop') };
    // no speed given: plays at normal speed; an optional target may be missing, a required one may not
    const a = await m.runDemo(api, [{ do: 'click', target: '.tidak-ada', optional: true, wait: 200 }, { do: 'waitFor', target: '.tidak-ada', ms: 200 }]);
    const b = await m.runDemo({ ...api, speed: 20 }, [{ do: 'click', target: '.tidak-ada', wait: 100 }]);
    return { a, b, calls, left: document.querySelectorAll('.demo').length };
  });
  expect(r).toEqual({ a: 'skipped', b: 'skipped', calls: ['desktop', 'desktop'], left: 0 });
  expect(errors.join('\n')).toContain('demo: .tidak-ada never appeared');
  expect(errors.join('\n')).toContain('demo: .tidak-ada not found');
});

// source: data/demo.json "Any key/tap skips straight to the desktop" (js/demo.js header) + Kelvin request 2026-11-07 killer demo
test('@app:demo taps on the end card do not skip; keys skip once; Lewati after a skip is ignored', async ({ page }) => {
  await toDesktop(page);
  const r = await mod(page, 'js/demo.js', async (m) => {
    let desk = 0;
    const api = { speed: 10, boot() {}, launch() {}, balloon() {}, timeout() {}, toDesktop: () => { desk++; } };
    const run = m.runDemo(api, [{ do: 'wait', ms: 600000 }]);
    const card = document.createElement('div'); card.className = 'demo-end'; document.body.append(card);
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); // a tap on the end card is not a skip
    const playing = !!document.querySelector('.demo');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })); // a key pressed with nothing focused skips
    document.querySelector('.demo-skip').click(); // a second skip does nothing
    card.remove();
    return { playing, result: await run, desk };
  });
  expect(r).toEqual({ playing: true, result: 'skipped', desk: 1 });
});

// source: README "Kilas Balik" / Kelvin request 2026-11-07 killer demo (plan: "Any key/click skips to interactive desktop")
test('@app:demo skipping during the welcome screen or after the desktop appears lands on one desktop', async ({ page }) => {
  await boot(page, 'demo&speed=10');
  await expect(page.locator('.welcome')).toBeVisible({ timeout: 20_000 });
  await page.keyboard.press('Space');
  await expect(page.locator('.desktop')).toBeVisible();
  await page.waitForTimeout(2000); // the welcome screen's own timer must not rebuild the desktop
  await expect(page.locator('.desktop')).toHaveCount(1);
  await expect(page.locator('.demo')).toHaveCount(0);

  await boot(page, 'demo&speed=10');
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 20_000 });
  await page.locator('.icon[data-app="ranjau"]').evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'ranjau' })));
  await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('.demo')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible(); // the running session is kept
});

// source: Kelvin request 2026-11-07 "?seed" deterministic test switch (js/params.js: "?seed=N deterministic Math.random")
test('@app:boot without ?seed or with a non-numeric one the warnet still boots with a random voucher', async ({ page }) => {
  await page.goto('./?nosound&seed=abc');
  await page.locator('.bios').click();
  await expect(page.locator('.sticky .vu')).not.toBeEmpty();
  await page.goto('./?nosound');
  await page.locator('.bios').click();
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
});

// source: .claude/skills/add-game/SKILL.md (community games come from data/games.json with any name and icon)
test('@app:games a game with a symbol-only name and an unknown icon still gets box art and a window', async ({ page }) => {
  await page.route('**/data/games.json', async (r) => {
    const games = await (await r.fetch()).json();
    await r.fulfill({ json: [...games, { id: 'misteri', name: '???', note: 'Game misteri', mode: 'embed', url: 'https://example.com/misteri/', icon: 'ikon-tidak-ada', year: 2002 }] });
  });
  await toDesktop(page);
  await expect(page.locator('.icon[data-app="g:misteri"] text')).toHaveText('?');
  await page.locator('.icon[data-app="g:misteri"]').dblclick();
  const win = page.getByRole('dialog', { name: '???' });
  await expect(win.locator('iframe')).toHaveAttribute('src', 'https://example.com/misteri/');
  await expect(win.locator('.titlebar .ti svg')).toHaveCount(1); // falls back to the text-file icon
  expect(await mod(page, 'js/apps/games.js', (m) => m.launchGame('tidak-ada'))).toBeUndefined();
  await page.locator('.icon[data-app="games"]').dblclick();
  const folder = page.getByRole('dialog', { name: 'Game Warnet' });
  await expect(folder.locator('[data-g="misteri"] text')).toHaveText('?');
  await folder.locator('.ex-main').dispatchEvent('dblclick'); // between the games: opens nothing
  await expect(page.locator('.win')).toHaveCount(2);
});

// source: Kelvin request 2026-11-07 "100% testing coverage +e2e + matrix all use case should be covered" (old shortcut ids keep working as deep links)
test('@app:games legacy app ids cs16, diablo, pinball and sango still launch their games', async ({ page }) => {
  await toDesktop(page);
  for (const [id, title] of [['diablo', 'Diablo (Shareware)'], ['pinball', '3D Pinball Space Cadet'], ['sango', 'Sango Fighter']]) {
    await launch(page, id);
    await expect(page.getByRole('dialog', { name: title })).toBeVisible();
  }
  await launch(page, 'cs16');
  const ask = page.getByRole('dialog', { name: 'Counter-Strike 1.6' });
  await expect(ask).toContainText('Buka di tab baru?');
  await ask.getByRole('button', { name: 'Batal' }).click();
  await expect(ask).toHaveCount(0);
});

// source: README "Supports touch: ... a single tap opens icons" (hybrid laptops switch between touch and mouse)
test.describe('touch and mouse on one device', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'isMobile is not supported in Firefox');
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 900, height: 700 } });
  test('@app:games a tap opens a game; once a mouse is the main pointer a click only selects it', async ({ page }) => {
    await toDesktop(page);
    await page.locator('.icon[data-app="games"]').tap();
    const games = page.getByRole('dialog', { name: 'Game Warnet' });
    await games.locator('[data-g="ranjau"]').tap();
    await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Ranjau' }).getByRole('button', { name: 'Close' }).tap();
    await page.evaluate(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (q === '(pointer: coarse)' ? { matches: false } : mm(q)); });
    await games.locator('[data-g="ular"]').tap();
    await expect(games.locator('[data-g="ular"]')).toHaveClass(/\bsel\b/);
    await expect(page.getByRole('dialog', { name: 'Ular HP' })).toHaveCount(0);
  });
});

// source: README "Others: My Computer ..." desktop behaviour: double-click opens an icon (double-clicking empty desktop opens nothing)
test('@app:desktop double-clicking between the desktop icons opens nothing', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icons').dispatchEvent('dblclick');
  await page.waitForTimeout(200);
  await expect(page.locator('.win')).toHaveCount(0);
});

// source: README "Winamp ... lazy-loaded from unpkg" (a broken Winamp module never blocks shutting down)
test('@app:winamp Turn Off still works when closing Winamp fails', async ({ page }) => {
  await page.route('**/js/apps/winamp.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export const onWinampChange = () => {}; export const toggleWinamp = () => {}; export function closeWinamp() { window.__waCloseCalls = (window.__waCloseCalls || 0) + 1; throw new Error("rusak"); }' }));
  await toDesktop(page);
  await page.locator('.startbtn').click();
  await page.locator('[data-p="off"]').click();
  await page.locator('[data-s="off"]').click();
  await expect(page.locator('.bye')).toBeVisible();
  // the failure is swallowed asynchronously; wait for it so the test covers that path every run
  await expect.poll(() => page.evaluate(() => window.__waCloseCalls)).toBe(1);
});

// source: AGENTS.md "Only allow http:/https: URLs" + Kelvin request 2026-11-07 "subtly softsell" (sponsors without a message, undated supporters, partial links.json)
test('@app:kontributor supporters without dates or messages, a sponsor without a slogan, and links.json without donate', async ({ page }) => {
  await links(page, { site: LINKS.site, repo: LINKS.repo });
  await page.route('**/data/supporters.json', (r) => r.fulfill({ json: [
    { name: 'Andi', tier: 'jam' },
    { name: 'Sari', tier: 'malam' },
    { name: 'Warung Kopi', tier: 'iklan', url: 'https://example.com/kopi', date: '2026-11-02' },
    { name: 'Joko', tier: 'vip', date: '2026-11-02' },
    { name: 'Iklan Palsu', tier: 'iklan', url: 'http://example.com/', date: '2026-11-03' },
  ] }));
  await boot(page);
  await page.locator('.bios').click();
  await expect(page.locator('.lock .ticker')).toContainText('★ Terima kasih Andi (Paket 1 Jam) ★');
  await toDesktop(page);
  await page.locator('.icon[data-app="kontributor"]').dblclick();
  const np = page.locator('textarea.notepad');
  await expect(np).toHaveValue(/\[Member VIP\]\n- Joko\n/);
  await expect(np).toHaveValue(/\[Pasang Iklan\]\n- Iklan Palsu\n- Warung Kopi\n/);
  const banner = await mod(page, 'js/community.js', async (m) => m.sponsorBanner((await import(new URL('js/data.js', document.baseURI).href)).SUPPORTERS, {}));
  expect(banner).toEqual({ title: 'Warung Kopi', sub: 'Sponsor Warnet Nusantara.Net', href: 'https://example.com/kopi', sponsor: true });
  await launch(page, 'donate');
  await expect(page.locator('.op-pay.off')).toHaveCount(4);
});

// source: Kelvin request 2026-11-07 "show supporter name donation everywhere" (empty list invites the first supporter)
test('@app:kontributor KONTRIBUTOR.txt invites the first supporter while nobody has paid yet', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="kontributor"]').dblclick();
  await expect(page.locator('textarea.notepad')).toHaveValue(/- Belum ada\. Jadilah yang pertama! Start -> Dukung Warnet Ini/);
});

// source: Kelvin request 2026-11-07 "if any inquiry from the web automatically create issue on the github repo" (issue carries the app it came from)
test('@app:contact contact links opened from an app carry that app; bare issue links stay minimal', async ({ page }) => {
  await toDesktop(page);
  await mod(page, 'js/apps/operator.js', (m) => { m.openContact('ranjau'); });
  const href = await page.locator('[data-contact="bug"]').getAttribute('href');
  expect(new URL(href).searchParams.get('body')).toContain('- app: ranjau');
  const bare = await mod(page, 'js/community.js', (m) => m.issueUrl('https://github.com/o/r', 'bug'));
  expect(bare).toBe('https://github.com/o/r/issues/new?template=bug.yml&labels=from-web');
});

// source: Kelvin request 2026-11-07 SEO/virality plan ("Bagikan sesi warnet kamu" on Log Off with the session brag)
test('@app:boot the Log Off brag counts hours for long sessions', async ({ page }) => {
  await page.clock.install();
  await toDesktop(page);
  for (let i = 0; i < 2; i++) { // make sure the voucher outlasts the session
    await page.locator('.taskbar .bill').click();
    await page.getByRole('dialog', { name: 'Billing' }).getByRole('button', { name: 'Nambah 1 jam' }).click();
  }
  await page.locator('.startbtn').click();
  await page.clock.fastForward('01:02:00');
  await page.locator('[data-p="logoff"]').click();
  const wa = decodeURIComponent(await page.locator('.lock .share a').first().getAttribute('href'));
  expect(wa).toContain('Gue main 1 jam 2 menit di Warnet Nusantara.Net');
});

// source: Kelvin request 2026-11-07 "anonymous telemetry" (cookieless, never breaks the app)
test('@app:stats an unreachable GoatCounter script switches counting off; the job ad click on the lock screen is counted', async ({ page, external }) => {
  await links(page, GC);
  await toDesktop(page); // count.js is blocked (offline): counting turns itself off
  await launch(page, 'ranjau');
  await launch(page, 'ular');
  await expect(page.getByRole('dialog', { name: 'Ular HP' })).toBeVisible();
  expect(external.filter((u) => u.includes('gc.zgo.at'))).toEqual(['https://gc.zgo.at/count.js']);

  await counter(page, 'window.__gc = []; window.goatcounter.count = (v) => window.__gc.push(v.path);');
  await boot(page);
  await page.locator('.bios').click();
  await page.locator('.lowongan').evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault()); a.click(); });
  await expect.poll(() => page.evaluate(() => window.__gc)).toEqual(['boot', 'cta:lowongan-lock']);
});

// source: Kelvin request 2026-11-07 "anonymous telemetry" (js/stats.js: "it can never throw into the app")
test('@app:stats events queued while the script loads are sent; a broken or missing counter never throws', async ({ page }) => {
  await links(page, GC);
  let mode = 'slow';
  await page.route('https://gc.zgo.at/count.js', async (r) => {
    const body = {
      slow: 'window.__gc = []; window.goatcounter.count = (v) => window.__gc.push(v.path);',
      throws: 'window.goatcounter.count = () => { throw new Error("gc"); };',
      gone: 'delete window.goatcounter;',
      noop: 'window.goatcounter.count = 42;',
    }[mode];
    if (mode === 'slow') await new Promise((ok) => setTimeout(ok, 500));
    await r.fulfill({ contentType: 'text/javascript', body });
  });
  await toDesktop(page);
  await launch(page, 'ranjau'); // tracked while count.js is still loading
  await expect.poll(() => page.evaluate(() => window.__gc)).toEqual(['boot', 'app:ranjau']);
  for (mode of ['throws', 'gone', 'noop']) {
    await toDesktop(page);
    await page.waitForFunction(() => document.querySelector('script[src="https://gc.zgo.at/count.js"]'));
    await page.waitForTimeout(200);
    await launch(page, 'ranjau');
    await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible();
  }
});

// source: Kelvin request 2026-11-07 "anonymous telemetry" ("off for Do-Not-Track" in js/stats.js)
test('@app:stats Do Not Track and Global Privacy Control keep GoatCounter off', async ({ page, external }) => {
  await links(page, GC);
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'doNotTrack', { get: () => '1' }));
  await toDesktop(page);
  await launch(page, 'ranjau');
  await expect(page.getByRole('dialog', { name: 'Ranjau' })).toBeVisible();
  expect(await mod(page, 'js/stats.js', (m) => [m.enabled(), m.enabled({ goatcounter: 'https://x.goatcounter.com/count' }, { globalPrivacyControl: true }), m.enabled({ goatcounter: 'https://x.goatcounter.com/count' }, {})])).toEqual([false, false, true]);
  expect(external.filter((u) => u.includes('gc.zgo.at'))).toEqual([]);
});

// source: README "IRC Chat" (a nickname is always shown, even for an empty login)
test('@app:chat an empty username joins IRC as tamu; the BIOS falls back to PC-07', async ({ page }) => {
  await toDesktop(page);
  await mod(page, 'js/state.js', (m) => { m.session.user = ''; m.session.pc = 0; });
  await launch(page, 'chat');
  const chat = page.getByRole('dialog', { name: /IRC Chat/ });
  await expect(chat.locator('.irc-nicks')).toContainText('tamu');
  await chat.getByRole('button', { name: 'Close' }).click();
  await mod(page, 'js/state.js', (m) => { m.session.user = 'anak_gaul99'; });
  await launch(page, 'chat');
  await expect(chat.locator('.irc-nicks')).toContainText('anak_gaul99');
  await page.locator('.startbtn').click();
  await page.locator('[data-p="off"]').click();
  await page.locator('[data-s="restart"]').click();
  await expect(page.locator('.bios')).toContainText('PC-07');
});

// source: README "Penjelajah Internet ... Starts with a synthesized Telkomnet Instan dial-up handshake." (muted: connects on its own)
test('@app:browser with sound off the dial-up connects by itself', async ({ page }) => {
  await toDesktop(page);
  await page.locator('.icon[data-app="browser"]').dblclick();
  await expect(page.locator('.br-view iframe')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Menghubungkan ke Telkomnet Instan' })).toHaveCount(0);
});
