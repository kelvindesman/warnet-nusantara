// Static landing pages for search and AI search: they must load cleanly on both
// layouts, carry complete metadata, link only to pages that exist, and deep-link
// into the app.
import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures.mjs';

const LINKS = JSON.parse(readFileSync(new URL('../../data/links.json', import.meta.url), 'utf8'));
const SITEMAP = readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8');
const PAGES = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(LINKS.site.length));
const LANDING = PAGES.filter((p) => p !== '');

// source: plan "SEO + GEO" (title/description/canonical/hreflang/OG/JSON-LD on every page, no broken internal links)
test('@app:seo every sitemap page has full metadata, valid JSON-LD and working internal links', async ({ page, request, baseURL }) => {
  expect(PAGES).toEqual(expect.arrayContaining(['', 'id/', 'en/', 'game-warnet/', 'winamp/', 'mirc/', 'mesin-waktu-internet/', 'tentang-warnet/']));
  const seen = new Set();
  for (const p of PAGES) {
    await page.goto(`./${p}`);
    await expect(page).toHaveTitle(/Warnet Nusantara\.Net/);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toMatch(/.{60,}/);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(LINKS.site + p);
    for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) await expect(page.locator(`meta[property="${prop}"]`)).toHaveCount(1);
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe(`${LINKS.site}docs/media/og.png`);
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(lds.length).toBeGreaterThan(0);
    for (const t of lds) expect(JSON.parse(t)['@context']).toBe('https://schema.org');
    await expect(page.locator('h1')).toHaveCount(1);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.href));
    for (const h of hrefs) if (h.startsWith(new URL(baseURL).origin)) seen.add(h.split('#')[0]);
  }
  for (const h of seen) expect((await request.get(h)).status(), h).toBe(200);
  for (const f of ['robots.txt', 'llms.txt', 'llms-full.txt', 'manifest.webmanifest', 'favicon.svg', 'docs/media/og.png']) expect((await request.get(`./${f}`)).status(), f).toBe(200);
});

// source: plan "SEO + GEO" hreflang id/en/x-default between the bilingual landing pages
test('@app:seo Indonesian and English landing pages point at each other with hreflang', async ({ page }) => {
  for (const p of ['id/', 'en/']) {
    await page.goto(`./${p}`);
    expect(await page.locator('link[rel="alternate"]').evaluateAll((ls) => ls.map((l) => `${l.hreflang}=${l.getAttribute('href')}`)))
      .toEqual([`id=${LINKS.site}id/`, `en=${LINKS.site}en/`, `x-default=${LINKS.site}`]);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

// source: plan "SEO + GEO" — each landing page has a "Masuk warnet" deep link (/#app=winamp etc.)
test('@app:seo landing page deep links open the matching app', async ({ page }) => {
  await page.goto('./mirc/');
  await page.getByRole('link', { name: 'Buka IRC →' }).click();
  await expect(page.locator('.win', { hasText: 'IRC' }).first()).toBeVisible();
  await page.goto('./game-warnet/');
  await page.getByRole('link', { name: 'GunBound' }).click();
  await expect(page.getByRole('dialog', { name: 'GunBound', exact: true })).toBeVisible();
  await page.goto('./id/');
  await page.getByRole('link', { name: '▶ Tonton Kilas Balik 60 detik' }).click();
  await expect(page.locator('.demo-cap')).toBeVisible();
});

// source: plan "SEO + GEO" — index.html static intro for crawlers, replaced once JS boots
test('@app:seo index.html serves a static intro that the app replaces on boot', async ({ page }) => {
  await page.route('**/js/main.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('./');
  await expect(page.locator('.seo-intro h1')).toHaveText('Warnet Nusantara.Net');
  await expect(page.locator('.seo-intro a[href="game-warnet/"]')).toBeVisible();
  await page.unroute('**/js/main.js');
  await page.goto('./?seed=7&nosound');
  await expect(page.locator('.bios')).toBeVisible();
  await expect(page.locator('.seo-intro')).toHaveCount(0);
});
