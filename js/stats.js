// Anonymous, cookieless usage counts (GoatCounter). Aggregate only: no cookies,
// no personal data, no fingerprinting. Off until data/links.json sets
// "goatcounter" (e.g. "https://<code>.goatcounter.com/count"), off for
// Do-Not-Track, and it can never throw into the app.
import { LINKS } from './data.js';

const queue = [];
let state = 'idle'; // idle | loading | ready | off

export function enabled(links = LINKS, nav = globalThis.navigator) {
  return /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(links.goatcounter || '') && nav?.doNotTrack !== '1' && nav?.globalPrivacyControl !== true;
}

/** Event name → a stable, path-like key GoatCounter can group. */
export const eventPath = (name) => String(name).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').slice(0, 80);

function flush() {
  const gc = window.goatcounter;
  if (!gc || typeof gc.count !== 'function') return;
  while (queue.length) {
    const path = queue.shift();
    try { gc.count({ path, title: path, event: true }); } catch { /* never break the warnet */ }
  }
}

function load() {
  state = 'loading';
  window.goatcounter = { no_onload: true, allow_local: false };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = LINKS.goatcounter;
  s.onload = () => { state = 'ready'; flush(); };
  s.onerror = () => { state = 'off'; queue.length = 0; };
  document.head.appendChild(s);
}

export function track(name) {
  if (state === 'off') return;
  if (state === 'idle' && !enabled()) { state = 'off'; return; }
  queue.push(eventPath(name));
  if (state === 'idle') load(); else if (state === 'ready') flush();
}
