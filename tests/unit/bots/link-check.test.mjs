import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { targetsFromJson, targetsFromDataJs, dedupe, checkUrl, checkAll, formatReport, wayback } from '../../../scripts/bots/link-check.mjs';

// source: js/data.js wayback() helper ("https://web.archive.org/web/${year}if_/${url}") + Kelvin request 2026-11-07
test('wayback URL matches the browser app', () => {
  assert.equal(wayback('http://www.detik.com/', 2001), 'https://web.archive.org/web/2001if_/http://www.detik.com/');
});

// source: Kelvin request 2026-11-07 "every URL in data/*.json and js/data.js" (bookmark shape {name,url,year,cat})
test('bookmarks go through Wayback, other URLs are checked directly', () => {
  const t = targetsFromJson([
    { name: 'detik.com', url: 'http://www.detik.com/', year: 2001, cat: 'Berita' },
    { id: 'pop', name: 'Prince of Persia', mode: 'embed', url: 'https://princejs.com/', year: 1989 },
    { nested: { href: 'https://example.org/x' }, text: 'not a url' },
  ], 'data/x.json');
  assert.deepEqual(t.map((x) => x.url), ['https://web.archive.org/web/2001if_/http://www.detik.com/', 'https://princejs.com/', 'https://example.org/x']);
});

// source: .claude/skills/add-game/SKILL.md Tier C shrines show the old site through the Wayback Machine
test('shrine old sites go through Wayback, official pages are checked directly', () => {
  const t = targetsFromJson([{ id: 'gunbound', name: 'GunBound', mode: 'shrine', year: 2004, site: 'http://gunbound.boleh.com/', siteYear: 2004, official: 'https://www.gunbound.com/' }], 'data/games.json');
  assert.deepEqual(t.map((x) => x.url), ['https://web.archive.org/web/2004if_/http://gunbound.boleh.com/', 'https://www.gunbound.com/']);
});

// source: js/data.js (BOOKMARKS, GAMES with ia('id') embeds) at the time of writing
test('scans js/data.js object literals and archive.org embeds, skipping template strings', () => {
  const src = [
    "export const wayback = (url, year) => `https://web.archive.org/web/${year}if_/${url}`;",
    "export const BOOKMARKS = [",
    "  { name: 'detik.com', url: 'http://www.detik.com/', year: 2001, cat: 'Berita' },",
    "];",
    "const ia = (id) => `https://archive.org/embed/${id}`;",
    "export const GAMES = [",
    "  { id: 'cs16', name: 'Counter-Strike 1.6', mode: 'tab', url: 'https://play-cs.com/', icon: 'link', year: 2003 },",
    "  { id: 'keen', name: 'Keen', mode: 'embed', url: ia('msdos_Commander_Keen_1990'), year: 1990 },",
    "];",
  ].join('\n');
  const urls = targetsFromDataJs(src).map((t) => t.url);
  assert.deepEqual(urls, ['https://web.archive.org/web/2001if_/http://www.detik.com/', 'https://play-cs.com/', 'https://archive.org/embed/msdos_Commander_Keen_1990']);
});

// source: plan "Content becomes data, not code" (bookmarks/games moved to data/*.json in 8d6c140)
test('the real data/bookmarks.json and data/games.json yield Wayback URLs for every bookmark and shrine', () => {
  const read = (f) => JSON.parse(readFileSync(new URL(`../../../data/${f}.json`, import.meta.url), 'utf8'));
  const t = [...targetsFromJson(read('bookmarks'), 'data/bookmarks.json'), ...targetsFromJson(read('games'), 'data/games.json')];
  assert.ok(t.some((x) => x.url === 'https://web.archive.org/web/2001if_/http://www.detik.com/'));
  assert.ok(t.some((x) => x.url === 'https://web.archive.org/web/2004if_/http://www.ragnarok.co.id/'));
  assert.ok(t.every((x) => /^https?:\/\//.test(x.url) && !x.url.includes('${')));
  assert.ok(!t.some((x) => x.url === 'http://www.ragnarok.co.id/'), 'shrine old sites are never checked live');
  assert.equal(dedupe([...t, ...t]).length, dedupe(t).length);
});

const res = (status) => ({ status, body: { cancel() {} } });

// source: Kelvin request 2026-11-07 "answers (HEAD/GET, 15s timeout)"
test('checkUrl: HEAD ok, GET fallback, dead, timeout and rate limit', async () => {
  assert.deepEqual(await checkUrl('u', async () => res(200)), { ok: true, status: 200 });
  const calls = [];
  const headRefused = async (u, o) => { calls.push(o.method); return res(o.method === 'HEAD' ? 405 : 200); };
  assert.equal((await checkUrl('u', headRefused)).ok, true);
  assert.deepEqual(calls, ['HEAD', 'GET']);
  assert.deepEqual(await checkUrl('u', async () => res(404)), { ok: false, status: 404, error: undefined });
  const slow = (u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(Object.assign(new Error('t'), { name: 'TimeoutError' }))));
  assert.deepEqual(await checkUrl('u', slow, 10), { ok: false, status: 0, error: 'timeout' });
  assert.deepEqual(await checkUrl('u', async () => res(429)), { ok: true, rateLimited: true, status: 429 });
});

// source: Kelvin request 2026-11-07 "Wayback URLs" + first real run 2026-11-07 (web.archive.org refused connections after ~15 parallel requests)
test('archive.org URLs run one at a time; refused connections there count as rate-limited', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const f = async (u) => {
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    if (u.includes('refused')) throw Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    return res(200);
  };
  const targets = ['a', 'b', 'refused'].map((x) => ({ url: wayback(`http://${x}.example/`, 2001), source: 's', label: x }));
  const r = await checkAll(targets, f, { archiveGap: 1 });
  assert.equal(maxInFlight, 1);
  assert.deepEqual(r.map((x) => [x.ok, !!x.rateLimited]), [[true, false], [true, false], [true, true]]);
  const direct = await checkAll([{ url: 'https://refused.example/', source: 's', label: 'x' }], f);
  assert.equal(direct[0].ok, false, 'non-archive refusals are real failures');
});

// source: Kelvin request 2026-11-07 'opens/updates one issue "Link mati" listing failures'
test('report lists dead links in a table, escapes cells and notes rate limits', async () => {
  const results = await checkAll([
    { url: 'https://a.example/', source: 'js/data.js', label: 'A|B <b>' },
    { url: 'https://b.example/', source: 'data/bookmarks.json', label: 'B' },
    { url: 'https://c.example/', source: 'data/bookmarks.json', label: 'C' },
  ], async (u) => res(u.includes('a.') ? 404 : u.includes('c.') ? 429 : 200));
  const md = formatReport(results, '2026-11-07');
  assert.match(md, /\*\*1 mati\*\* dari 3 link/);
  assert.match(md, /\| A\\\|B b \| <https:\/\/a\.example\/> \| `js\/data\.js` \| 404 \|/);
  assert.match(md, /1 link kena rate limit/);
  assert.match(formatReport([{ url: 'x', ok: true }], '2026-11-07'), /Semua link hidup/);
});
