// Operator corner: donations, contact → GitHub issues, job ad, supporters everywhere, telemetry.
import { test, expect, boot, toDesktop, openBrowser } from './fixtures.mjs';

const LINKS = {
  site: 'https://warnet-nusantara.pages.dev/',
  repo: 'https://github.com/kelvindesman/warnet-nusantara',
  discord: '', goatcounter: '', contactEmail: '',
  donate: { trakteer: '', saweria: '', githubSponsors: '', buyMeACoffee: '' },
};
const SUPPORTERS = [
  { name: 'Budi', tier: 'malam', platform: 'trakteer', date: '2026-11-05', message: 'kangen main RO di warnet!' },
  { name: '<img src=x onerror=alert(1)>', tier: 'jam', platform: 'saweria', date: '2026-11-04', message: '<b>xss</b>' },
  { name: 'Toko Disket Jaya', tier: 'iklan', platform: 'githubSponsors', date: '2026-11-01', message: 'Disket 1.44MB murah', url: 'https://example.com/disket' },
  { name: 'Rahasia', tier: 'vip', platform: 'manual', date: '2026-11-06', hidden: true },
];
const withData = async (page, { links = LINKS, supporters } = {}) => {
  await page.route('**/data/links.json', (r) => r.fulfill({ json: links }));
  if (supporters) await page.route('**/data/supporters.json', (r) => r.fulfill({ json: supporters }));
};
const startItem = async (page, name) => {
  await page.locator('.startbtn').click();
  await page.locator('.startmenu .sm-item', { hasText: name }).click();
};

// source: Kelvin request 2026-11-07 "look for maintainer ... subtly softsell inside the web page"
test('@app:lowongan billing screen job ad and desktop LOWONGAN_OPERATOR.txt', async ({ page }) => {
  await boot(page);
  await page.locator('.bios').click();
  await expect(page.locator('.lowongan')).toHaveAttribute('href', /\/blob\/main\/MAINTAINERS\.md$/);
  await expect(page.locator('.lock .ticker')).toContainText('Jadilah pendukung pertama');
  await toDesktop(page);
  await page.locator('.icon[data-app="lowongan"]').dblclick();
  await expect(page.locator('textarea.notepad')).toHaveValue(/DICARI: OPERATOR SHIFT MALAM/);
  await expect(page.locator('textarea.notepad')).toHaveValue(/10 PR diterima -> Operator/);
});

// source: Kelvin request 2026-11-07 "donation model" + "support github sponsor and buymeacoffee"
test('@app:donate Dukung Warnet Ini lists 4 platforms as "segera hadir" until configured', async ({ page }) => {
  await withData(page);
  await toDesktop(page);
  await startItem(page, 'Dukung Warnet Ini');
  const win = page.locator('.win', { hasText: 'Dukung Warnet Ini' });
  await expect(win.locator('.op-pay')).toHaveCount(4);
  await expect(win.locator('.op-pay.off')).toHaveCount(4);
  await expect(win.locator('.op-tiers tr')).toHaveCount(4);
  await expect(win).toContainText('Minimal Rp 5.000 / $3');
});

// source: Kelvin request 2026-11-08 "https://trakteer.id/account clickops setup here https://studio.buymeacoffee.com/dashboard https://saweria.co/admin"; Kelvin 2026-11-08 "Saweria done"
test('@app:donate the shipped links.json opens the real Trakteer, Saweria and Buy Me a Coffee pages', async ({ page }) => {
  await toDesktop(page);
  await startItem(page, 'Dukung Warnet Ini');
  const win = page.locator('.win', { hasText: 'Dukung Warnet Ini' });
  await expect(win.locator('a.op-pay[data-pay="trakteer"]')).toHaveAttribute('href', 'https://trakteer.id/kelvin_desman');
  await expect(win.locator('a.op-pay[data-pay="buyMeACoffee"]')).toHaveAttribute('href', 'https://buymeacoffee.com/kelvindsmn');
  await expect(win.locator('a.op-pay[data-pay="saweria"]')).toHaveAttribute('href', 'https://saweria.co/kelvindesman');
  await expect(win.locator('a.op-pay[data-pay="trakteer"]')).toHaveAttribute('rel', /noopener/);
  await expect(win.locator('.op-pay.off')).toHaveCount(1); // GitHub Sponsors: segera hadir
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  await expect(page.locator('.lock .paylink')).toHaveAttribute('href', 'https://trakteer.id/kelvin_desman'); // first configured platform
});

// source: Kelvin request 2026-11-08 "can this without leaving page?" + "opensource icon?" (answers 2026-11-08: Buy Me a Coffee in a warnet window, Trakteer/Saweria in a popup, own icon per button)
test('@app:donate pay buttons carry their own icons; Buy Me a Coffee opens in a window, Trakteer and Saweria in a popup', async ({ page }) => {
  await page.route('https://www.buymeacoffee.com/widget/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>Buy Kelvin a coffee</p>' }));
  await toDesktop(page);
  await page.evaluate(() => { window.__open = []; window.open = (...a) => { window.__open.push(a); return null; }; });
  await startItem(page, 'Dukung Warnet Ini');
  const win = page.locator('.win', { hasText: 'Dukung Warnet Ini' });
  for (const [id, grad] of [['trakteer', null], ['saweria', 'gW'], ['githubSponsors', 'gH'], ['buyMeACoffee', 'gK']]) {
    const svg = win.locator(`[data-pay="${id}"] svg`);
    await expect(svg).toHaveCount(1);
    if (grad) await expect(svg.locator('linearGradient')).toHaveAttribute('id', new RegExp(`^${grad}`));
  }
  await win.locator('a[data-pay="trakteer"]').click();
  await win.locator('a[data-pay="saweria"]').click();
  await expect.poll(() => page.evaluate(() => window.__open)).toEqual([
    ['https://trakteer.id/kelvin_desman', 'warnet-pay', 'popup,noopener,width=480,height=760'],
    ['https://saweria.co/kelvindesman', 'warnet-pay', 'popup,noopener,width=480,height=760'],
  ]);
  await expect(page.locator('.desktop')).toBeVisible(); // still on the warnet
  await win.locator('a[data-pay="buyMeACoffee"]').click();
  const bmc = page.locator('.win', { hasText: 'International, one-off' }).filter({ has: page.locator('iframe') });
  await expect(bmc.locator('iframe')).toHaveAttribute('src', 'https://www.buymeacoffee.com/widget/page/kelvindsmn?color=%23FFDD00');
  await expect(page.frameLocator('iframe[title="Buy Me a Coffee"]').getByText('Buy Kelvin a coffee')).toBeVisible();
  await bmc.getByRole('button', { name: 'Tab baru' }).click();
  await expect.poll(() => page.evaluate(() => window.__open.length)).toBe(3);
  expect((await page.evaluate(() => window.__open))[2]).toEqual(['https://buymeacoffee.com/kelvindsmn', '_blank', 'noopener']);
});

// source: Kelvin request 2026-11-08 "cta should be support donation project etc, also include shortcut one click fork or star the rpoject to support coment raise issue if you found any"
test('@app:donate Dukung Warnet Ini: free one-click Star, Fork and bug report links above the donation platforms', async ({ page }) => {
  await toDesktop(page);
  const ic = page.locator('.desktop .icons .icon[data-app="donate"]');
  await expect(ic).toHaveText('Dukung Warnet Ini');
  await startItem(page, 'Dukung Warnet Ini');
  await expect(page.locator('.startmenu')).toHaveCount(0);
  const win = page.locator('.win', { hasText: 'Dukung Warnet Ini' });
  const repo = await page.evaluate(async () => (await (await fetch('data/links.json')).json()).repo);
  await expect(win.locator('[data-free="star"]')).toHaveAttribute('href', repo);
  await expect(win.locator('[data-free="fork"]')).toHaveAttribute('href', `${repo}/fork`);
  const issue = new URL(await win.locator('[data-free="issue"]').getAttribute('href'));
  expect(issue.origin + issue.pathname).toBe(`${repo}/issues/new`);
  expect(issue.searchParams.get('template')).toBe('bug.yml');
  for (const a of await win.locator('.op-act').all()) { await expect(a).toHaveAttribute('target', '_blank'); await expect(a).toHaveAttribute('rel', 'noopener'); }
});

// source: Kelvin request 2026-11-07 "Saweria/Trakteer ... also support github sponsor and buymeacoffee"
test('@app:donate configured platforms become real links (https only)', async ({ page }) => {
  await withData(page, { links: { ...LINKS, donate: { trakteer: 'https://trakteer.id/warnet', saweria: 'javascript:alert(1)', githubSponsors: 'https://github.com/sponsors/warnet', buyMeACoffee: '' } } });
  await toDesktop(page);
  await startItem(page, 'Dukung Warnet Ini');
  await expect(page.locator('a.op-pay[data-pay="trakteer"]')).toHaveAttribute('href', 'https://trakteer.id/warnet');
  await expect(page.locator('a.op-pay[data-pay="githubSponsors"]')).toHaveAttribute('href', 'https://github.com/sponsors/warnet');
  await expect(page.locator('.op-pay.off')).toHaveCount(2); // saweria (unsafe URL rejected) + BMC (empty)
});

// source: Kelvin request 2026-11-07 "if any inquiry from the web automatically create issue on the github repo"
test('@app:contact Hubungi Operator links prefill GitHub issue forms; Discord placeholder', async ({ page }) => {
  await toDesktop(page);
  await startItem(page, 'Hubungi Operator');
  const links = page.locator('[data-contact]');
  await expect(links).toHaveCount(5);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const [i, t] of ['bug', 'usul-situs', 'usul-game', 'kenangan', 'kerja-sama'].entries()) {
    const u = new URL(hrefs[i]);
    expect(u.origin + u.pathname).toBe(`${LINKS.repo}/issues/new`);
    expect(u.searchParams.get('template')).toBe(`${t}.yml`);
    expect(u.searchParams.get('labels')).toBe('from-web');
    expect(u.searchParams.get('body')).toContain('Info otomatis dari warnet');
  }
  await expect(page.locator('.op-soon')).toHaveText('Discord — segera hadir');
});

// source: Kelvin request 2026-11-07 "add discord placeholder"
test('@app:contact Discord link appears once configured', async ({ page }) => {
  await withData(page, { links: { ...LINKS, discord: 'https://discord.gg/warnet' } });
  await toDesktop(page);
  await startItem(page, 'Hubungi Operator');
  await expect(page.locator('a[data-contact="discord"]')).toHaveAttribute('href', 'https://discord.gg/warnet');
});

// source: Kelvin request 2026-11-07 "show supporter name donation everywhere ... message ... running text"
test('@app:kontributor supporters show in ticker, KONTRIBUTOR.txt and About; HTML is never executed; hidden skipped', async ({ page }) => {
  await withData(page, { supporters: SUPPORTERS });
  let alerted = false;
  page.on('dialog', (d) => { alerted = true; d.dismiss(); });
  await boot(page);
  await page.locator('.bios').click();
  const ticker = page.locator('.lock .ticker');
  await expect(ticker).toContainText('Terima kasih Budi (Paket Malam): "kangen main RO di warnet!"');
  await expect(ticker).toContainText('<img src=x onerror=alert(1)>'); // shown as text
  await expect(ticker).not.toContainText('Rahasia');
  await expect(page.locator('.lock img')).toHaveCount(0);

  await toDesktop(page);
  await page.locator('.icon[data-app="kontributor"]').dblclick();
  const np = page.locator('textarea.notepad');
  await expect(np).toHaveValue(/\[Pasang Iklan\]\n- Toko Disket Jaya — "Disket 1.44MB murah"/);
  await expect(np).toHaveValue(/- Kelvin \(owner\)/);
  await expect(np).not.toHaveValue(/Rahasia/);

  await page.getByRole('dialog', { name: 'KONTRIBUTOR.txt - Notepad' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog', { name: 'KONTRIBUTOR.txt - Notepad' })).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('launch', { detail: 'about' })));
  const about = page.locator('.win', { hasText: 'System Properties' });
  await expect(about).toContainText('3 pendukung');
  await expect(about).toContainText('Operator:Kelvin');
  await expect(about).toContainText('Tidak berafiliasi');
  await about.locator('[data-go="kontributor"]').click();
  await expect(page.getByRole('dialog', { name: 'KONTRIBUTOR.txt - Notepad' })).toBeVisible();
  expect(alerted).toBe(false);
});

// source: Kelvin request 2026-11-07 "donation model" (Log Off line "bayar ke mas operator" becomes a real link)
test('@app:donate Log Off and Turn Off screens link to supporting the operator', async ({ page }) => {
  await withData(page); // no platform configured: falls back to the README section
  await toDesktop(page);
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  await expect(page.locator('.lock .paylink')).toHaveAttribute('href', `${LINKS.repo}#support-the-operator`);
  await toDesktop(page);
  await page.locator('.startbtn').click();
  await page.locator('[data-p="off"]').click();
  await page.locator('[data-s="off"]').click();
  const pay = page.locator('.bye .paylink');
  await expect(pay).toBeVisible();
  await expect(pay).toHaveAttribute('href', `${LINKS.repo}#support-the-operator`);
  await expect(pay).toHaveAttribute('target', '_blank');
  await pay.evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
  await expect(page.locator('.bye')).toBeVisible(); // clicking the link did not reboot
  await page.locator('.bye').click();
  await expect(page.locator('.bios')).toBeVisible();
});

// source: Kelvin request 2026-11-07 "subtly softsell inside the web page" (portal banner + contact)
test('@app:browser portal shows supporters ticker, sponsor banner, and opens donate/contact windows', async ({ page }) => {
  await toDesktop(page);
  await openBrowser(page);
  const portal = page.frameLocator('.br-view iframe');
  await expect(portal.locator('#ticker')).toContainText('Jadilah pendukung pertama');
  await expect(portal.locator('#banner b')).toHaveText('PASANG IKLAN DI SINI!');
  await portal.locator('#banner').click();
  await expect(page.locator('.win', { hasText: 'Dukung Warnet Ini' })).toBeVisible();
  await portal.locator('.uc a[data-cmd="contact"]').click();
  await expect(page.locator('.win', { hasText: 'Hubungi Operator' })).toBeVisible();
});

// source: Kelvin request 2026-11-07 "subtly softsell" (paying sponsor gets the 468x60 banner)
test('@app:browser portal banner shows a paying sponsor with its https link', async ({ page }) => {
  await withData(page, { supporters: SUPPORTERS });
  await toDesktop(page);
  await openBrowser(page);
  const banner = page.frameLocator('.br-view iframe').locator('#banner');
  await expect(banner.locator('b')).toHaveText('Toko Disket Jaya');
  await expect(banner).toHaveAttribute('href', 'https://example.com/disket');
  await expect(banner).not.toHaveAttribute('data-cmd', /.*/);
});

// source: Kelvin request 2026-11-07 "can we collect anonymous telemetry" (cookieless, off unless configured, honours DNT)
test('@app:stats GoatCounter counts boot/login/app events only when configured', async ({ page }) => {
  await withData(page, { links: { ...LINKS, goatcounter: 'https://warnet.goatcounter.com/count' } });
  await page.route('https://gc.zgo.at/count.js', (r) => r.fulfill({
    contentType: 'text/javascript',
    body: 'window.__gc = []; window.goatcounter.count = (v) => window.__gc.push(v.path);',
  }));
  await toDesktop(page);
  await page.locator('.icon[data-app="ranjau"]').dblclick();
  await expect.poll(() => page.evaluate(() => window.__gc)).toEqual(['boot', 'app:ranjau']);
  const cookies = await page.context().cookies();
  expect(cookies).toEqual([]);
});

// source: Kelvin request 2026-11-07 "anonymous telemetry" (privacy: off without config); the live
// data/links.json has a GoatCounter code since 2026-11-10, so this stubs an unconfigured copy
test('@app:stats no analytics script is requested when not configured', async ({ page, external }) => {
  await withData(page);
  await toDesktop(page);
  await page.locator('.icon[data-app="ranjau"]').dblclick();
  await page.waitForTimeout(200);
  expect(external.filter((u) => u.includes('goatcounter') || u.includes('gc.zgo.at'))).toEqual([]);
});

// source: Kelvin request 2026-11-07 SEO plan "per-app deep links /#app=" so shares land on the fun part
test('@app:boot #app=<id> deep link opens that app on the desktop', async ({ page }) => {
  await boot(page, '', '#app=ranjau');
  await expect(page.locator('.win', { hasText: 'Ranjau' })).toBeVisible();
});

// source: Kelvin request 2026-11-08 "is dollar account?or a good supporter opensource icon boost anyone nudge encourage to click or something" (screenshot of the dolphin "Support this Project" icon)
test('@app:donate the desktop support icon is a beating supporter heart, still under reduced motion', async ({ page }) => {
  await toDesktop(page);
  const heart = page.locator('.icons > .icon[data-app="donate"] svg');
  await expect(heart.locator('path[fill="url(#gH)"], path[fill^="url(#gH"]')).toHaveCount(1);
  expect(await heart.evaluate((e) => getComputedStyle(e).animationName)).toBe('heartbeat');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await heart.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await page.locator('.icons > .icon[data-app="donate"]').dblclick();
  await expect(page.locator('.win', { hasText: 'Dukung Warnet Ini' }).locator('.titlebar svg path[fill^="url(#gH"]')).toHaveCount(1);
});
