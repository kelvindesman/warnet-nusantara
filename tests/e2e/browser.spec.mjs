// Penjelajah Internet: address bar, Wayback year picker, history, toolbar, dial-up, portal page.
import { test, expect, toDesktop, openBrowser } from './fixtures.mjs';

const WB = 'https://web.archive.org/web/';
// Stub the Wayback Machine so frame loads succeed offline.
const stubWayback = (page) => page.route('https://web.archive.org/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>arsip</p>' }));

async function setup(page) {
  await stubWayback(page);
  await toDesktop(page);
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  await openBrowser(page);
  const win = page.getByRole('dialog', { name: /Penjelajah Internet$/ });
  const addr = win.getByRole('textbox', { name: 'Address' });
  const frame = win.locator('.br-view iframe');
  const go = async (text) => { await addr.fill(text); await addr.press('Enter'); };
  const btn = (a) => win.locator(`[data-a="${a}"]`);
  return { win, addr, frame, go, btn };
}

// source: README "Penjelajah Internet: A real browser in a window. Every page loads through the Wayback Machine, with a year picker (1998–2015)"
test('@app:browser address bar: domains, searches, archive URLs, about:home and the year picker', async ({ page }) => {
  const { win, addr, frame, go } = await setup(page);
  await go('detik.com');
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://detik.com`);
  await expect(addr).toHaveValue('http://detik.com');
  await expect(win.locator('.tt')).toHaveText('http://detik.com - Penjelajah Internet');
  await expect(win.locator('.statusbar .st')).toHaveText('Selesai');
  await go('kaskus');
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.google.com/search?q=kaskus`);
  await go('lagu peterpan.mp3');
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.google.com/search?q=lagu%20peterpan.mp3`);
  await go('https://web.archive.org/web/2003/http://www.friendster.com/');
  await expect(frame).toHaveAttribute('src', 'https://web.archive.org/web/2003/http://www.friendster.com/');
  await go('about:home');
  await expect(frame).toHaveAttribute('src', 'home.html');
  await expect(win.locator('.tt')).toHaveText('Portal Nusantara.Net - Penjelajah Internet');
  const year = win.getByRole('combobox', { name: 'Tahun' });
  await year.selectOption('1999'); // on the home page the year only applies to the next visit
  await expect(frame).toHaveAttribute('src', 'home.html');
  await addr.fill('http://www.geocities.com/');
  await addr.press('a'); // typing does not navigate
  await addr.fill('http://www.geocities.com/');
  await win.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(frame).toHaveAttribute('src', `${WB}1999if_/http://www.geocities.com/`);
  await year.selectOption('2004');
  await expect(frame).toHaveAttribute('src', `${WB}2004if_/http://www.geocities.com/`);
  await year.selectOption('live');
  await expect(frame).toHaveAttribute('src', 'http://www.geocities.com/');
  await frame.dispatchEvent('load');
  await expect(win.locator('.statusbar .st')).toContainText('Layar putih?');
  await addr.click();
  expect(await addr.evaluate((i) => [i.selectionStart, i.selectionEnd])).toEqual([0, 'http://www.geocities.com/'.length]);
  await go('');
  await expect(frame).toHaveAttribute('src', 'home.html');
});

// source: README "Penjelajah Internet: A real browser in a window" (Back, Forward, Stop, Refresh, Home, Search, bookmarks)
test('@app:browser toolbar: back, forward, stop, refresh, home, search, new tab and bookmarks', async ({ page }) => {
  const { win, frame, go, btn } = await setup(page);
  await expect(btn('back')).toBeDisabled();
  await expect(btn('fwd')).toBeDisabled();
  await btn('back').evaluate((b) => b.onclick()); // nothing to go back to
  await btn('newtab').click();
  await win.locator('.br-links [data-b="0"]').click(); // detik.com 2001
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.detik.com/`);
  await win.locator('.br-links').dispatchEvent('click');
  await go('kompas.com');
  await btn('back').click();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.detik.com/`);
  await btn('back').click();
  await expect(frame).toHaveAttribute('src', 'home.html');
  await btn('fwd').click();
  await btn('fwd').click();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://kompas.com`);
  await btn('fwd').evaluate((b) => b.onclick()); // already at the newest page
  await btn('stop').click();
  await expect(frame).toHaveAttribute('src', 'about:blank');
  await expect(win.locator('.br-throbber')).not.toHaveClass(/spin/);
  await btn('reload').click();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://kompas.com`);
  await btn('newtab').click();
  await btn('search').click();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.google.com/`);
  await btn('home').click();
  await expect(frame).toHaveAttribute('src', 'home.html');
  expect(await page.evaluate(() => window.__opened)).toEqual([
    ['home.html', '_blank', 'noopener'],
    [`${WB}2001if_/http://kompas.com`, '_blank', 'noopener'],
  ]);
});

// source: README "Penjelajah Internet ... Friendster 2003" (desktop shortcuts open the browser on their site, reusing the window)
test('@app:friendster @app:kaskus shortcuts reuse the open browser window', async ({ page }) => {
  const { win, frame } = await setup(page);
  await page.locator('.icon[data-app="friendster"]').dblclick();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.friendster.com/`);
  await page.locator('.icon[data-app="kaskus"]').dblclick();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.kaskus.com/`);
  await page.locator('.icon[data-app="browser"]').dblclick(); // no URL: just focus
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.kaskus.com/`);
  await expect(page.getByRole('dialog', { name: /Penjelajah Internet$/ })).toHaveCount(1);
  await expect(win).toBeVisible();
});

// source: README "Penjelajah Internet ... Starts with a synthesized Telkomnet Instan dial-up handshake."
test('@app:browser dial-up: Batal cancels, the steps run to "Terhubung", Lewati connects once', async ({ page }) => {
  await page.clock.install();
  await stubWayback(page);
  await toDesktop(page);
  await page.locator('.tray .vol').click(); // sound on: the handshake takes ~9 s
  await page.locator('.icon[data-app="browser"]').dblclick();
  const dial = page.getByRole('dialog', { name: 'Menghubungkan ke Telkomnet Instan' });
  await expect(dial.locator('.st')).toHaveText('Memanggil 080989999...');
  await dial.getByRole('button', { name: 'Batal' }).click();
  await expect(dial).toHaveCount(0);
  await page.clock.runFor(12_000);
  await expect(page.locator('.br-view')).toHaveCount(0); // cancelled: never connected

  await page.locator('.icon[data-app="browser"]').dblclick();
  await page.clock.runFor(8700);
  await expect(dial.locator('.st')).toHaveText('Terhubung pada 53.333 bps');
  await expect(dial.locator('.progress i')).toHaveAttribute('style', /width: 100%/);
  const skip = await dial.getByRole('button', { name: 'Lewati' }).elementHandle();
  await skip.click();
  await expect(page.locator('.br-view iframe')).toBeVisible();
  await expect(page.locator('.balloon')).toContainText('Terhubung ke Telkomnet Instan');
  await skip.evaluate((b) => b.click()); // a second click on the old dialog does nothing
  await page.clock.runFor(5000); // the handshake finishing later does not reconnect
  await expect(page.getByRole('dialog', { name: /Penjelajah Internet$/ })).toHaveCount(1);
});

// source: Kelvin request 2026-11-07 "subtly softsell" (portal → desktop app bridge is an allowlist) + AGENTS.md "Escape everything rendered"
test('@app:browser portal messages: search, links, allowlisted commands only, foreign messages ignored', async ({ page }) => {
  const { win, frame } = await setup(page);
  const portal = page.frameLocator('.br-view iframe');
  await portal.locator('#cari input[name=q]').fill('warnet bandung');
  await portal.locator('#cari button').click();
  await expect(frame).toHaveAttribute('src', `${WB}2001if_/http://www.google.com/search?q=warnet%20bandung`);
  await win.locator('[data-a="home"]').click();
  await portal.locator('#side a').first().click();
  await expect(frame).toHaveAttribute('src', /^https:\/\/web\.archive\.org\/web\/\d{4}if_\/http/);
  await win.locator('[data-a="home"]').click();
  await expect(portal.locator('#hits .card').first()).toBeVisible();
  await portal.locator('body').evaluate(() => {
    parent.postMessage({ type: 'cmd', cmd: 'about' }, location.origin); // not on the allowlist
    parent.postMessage(null, location.origin);
    parent.postMessage({ type: 'lain' }, location.origin);
  });
  await page.evaluate(() => window.postMessage({ type: 'nav', url: 'http://evil.example/', year: 2001 }, '*')); // not from the frame
  await page.waitForTimeout(200);
  await expect(page.getByRole('dialog', { name: 'System Properties' })).toHaveCount(0);
  await expect(frame).toHaveAttribute('src', 'home.html');
  await expect(portal.locator('#ctr')).toHaveText(/^\d{7}$/);
});

// source: README "Penjelajah Internet" (home.html is also a normal page outside the window)
test('@app:browser portal page opened on its own navigates through the Wayback Machine itself', async ({ page }) => {
  // 204 keeps the portal document in place, so we can see where each click tried to go.
  await page.route('https://web.archive.org/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('home.html');
  await expect(page.locator('#hits .card').first()).toBeVisible();
  await page.locator('.nav [data-cmd="contact"]').click(); // no desktop around: a plain "#" link
  await expect(page).toHaveURL(/home\.html#$/);
  const search = page.waitForRequest((r) => r.url().startsWith('https://web.archive.org/'));
  await page.locator('#cari input[name=q]').fill('friendster');
  await page.locator('#cari button').click();
  expect((await search).url()).toBe(`${WB}2001if_/http://www.google.com/search?q=friendster`);
  const link = page.waitForRequest((r) => r.url().startsWith('https://web.archive.org/'));
  await page.locator('#side a').first().click();
  expect((await link).url()).toMatch(/^https:\/\/web\.archive\.org\/web\/\d{4}if_\/http/);
  await expect(page.locator('#banner b')).toHaveText('PASANG IKLAN DI SINI!');
});

// source: Kelvin request 2026-11-10 "showcase real iconic indo game warnet" — the archived ragnarok.co.id 2004 page opened from the Ragnarok shrine replaced the whole warnet tab (frame-busting), ending the session
test('@app:browser an old site that frame-busts stays inside the browser window', async ({ page }) => {
  await page.route('https://web.archive.org/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>arsip</p><script>top.location.href = "https://example.com/busted";</script>' }));
  const { frame, go } = await setup(page);
  await expect(frame).toHaveAttribute('sandbox', /allow-scripts/);
  await expect(frame).not.toHaveAttribute('sandbox', /allow-top-navigation/);
  await go('ragnarok.co.id');
  await expect(page.frameLocator('.br-view iframe').locator('p')).toHaveText('arsip');
  await page.waitForTimeout(800);
  expect(page.url()).not.toContain('example.com');
  await expect(page.locator('.startbtn')).toBeVisible();
});
