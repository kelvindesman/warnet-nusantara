// URL switches for tests, agents and demos. Imported first by main.js.
//   ?seed=N    deterministic Math.random (same voucher, same bots, same mines)
//   ?nosound   start muted
//   ?demo      play the "Kilas Balik 60 detik" attract mode
//   ?speed=N   demo speed multiplier (tests use 10)
//   ?lang=id|en UI language (see pickLang and js/i18n.js)
//   ?era=2003|2011|2015 which PC generation the warnet runs (see pickEra and js/era.js)
import { setMuted } from './sound.js';

/** mulberry32: tiny seeded PRNG returning floats in [0, 1). */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parse the switches from a query string. Pure so it can be unit tested. */
export function parseParams(search) {
  const q = new URLSearchParams(search);
  const raw = q.get('seed');
  const seed = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;
  const sp = Number(q.get('speed'));
  return { seed, nosound: q.has('nosound'), demo: q.has('demo'), speed: sp > 0 && sp <= 20 ? sp : 1 };
}

/** UI language: `?lang=` beats a saved choice, which beats the browser's language list
 *  (first id/en entry wins, "in" is the legacy code for Indonesian); anything else gets English. */
export function pickLang(search, stored, languages) {
  const ok = (l) => l === 'id' || l === 'en';
  const p = new URLSearchParams(search).get('lang');
  if (ok(p)) return p;
  if (ok(stored)) return stored;
  for (const l of languages) { const s = String(l).toLowerCase().split('-')[0].replace(/^in$/, 'id'); if (ok(s)) return s; }
  return 'en';
}

/** PC era: `?era=` beats the visitor's saved pick; anything unknown falls back to 2003. */
export const ERA_IDS = ['2003', '2011', '2015'];
export function pickEra(search, stored) {
  const p = new URLSearchParams(search).get('era');
  return [p, stored].find((e) => ERA_IDS.includes(e)) || '2003';
}

export function applyParams(search = location.search) {
  const p = parseParams(search);
  if (p.seed !== null) Math.random = seeded(p.seed);
  if (p.nosound) setMuted(true);
  return p;
}
