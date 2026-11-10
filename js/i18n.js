// UI language (Indonesian or English). Picked once at startup: ?lang=id|en, then the
// visitor's saved choice, then the browser's language list, then English.
// gettext style: the Indonesian source string IS the key. t('Masuk') returns the
// English entry from js/i18n/en.js when LANG is 'en', else the source string.
// The English dictionary is only downloaded by English visitors.
import { pickLang } from './params.js';
import { fill } from './text.js';

const KEY = 'lang';
const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export const LANG = pickLang(location.search, saved(), navigator.languages);
document.documentElement.lang = LANG;
const dict = LANG === 'en' ? (await import('./i18n/en.js')).default : {};

/** Translate an Indonesian source string; `{name}` placeholders are filled from vars. */
export const t = (src, vars = {}) => fill(dict[src] ?? src, vars);

/** Data field in the UI language: obj.note_en for English when present, else obj.note. */
export const tx = (obj, key) => (LANG === 'en' && obj[`${key}_en`]) || obj[key];

/** Save the choice (private mode: the URL still carries it) and reload. `hash` picks the screen to come back to. */
export function setLang(l, hash) {
  if (l === LANG) return;
  try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
  const u = new URL(location.href);
  u.searchParams.set(KEY, l);
  u.hash = hash;
  location.replace(u.href);
}
