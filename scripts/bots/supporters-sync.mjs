// Supporters sync: Trakteer + Buy Me a Coffee + GitHub Sponsors -> data/supporters.json
// and the SUPPORTERS block in README.md / README.id.md. The workflow (supporters.yml) opens a PR.
//
//   TRAKTEER_API_KEY=... BMC_TOKEN=... SPONSORS_TOKEN=... node scripts/bots/supporters-sync.mjs
//
// Every platform is optional: a missing secret skips it, an API error or rate limit keeps the
// entries already in data/supporters.json for that platform. Manual entries (platform 'saweria'
// or 'manual') and `hidden: true` flags are always preserved. We never store email or amount:
// the amount only picks a tier in memory.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { stripUnsafe, cap, readJson, writeJson, setOutput } from './lib.mjs';

export const TIER_ORDER = ['iklan', 'vip', 'malam', 'jam'];
export const TIER_TITLES = {
  iklan: 'Sponsor Iklan (Rp500.000+/bulan, $50+/bulan)',
  vip: 'Member VIP (Rp100.000+, $20/bulan)',
  malam: 'Paket Malam (Rp25.000+, $10 sekali atau $5/bulan)',
  jam: 'Paket 1 Jam (Rp5.000+, $3)',
};
export const PLATFORM_NAMES = { trakteer: 'Trakteer', bmc: 'Buy Me a Coffee', github: 'GitHub Sponsors', saweria: 'Saweria', manual: 'Manual' };
export const SYNCED = ['trakteer', 'bmc', 'github'];
export const KEPT = ['saweria', 'manual'];
export const NAME_MAX = 40;
export const MESSAGE_MAX = 140;
const ANONYMOUS = /^(anonymous|anonim|anon|seseorang|someone|guest|tamu|hamba allah|no name|-+|\?+)$/i;

/**
 * Tier from one payment (Kelvin request 2026-11-07 tier table):
 *   IDR: jam Rp5.000+, malam Rp25.000+, vip Rp100.000+, iklan Rp500.000+
 *   USD monthly: jam $3+, malam $5+, vip $20+, iklan $50+
 *   USD one-off: jam $3+, malam $10+ (one-off payments top out at malam)
 * Below the floor -> null (not credited). Other currencies are treated as USD.
 */
export function tierFor({ currency = 'USD', amount, monthly = false }) {
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return null;
  if (String(currency).toUpperCase() === 'IDR') {
    if (a >= 500000) return 'iklan';
    if (a >= 100000) return 'vip';
    if (a >= 25000) return 'malam';
    if (a >= 5000) return 'jam';
    return null;
  }
  if (monthly) {
    if (a >= 50) return 'iklan';
    if (a >= 20) return 'vip';
    if (a >= 5) return 'malam';
    if (a >= 3) return 'jam';
    return null;
  }
  if (a >= 10) return 'malam';
  if (a >= 3) return 'jam';
  return null;
}

let BADWORDS;
function badwords() {
  BADWORDS ??= JSON.parse(readFileSync(new URL('./badwords.json', import.meta.url), 'utf8')).words;
  return BADWORDS;
}

/** True when the text contains a listed word (with basic leetspeak folding). */
export function isProfane(text, words = badwords()) {
  const folded = String(text ?? '').toLowerCase()
    .replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't');
  const tokens = folded.split(/[^a-z0-9]+/).filter(Boolean);
  const squashed = folded.replace(/[^a-z0-9]+/g, '');
  // "f.u.c.k" / "k o n t o l": join runs of single-letter tokens back into one token
  const spelled = folded.split(/[^a-z0-9]+/).join(' ').replace(/\b(\w)(?: (?=\w\b))/g, '$1').split(' ');
  tokens.push(...spelled);
  return words.some((w) => (w.length <= 4 ? tokens.includes(w) : squashed.includes(w)));
}

export const isoDate = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10); };

/** Raw payment -> public supporter, or null when it must not be credited. */
export function normalize(raw, platform) {
  if (raw.anonymous || raw.refunded || raw.hidden) return null;
  const name = cap(stripUnsafe(raw.name), NAME_MAX);
  if (!name || ANONYMOUS.test(name) || isProfane(name)) return null;
  const tier = tierFor(raw);
  if (!tier) return null;
  let message = cap(stripUnsafe(raw.message), MESSAGE_MAX);
  if (message && isProfane(message)) message = '';
  const out = { name, tier, platform, date: isoDate(raw.date) };
  if (message) out.message = message;
  return out;
}

const keyOf = (s) => `${s.platform}:${s.name.toLowerCase()}`;
const rank = (t) => TIER_ORDER.indexOf(t);

/** One entry per supporter: best tier, latest date, latest non-empty message. */
export function aggregate(list) {
  const map = new Map();
  for (const s of list) {
    const k = keyOf(s);
    const prev = map.get(k);
    if (!prev) { map.set(k, { ...s }); continue; }
    const newer = s.date > prev.date;
    const merged = { ...prev, tier: rank(s.tier) < rank(prev.tier) ? s.tier : prev.tier, date: newer ? s.date : prev.date };
    if (s.message && (newer || !prev.message)) merged.message = s.message;
    map.set(k, merged);
  }
  return [...map.values()];
}

export function sortSupporters(list) {
  return [...list].sort((a, b) => rank(a.tier) - rank(b.tier) || String(a.date).localeCompare(String(b.date)) || a.name.localeCompare(b.name));
}

/**
 * Merge fresh platform results into the existing file.
 * `fresh` maps platform -> array of supporters, or null when the platform was skipped or failed
 * (then its existing entries are kept as they are).
 */
export function mergeSupporters(existing, fresh) {
  const hidden = new Set(existing.filter((s) => s.hidden === true).map(keyOf));
  const out = existing.filter((s) => KEPT.includes(s.platform) || !SYNCED.includes(s.platform) || fresh[s.platform] == null);
  for (const p of SYNCED) {
    if (fresh[p] == null) continue;
    for (const s of aggregate(fresh[p])) out.push(hidden.has(keyOf(s)) ? { ...s, hidden: true } : s);
  }
  return sortSupporters(out);
}

/** Markdown for the README block (hidden entries left out). */
export function renderBlock(supporters) {
  const visible = supporters.filter((s) => !s.hidden);
  if (!visible.length) return '_Belum ada yang patungan. Jadilah yang pertama!_';
  const parts = [];
  for (const tier of TIER_ORDER) {
    const group = visible.filter((s) => s.tier === tier);
    if (!group.length) continue;
    parts.push(`#### ${TIER_TITLES[tier]}\n`);
    for (const s of group) {
      const msg = s.message ? `: "${s.message.replace(/"/g, "'")}"` : '';
      parts.push(`- **${s.name}** (${PLATFORM_NAMES[s.platform] ?? s.platform})${msg}`);
    }
    parts.push('');
  }
  return parts.join('\n').trimEnd();
}

export const START = '<!-- SUPPORTERS:START -->';
export const END = '<!-- SUPPORTERS:END -->';

/** Replace the text between the markers. Returns null when the markers are missing. */
export function replaceBlock(readme, block) {
  const s = readme.indexOf(START);
  const e = readme.indexOf(END);
  if (s === -1 || e === -1 || e < s) return null;
  return `${readme.slice(0, s + START.length)}\n${block}\n${readme.slice(e)}`;
}

// ---------------------------------------------------------------- platform adapters
// Each adapter returns { ok: true, items: Raw[] } or { ok: false, reason }.
// Raw = { name, currency, amount, monthly, date, message, anonymous?, refunded?, hidden? }

async function getJson(fetchImpl, url, headers) {
  let res;
  try { res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(20000) }); } catch (e) { return { error: `network: ${e.message}` }; }
  if (res.status === 429) return { error: 'rate-limited (429)' };
  if (!res.ok) return { error: `HTTP ${res.status}` };
  try { return { data: await res.json() }; } catch { return { error: 'invalid JSON' }; }
}

const MAX_PAGES = 20;

// Trakteer public API: GET https://api.trakteer.id/v1/public/supports with header `key`.
// Endpoint confirmed (answers 403 JSON without a valid key). The response field names below
// follow Trakteer's API page but were not verified with a real key.
// TODO(owner): run once with a real key (workflow_dispatch) and adjust if the shape differs.
export async function fetchTrakteer({ token, fetchImpl = globalThis.fetch }) {
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await getJson(fetchImpl, `https://api.trakteer.id/v1/public/supports?limit=100&page=${page}&include=is_guest`, {
      key: token, accept: 'application/json', 'x-requested-with': 'XMLHttpRequest',
    });
    if (r.error) return { ok: false, reason: r.error };
    const result = r.data?.result;
    if (r.data?.status && r.data.status !== 'success') return { ok: false, reason: `API status ${r.data.status}` };
    const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : null;
    if (!rows) return { ok: false, reason: 'unexpected response shape' };
    for (const d of rows) items.push({
      name: d.supporter_name, currency: 'IDR', amount: Number(d.amount), monthly: false,
      date: d.updated_at ?? d.created_at, message: d.support_message, anonymous: d.is_guest === true && !d.supporter_name,
    });
    const last = Number(result?.last_page ?? 1);
    if (!rows.length || page >= last) break;
  }
  return { ok: true, items };
}

// Buy Me a Coffee: https://developers.buymeacoffee.com (docs require login).
// GET /api/v1/supporters (one-off) and /api/v1/subscriptions?status=active (memberships), Bearer token.
export async function fetchBmc({ token, fetchImpl = globalThis.fetch }) {
  const headers = { authorization: `Bearer ${token}`, accept: 'application/json' };
  const items = [];
  for (const kind of ['supporters', 'subscriptions']) {
    let url = `https://developers.buymeacoffee.com/api/v1/${kind}${kind === 'subscriptions' ? '?status=active' : ''}`;
    for (let page = 1; url && page <= MAX_PAGES; page++) {
      const r = await getJson(fetchImpl, url, headers);
      if (r.error) {
        if (r.error === 'HTTP 404' && page === 1) break; // BMC answers 404 "No ... found" when the list is empty
        return { ok: false, reason: `${kind}: ${r.error}` };
      }
      const rows = r.data?.data;
      if (!Array.isArray(rows)) return { ok: false, reason: `${kind}: unexpected response shape` };
      for (const d of rows) {
        if (kind === 'supporters') items.push({
          name: d.supporter_name, currency: d.support_currency || 'USD',
          amount: Number(d.support_coffees || 1) * Number(d.support_coffee_price || 0), monthly: false,
          date: d.support_created_on, message: d.support_note, refunded: d.is_refunded === true || d.is_refunded === 1,
          hidden: d.support_visibility === 0,
        });
        else {
          const per = Number(d.subscription_coffee_num || 1) * Number(d.subscription_coffee_price || 0);
          items.push({
            name: d.payer_name, currency: d.subscription_currency || 'USD',
            amount: d.subscription_duration_type === 'year' ? per / 12 : per, monthly: true,
            date: d.subscription_created_on, message: d.subscription_message,
            hidden: d.subscription_hidden === true || d.subscription_hidden === 1 || d.subscription_is_cancelled === true,
          });
        }
      }
      url = r.data.next_page_url || null;
    }
  }
  return { ok: true, items };
}

export const SPONSORS_QUERY = `query($after: String) {
  viewer {
    sponsorshipsAsMaintainer(first: 100, after: $after, activeOnly: true, includePrivate: false) {
      pageInfo { hasNextPage endCursor }
      nodes {
        createdAt privacyLevel isOneTimePayment
        tier { monthlyPriceInDollars isOneTime }
        sponsorEntity { __typename ... on User { login } ... on Organization { login } }
      }
    }
  }
}`;

// GitHub Sponsors via GraphQL; SPONSORS_TOKEN must belong to the sponsored account (scope read:user, plus read:org for orgs).
export async function fetchGithubSponsors({ token, fetchImpl = globalThis.fetch }) {
  const items = [];
  let after = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    let res;
    try {
      res = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'warnet-bots' },
        body: JSON.stringify({ query: SPONSORS_QUERY, variables: { after } }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) { return { ok: false, reason: `network: ${e.message}` }; }
    if (res.status === 429 || res.status === 403) return { ok: false, reason: `rate-limited or forbidden (${res.status})` };
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const body = await res.json();
    if (body.errors?.length) return { ok: false, reason: `GraphQL: ${body.errors[0].type || body.errors[0].message}` };
    const conn = body.data?.viewer?.sponsorshipsAsMaintainer;
    if (!conn) return { ok: false, reason: 'unexpected response shape' };
    for (const n of conn.nodes) items.push({
      name: n.sponsorEntity?.login, currency: 'USD', amount: n.tier?.monthlyPriceInDollars,
      monthly: !(n.isOneTimePayment || n.tier?.isOneTime), date: n.createdAt, message: '',
      hidden: n.privacyLevel !== 'PUBLIC',
    });
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return { ok: true, items };
}

export const ADAPTERS = {
  trakteer: { secret: 'TRAKTEER_API_KEY', run: fetchTrakteer },
  bmc: { secret: 'BMC_TOKEN', run: fetchBmc },
  github: { secret: 'SPONSORS_TOKEN', run: fetchGithubSponsors },
};

/** Run every adapter whose secret is set. Returns { fresh, log }. */
export async function collect(env = process.env, fetchImpl = globalThis.fetch) {
  const fresh = {};
  const log = [];
  for (const [platform, { secret, run }] of Object.entries(ADAPTERS)) {
    const token = env[secret];
    if (!token) { fresh[platform] = null; log.push(`${platform}: skipped (${secret} not set)`); continue; }
    const r = await run({ token, fetchImpl });
    if (!r.ok) { fresh[platform] = null; log.push(`${platform}: kept existing entries (${r.reason})`); continue; }
    fresh[platform] = r.items.map((raw) => normalize(raw, platform)).filter(Boolean);
    log.push(`${platform}: ${fresh[platform].length} credited of ${r.items.length} payments`);
  }
  return { fresh, log };
}

async function main() {
  const dataPath = 'data/supporters.json';
  const existing = readJson(dataPath, []);
  if (!Array.isArray(existing)) throw new Error(`${dataPath} must be a JSON array`);
  const { fresh, log } = await collect();
  for (const l of log) console.log(l);
  const merged = mergeSupporters(existing, fresh);
  const before = JSON.stringify(existing);
  if (JSON.stringify(merged) !== before || !existsSync(dataPath)) writeJson(dataPath, merged);
  const block = renderBlock(merged);
  for (const f of ['README.md', 'README.id.md']) {
    if (!existsSync(f)) continue;
    const next = replaceBlock(readFileSync(f, 'utf8'), block);
    if (next == null) { console.warn(`${f}: SUPPORTERS markers missing, not updated`); continue; }
    writeFileSync(f, next);
  }
  setOutput('summary', log.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
