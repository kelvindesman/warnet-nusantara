// The warnet billing client (own brand NusaBilling.Net, modelled on mid-2000s billing clients) on the lock screen: button panel, WS number, Time Warning.
import { test, expect, boot } from './fixtures.mjs';

const REF = 'Kelvin request 2026-11-08 "default look and feel should be make the copment as similar as teh original possible" (refs: x.com/KhoirulAksara/status/1705120079799783689, steamcommunity.com/sharedfiles/filedetails/?id=3039785799)';

async function toLock(page) {
  await page.clock.install();
  await boot(page);
  await page.locator('.bios').click();
  await expect(page.locator('.lock form.billing')).toBeVisible();
}

async function login(page) {
  await page.locator('.sticky').click();
  await page.locator('form.billing [type=submit]').click();
  await page.clock.runFor(10_000);
  await expect(page.locator('.desktop')).toBeVisible();
}

const secs = (t) => t.split(':').reduce((a, n) => a * 60 + Number(n), 0);

// source: REF + Kelvin request 2026-11-08 "use real BillingExplorer name", superseded by Kelvin request 2026-11-08 "our own branding agnostic ... not affiliated and dont want to be affiliated" — panel buttons Personal/Group/Game/Paket/Member/Pre-Paid/Admin ##/Panduan, Group/Game/Member greyed out, "WS - n" and the warnet name card
test('@app:boot billing client panel: buttons answer, disabled ones stay disabled, WS matches the PC', async ({ page }) => {
  await toLock(page);
  const lock = page.locator('.lock');
  await expect(lock.locator('.be-logo')).toHaveText(/NusaBilling\.Net\s*Client Pro 2006/);
  await expect(page.locator('body')).not.toContainText(/BillingExplorer|DeskPro|Bangsawan/); // own brand only, no vendor name
  await expect(lock.locator('.be-card h1')).toHaveText('Warnet Nusantara.Net');
  const pc = (await lock.locator('.billing .pc b').textContent()).replace('PC-', '');
  await expect(lock.locator('.be-wsn span')).toHaveText(pc.padStart(2, '0'));
  for (const k of ['group', 'game', 'member']) await expect(lock.locator(`[data-be="${k}"]`)).toBeDisabled();
  const err = lock.locator('.billing .err');
  await lock.locator('[data-be="personal"]').click();
  await expect(err).toContainText('Billing Personal harus dibuka mas operator');
  await lock.locator('[data-be="paket"]').click();
  await expect(err).toContainText('Paket malam Rp 10.000');
  await expect(lock.locator('table.tarif')).toHaveClass(/\bflash\b/);
  await lock.locator('[data-be="paket"]').click(); // flashing again restarts the animation
  await expect(lock.locator('table.tarif')).toHaveClass(/\bflash\b/);
  await lock.locator('[data-be="admin"]').click();
  await expect(err).toContainText('Khusus operator!');
  await lock.locator('[data-be="panduan"]').click();
  await expect(err).toContainText('klik kertas kuning');
  await lock.locator('[data-be="prepaid"]').click();
  await expect(err).toContainText('voucher Pre-Paid');
  await expect(lock.locator('form.billing [name=u]')).toBeFocused();
  await lock.locator('.be-btns').dispatchEvent('click'); // the gap between buttons does nothing
  await expect(err).toContainText('voucher Pre-Paid');
  await lock.locator('[data-new]').click();
  await expect(lock.locator('.be-wsn span')).toHaveText((await lock.locator('.billing .pc b').textContent()).replace('PC-', '').padStart(2, '0'));
});

// source: REF — "Time Warning: Tidak (No) / Menit 30 / Menit 60 / Menit [n]" picks when the billing warns before time runs out
test('@app:boot Time Warning "Tidak" never warns before time runs out', async ({ page }) => {
  await toLock(page);
  await page.getByRole('radio', { name: 'Tidak (No)' }).check();
  await login(page);
  const bill = page.locator('.taskbar .bill');
  await page.clock.fastForward((secs(await bill.textContent()) - 60) * 1000);
  await expect(bill).toHaveClass(/\blow\b/);
  await expect(page.getByText('Waktu kamu tinggal')).toHaveCount(0);
});

// source: REF — Time Warning "Menit 30"
test('@app:boot Time Warning "Menit 30" warns 30 minutes before time runs out', async ({ page }) => {
  await toLock(page);
  await page.getByRole('radio', { name: 'Menit 30' }).check();
  await login(page);
  const bill = page.locator('.taskbar .bill');
  await page.clock.fastForward((secs(await bill.textContent()) - 31 * 60) * 1000);
  await expect(page.getByText('Waktu kamu tinggal')).toHaveCount(0);
  await page.clock.fastForward(90_000);
  await expect(page.locator('.balloon')).toContainText('Waktu kamu tinggal 30 menit!');
});

// source: REF — Time Warning "Menit [n]" custom box; typing in it selects that option
test('@app:boot Time Warning custom minutes: typing selects it, junk means no warning', async ({ page }) => {
  await toLock(page);
  const box = page.getByRole('spinbutton', { name: 'Menit peringatan' });
  await page.getByRole('radio', { name: 'Menit 60' }).check();
  await box.fill('45');
  await expect(page.locator('[name=tw][value=x]')).toBeChecked();
  await box.fill('');
  await login(page);
  const bill = page.locator('.taskbar .bill');
  await page.clock.fastForward((secs(await bill.textContent()) - 60) * 1000);
  await expect(page.getByText('Waktu kamu tinggal')).toHaveCount(0);
});

// source: Kelvin request 2026-11-08 "the dolphin is crap why cant we use real dolphin image" (screenshot of the lock screen)
test('@app:boot lock wallpaper is a real dolphin photo that loads from the repo', async ({ page }) => {
  await toLock(page);
  const sea = page.locator('.lock .sea');
  await expect(sea).toHaveAttribute('role', 'img');
  const bg = await sea.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toMatch(/img\/lock-dolphins\.jpg/);
  const size = await page.evaluate((u) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok(null); i.src = u; }), bg.match(/url\("?([^")]+)"?\)/)[1]);
  expect(size[0]).toBeGreaterThanOrEqual(1000);
});

// source: Kelvin request 2026-11-08 "the dolphin doesnt show its face" (screenshot of the lock screen showing only a dorsal fin), then "use this wallpaper" (moonlit lagoon dolphin, rebuilt from free material), then "dolphine looks dying", then owner decision 2026-11-10: use the original lock-screen photo (third-party, see CREDITS.md; moon moved right so it clears the header)
test('@app:boot lock wallpaper dolphin shows its face, clear of the billing UI on desktop and phone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toLock(page);
  // eye and snout tip of the dolphin in the 2880x2160 wallpaper
  const face = [[1792, 1581], [2067, 1608]];
  for (const [w, h] of [[1366, 768], [1920, 1080], [1280, 720], [1440, 900], [390, 844], [800, 1100]]) {
    await page.setViewportSize({ width: w, height: h });
    const hits = await page.locator('.lock .sea').evaluate((sea, pts) => {
      const r = sea.getBoundingClientRect(), cs = getComputedStyle(sea);
      // background-size is "<w>% auto" (desktop) or "auto <h>%" (phones, portrait)
      const byW = /^([\d.]+)% auto$/.exec(cs.backgroundSize), byH = /^auto ([\d.]+)%$/.exec(cs.backgroundSize);
      const k = byW ? r.width * Number(byW[1]) / 100 / 2880 : r.height * Number(byH[1]) / 100 / 2160, bw = 2880 * k, bh = 2160 * k;
      const ox = (r.width - bw) * parseFloat(cs.backgroundPositionX) / 100, oy = (r.height - bh) * parseFloat(cs.backgroundPositionY) / 100;
      return pts.map(([x, y]) => {
        const sx = r.left + ox + x * k, sy = r.top + oy + y * k;
        const top = document.elementFromPoint(sx, sy);
        return sx >= 0 && sy >= 0 && sx < innerWidth && sy < innerHeight && top === sea;
      });
    }, face);
    expect(hits, `${w}x${h}`).toEqual([true, true]);
  }
  // the eye is really there: the darkest pixel around it is far darker than open lagoon (a fin-only sea has none)
  const eye = await page.evaluate(() => new Promise((ok) => {
    const i = new Image();
    i.onload = () => {
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(i, 0, 0);
      const d = g.getImageData(1765, 1555, 54, 54).data; let min = 255;
      for (let n = 0; n < d.length; n += 4) min = Math.min(min, (d[n] + d[n + 1] + d[n + 2]) / 3);
      ok([i.naturalWidth, i.naturalHeight, min]);
    };
    i.src = 'img/lock-dolphins.jpg';
  }));
  expect(eye.slice(0, 2)).toEqual([2880, 2160]);
  expect(eye[2]).toBeLessThan(70);
});

// source: Kelvin screenshot 2026-11-08 of the lock screen: Chrome autofilled a saved personal email and password into the voucher form
test('@app:boot voucher fields opt out of browser password autofill', async ({ page }) => {
  await toLock(page);
  for (const n of ['u', 'p']) await expect(page.locator(`form.billing [name=${n}]`)).toHaveAttribute('autocomplete', 'one-time-code');
});
