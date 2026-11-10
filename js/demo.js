// "Kilas Balik 60 detik": a scripted, skippable attract mode that replays an
// evening at the warnet with a fake cursor. Beats live in data/demo.json so
// the community can add memories. Any key/tap skips straight to the desktop.
import { h, esc } from './wm.js';
import { LINKS } from './data.js';
import { shareLinks } from './community.js';
import { track } from './stats.js';
import { t } from './i18n.js';

const sleep = (ms, signal) => new Promise((ok, no) => {
  const t = setTimeout(ok, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); no(new DOMException('skip', 'AbortError')); }, { once: true });
});

/** Wait for a selector to appear (or give up after `ms`). */
async function waitFor(sel, ms, signal) {
  for (let t = 0; t < ms; t += 100) {
    const el = document.querySelector(sel);
    if (el) return el;
    await sleep(100, signal);
  }
  return null;
}

/**
 * api: { boot, launch, balloon, timeout, toDesktop, speed }
 * Returns a promise that resolves when the demo ends or is skipped.
 */
export async function runDemo(api, beats) {
  const speed = api.speed || 1;
  const ctl = new AbortController();
  const { signal } = ctl;
  track('demo:start');
  document.body.classList.add('demo-on');
  const ui = h(`<div class="demo" aria-live="polite">
    <div class="demo-cursor" aria-hidden="true"></div>
    <div class="demo-cap"><span class="demo-text"></span><button class="demo-skip" type="button">${t('Lewati ⏭')}</button></div>
  </div>`);
  document.body.appendChild(ui);
  const cursor = ui.querySelector('.demo-cursor'), text = ui.querySelector('.demo-text');
  const caption = (c) => { if (c) text.textContent = c; };
  const point = async (el) => {
    const r = el.getBoundingClientRect();
    cursor.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px)`;
    await sleep(700 / speed, signal);
  };
  let skipped = false;
  const skip = (e) => {
    if (e && e.target.closest && e.target.closest('.demo-end')) return;
    if (skipped) return;
    skipped = true; ctl.abort();
  };
  ui.querySelector('.demo-skip').addEventListener('click', skip);
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip, true);
  const cleanup = () => {
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pointerdown', skip, true);
    ui.remove();
    document.body.classList.remove('demo-on');
  };

  try {
    for (const b of beats) {
      caption(b.caption);
      if (b.do === 'boot') { api.boot(); await waitFor('.lock form.billing', 20000, signal); await sleep(1500 / speed, signal); }
      if (b.do === 'click') {
        const el = await waitFor(b.target, b.wait || 3000, signal);
        if (el) { await point(el); el.click(); } else if (!b.optional) throw new Error(`demo: ${b.target} not found`);
        await sleep(1800 / speed, signal);
      }
      if (b.do === 'wait') await sleep(b.ms / speed, signal);
      if (b.do === 'waitFor') { if (!(await waitFor(b.target, b.ms, signal))) throw new Error(`demo: ${b.target} never appeared`); await sleep(1500 / speed, signal); }
      if (b.do === 'launch') { api.launch(b.app); await sleep(2600 / speed, signal); }
      if (b.do === 'balloon') { api.balloon(b.title, esc(b.text)); await sleep(2600 / speed, signal); }
      if (b.do === 'timeout') { api.timeout(); await sleep(3500 / speed, signal); }
      if (b.do === 'end') { cleanup(); track('demo:end'); return endCard(api); }
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.error(e);
    track('demo:skip');
  }
  cleanup();
  api.toDesktop();
  return 'skipped';
}

function endCard(api) {
  const text = t('Masih ingat billing lumba-lumba, BUZZ!!! dan "asl pls"? Main lagi di Warnet Nusantara.Net');
  const share = shareLinks(text, LINKS.site, 'demo');
  const card = h(`<div class="demo-end" role="dialog" aria-label="${t('Kilas Balik selesai')}">
    <h2>${t('Masih ingat semua ini?')}</h2>
    <p>${t('Warnetnya masih buka. Gratis. Selamanya.')}</p>
    <button class="btn primary" data-end="enter">${t('Masuk warnet →')}</button>
    <div class="demo-share">${share.map((s) => `<a class="btn" href="${esc(s.href)}" target="_blank" rel="noopener" data-share="${s.id}">${esc(s.label)}</a>`).join('')}</div>
    <button class="btn" data-end="donate">${t('☕ Dukung Warnet Ini')}</button>
  </div>`);
  document.body.appendChild(card);
  return new Promise((ok) => {
    card.addEventListener('click', (e) => {
      const s = e.target.closest('[data-share]');
      if (s) track(`share:${s.dataset.share}`);
      const a = e.target.closest('[data-end]')?.dataset.end;
      if (!a) return;
      card.remove();
      api.toDesktop();
      if (a === 'donate') api.launch('donate');
      ok(a);
    });
  });
}
