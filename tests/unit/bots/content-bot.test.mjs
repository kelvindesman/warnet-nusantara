import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseIssueForm } from '../../../scripts/bots/lib.mjs';
import { FIELDS, isUsulSitus, validateSuggestion, appendBookmark, urlKey } from '../../../scripts/bots/content-bot.mjs';

const BODY = readFileSync(new URL('./fixtures/usul-situs-issue.md', import.meta.url), 'utf8');
const form = (over = {}) => ({ ...parseIssueForm(BODY), ...over });

// source: .github/ISSUE_TEMPLATE/usul-situs.yml fields (GitHub renders issue forms as "### Label" sections)
test('parses the usul-situs issue form body', () => {
  const f = parseIssueForm(BODY);
  assert.equal(f[FIELDS.name], 'Kafegaul');
  assert.equal(f[FIELDS.url], 'http://www.kafegaul.com/');
  assert.equal(f[FIELDS.year], '2002');
  assert.equal(f[FIELDS.cat], 'Komunitas');
  assert.equal(f['Link Wayback (opsional) / Wayback snapshot link (optional)'], '', '_No response_ means empty');
  assert.match(f['Kenapa situs ini penting? / Why does it belong here?'], /mid-line$/);
  assert.equal(isUsulSitus(BODY), true);
  assert.equal(isUsulSitus('### Apa yang terjadi?\n\nbug'), false);
});

// source: .github/ISSUE_TEMPLATE/usul-situs.yml fields + Kelvin request 2026-11-07 (bookmark shape {name,url,year,cat})
test('a valid suggestion becomes a bookmark with exactly name/url/year/cat', () => {
  const r = validateSuggestion(form(), []);
  assert.equal(r.ok, true);
  assert.deepEqual(r.bookmark, { name: 'Kafegaul', url: 'http://www.kafegaul.com/', year: 2002, cat: 'Komunitas' });
  const list = appendBookmark([{ name: 'detik.com', url: 'http://www.detik.com/', year: 2001, cat: 'Berita' }], r.bookmark);
  assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(list[1]), ['name', 'url', 'year', 'cat']);
});

// source: Kelvin request 2026-11-07 "validate (URL http(s), year 1996-2008, name <= 60 chars, no HTML)"
test('rejects non-http URLs, out-of-range years, long names and HTML', () => {
  const bad = [
    [{ [FIELDS.url]: 'javascript:alert(1)' }, /http/],
    [{ [FIELDS.url]: 'ftp://files.example.com/' }, /http/],
    [{ [FIELDS.url]: 'http://user:pw@example.com/' }, /password/],
    [{ [FIELDS.url]: 'https://web.archive.org/web/2002/http://www.kafegaul.com/' }, /Wayback/],
    [{ [FIELDS.year]: '1995' }, /1996/],
    [{ [FIELDS.year]: '2009' }, /2008/],
    [{ [FIELDS.year]: '2002abc' }, /Tahun/],
    [{ [FIELDS.name]: 'x'.repeat(61) }, /60/],
    [{ [FIELDS.name]: '<img src=x onerror=alert(1)>' }, /HTML/],
    [{ [FIELDS.name]: 'Kafe&lt;gaul' }, /HTML/],
    [{ [FIELDS.name]: '' }, /kosong/],
    [{ [FIELDS.cat]: 'Judi' }, /Kategori/],
  ];
  for (const [over, re] of bad) {
    const r = validateSuggestion(form(over), []);
    assert.equal(r.ok, false, JSON.stringify(over));
    assert.ok(r.errors.some((e) => re.test(e)), `${JSON.stringify(over)} -> ${r.errors}`);
  }
  assert.equal(validateSuggestion(form({ [FIELDS.name]: 'x'.repeat(60) }), []).ok, true);
});

// source: .github/ISSUE_TEMPLATE/usul-situs.yml category option "Lainnya / Other"
test('maps the "Lainnya / Other" option to Lainnya', () => {
  assert.equal(validateSuggestion(form({ [FIELDS.cat]: 'Lainnya / Other' }), []).bookmark.cat, 'Lainnya');
});

// source: CONTRIBUTING.md "Suggest a site" (no duplicate bookmarks)
test('rejects a site that is already bookmarked (www and trailing slash ignored)', () => {
  const r = validateSuggestion(form(), [{ name: 'KG', url: 'http://kafegaul.com', year: 2001, cat: 'Komunitas' }]);
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /sudah ada/);
  assert.equal(urlKey('http://WWW.Kafegaul.com/'), urlKey('http://kafegaul.com'));
});
