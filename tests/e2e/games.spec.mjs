// Game Warnet folder: every catalog entry is listed and launches the right way.
// External game hosts are blocked by the fixture, so this checks wiring (iframe
// src, new-tab prompt), not playability. Playability is the nightly live check.
import { readFileSync } from 'node:fs';
import { test, expect, toDesktop } from './fixtures.mjs';

const GAMES = JSON.parse(readFileSync(new URL('../../data/games.json', import.meta.url), 'utf8'));
const openFolder = async (page) => {
  await page.locator('.icon[data-app="games"]').dblclick();
  const win = page.getByRole('dialog', { name: 'Game Warnet' });
  await expect(win).toBeVisible();
  return win;
};

// source: Kelvin request 2026-11-07 "have we swept all popular game ported on the internet and fully functional"
test('@app:games folder lists every catalog game grouped by launch mode', async ({ page }) => {
  await toDesktop(page);
  const win = await openFolder(page);
  await expect(win.locator('[data-g]')).toHaveCount(GAMES.length);
  await expect(win.locator('.statusbar .st')).toHaveText(`${GAMES.length} objek`);
  const ids = await win.locator('[data-g]').evaluateAll((bs) => bs.map((b) => b.dataset.g));
  const order = ['local', 'embed', 'tab', 'fanport', 'ps', 'shrine']; // memorials (not playable) last
  const group = (g) => order.indexOf(g.console ? 'ps' : g.mode);
  const down = (g) => (g.broken || g.status === 'down' ? 1 : 0);
  expect(ids).toEqual([...GAMES].sort((a, b) => group(a) - group(b) || down(a) - down(b)).map((g) => g.id));
});

// source: Kelvin request 2026-11-08 "ensure all game is web ready palyable active and can be loaded in brwoser anything that not playable should have note and less priority"
test('@app:games a game marked broken sinks to the end of its group, shows the operator note, and asks before launching', async ({ page }) => {
  const embeds = GAMES.filter((g) => g.mode === 'embed' && !g.broken);
  const victim = embeds[0];
  await page.route('**/data/games.json', (r) => r.fulfill({ json: GAMES.map((g) => (g.id === victim.id ? { ...g, broken: 'Emulatornya macet di layar hitam.', broken_en: 'The emulator hangs on a black screen.' } : g)) }));
  await toDesktop(page);
  const win = await openFolder(page);
  const ids = await win.locator('[data-g]').evaluateAll((bs) => bs.map((b) => b.dataset.g));
  const lastEmbed = Math.max(...GAMES.filter((g) => g.mode === 'embed').map((g) => ids.indexOf(g.id)));
  expect(ids.indexOf(victim.id)).toBe(lastEmbed); // less priority: after every playable embed
  const b = win.locator(`[data-g="${victim.id}"]`);
  await expect(b).toHaveClass(/\brusak\b/);
  await expect(b.locator('small')).toContainText('⚠');
  await expect(win.locator(`[data-g="${embeds[1].id}"]`)).not.toHaveClass(/\brusak\b/);
  await b.click();
  await expect(win.locator('.det')).toContainText('Catatan operator: Emulatornya macet di layar hitam.');
  await win.locator(`[data-g="${embeds[1].id}"]`).click();
  await expect(win.locator('.det')).not.toContainText('Catatan operator');
  await b.dblclick();
  let box = page.locator('.win .dialog').filter({ hasText: 'Emulatornya macet' });
  await expect(box).toBeVisible();
  await page.getByRole('button', { name: 'Batal' }).click();
  await expect(page.getByRole('dialog', { name: victim.name, exact: true })).toHaveCount(0); // cancelled: nothing opens
  await b.dblclick();
  box = page.locator('.win .dialog').filter({ hasText: 'Emulatornya macet' });
  await expect(box).toBeVisible();
  await page.getByRole('button', { name: 'Tetap coba' }).click();
  await expect(page.getByRole('dialog', { name: victim.name, exact: true }).locator('iframe')).toHaveAttribute('src', victim.url);
});

// source: Kelvin request 2026-11-07 "fully functional if user goes to our web" (each embed opens its own window)
test('@app:games every embedded game opens a window framing its https URL', async ({ page }) => {
  test.setTimeout(120_000);
  await toDesktop(page);
  const win = await openFolder(page);
  for (const g of GAMES.filter((x) => x.mode === 'embed')) {
    await win.locator(`[data-g="${g.id}"]`).click();
    await expect(win.locator('.det')).toContainText(g.name);
    await win.locator(`[data-g="${g.id}"]`).dblclick();
    const gw = page.getByRole('dialog', { name: g.name, exact: true });
    await expect(gw.locator('iframe')).toHaveAttribute('src', g.url);
    await gw.getByRole('button', { name: 'Close' }).click();
    await expect(gw).toHaveCount(0);
  }
});

// source: .claude/skills/add-game/SKILL.md "tab" mode for hosts that refuse framing
test('@app:games new-tab games ask first, then open with noopener; Batal opens nothing', async ({ page }) => {
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const win = await openFolder(page);
  const tabs = GAMES.filter((x) => x.mode === 'tab');
  for (const g of tabs) {
    await win.locator(`[data-g="${g.id}"]`).dblclick();
    if (g.broken) await page.getByRole('button', { name: 'Tetap coba' }).click(); // operator note first
    await page.getByRole('button', { name: 'Buka', exact: true }).click();
  }
  expect(await page.evaluate(() => window.__opened)).toEqual(tabs.map((g) => [g.url, '_blank', 'noopener']));
  await win.locator(`[data-g="${tabs[0].id}"]`).dblclick();
  await page.getByRole('button', { name: 'Batal' }).click();
  expect(await page.evaluate(() => window.__opened.length)).toBe(tabs.length);
});

// source: bug ref games-candidates sweep 2026-11-07: alula.github.io/SpaceCadetPinball redirects to http:// (mixed content in iframe)
test('@app:games Space Cadet Pinball frames the https host directly', async ({ page }) => {
  await toDesktop(page);
  const win = await openFolder(page);
  await win.locator('[data-g="pinball"]').dblclick();
  await expect(page.getByRole('dialog', { name: '3D Pinball Space Cadet' }).locator('iframe')).toHaveAttribute('src', 'https://pinball.alula.me/');
});

// source: .claude/skills/add-game/SKILL.md "Tier C: build a Shrine instead" (never link still-sold games or private servers)
test('@app:games shrines fake a server under maintenance, open the old site via Wayback and the official page', async ({ page }) => {
  await page.clock.install(); // each shrine "connects" for 1.5 s; skip the wait instead of sleeping 14 × 1.5 s
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const shrines = GAMES.filter((x) => x.mode === 'shrine');
  expect(shrines.length).toBeGreaterThan(0);
  const win = await openFolder(page);
  // install() lets time flow, so a slow run could pass 1.5 s before the first check: hold it still
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  for (const g of shrines) {
    await win.locator(`[data-g="${g.id}"]`).dblclick();
    const sw = page.getByRole('dialog', { name: g.name, exact: true });
    await expect(sw.locator('.sh-st')).toHaveText('Menghubungkan ke server...');
    await page.clock.runFor(1500);
    await expect(sw.locator('iframe')).toHaveCount(0);
    await expect(sw.locator('.sh-st')).toContainText('Server lagi maintenance');
    await expect(sw.locator('[data-official]')).toHaveCount(g.official ? 1 : 0);
    if (g.official) await sw.locator('[data-official]').click();
    await sw.getByRole('button', { name: 'Close' }).click();
  }
  expect(await page.evaluate(() => window.__opened)).toEqual(shrines.filter((g) => g.official).map((g) => [g.official, '_blank', 'noopener']));
  await page.clock.resume();
  const rag = shrines.find((g) => g.id === 'ragnarok');
  await win.locator('[data-g="ragnarok"]').dblclick();
  await page.getByRole('dialog', { name: rag.name, exact: true }).getByRole('button', { name: `Lihat situs lama (${rag.siteYear})` }).click();
  const skip = page.getByRole('button', { name: 'Lewati' });
  const frame = page.locator('.br-view iframe');
  await expect(skip.or(frame)).toBeVisible();
  if (await skip.isVisible()) await skip.click({ timeout: 2000 }).catch(() => {});
  await expect(frame).toHaveAttribute('src', `https://web.archive.org/web/${rag.siteYear}if_/${rag.site}`);
});

// source: Kelvin request 2026-11-07 catalog sweep; desktop must stay usable (folder-only games keep no shortcut)
test('@app:games desktop shows shortcuts only for original games; new and shrine games live in the folder; deep link still works', async ({ page }) => {
  await toDesktop(page);
  for (const g of GAMES.filter((x) => x.mode !== 'local')) {
    // PS1/PS2 fan ports have their own corner (Kelvin request 2026-11-10 "psx game should be shown at ddesktop icon bottom right")
    await expect(page.locator(`.desktop .icon[data-app="g:${g.id}"]`)).toHaveCount(g.console ? 1 : g.mode === 'shrine' || g.desktop === false ? 0 : 1);
  }
  await page.goto('about:blank');
  await page.goto('./?seed=7&nosound#app=g:gunbound');
  await expect(page.getByRole('dialog', { name: 'GunBound', exact: true })).toBeVisible();
});

// source: Kelvin request 2026-11-08 "search list of ported fan illegal game to web we shoud display it as well ddisclamer we're not affiliated anything"
test('@app:games fan ports: disclaimer in the folder and every launcher, live ports open in a new tab, dead ports only link the news', async ({ page }) => {
  test.slow(); // walks every fan port launcher (20+ windows) in one test
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const fans = GAMES.filter((x) => x.mode === 'fanport');
  expect(fans.some((g) => g.status === 'live') && fans.some((g) => g.status === 'down')).toBe(true);
  const win = await openFolder(page);
  await expect(win.locator('.fp-disc')).toContainText('tidak berafiliasi');
  const expected = [];
  for (const g of fans) {
    await win.locator(`[data-g="${g.id}"]`).dblclick();
    const fw = page.getByRole('dialog', { name: g.name, exact: true });
    await expect(fw.locator('.op-small')).toContainText('tidak berafiliasi');
    await expect(fw.locator('iframe')).toHaveCount(0); // never framed inside the warnet
    await expect(fw.locator('[data-play]')).toHaveCount(g.status === 'live' ? 1 : 0);
    await expect(fw.locator('[data-news]')).toHaveCount(g.news ? 1 : 0);
    if (g.status === 'live') { await fw.locator('[data-play]').click(); expected.push([g.url, '_blank', 'noopener']); }
    else await expect(fw.locator('.fp-st')).toContainText('DMCA');
    if (g.news) { await fw.locator('[data-news]').click(); expected.push([g.news, '_blank', 'noopener']); }
    await fw.getByRole('button', { name: 'Close' }).click();
  }
  expect(await page.evaluate(() => window.__opened)).toEqual(expected);
});

// source: Kelvin request 2026-11-08 "add cta button request game or something" (screenshot of the Game Warnet folder)
test('@app:games "Usul game" button prefills the usul-game issue form and is counted', async ({ page }) => {
  await page.route('**/data/links.json', async (r) => {
    const links = await (await r.fetch()).json();
    await r.fulfill({ json: { ...links, goatcounter: 'https://warnet.goatcounter.com/count' } });
  });
  await page.route('https://gc.zgo.at/count.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.__gc = []; window.goatcounter.count = (v) => window.__gc.push(v.path);' }));
  await toDesktop(page);
  const win = await openFolder(page);
  const cta = win.getByRole('link', { name: 'Usul game ke operator' });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(cta).toHaveAttribute('rel', 'noopener');
  const links = JSON.parse(readFileSync(new URL('../../data/links.json', import.meta.url), 'utf8'));
  const u = new URL(await cta.getAttribute('href'));
  expect(u.origin + u.pathname).toBe(`${links.repo}/issues/new`);
  expect(u.searchParams.get('template')).toBe('usul-game.yml');
  expect(u.searchParams.get('labels')).toBe('from-web');
  expect(u.searchParams.get('title')).toBe('[Game] ');
  expect(u.searchParams.get('body')).toContain('- app: games');
  await cta.evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault()); a.click(); });
  await expect.poll(() => page.evaluate(() => window.__gc)).toEqual(['boot', 'app:games', 'cta:usul-game']);
});

// source: Kelvin request 2026-11-10 "include retrogames psx ps2 collection (fan made fan port we're not affiliated)"
test('@app:games rental PS corner: PS1 and PS2 fan ports on their own shelf, labelled, under the not-affiliated disclaimer, opening in a new tab', async ({ page }) => {
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const ps = GAMES.filter((g) => g.console);
  expect(ps.filter((g) => g.console === 'ps1').length).toBeGreaterThan(0);
  expect(ps.filter((g) => g.console === 'ps2').length).toBeGreaterThan(0);
  const win = await openFolder(page);
  const shelf = win.locator('.subgroup.g-ps');
  await expect(shelf).toHaveText('Pojok Rental PS: PS1 & PS2 (port fan, buka tab baru)');
  // the shelf comes after the fan-port disclaimer and holds exactly the PlayStation ports
  const layout = await win.locator('.ex-main').evaluate((m) => {
    const kids = [...m.children]; const at = kids.findIndex((k) => k.classList.contains('g-ps'));
    const disc = kids.findIndex((k) => k.classList.contains('fp-disc'));
    const shelf = []; for (const k of kids.slice(at + 1)) { if (k.classList.contains('group')) break; shelf.push(k.dataset.g); }
    return { disc, at, shelf };
  });
  expect(layout.disc).toBeLessThan(layout.at);
  expect(layout.shelf.sort()).toEqual(ps.map((g) => g.id).sort());
  const crash = ps.find((g) => g.id === 'fpcrashbash');
  await expect(win.locator('[data-g="fpcrashbash"] small')).toHaveText(`${crash.year} · PS1`);
  await expect(win.locator('[data-g="fpgta3"] small')).toHaveText('2001 · PS2');
  // searching keeps the shelf under the disclaimer: a PS hit shows the fan-port header, the disclaimer and the shelf
  const q = win.getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await q.fill('crash bash');
  await expect(win.locator('.ex-main .icon:visible')).toHaveCount(1);
  await expect(win.locator('.group:visible')).toHaveText(['Port Fan (tidak resmi, buka tab baru)']);
  await expect(win.locator('.fp-disc')).toBeVisible();
  await expect(shelf).toBeVisible();
  await q.fill('gunz'); // a PC fan port only: the PS shelf header goes away
  await expect(win.locator('.fp-disc')).toBeVisible();
  await expect(shelf).toBeHidden();
  await q.fill('');
  await win.locator('[data-g="fpgta3"]').dblclick();
  const fw = page.getByRole('dialog', { name: 'GTA III (port fan)', exact: true });
  await expect(fw.locator('.op-small')).toContainText('tidak berafiliasi');
  await expect(fw.locator('iframe')).toHaveCount(0);
  await fw.locator('[data-play]').click();
  expect(await page.evaluate(() => window.__opened)).toEqual([['https://quenq.com/apps/gta-3/', '_blank', 'noopener']]);
});

// source: Kelvin 2026-11-10, asked "can we link retrogames.cc?" (it hosts PS1 games still on sale): "yes"
test('@app:games retrogames.cc PS1 games sit on the rental PS shelf and open their game page in a new tab, never a frame', async ({ page }) => {
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  const rg = GAMES.filter((g) => g.url && new URL(g.url).hostname === 'www.retrogames.cc');
  expect(rg.map((g) => g.name)).toEqual(expect.arrayContaining(['Tekken 3 (emulator)', 'Crash Team Racing (emulator)', 'Harvest Moon: Back to Nature (emulator)']));
  for (const g of rg) {
    expect(g).toMatchObject({ mode: 'fanport', console: 'ps1', status: 'live', desktop: false });
    expect(g.url).toMatch(/^https:\/\/www\.retrogames\.cc\/psx-games\/[a-z0-9-]+\.html$/);
  }
  const win = await openFolder(page);
  const q = win.getByRole('searchbox', { name: 'Cari di Game Warnet' });
  await q.fill('tekken 3');
  await expect(win.locator('.subgroup.g-ps')).toBeVisible();
  await expect(win.locator('.fp-disc')).toBeVisible();
  await win.locator('[data-g="rgtekken3"]').dblclick();
  const fw = page.getByRole('dialog', { name: 'Tekken 3 (emulator)', exact: true });
  await expect(fw.locator('.op-small')).toContainText('tidak berafiliasi');
  await expect(fw.locator('iframe')).toHaveCount(0);
  await fw.locator('[data-play]').click();
  expect(await page.evaluate(() => window.__opened)).toEqual([['https://www.retrogames.cc/psx-games/tekken-3.html', '_blank', 'noopener']]);
  // the desktop rental PS corner offers them too
  await expect(page.locator('.desktop .ps-corner .icon[data-app="g:rgtekken3"]')).toHaveCount(1);
});
