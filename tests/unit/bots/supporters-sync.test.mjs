import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  tierFor, isProfane, normalize, mergeSupporters, renderBlock, replaceBlock, collect,
  fetchTrakteer, fetchBmc, fetchGithubSponsors, START, END,
} from '../../../scripts/bots/supporters-sync.mjs';

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/supporters/${n}.json`, import.meta.url), 'utf8'));
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
/** Fake fetch: route by URL substring; records calls. */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url, opts });
    for (const [match, res] of routes) if (url.includes(match)) return typeof res === 'function' ? res(url, opts) : res;
    return json(404, { message: 'not found' });
  };
  fn.calls = calls;
  return fn;
}

// source: Kelvin request 2026-11-07 tier table (jam Rp5.000+/$3, malam Rp25.000+/$10 one-off or $5/mo, vip Rp100.000+/$20/mo, iklan Rp500.000+/mo or $50+/mo; below Rp5.000/$3 not credited)
test('tierFor follows the tier table', () => {
  assert.equal(tierFor({ currency: 'IDR', amount: 4999 }), null);
  assert.equal(tierFor({ currency: 'IDR', amount: 5000 }), 'jam');
  assert.equal(tierFor({ currency: 'IDR', amount: 25000 }), 'malam');
  assert.equal(tierFor({ currency: 'IDR', amount: 100000 }), 'vip');
  assert.equal(tierFor({ currency: 'IDR', amount: 500000 }), 'iklan');
  assert.equal(tierFor({ currency: 'USD', amount: 2.99 }), null);
  assert.equal(tierFor({ currency: 'USD', amount: 3 }), 'jam');
  assert.equal(tierFor({ currency: 'USD', amount: 10 }), 'malam');
  assert.equal(tierFor({ currency: 'USD', amount: 100 }), 'malam', 'one-off tops out at malam');
  assert.equal(tierFor({ currency: 'USD', amount: 5, monthly: true }), 'malam');
  assert.equal(tierFor({ currency: 'USD', amount: 20, monthly: true }), 'vip');
  assert.equal(tierFor({ currency: 'USD', amount: 50, monthly: true }), 'iklan');
  assert.equal(tierFor({ currency: 'USD', amount: 'abc' }), null);
});

// source: Kelvin request 2026-11-07 "drop anonymous, strip URLs/HTML, profanity filter, message cap 140 chars; never store email or amount"
test('normalize drops anonymous/profane names, strips URLs and HTML, caps messages, never keeps email or amount', () => {
  assert.equal(normalize({ name: 'Seseorang', currency: 'IDR', amount: 50000 }, 'trakteer'), null);
  assert.equal(normalize({ name: '  ', currency: 'IDR', amount: 50000 }, 'trakteer'), null);
  assert.equal(normalize({ name: 'K0nt0l', currency: 'IDR', amount: 50000 }, 'trakteer'), null);
  const s = normalize({ name: '<b>Budi</b>', currency: 'IDR', amount: 30000, date: '2026-10-01 10:00:00', message: 'Mantap <img src=x> lihat https://evil.example/x dan www.spam.com dan judi.xyz @someone ' + 'a'.repeat(300), email: 'a@b.c' }, 'trakteer');
  assert.equal(s.name, 'Budi');
  assert.equal(s.tier, 'malam');
  assert.equal(s.date, '2026-10-01');
  assert.doesNotMatch(s.message, /https?:|www\.|<|>|judi\.xyz|@someone/);
  assert.equal(Array.from(s.message).length, 140);
  assert.deepEqual(Object.keys(s).sort(), ['date', 'message', 'name', 'platform', 'tier']);
  const rude = normalize({ name: 'Sari', currency: 'IDR', amount: 5000, message: 'dasar 4nj1ng' }, 'trakteer');
  assert.equal(rude.message, undefined, 'profane message dropped, supporter kept');
  assert.equal(isProfane('Dickson Grape'), false, 'short words only match whole tokens');
  assert.equal(isProfane('fuuck'), false);
  assert.equal(isProfane('F.U.C.K'), true);
});

// source: https://trakteer.id API (GET api.trakteer.id/v1/public/supports, header `key`) + Kelvin request 2026-11-07 fixtures for each API shape
test('Trakteer adapter pages through supports and credits by IDR amount', async () => {
  const f = fakeFetch([['page=1', json(200, fx('trakteer-page1'))], ['page=2', json(200, fx('trakteer-page2'))]]);
  const r = await fetchTrakteer({ token: 'test-key', fetchImpl: f });
  assert.equal(r.ok, true);
  assert.equal(r.items.length, 6);
  assert.equal(f.calls[0].opts.headers.key, 'test-key');
  const { fresh } = await collect({ TRAKTEER_API_KEY: 'test-key' }, f);
  const names = fresh.trakteer.map((s) => s.name);
  assert.deepEqual(names.sort(), ['Budi', 'Budi', 'Sari']);
});

// source: Kelvin request 2026-11-07 (empty, error, rate-limit fixtures for each API)
test('Trakteer adapter: empty list, HTTP error, rate limit, bad shape', async () => {
  const empty = await fetchTrakteer({ token: 't', fetchImpl: fakeFetch([['supports', json(200, { status: 'success', result: { data: [], last_page: 1 } })]]) });
  assert.deepEqual(empty, { ok: true, items: [] });
  assert.deepEqual(await fetchTrakteer({ token: 't', fetchImpl: fakeFetch([['supports', json(403, { status: 'error' })]]) }), { ok: false, reason: 'HTTP 403' });
  assert.deepEqual(await fetchTrakteer({ token: 't', fetchImpl: fakeFetch([['supports', json(429, {})]]) }), { ok: false, reason: 'rate-limited (429)' });
  assert.equal((await fetchTrakteer({ token: 't', fetchImpl: fakeFetch([['supports', json(200, { status: 'success', result: 'nope' })]]) })).ok, false);
  assert.match((await fetchTrakteer({ token: 't', fetchImpl: async () => { throw new Error('ENOTFOUND'); } })).reason, /network/);
});

// source: developers.buymeacoffee.com API (/api/v1/supporters, /api/v1/subscriptions) + Kelvin request 2026-11-07 fixtures
test('Buy Me a Coffee adapter credits one-offs and memberships, skips refunds, private and anonymous', async () => {
  const f = fakeFetch([['/supporters', json(200, fx('bmc-supporters'))], ['/subscriptions', json(200, fx('bmc-subscriptions'))]]);
  const { fresh } = await collect({ BMC_TOKEN: 'b' }, f);
  assert.equal(f.calls[0].opts.headers.authorization, 'Bearer b');
  const byName = Object.fromEntries(fresh.bmc.map((s) => [s.name, s]));
  assert.deepEqual(Object.keys(byName).sort(), ['Alice', 'Big Co', 'Yearly Yan']);
  assert.equal(byName.Alice.tier, 'malam'); // 2 x $5 one-off
  assert.equal(byName['Big Co'].tier, 'iklan'); // $50/month
  assert.equal(byName['Yearly Yan'].tier, 'malam'); // $60/year = $5/month
  assert.ok(!JSON.stringify(fresh).includes('@example'), 'no email stored');
});

// source: Kelvin request 2026-11-07 (empty, error, rate-limit fixtures for each API)
test('Buy Me a Coffee adapter: empty (404), error, rate limit', async () => {
  assert.deepEqual(await fetchBmc({ token: 'b', fetchImpl: fakeFetch([]) }), { ok: true, items: [] });
  assert.deepEqual(await fetchBmc({ token: 'b', fetchImpl: fakeFetch([['/supporters', json(500, {})]]) }), { ok: false, reason: 'supporters: HTTP 500' });
  assert.deepEqual(await fetchBmc({ token: 'b', fetchImpl: fakeFetch([['/supporters', json(429, {})]]) }), { ok: false, reason: 'supporters: rate-limited (429)' });
});

// source: GitHub GraphQL schema (viewer.sponsorshipsAsMaintainer) + Kelvin request 2026-11-07 fixtures
test('GitHub Sponsors adapter maps monthly/one-time tiers and skips private sponsors', async () => {
  const f = fakeFetch([['graphql', json(200, fx('github-sponsors'))]]);
  const { fresh } = await collect({ SPONSORS_TOKEN: 'g' }, f);
  assert.deepEqual(fresh.github.map((s) => [s.name, s.tier]), [['octo-dev', 'vip'], ['kopi-org', 'malam']]);
  assert.equal(JSON.parse(f.calls[0].opts.body).variables.after, null);
});

// source: Kelvin request 2026-11-07 (empty, error, rate-limit fixtures for each API)
test('GitHub Sponsors adapter: empty, GraphQL error, rate limit', async () => {
  const empty = { data: { viewer: { sponsorshipsAsMaintainer: { pageInfo: { hasNextPage: false }, nodes: [] } } } };
  assert.deepEqual(await fetchGithubSponsors({ token: 'g', fetchImpl: fakeFetch([['graphql', json(200, empty)]]) }), { ok: true, items: [] });
  assert.deepEqual(await fetchGithubSponsors({ token: 'g', fetchImpl: fakeFetch([['graphql', json(200, { errors: [{ type: 'INSUFFICIENT_SCOPES' }] })]]) }), { ok: false, reason: 'GraphQL: INSUFFICIENT_SCOPES' });
  assert.equal((await fetchGithubSponsors({ token: 'g', fetchImpl: fakeFetch([['graphql', json(429, {})]]) })).ok, false);
});

// source: Kelvin request 2026-11-07 "each platform skipped if its secret is missing"
test('platforms without a secret are skipped and never called', async () => {
  const f = fakeFetch([]);
  const { fresh, log } = await collect({}, f);
  assert.deepEqual(fresh, { trakteer: null, bmc: null, github: null });
  assert.equal(f.calls.length, 0);
  assert.equal(log.length, 3);
});

// source: Kelvin request 2026-11-07 "merge with existing data/supporters.json preserving manual entries (platform 'saweria' or 'manual') and hidden: true flags"
test('merge keeps manual/saweria entries, hidden flags and failed platforms; aggregates repeat supporters', () => {
  const existing = [
    { name: 'Warung Bu Tini', tier: 'iklan', platform: 'manual', date: '2026-01-01' },
    { name: 'Saweria Sam', tier: 'jam', platform: 'saweria', date: '2026-02-01', message: 'semangat' },
    { name: 'Budi', tier: 'jam', platform: 'trakteer', date: '2026-01-05', hidden: true },
    { name: 'Old Trakteer', tier: 'jam', platform: 'trakteer', date: '2026-01-06' },
    { name: 'Alice', tier: 'jam', platform: 'bmc', date: '2026-01-07' },
  ];
  const fresh = {
    trakteer: [
      { name: 'Budi', tier: 'malam', platform: 'trakteer', date: '2026-10-01', message: 'pertama' },
      { name: 'budi', tier: 'iklan', platform: 'trakteer', date: '2026-10-20', message: 'kedua' },
      { name: 'Budi', tier: 'jam', platform: 'trakteer', date: '2026-10-25' },
    ],
    bmc: null, // failed or skipped: keep existing bmc entries
    github: [],
  };
  const merged = mergeSupporters(existing, fresh);
  const budi = merged.find((s) => s.name.toLowerCase() === 'budi');
  assert.deepEqual(budi, { name: 'Budi', tier: 'iklan', platform: 'trakteer', date: '2026-10-25', message: 'kedua', hidden: true });
  assert.ok(merged.some((s) => s.platform === 'manual'));
  assert.ok(merged.some((s) => s.platform === 'saweria'));
  assert.ok(merged.some((s) => s.name === 'Alice'));
  assert.ok(!merged.some((s) => s.name === 'Old Trakteer'), 'refreshed platform replaces its old entries');
  assert.deepEqual(merged.map((s) => s.tier), ['iklan', 'iklan', 'jam', 'jam']);
});

// source: Kelvin request 2026-11-07 "rewrite README.md and README.id.md block between SUPPORTERS markers grouped by tier with messages"
test('README block is grouped by tier, skips hidden supporters and only replaces between markers', () => {
  const list = [
    { name: 'Warung Bu Tini', tier: 'iklan', platform: 'manual', date: '2026-01-01' },
    { name: 'Budi', tier: 'malam', platform: 'trakteer', date: '2026-10-01', message: 'Kangen "warnet"' },
    { name: 'Hidden Hana', tier: 'vip', platform: 'bmc', date: '2026-10-01', hidden: true },
  ];
  const block = renderBlock(list);
  assert.match(block, /#### Sponsor Iklan[\s\S]*Warung Bu Tini[\s\S]*#### Paket Malam[\s\S]*\*\*Budi\*\* \(Trakteer\): "Kangen 'warnet'"/);
  assert.doesNotMatch(block, /Hidden Hana|Member VIP/);
  assert.match(renderBlock([]), /Belum ada/);
  const readme = `# Title\n\n${START}\nold stuff\n${END}\n\nfooter\n`;
  assert.equal(replaceBlock(readme, 'NEW'), `# Title\n\n${START}\nNEW\n${END}\n\nfooter\n`);
  assert.equal(replaceBlock('# no markers', 'NEW'), null);
});
