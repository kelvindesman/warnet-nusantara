// Boot → billing lock → login → desktop, on both URL layouts.
import { test, expect, boot, toDesktop, openBrowser } from './fixtures.mjs';

// source: README "Boot flow: Award BIOS POST → warnet billing lock screen → selamat datang → desktop"
test('@app:boot BIOS skips to billing lock and voucher login reaches the desktop', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.bios')).toBeVisible();
  await page.locator('.bios').click();
  await expect(page.locator('.lock form.billing')).toBeVisible();
  await page.locator('.sticky').click();
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.welcome')).toBeVisible();
  await expect(page.locator('.desktop')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.taskbar .bill')).toHaveText(/^\d\d:\d\d:\d\d$/);
});

// source: README "random voucher on a sticky note" (login must reject anything else)
test('@app:boot wrong username and wrong password show the operator errors', async ({ page }) => {
  await boot(page);
  await page.locator('.bios').click();
  const form = page.locator('form.billing');
  await form.locator('[name=u]').fill('bukan_user');
  await form.locator('[name=p]').fill('x');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(form.locator('.err')).toHaveText('Username tidak terdaftar. Tanya mas operator!');
  const user = await page.locator('.sticky .vu').textContent();
  await form.locator('[name=u]').fill(user);
  await form.locator('[name=p]').fill('salah');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(form.locator('.err')).toHaveText('Password salah! Cek lagi kertasnya.');
});

// source: Kelvin request 2026-11-07 "?seed" deterministic test switch (plan: agentic best practices)
test('@app:boot same seed prints the same voucher', async ({ page }) => {
  await boot(page, 'seed=42');
  await page.locator('.bios').click();
  const user = await page.locator('.sticky .vu').textContent();
  const pass = await page.locator('.sticky .vp').textContent();
  await boot(page, 'seed=42');
  await page.locator('.bios').click();
  await expect(page.locator('.sticky .vu')).toHaveText(user);
  await expect(page.locator('.sticky .vp')).toHaveText(pass);
});

// source: Kelvin request 2026-11-07 "can this fully compatible deployed to github pages" (subpath layout)
test('@app:browser portal home.html loads inside the browser window on this layout', async ({ page }) => {
  await toDesktop(page);
  await openBrowser(page);
  const frame = page.frameLocator('.br-view iframe');
  await expect(frame.locator('#hits .card').first()).toBeVisible();
  await expect(page.locator('.br-addr input')).toHaveValue('about:home');
});
