// Nightly link check (links.yml): every URL in data/*.json and js/data.js must answer.
// Bookmarks (objects with url + year + cat) are checked through the Wayback Machine as
// https://web.archive.org/web/<year>if_/<url>, exactly how the browser app opens them.
//   node scripts/bots/link-check.mjs run <report.md>   check and write the report; outputs failed=<n>
//   node scripts/bots/link-check.mjs issue <report.md> open/update/close the single "Link mati" issue
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { github, setOutput } from './lib.mjs';

export const ISSUE_TITLE = 'Link mati';
export const TIMEOUT_MS = 15000;
export const wayback = (url, year) => `https://web.archive.org/web/${year}if_/${url}`;
const isHttp = (u) => /^https?:\/\/[^\s'"`<>]+$/.test(u) && !u.includes('${');
const isBookmark = (o) => o && typeof o.url === 'string' && o.year != null && typeof o.cat === 'string' && !o.mode;

/** Walk parsed JSON and collect check targets. */
export function targetsFromJson(data, source) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      if (isBookmark(v) && isHttp(v.url)) out.push({ url: wayback(v.url, v.year), source, label: v.name ?? v.url });
      const shrine = v.mode === 'shrine' && v.siteYear != null && isHttp(v.site);
      if (shrine) out.push({ url: wayback(v.site, v.siteYear), source, label: v.name ?? v.id });
      for (const [k, x] of Object.entries(v)) {
        if ((isBookmark(v) && k === 'url') || (shrine && k === 'site')) continue;
        if (typeof x === 'string' && isHttp(x)) out.push({ url: x, source, label: v.name ?? v.id ?? x });
        else walk(x);
      }
    }
  };
  walk(data);
  return out;
}

/** Lenient scan of js/data.js object literals (single-quoted strings, numbers) and ia('id') embeds. */
export function targetsFromDataJs(text, source = 'js/data.js') {
  const out = [];
  for (const m of text.matchAll(/\{[^{}]*\}/g)) {
    const obj = {};
    for (const f of m[0].matchAll(/(\w+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|(\d+))/g)) obj[f[1]] = f[2] ?? f[3] ?? Number(f[4]);
    if (isBookmark(obj) && isHttp(obj.url)) out.push({ url: wayback(obj.url, obj.year), source, label: obj.name });
    else if (typeof obj.url === 'string' && isHttp(obj.url)) out.push({ url: obj.url, source, label: obj.name ?? obj.id ?? obj.url });
  }
  const iaBase = text.match(/const\s+ia\s*=\s*\(\w+\)\s*=>\s*`(https:\/\/archive\.org\/[^`$]*)\$\{/);
  if (iaBase) for (const m of text.matchAll(/\bia\('([\w.-]+)'\)/g)) out.push({ url: iaBase[1] + m[1], source, label: m[1] });
  return out;
}

export function dedupe(targets) {
  const seen = new Map();
  for (const t of targets) if (!seen.has(t.url)) seen.set(t.url, t);
  return [...seen.values()];
}

/** HEAD first, GET when HEAD is refused. ok = 2xx/3xx; 429 = rate-limited (not counted as dead). */
export async function checkUrl(url, fetchImpl = globalThis.fetch, timeout = TIMEOUT_MS) {
  const attempt = async (method) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new DOMException('timeout', 'TimeoutError')), timeout);
    try {
      const res = await fetchImpl(url, { method, redirect: 'follow', signal: ac.signal, headers: { 'user-agent': 'Mozilla/5.0 (warnet-link-check)' } });
      if (method === 'GET') res.body?.cancel?.();
      return { status: res.status };
    } catch (e) {
      return { status: 0, error: e.name === 'TimeoutError' || e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message) };
    } finally {
      clearTimeout(timer);
    }
  };
  let r = await attempt('HEAD');
  if (r.status === 0 || [400, 403, 404, 405, 501].includes(r.status)) r = await attempt('GET');
  if (r.status >= 200 && r.status < 400) return { ok: true, status: r.status };
  if (r.status === 429) return { ok: true, rateLimited: true, status: 429 };
  return { ok: false, status: r.status, error: r.error };
}

// The Internet Archive refuses connections (ECONNREFUSED) for a few minutes when a client goes
// above roughly 15 requests per minute, so archive.org URLs run one at a time with a gap, and a
// refused connection there counts as rate-limited, not dead.
export const ARCHIVE = /^https:\/\/([\w-]+\.)?archive\.org\//;
export const ARCHIVE_GAP_MS = 4500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function checkAll(targets, fetchImpl, { concurrency = 3, archiveGap = ARCHIVE_GAP_MS } = {}) {
  const results = new Array(targets.length);
  const idx = targets.map((_, k) => k);
  const archive = idx.filter((k) => ARCHIVE.test(targets[k].url));
  const other = idx.filter((k) => !ARCHIVE.test(targets[k].url));
  const run = async (k) => {
    let r = await checkUrl(targets[k].url, fetchImpl);
    if (!r.ok && ARCHIVE.test(targets[k].url) && /ECONNREFUSED|ECONNRESET/.test(r.error ?? '')) r = { ok: true, rateLimited: true, status: 0, error: r.error };
    results[k] = { ...targets[k], ...r };
  };
  let i = 0;
  const worker = async () => { while (i < other.length) await run(other[i++]); };
  const archiveQueue = async () => { for (const [n, k] of archive.entries()) { if (n) await sleep(archiveGap); await run(k); } };
  await Promise.all([archiveQueue(), ...Array.from({ length: Math.min(concurrency, other.length) }, worker)]);
  return results;
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '');

export function formatReport(results, date) {
  const dead = results.filter((r) => !r.ok);
  const limited = results.filter((r) => r.rateLimited);
  const lines = [
    `Cek link otomatis tanggal ${date}: **${dead.length} mati** dari ${results.length} link.`,
    '',
  ];
  if (dead.length) {
    lines.push('| Nama | URL | Sumber | Status |', '| --- | --- | --- | --- |');
    for (const r of dead) lines.push(`| ${cell(r.label)} | <${cell(r.url)}> | \`${cell(r.source)}\` | ${r.status || cell(r.error) || 'error'} |`);
    lines.push('', 'Untuk bookmark, ganti `year` ke tahun yang punya snapshot Wayback, atau hapus entrinya. Issue ini diperbarui tiap malam.');
  } else lines.push('Semua link hidup.');
  if (limited.length) lines.push('', `${limited.length} link kena rate limit dan dicek lagi besok.`);
  return lines.join('\n');
}

function collectTargets(root = '.') {
  const targets = [];
  const dataDir = join(root, 'data');
  if (existsSync(dataDir)) for (const f of readdirSync(dataDir).filter((n) => n.endsWith('.json')).sort()) {
    targets.push(...targetsFromJson(JSON.parse(readFileSync(join(dataDir, f), 'utf8')), `data/${f}`));
  }
  const dataJs = join(root, 'js', 'data.js');
  if (existsSync(dataJs)) targets.push(...targetsFromDataJs(readFileSync(dataJs, 'utf8')));
  return dedupe(targets);
}

async function upsertIssue(gh, repo, report, failed) {
  const q = encodeURIComponent(`repo:${repo} is:issue is:open in:title "${ISSUE_TITLE}" author:app/github-actions`);
  const found = (await gh.get(`/search/issues?q=${q}`)).items.find((i) => i.title === ISSUE_TITLE);
  if (failed > 0) {
    if (found) await gh.patch(`/repos/${repo}/issues/${found.number}`, { body: report });
    else await gh.post(`/repos/${repo}/issues`, { title: ISSUE_TITLE, body: report, labels: ['bug', 'konten'] });
  } else if (found) {
    await gh.post(`/repos/${repo}/issues/${found.number}/comments`, { body: 'Semua link hidup lagi. Issue ditutup otomatis.' });
    await gh.patch(`/repos/${repo}/issues/${found.number}`, { state: 'closed', state_reason: 'completed' });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, file] = process.argv.slice(2);
  if (cmd === 'run') {
    const results = await checkAll(collectTargets('.'));
    const failed = results.filter((r) => !r.ok).length;
    writeFileSync(file, formatReport(results, new Date().toISOString().slice(0, 10)));
    setOutput('failed', String(failed));
    console.log(`${failed} dead of ${results.length}`);
  } else if (cmd === 'issue') {
    const report = readFileSync(file, 'utf8');
    await upsertIssue(github(), process.env.GITHUB_REPOSITORY, report, Number(process.env.FAILED || 0));
  } else { console.error('usage: link-check.mjs run|issue <report.md>'); process.exit(2); }
}
