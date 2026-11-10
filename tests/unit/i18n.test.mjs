// Unit tests for the UI language switch: pickLang (js/params.js), fill (js/text.js),
// t()/tx() (js/i18n.js) and the English dictionary's completeness (js/i18n/en.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import './browser-env.mjs';
import { pickLang } from '../../js/params.js';
import { fill } from '../../js/text.js';
import EN from '../../js/i18n/en.js';

const REQ = 'Kelvin request 2026-11-08 "support multi language translation ebst practices english or indonesia read devices default"';

/** Every t('...') / t("...") / t(`...`) literal key in first-party code. */
export function usedKeys() {
  const files = [];
  const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
  walk('js');
  files.push('home.html');
  const keys = new Map();
  const call = /(?<![\w$.])t\(\s*(['"`])((?:\\[\s\S]|(?!\1)[^\\])*)\1/g;
  for (const f of files) {
    if (f === join('js', 'i18n', 'en.js')) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(call)) {
      assert.ok(!(m[1] === '`' && m[2].includes('${')), `${f}: t() keys must be literal; use {placeholders}: ${m[2].slice(0, 60)}`);
      keys.set(new Function(`return ${m[1]}${m[2]}${m[1]}`)(), f); // the string value, escapes resolved
    }
  }
  return keys;
}

// source: REQ (pick order: ?lang= > saved choice > navigator.languages > English)
test('pickLang: URL param beats saved choice beats browser languages beats English', () => {
  assert.equal(pickLang('?lang=en', 'id', ['id-ID']), 'en');
  assert.equal(pickLang('?lang=id', 'en', ['en-US']), 'id');
  assert.equal(pickLang('?lang=fr', 'en', ['id-ID']), 'en', 'unknown param falls through to the saved choice');
  assert.equal(pickLang('', 'id', ['en-US']), 'id');
  assert.equal(pickLang('', 'xx', ['id-ID']), 'id', 'unknown saved value falls through to the browser');
  assert.equal(pickLang('', null, ['en-GB', 'id']), 'en', 'first supported entry in list order wins');
  assert.equal(pickLang('', null, ['fr-FR', 'id-ID', 'en']), 'id');
  assert.equal(pickLang('', null, ['ID']), 'id', 'case-insensitive');
  assert.equal(pickLang('', null, ['in-ID']), 'id', 'legacy "in" code for Indonesian');
  assert.equal(pickLang('', null, ['fr-FR', 'de']), 'en');
  assert.equal(pickLang('', null, []), 'en');
});

// source: REQ (private mode: storage throws, the app must still boot)
test('i18n loads when localStorage throws, and setLang still works through the URL', async () => {
  const prev = globalThis.localStorage;
  const thrower = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); } };
  globalThis.localStorage = thrower;
  const replaced = [];
  globalThis.location = { search: '?lang=id', href: 'http://localhost/?seed=7', replace: (u) => replaced.push(u) };
  try {
    const m = await import(`../../js/i18n.js?throw=${Date.now()}`);
    assert.equal(m.LANG, 'id');
    m.setLang('id'); // already active: nothing to do
    assert.deepEqual(replaced, []);
    m.setLang('en', '#lock');
    assert.deepEqual(replaced, ['http://localhost/?seed=7&lang=en#lock']);
  } finally { globalThis.localStorage = prev; }
});

// source: REQ ({name} placeholders are filled in both languages)
test('fill replaces every {placeholder} from vars and leaves other text alone', () => {
  assert.equal(fill('Selamat datang, {user}! PC-{pc}', { user: 'ganteng_12', pc: '07' }), 'Selamat datang, ganteng_12! PC-07');
  assert.equal(fill('{n} objek, {n} lagi', { n: 3 }), '3 objek, 3 lagi');
  assert.equal(fill('tanpa placeholder', {}), 'tanpa placeholder');
  assert.equal(fill('{a}', { a: '{b}', b: 'x' }), '{b}', 'values are not re-scanned');
});

// source: REQ (missing translation falls back to the Indonesian source; Indonesian needs no dictionary)
test('t() returns the source (filled) when a key has no entry; tx() picks the source field in Indonesian', async () => {
  const { t, tx, LANG } = await import('../../js/i18n.js');
  assert.equal(LANG, 'id');
  assert.equal(t('Belum diterjemahkan {x}', { x: 1 }), 'Belum diterjemahkan 1');
  assert.equal(tx({ note: 'Catatan', note_en: 'Note' }, 'note'), 'Catatan');
});

// source: REQ (English visitors get the English entry; missing keys and missing _en fields fall back)
test('English: t() uses js/i18n/en.js, falls back to the source, tx() prefers *_en', async () => {
  const prev = globalThis.location;
  globalThis.location = { search: '?lang=en', href: 'http://localhost/' };
  try {
    const { t, tx, LANG } = await import(`../../js/i18n.js?en=${Date.now()}`);
    assert.equal(LANG, 'en');
    assert.equal(t('Masuk'), EN['Masuk']);
    assert.equal(t('Selamat datang, {user}!', { user: 'x' }), EN['Selamat datang, {user}!'].replace('{user}', 'x'));
    assert.equal(t('Kalimat tanpa terjemahan'), 'Kalimat tanpa terjemahan');
    assert.equal(tx({ note: 'Catatan', note_en: 'Note' }, 'note'), 'Note');
    assert.equal(tx({ note: 'Catatan' }, 'note'), 'Catatan');
  } finally { globalThis.location = prev; }
});

// source: REQ (every UI string has an English entry; no dead entries)
test('js/i18n/en.js covers every t() key in js/**/*.js and home.html, and has no unused entries', () => {
  const used = usedKeys();
  assert.ok(used.size > 100, `only ${used.size} keys found; is the scanner broken?`);
  const missing = [...used.keys()].filter((k) => !(k in EN)).map((k) => `${used.get(k)}: ${k}`);
  assert.deepEqual(missing, [], 'keys without an English entry');
  const unused = Object.keys(EN).filter((k) => !used.has(k));
  assert.deepEqual(unused, [], 'dictionary entries no code uses any more');
});

// source: REQ (translations keep the same {placeholders} and are real strings)
test('every English entry is a non-empty string with exactly the source placeholders', () => {
  const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const [k, v] of Object.entries(EN)) {
    assert.equal(typeof v, 'string', k);
    assert.ok(v.trim().length, k);
    assert.equal(ph(v), ph(k), `placeholders differ for: ${k}`);
  }
});

// source: REQ + AGENTS.md "FAN_DISCLAIMER must stay legally equivalent" (owner decision 2026-11-08, tier D)
test('English fan-port disclaimer keeps every legal element', () => {
  const key = Object.keys(EN).find((k) => k.startsWith('Port buatan fans, TIDAK resmi.'));
  assert.ok(key, 'FAN_DISCLAIMER has an English entry');
  const en = EN[key];
  for (const must of [/NOT official/i, /not affiliated with/i, /not endorsed by/i, /(do(es)? not|never) host/i, /third-party/i, /trademarks belong to their owners/i, /own risk/i, /copyright (owners|holders)/i, /Contact the Operator/i]) assert.match(en, must);
});
