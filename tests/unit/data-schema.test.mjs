// Schema checks for community-editable content in data/*.json.
// Content PRs can auto-merge only because these checks (plus e2e) gate them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './browser-env.mjs';
import { TIERS } from '../../js/community.js';

const read = (f) => JSON.parse(readFileSync(`data/${f}.json`, 'utf8'));
const NO_HTML = /[<>"`]|javascript:/i;
const httpUrl = (u) => typeof u === 'string' && /^https?:\/\/[^\s"'<>`]+$/.test(u);
const httpsUrl = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>`]+$/.test(u);
// Fan-made browser ports are linked out only (owner decision 2026-11-08). A content PR can add a port only on a host a maintainer already reviewed here.
const FANPORT_HOSTS = ['revc.wasm.ltd', 'm1stermo.github.io', 'x8bitrain.github.io', 'generals.wasm.ltd', 'iker3329.github.io', 'nfsu2.xyz', 'diablo2.virtastic.app', 'mitchellhynes.com', 'q3js.com', 'game.chronodivide.com', 'play.lostarena.online', 'playigi.com', 'pes6.optijuegos.net', 'gunz.sigr.io', 'dannishen60.github.io', 'crashbash.app', 'outbreakweb.com', 'quenq.com', 'shar-wasm.cjoseph.workers.dev', 'tkdr-recomp.pages.dev', 'b1t64.github.io', 'mgs.ravenlight.net', 'phoboslab.org', 'isle.pizza', 'midzer.de', 'playeaw.com', 'www.retrogames.cc'];
const GAME_HOSTS = ['archive.org', 'd07riv.github.io', 'alula.github.io', 'pinball.alula.me', 'www.netquake.io', 'supertux.semphris.com', 'www.linerider.com', 'princejs.com', 'play-cs.com', 'dos.zone', '98.js.org'];

// source: plan "Content becomes data, not code ... CI validates against the schema (URL allowlist)"
// Snapshot years per PC era (Kelvin request 2026-11-08: era content); rows without `era` are the 2003 PC.
const ERA_YEARS = { 2003: [1996, 2008], 2011: [2008, 2012], 2015: [2012, 2015] };
test('bookmarks: name/url/year/cat (+ optional era, hit, hit_en), snapshot year fits the era, no HTML', () => {
  const b = read('bookmarks');
  assert.ok(b.length > 0);
  const names = new Set();
  for (const x of b) {
    for (const k of Object.keys(x)) assert.ok(['cat', 'name', 'url', 'year', 'era', 'hit', 'hit_en'].includes(k), `${x.name}: ${k}`);
    assert.ok(x.name.length <= 60 && !NO_HTML.test(x.name), x.name);
    assert.ok(httpUrl(x.url), x.url);
    const era = x.era ?? '2003';
    assert.ok(ERA_YEARS[era] && era !== '2003' || x.era === undefined, `${x.name}: era ${x.era}`);
    const [lo, hi] = ERA_YEARS[era];
    assert.ok(Number.isInteger(x.year) && x.year >= lo && x.year <= hi, `${x.name} ${x.year}`);
    assert.ok(x.cat && !NO_HTML.test(x.cat));
    for (const k of ['hit', 'hit_en']) if (x[k] !== undefined) assert.ok(typeof x[k] === 'string' && x[k].trim() && x[k].length <= 60 && !NO_HTML.test(x[k]), `${x.name}: ${k}`);
    if (x.hit_en !== undefined) assert.ok(x.hit, `${x.name}: hit_en without hit`);
    const key = `${era}:${x.name}`;
    assert.ok(!names.has(key), `duplicate ${key}`); names.add(key);
  }
  for (const era of Object.keys(ERA_YEARS)) assert.ok(b.filter((x) => (x.era ?? '2003') === era && x.hit).length >= 3, `era ${era} needs portal hits`);
});

// source: plan "URL allowlist ... known game hosts"; .claude/skills/add-game legality tiers
test('games: unique ids, valid mode, https URL on an allowlisted host', () => {
  const ids = new Set();
  for (const g of read('games')) {
    assert.match(g.id, /^[a-z0-9]+$/);
    assert.ok(!ids.has(g.id), `duplicate ${g.id}`); ids.add(g.id);
    assert.ok(['local', 'embed', 'tab', 'shrine', 'fanport'].includes(g.mode), g.id);
    assert.ok(g.name && !NO_HTML.test(g.name) && !NO_HTML.test(g.note || ''), g.id);
    assert.ok(Number.isInteger(g.year) && g.year >= 1980 && g.year <= 2015, g.id); // warnet eras run to 2015 (Kelvin request 2026-11-08 "until 2012,2013,2014,2015")
    if (g.hot !== undefined) { // "Lagi rame" on a newer PC; fan ports stay in their own group next to the disclaimer
      assert.ok(Array.isArray(g.hot) && g.hot.length && g.hot.every((e) => ['2011', '2015'].includes(e)), g.id);
      assert.notEqual(g.mode, 'fanport', g.id);
    }
    if (g.console !== undefined) assert.equal(g.mode, 'fanport', g.id); // only fan ports sit on the PS shelf
    if (g.mode === 'local') { assert.equal(g.url, undefined); continue; }
    if (g.mode === 'shrine') { // tier C: never a playable URL, only the old site (Wayback) and the official page
      assert.equal(g.url, undefined, g.id);
      assert.match(g.site, /^https?:\/\/[^\s"'<>]+$/, g.id);
      assert.ok(Number.isInteger(g.siteYear) && g.siteYear >= 1996 && g.siteYear <= 2015, g.id);
      if (g.official !== undefined) assert.ok(httpsUrl(g.official), g.id);
      continue;
    }
    if (g.mode === 'fanport') { // linked out only, never framed; a dead port keeps its news story and no playable URL
      assert.equal(g.desktop, false, g.id);
      if (g.console !== undefined) assert.ok(['ps1', 'ps2'].includes(g.console), g.id); // the rental PS shelf (Kelvin request 2026-11-10 "include retrogames psx ps2 collection")
      assert.ok(['live', 'down'].includes(g.status), g.id);
      if (g.news !== undefined) assert.ok(httpsUrl(g.news), g.id);
      if (g.status === 'down') { assert.equal(g.url, undefined, g.id); assert.ok(g.news, g.id); continue; }
      assert.ok(httpsUrl(g.url), g.url);
      assert.ok(FANPORT_HOSTS.includes(new URL(g.url).hostname), `fan-port host not allowlisted: ${g.url}`);
      continue;
    }
    assert.ok(httpsUrl(g.url), g.url);
    assert.ok(GAME_HOSTS.includes(new URL(g.url).hostname), `host not allowlisted: ${g.url}`);
  }
});

const REQ_I18N = 'Kelvin request 2026-11-08 "support multi language translation ebst practices english or indonesia read devices default"';
/** Optional English twins (`<field>_en`) get the same checks as their Indonesian source field. */
const twin = (obj, field, max, where, bad = NO_HTML) => {
  const v = obj[`${field}_en`];
  if (v === undefined) return;
  assert.ok(obj[field] !== undefined, `${where}: ${field}_en without ${field}`);
  assert.ok(typeof v === 'string' && v.trim() && v.length <= max && !bad.test(v), `${where}: ${field}_en ${v}`);
};

// source: REQ_I18N (games.json note_en: same rules as note)
test('games: note and optional note_en are plain text, at most 160 chars', () => {
  for (const g of read('games')) {
    assert.ok((g.note || '').length <= 160, g.id);
    twin(g, 'note', 160, g.id);
    for (const k of Object.keys(g)) if (k.endsWith('_en')) assert.ok(['note_en', 'broken_en'].includes(k), `${g.id}: only note and broken have an English twin, not ${k}`);
  }
});

// source: Kelvin request 2026-11-08 "ensure all game is web ready palyable active and can be loaded in brwoser anything that not playable should have note and less priority"
test('games: a "broken" note (from scripts/games-live.mjs) is short plain text with an English twin, only on games that have a URL', () => {
  for (const g of read('games')) {
    if (g.broken === undefined) { assert.equal(g.broken_en, undefined, g.id); continue; }
    assert.ok(typeof g.broken === 'string' && g.broken.trim() && g.broken.length <= 160 && !NO_HTML.test(g.broken), g.id);
    assert.ok(g.url, `${g.id}: broken note on a game without a playable URL`);
    assert.ok(g.broken_en, `${g.id}: broken needs broken_en`);
    twin(g, 'broken', 160, g.id);
  }
});

// source: REQ_I18N (demo.json beats: optional caption_en/title_en/text_en, same rules as the source field)
test('demo: beats have a known action, plain-text captions, and _en twins follow the same rules', () => {
  const PLAIN = /[<>`]|javascript:/i; // captions may quote people ("MAS, NAMBAH SEJAM!"); they are set with textContent / esc()
  const DO = ['boot', 'click', 'wait', 'waitFor', 'launch', 'balloon', 'timeout', 'end'];
  for (const [i, b] of read('demo').beats.entries()) {
    assert.ok(DO.includes(b.do), `beat ${i}: ${b.do}`);
    for (const f of ['caption', 'title', 'text']) {
      if (b[f] !== undefined) assert.ok(typeof b[f] === 'string' && b[f].length <= 140 && !PLAIN.test(b[f]), `beat ${i}: ${f}`);
      twin(b, f, 140, `beat ${i}`, PLAIN);
    }
    for (const k of Object.keys(b)) if (k.endsWith('_en')) assert.ok(['caption_en', 'title_en', 'text_en'].includes(k), `beat ${i}: ${k}`);
  }
});

// source: plan "data/irc.json" (bot lines are community content)
test('irc: channels start with #, nick/line strings without HTML, replies use {me}', () => {
  const irc = read('irc');
  assert.equal(typeof irc.server, 'string');
  for (const [ch, nicks] of Object.entries(irc.channels)) {
    assert.match(ch, /^#[a-z0-9]+$/);
    assert.ok(nicks.length && nicks.every((n) => typeof n === 'string' && n.length <= 20 && !/[<>"]/.test(n)), ch);
  }
  for (const l of [...irc.lines, ...irc.replies]) assert.ok(typeof l === 'string' && l.length <= 140 && !/[<>]/.test(l), l);
  assert.ok(irc.replies.every((r) => r.includes('{me}')));
  // era chatter (Kelvin request 2026-11-08: era content): same rules, only newer PCs
  assert.deepEqual(Object.keys(irc.eras).sort(), ['2011', '2015']);
  for (const [era, e] of Object.entries(irc.eras)) {
    assert.match(e.since, new RegExp(`^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) [A-Z][a-z]{2} \\d{1,2} ${era}$`));
    assert.ok(e.lines.length >= 10 && e.replies.length >= 5, era);
    for (const l of [...e.lines, ...e.replies]) assert.ok(typeof l === 'string' && l.length <= 140 && !/[<>]/.test(l), l);
    assert.ok(e.replies.every((r) => r.includes('{me}')), era);
  }
});

// source: Kelvin request 2026-11-07 supporters (name, tier, message ≤140, never email/amount)
test('supporters: allowed fields only, known tier, message ≤ 140, https sponsor URL', () => {
  for (const s of read('supporters')) {
    for (const k of Object.keys(s)) assert.ok(['name', 'tier', 'platform', 'date', 'message', 'url', 'hidden'].includes(k), `field ${k}`);
    assert.ok(s.name && s.name.length <= 40);
    assert.ok(TIERS[s.tier], s.tier);
    assert.match(s.date, /^\d{4}-\d{2}-\d{2}$/);
    if (s.message) assert.ok(s.message.length <= 140);
    if (s.url) { assert.equal(s.tier, 'iklan'); assert.ok(httpsUrl(s.url)); }
  }
});

// source: plan "Discord placeholder ... Invite URL lives in data/links.json; empty = segera hadir"
test('links: repo/site https, optional links empty or https, analytics endpoint shape', () => {
  const l = read('links');
  assert.ok(httpsUrl(l.repo) && httpsUrl(l.site));
  for (const v of [l.discord, ...Object.values(l.donate)]) assert.ok(v === '' || httpsUrl(v), v);
  assert.ok(l.goatcounter === '' || /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(l.goatcounter));
  assert.ok(l.contactEmail === '' || /^[^@\s]+@[^@\s]+$/.test(l.contactEmail));
});

// source: MAINTAINERS.md roles
test('maintainers: name + role from the ladder', () => {
  for (const m of read('maintainers')) assert.ok(m.name && ['owner', 'maintainer', 'triager'].includes(m.role));
});
