// UI language: Indonesian or English, picked from ?lang=, then the saved choice,
// then the browser's languages, then English. Switchable on the lock screen and
// in Display Properties.
import { test, expect, boot, toDesktop } from './fixtures.mjs';

const REQ = 'Kelvin request 2026-11-08 "support multi language translation ebst practices english or indonesia read devices default"';

async function toLock(page, query = '') {
  await boot(page, query);
  await page.locator('.bios').click();
  await expect(page.locator('.lock form.billing')).toBeVisible();
}

async function login(page) {
  await page.locator('.sticky').click();
  await page.locator('form.billing [type=submit]').click();
  await expect(page.locator('.desktop')).toBeVisible();
}

const lang = (page) => page.evaluate(() => document.documentElement.lang);

/** Click a language button and follow the reload it starts. The app's own navigation
 *  is answered with 204 (the browser keeps the page, so its coverage counters survive),
 *  then the same URL is loaded with page.goto, which collects coverage first. The request
 *  carries no #fragment, so the caller names the screen hash; tests that click without
 *  this helper check the real reload, hash included. */
async function switchLang(page, button, hash) {
  let target = null;
  const hold = (route) => {
    if (target || !route.request().isNavigationRequest()) return route.fallback();
    target = route.request().url();
    return route.fulfill({ status: 204 });
  };
  const match = (u) => u.searchParams.has('lang');
  await page.route(match, hold);
  await button.click();
  await expect.poll(() => target).not.toBeNull();
  await page.unroute(match, hold);
  await page.goto(target + hash);
}

test.describe('Indonesian device', () => {
  test.use({ locale: 'id-ID' });

  // source: REQ ("read devices default": an Indonesian browser gets Indonesian)
  test('@app:boot id-ID browser gets the Indonesian lock screen and desktop', async ({ page }) => {
    await toLock(page);
    expect(await lang(page)).toBe('id');
    const lock = page.locator('.lock');
    await expect(lock.locator('form.billing [type=submit]')).toHaveText('Masuk');
    await expect(lock.locator('.billing .status')).toHaveText('● TERKUNCI');
    await expect(lock.locator('[data-lang="id"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(lock.locator('[data-lang="en"]')).toHaveAttribute('aria-pressed', 'false');
    await lock.locator('[data-lang="id"]').click(); // already active: stays put
    await expect(lock.locator('[data-lang="id"]')).toHaveAttribute('aria-pressed', 'true');
    await lock.locator('.be-lang').dispatchEvent('click'); // the gap between the buttons does nothing
    await login(page);
    await page.locator('.startbtn').click();
    await expect(page.locator('.startmenu')).toContainText('Dukung Warnet Ini');
  });

  // source: REQ (the ID | EN toggle switches and the choice survives a reload and a fresh visit)
  test('@app:boot lock-screen EN toggle switches to English and the choice persists', async ({ page }) => {
    await toLock(page);
    await page.locator('.lock [data-lang="en"]').click(); // the real reload
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Log in');
    await expect(page).toHaveURL(/[?&]lang=en(&|#|$)/);
    await expect(page).toHaveURL(/#lock$/);
    expect(await lang(page)).toBe('en');
    await expect(page.locator('.lock [data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Log in');
    await toLock(page); // a fresh visit without ?lang= still remembers English
    expect(await lang(page)).toBe('en');
    await expect(page.locator('.lock .billing .status')).toHaveText('● LOCKED');
    await switchLang(page, page.locator('.lock [data-lang="id"]'), '#lock');
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Masuk');
    expect(await lang(page)).toBe('id');
  });

  // source: REQ (?lang= beats the device language)
  test('@app:boot ?lang=en overrides an Indonesian browser', async ({ page }) => {
    await toLock(page, 'lang=en');
    expect(await lang(page)).toBe('en');
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Log in');
  });
});

test.describe('English device', () => {
  test.use({ locale: 'en-US' });

  // source: REQ (an English browser gets English: lock screen, Start menu, Game Warnet, a msgbox, Log Off, html lang)
  test('@app:boot en-US browser gets English lock screen, Start menu, Game Warnet, msgbox and Log Off', async ({ page }) => {
    await toLock(page);
    expect(await lang(page)).toBe('en');
    const lock = page.locator('.lock');
    await expect(lock.locator('.billing .status')).toHaveText('● LOCKED');
    await expect(lock.locator('[data-new]')).toHaveText('New voucher');
    await expect(lock.locator('.sticky')).toContainText('Voucher from the operator:');
    await expect(lock.locator('.marquee:not(.thanks)')).toContainText('Welcome to WARNET NUSANTARA.NET');
    await expect(lock.locator('[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
    await lock.locator('[data-be="panduan"]').click();
    await expect(lock.locator('.billing .err')).toContainText('Guide: click the yellow note');
    await lock.locator('[data-new]').click();
    await expect(lock.locator('.billing .err')).toHaveText('New voucher printed. Check the yellow note.');
    await expect(lock.locator('.pkg')).toHaveText(/^(1 Hour|2 Hours|3-Hour Package|Night Package) · Rp /);
    await login(page);
    await expect(page.locator('.welcome, .desktop').first()).toBeVisible();
    await expect(page.locator('.icon[data-app="browser"] span')).toHaveText('Internet Browser');
    await expect(page.locator('.balloon')).toContainText('Double-click Internet Browser', { timeout: 5000 });

    await page.locator('.startbtn').click();
    const sm = page.locator('.startmenu');
    await expect(sm).toContainText('Take a trip back to 2001');
    await expect(sm).toContainText('Support this Project');
    await expect(sm).toContainText('Contact the Operator');
    await page.locator('.startbtn').click();

    await page.locator('.icon[data-app="games"]').dblclick();
    const win = page.getByRole('dialog', { name: 'Game Warnet' });
    await expect(win.locator('.group').first()).toHaveText('Built in');
    await expect(win.locator('.fp-disc')).toContainText('Fan-made port, NOT official.');
    await expect(win.locator('.fp-disc')).toContainText('not affiliated with, not endorsed by, and does not host this game');
    await expect(win.locator('.statusbar .st')).toHaveText(/^\d+ objects$/);
    await win.locator('[data-g="ranjau"]').click();
    await expect(win.locator('.statusbar .st')).toHaveText('Mine sweeping, built into every warnet PC');
    await win.getByRole('button', { name: 'Close' }).click();

    await page.locator('.taskbar .bill').click();
    const box = page.getByRole('dialog', { name: 'Billing' });
    await expect(box).toContainText('Package:');
    await box.getByRole('button', { name: 'Add 1 hour' }).click();
    await expect(page.locator('.balloon')).toContainText('MAS, ONE MORE HOUR!');

    await page.locator('.startbtn').click();
    await page.locator('[data-p="logoff"]').click();
    await expect(page.locator('.lock .msg')).toContainText('Please pay');
    await expect(page.locator('.lock .msg')).toContainText('Share your warnet session:');
  });

  // source: REQ (Display Properties offers the language too; switching keeps you on the desktop)
  test('@app:display language choice in Display Properties switches to Indonesian', async ({ page }) => {
    await toDesktop(page);
    expect(await lang(page)).toBe('en');
    await page.locator('.icon[data-app="computer"]').dblclick();
    await page.getByRole('dialog', { name: 'My Computer' }).locator('[data-go="display"]').click();
    const dp = page.getByRole('dialog', { name: 'Display Properties' });
    await expect(dp).toContainText('Pick a wallpaper');
    const en = dp.getByRole('button', { name: 'English' });
    await expect(en).toHaveAttribute('aria-pressed', 'true');
    await en.click(); // already active
    await dp.getByRole('button', { name: 'Bahasa Indonesia' }).click(); // the real reload
    await expect(page.locator('.desktop')).toBeVisible();
    await expect(page).toHaveURL(/[?&]lang=id(&|#)/);
    await expect(page).toHaveURL(/#desktop$/);
    expect(await lang(page)).toBe('id');
    await expect(page.locator('.icon[data-app="browser"] span')).toHaveText('Penjelajah Internet');
    await page.locator('.icon[data-app="computer"]').dblclick();
    await page.getByRole('dialog', { name: 'My Computer' }).locator('[data-go="display"]').click();
    const dp2 = page.getByRole('dialog', { name: 'Display Properties' });
    await expect(dp2).toContainText('Pilih wallpaper');
    await expect(dp2.getByRole('button', { name: 'Bahasa Indonesia' })).toHaveAttribute('aria-pressed', 'true');
    // after the real reload, so coverage of this page survives (switchLang keeps it)
    await dp2.locator('.dp-lang').dispatchEvent('click'); // the label, not a button
    await expect(dp2).toBeVisible();
    await switchLang(page, dp2.getByRole('button', { name: 'English' }), '#desktop');
    await expect(page.locator('.icon[data-app="browser"] span')).toHaveText('Internet Browser');
  });

  // source: REQ (?lang= beats a saved choice and the device language)
  test('@app:boot ?lang=id overrides an English browser and a saved English choice', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('lang', 'en'); } catch {} });
    await toLock(page, 'lang=id');
    expect(await lang(page)).toBe('id');
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Masuk');
  });

  // source: REQ (English demo captions come from demo.json caption_en)
  test('@app:demo Kilas Balik shows English captions and end card', async ({ page }) => {
    test.setTimeout(60_000);
    await boot(page, 'demo&speed=10');
    await expect(page.locator('.demo-skip')).toHaveText('Skip ⏭');
    await expect(page.locator('.demo-text')).toHaveText(/^The year is 2003/);
    const end = page.getByRole('dialog', { name: 'Flashback finished' });
    await expect(end).toBeVisible({ timeout: 30_000 });
    await expect(end).toContainText('Remember all this?');
    await end.locator('[data-end="enter"]').click();
    await expect(page.locator('.desktop')).toBeVisible();
  });

  // source: REQ (the portal page inside the browser follows the language)
  test('@app:browser portal home page copy is English for English visitors', async ({ page }) => {
    await page.goto('home.html');
    expect(await lang(page)).toBe('en');
    await expect(page.locator('.hot')).toHaveText('★ The Hottest Sites at the Warnet ★');
    await expect(page.locator('#cari input')).toHaveAttribute('placeholder', 'Search Google 2001...');
    await expect(page.locator('#tips')).toContainText('Pages come from the Internet Archive');
  });
});

test.describe('Other device languages', () => {
  test.use({ locale: 'fr-FR' });

  // source: REQ (neither Indonesian nor English: fall back to English)
  test('@app:boot fr-FR browser falls back to English', async ({ page }) => {
    await toLock(page);
    expect(await lang(page)).toBe('en');
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Log in');
  });

  // source: REQ (private mode: storage throws; the choice still switches via the URL)
  test('@app:boot language switch works when localStorage throws (private mode)', async ({ page }) => {
    await page.addInitScript(() => {
      const no = () => { throw new DOMException('blocked', 'SecurityError'); };
      Storage.prototype.getItem = no; Storage.prototype.setItem = no;
    });
    await toLock(page);
    expect(await lang(page)).toBe('en');
    await switchLang(page, page.locator('.lock [data-lang="id"]'), '#lock');
    await expect(page.locator('.lock form.billing [type=submit]')).toHaveText('Masuk');
    expect(await lang(page)).toBe('id');
  });
});

// source: REQ (toggle "must not overlap anything at 390px and 1440px widths")
for (const [width, height] of [[390, 844], [1440, 900]]) {
  for (const locale of ['id-ID', 'en-US']) {
    test.describe(`${width}px ${locale}`, () => {
      test.use({ locale, viewport: { width, height } });
      test(`@app:boot ID | EN toggle fits without overlapping at ${width}px (${locale})`, async ({ page }) => {
        await toLock(page);
        const box = async (sel) => page.locator(sel).first().boundingBox();
        const sw = await box('.lock .be-lang');
        expect(sw.x).toBeGreaterThanOrEqual(0);
        expect(sw.x + sw.width).toBeLessThanOrEqual(width);
        const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        for (const sel of ['.lock .be-btns', '.lock .be-wsn', '.lock .be-ws label', '.lock .be-banner', '.lock form.billing', '.lock .sticky', '.lock .lowongan']) {
          const other = await box(sel);
          if (other) expect(hit(sw, other), `${sel} overlaps the language switch`).toBe(false);
        }
        const panel = await box('.lock .be-panel');
        expect(sw.x >= panel.x && sw.x + sw.width <= panel.x + panel.width && sw.y >= panel.y && sw.y + sw.height <= panel.y + panel.height).toBe(true);
      });
    });
  }
}
