// Content bot: turns an approved "Usul situs" issue (.github/ISSUE_TEMPLATE/usul-situs.yml)
// into a new entry in data/bookmarks.json. The workflow (content-bot.yml) opens the PR.
//   ISSUE_BODY=... node scripts/bots/content-bot.mjs [data/bookmarks.json]
// Step outputs: ok (true/false), name, year, errors (markdown list).
import { pathToFileURL } from 'node:url';
import { parseIssueForm, readJson, writeJson, setOutput } from './lib.mjs';

// Labels exactly as rendered by GitHub from the issue form.
export const FIELDS = {
  name: 'Nama situs / Site name',
  url: 'URL asli / Original URL',
  year: 'Tahun / Year',
  cat: 'Kategori / Category',
};
export const CATEGORIES = ['Berita', 'Portal', 'Komunitas', 'Hiburan', 'Cari', 'Email', 'Download', 'Game Online', 'Lainnya'];
export const YEAR_MIN = 1996;
export const YEAR_MAX = 2008;
export const NAME_MAX = 60;

/** True when the body comes from the usul-situs form (all required headings present). */
export function isUsulSitus(body) {
  const f = parseIssueForm(body);
  return Object.values(FIELDS).every((label) => label in f);
}

/** Canonical key for duplicate detection: host without www + path without trailing slash. */
export function urlKey(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch { return String(url).toLowerCase(); }
}

/** Validate a parsed form. Returns { ok, bookmark, errors }. Pure. */
export function validateSuggestion(fields, existing = []) {
  const errors = [];
  const name = String(fields[FIELDS.name] ?? '').trim();
  const rawUrl = String(fields[FIELDS.url] ?? '').trim();
  const rawYear = String(fields[FIELDS.year] ?? '').trim();
  const rawCat = String(fields[FIELDS.cat] ?? '').trim();

  if (!name) errors.push('Nama situs kosong.');
  else {
    if (Array.from(name).length > NAME_MAX) errors.push(`Nama situs maksimal ${NAME_MAX} karakter.`);
    if (/[<>]/.test(name) || /&[#a-z0-9]+;/i.test(name)) errors.push('Nama situs tidak boleh berisi HTML.');
    if (/[\u0000-\u001f\u007f]/.test(name)) errors.push('Nama situs berisi karakter aneh.');
  }

  let url = '';
  let parsed = null;
  try { parsed = new URL(rawUrl); } catch { /* handled below */ }
  if (!parsed || !/^https?:$/.test(parsed.protocol)) errors.push('URL harus diawali http:// atau https://.');
  else if (parsed.username || parsed.password) errors.push('URL tidak boleh berisi username/password.');
  else if (!parsed.hostname.includes('.')) errors.push('URL tidak valid.');
  else if (/(^|\.)archive\.org$/i.test(parsed.hostname)) errors.push('Pakai URL asli situsnya, bukan link Wayback (link Wayback dibuat otomatis).');
  else if (rawUrl.length > 300 || /[\s<>"'`]/.test(rawUrl)) errors.push('URL tidak valid.');
  else url = parsed.href;

  const year = /^\d{4}$/.test(rawYear) ? Number(rawYear) : NaN;
  if (!(year >= YEAR_MIN && year <= YEAR_MAX)) errors.push(`Tahun harus antara ${YEAR_MIN} dan ${YEAR_MAX}.`);

  const cat = rawCat.replace(/\s*\/\s*Other$/i, '').trim();
  if (!CATEGORIES.includes(cat)) errors.push('Kategori tidak dikenal.');

  if (url && existing.some((b) => urlKey(b.url) === urlKey(url))) errors.push('Situs ini sudah ada di bookmark.');

  return errors.length ? { ok: false, errors } : { ok: true, errors, bookmark: { name, url, year, cat } };
}

/** Append without mutating. */
export function appendBookmark(list, bookmark) {
  return [...list, { name: bookmark.name, url: bookmark.url, year: bookmark.year, cat: bookmark.cat }];
}

async function main() {
  const path = process.argv[2] || 'data/bookmarks.json';
  const body = process.env.ISSUE_BODY || '';
  if (!isUsulSitus(body)) {
    setOutput('ok', 'false');
    setOutput('errors', '- Issue ini bukan dari formulir Usul Situs, jadi bot tidak bisa memprosesnya.');
    return;
  }
  const existing = readJson(path, []);
  if (!Array.isArray(existing)) throw new Error(`${path} must be a JSON array`);
  const res = validateSuggestion(parseIssueForm(body), existing);
  setOutput('ok', String(res.ok));
  setOutput('errors', res.errors.map((e) => `- ${e}`).join('\n'));
  if (!res.ok) return;
  writeJson(path, appendBookmark(existing, res.bookmark));
  setOutput('name', res.bookmark.name);
  setOutput('year', String(res.bookmark.year));
  console.log(`Added ${res.bookmark.name} (${res.bookmark.year}) to ${path}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
