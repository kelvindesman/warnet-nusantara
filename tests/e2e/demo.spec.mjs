// "Kilas Balik 60 detik" attract mode.
import { test, expect, boot } from './fixtures.mjs';

// source: Kelvin request 2026-11-07 "include quick killer attractive demo bringback indonesia old generation memories"
test('@app:demo plays every beat with captions and ends on the share card', async ({ page }) => {
  test.setTimeout(60_000);
  // Record every caption the demo shows (they change faster than polling at speed=10).
  await page.addInitScript(() => {
    window.__caps = [];
    new MutationObserver(() => {
      const t = document.querySelector('.demo-text')?.textContent;
      if (t && window.__caps.at(-1) !== t) window.__caps.push(t);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await boot(page, 'demo&speed=10');
  await expect(page.getByRole('dialog', { name: /Instant Message/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ym .buzz').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('dialog', { name: /IRC Chat/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.lock')).toContainText('WAKTU HABIS', { timeout: 15_000 });
  const end = page.getByRole('dialog', { name: 'Kilas Balik selesai' });
  await expect(end).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.demo')).toHaveCount(0);
  const expected = (await (await page.request.get('data/demo.json')).json()).beats.map((b) => b.caption).filter(Boolean);
  expect(await page.evaluate(() => window.__caps)).toEqual(expected);
  const shares = await end.locator('[data-share]').evaluateAll((as) => as.map((a) => a.href));
  expect(shares).toHaveLength(4);
  for (const h of shares) expect(decodeURIComponent(h)).toContain('utm_campaign=demo');
  await end.locator('[data-end="enter"]').click();
  await expect(end).toHaveCount(0);
  await expect(page.locator('.desktop')).toBeVisible();
});

// source: Kelvin request 2026-11-07 killer demo (plan: "Any key/click skips to interactive desktop")
test('@app:demo any key skips to the desktop and the BIOS never comes back', async ({ page }) => {
  await boot(page, 'demo&speed=10');
  await expect(page.locator('.demo-text')).toContainText('Tahun 2003');
  await page.keyboard.press('Space');
  await expect(page.locator('.desktop')).toBeVisible();
  await expect(page.locator('.demo')).toHaveCount(0);
  await page.waitForTimeout(4000); // longer than the BIOS would have taken
  await expect(page.locator('.desktop')).toBeVisible();
  await expect(page.locator('.lock, .bios')).toHaveCount(0);
});

// source: Kelvin request 2026-11-07 killer demo ("▶ Tonton Kilas Balik" button on the billing screen)
test('@app:demo billing-screen button starts the demo; Lewati button skips; end card can open donate', async ({ page }) => {
  test.setTimeout(60_000);
  await boot(page, 'speed=10');
  await page.locator('.bios').click();
  await page.locator('[data-demo]').click();
  await expect(page.locator('.demo-text')).toContainText('Tahun 2003');
  await page.locator('.demo-skip').click();
  await expect(page.locator('.desktop')).toBeVisible();

  await boot(page, 'demo&speed=10');
  const end = page.getByRole('dialog', { name: 'Kilas Balik selesai' });
  await expect(end).toBeVisible({ timeout: 45_000 });
  await end.locator('[data-share="whatsapp"]').evaluate((a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
  await end.locator('[data-end="donate"]').click();
  await expect(page.getByRole('dialog', { name: 'Dukung Warnet Ini' })).toBeVisible();
});

// source: Kelvin request 2026-11-07 SEO/virality plan ("Bagikan sesi warnet kamu" on Log Off)
test('@app:boot Log Off offers WhatsApp/X/Threads/Facebook share with the session brag', async ({ page }) => {
  await boot(page, '', '#desktop');
  await page.locator('.startbtn').click();
  await page.locator('[data-p="logoff"]').click();
  const share = page.locator('.lock .share a');
  await expect(share).toHaveCount(4);
  const wa = decodeURIComponent(await share.first().getAttribute('href'));
  expect(wa).toMatch(/Gue main \d+ menit di Warnet Nusantara\.Net, bayar Rp/);
  expect(wa).toContain('utm_campaign=logoff');
});
