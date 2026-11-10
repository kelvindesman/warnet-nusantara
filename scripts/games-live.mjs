// Live playability sweep for the Game Warnet catalog (dev tool, needs the network).
// Not part of the gate: third-party game hosts change daily. Run it by hand or from
// a nightly job, read reports/games-live.json, then record unplayable games in
// data/games.json with a "broken" note (shown to players and sorted last).
//
//   node scripts/games-live.mjs            # every game with a URL
//   node scripts/games-live.mjs doom fpq3  # only these ids
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const DEAD_TEXT = /(404|not found|page not found|domain (is )?for sale|suspended|this site can.t be reached|dmca|has been (taken down|removed)|item cannot be found|no longer available)/i;

/** Is a page frameable by another origin, judging only by its response headers? */
export function frameable(headers) {
  const xfo = (headers['x-frame-options'] || '').toLowerCase();
  if (xfo.includes('deny') || xfo.includes('sameorigin')) return false;
  const fa = /frame-ancestors([^;]*)/i.exec(headers['content-security-policy'] || '');
  return !fa || /\*/.test(fa[1]);
}

/** Turn one probe into a verdict: ok, or a short reason a player would understand. */
export function classify(g, p) {
  if (p.error) return { ok: false, why: `tidak bisa dibuka (${p.error})` };
  if (p.status >= 400) return { ok: false, why: `server menjawab HTTP ${p.status}` };
  if (p.ia && !p.ia.exists) return { ok: false, why: 'item Internet Archive sudah tidak ada' };
  if (p.ia && !p.ia.emulated) return { ok: false, why: 'item Internet Archive tidak punya emulator' };
  if (g.mode === 'embed' && !p.ia && !frameable(p.headers)) return { ok: false, why: 'situsnya menolak dibuka di dalam jendela' };
  if (!p.canvas && !p.iframe && DEAD_TEXT.test(p.text)) return { ok: false, why: 'halamannya kosong atau sudah dihapus' };
  return { ok: true, why: p.canvas ? 'kanvas game muncul' : p.iframe ? 'pemutar termuat' : 'halaman termuat' };
}

async function probe(browser, g) {
  const out = { id: g.id, mode: g.mode, url: g.url };
  const ia = /archive\.org\/embed\/([^/?#]+)/.exec(g.url);
  try {
    const r = await fetch(g.url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
    out.status = r.status; out.headers = Object.fromEntries(r.headers);
    if (ia) {
      const m = await (await fetch(`https://archive.org/metadata/${ia[1]}`, { headers: { 'user-agent': UA } })).json();
      out.ia = { exists: !!m.metadata, emulated: !!(m.metadata && (m.metadata.emulator || m.metadata.emulator_ext)) || (m.files || []).some((f) => /\.(zip|jsdos)$/i.test(f.name)) };
    }
    const page = await browser.newPage({ userAgent: UA });
    try {
      await page.goto(g.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(8000);
      out.canvas = await page.locator('canvas').count();
      out.iframe = await page.locator('iframe').count();
      out.text = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    } finally { await page.close(); }
  } catch (e) { out.error = String(e.message || e).split('\n')[0].slice(0, 80); }
  return { ...out, verdict: classify(g, out) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { chromium } = await import('@playwright/test');
  const only = process.argv.slice(2);
  const games = JSON.parse(await readFile(new URL('../data/games.json', import.meta.url), 'utf8'))
    .filter((g) => g.url && (!only.length || only.includes(g.id)));
  const browser = await chromium.launch();
  const results = [];
  for (const g of games) { // one at a time: these pages are heavy WebGL/emulator apps
    const r = await probe(browser, g);
    results.push(r);
    console.log(`${r.verdict.ok ? 'OK  ' : 'FAIL'} ${g.id.padEnd(16)} ${String(r.status ?? '-').padEnd(4)} c${r.canvas ?? '-'} f${r.iframe ?? '-'} ${r.verdict.why}`);
  }
  await browser.close();
  await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
  await writeFile(new URL('../reports/games-live.json', import.meta.url), JSON.stringify({ date: new Date().toISOString(), results }, null, 1));
}
