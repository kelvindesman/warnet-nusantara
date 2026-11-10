// Minimal window manager: drag, resize, focus, minimize, maximize, taskbar sync.
import { icon } from './icons.js';
import { ding } from './sound.js';

/** @param {string} html @returns {WarnetEl} */
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return /** @type {WarnetEl} */ (t.content.firstElementChild); };
import { esc } from './text.js';
export { esc };

const wins = new Map();
let z = 100;
let layer, taskList, cascade = 0;
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((fn) => fn([...wins.values()]));

export function initWM(desktopEl, tasksEl) {
  layer = desktopEl; taskList = tasksEl;
  listeners.clear();
  wins.clear();
}
export const getWin = (id) => wins.get(id);
export const allWins = () => [...wins.values()];
const isSmall = () => window.innerWidth < 700;

export function openWindow(opts) {
  const { id = 'w' + Math.random().toString(36).slice(2), title, iconName = 'txt', width = 520, height = 380, resizable = true, maximizable = true, onClose, single = true } = opts;
  if (single && wins.has(id)) { const w = wins.get(id); restore(w); focus(w); return w; }
  const W = Math.min(width, layer.clientWidth - 8), H = Math.min(height, layer.clientHeight - 40);
  cascade = (cascade + 1) % 8;
  const x = opts.x ?? Math.max(4, Math.round((layer.clientWidth - W) / 2 - 90 + cascade * 26));
  const y = opts.y ?? Math.max(4, Math.round((layer.clientHeight - 32 - H) / 2 - 60 + cascade * 22));
  const el = h(`<div class="win opening" role="dialog" aria-label="${esc(title)}" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">
    <div class="titlebar"><span class="ti">${icon(iconName)}</span><span class="tt">${esc(title)}</span>
      <button class="tbtn mn" title="Minimize" aria-label="Minimize">${icon('min')}</button>
      ${maximizable ? `<button class="tbtn mx" title="Maximize" aria-label="Maximize">${icon('max')}</button>` : ''}
      <button class="tbtn close" title="Close" aria-label="Close">${icon('close')}</button></div>
    <div class="win-body"></div><div class="shield"></div>${resizable ? '<div class="resize"></div>' : ''}</div>`);
  const w = { id, el, title, iconName, body: el.querySelector('.win-body'), onClose, cleanup: [] };
  w.setTitle = (t) => { w.title = t; el.querySelector('.tt').textContent = t; emit(); };
  w.close = () => close(w);
  w.shake = () => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  wins.set(id, w);
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.classList.remove('opening'), { once: true });
  el.addEventListener('pointerdown', () => focus(w), true);
  el.querySelector('.mn').onclick = (e) => { e.stopPropagation(); minimize(w); };
  el.querySelector('.close').onclick = (e) => { e.stopPropagation(); close(w); };
  const mx = el.querySelector('.mx');
  if (mx) { mx.onclick = (e) => { e.stopPropagation(); toggleMax(w); }; el.querySelector('.titlebar').ondblclick = (e) => { if (!e.target.closest('.tbtn')) toggleMax(w); }; }
  dragify(w);
  if (resizable) resizify(w);
  if (isSmall() && maximizable) toggleMax(w, true);
  focus(w);
  opts.content?.(w.body, w);
  emit();
  return w;
}

function dragify(w) {
  const bar = w.el.querySelector('.titlebar');
  bar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.tbtn') || w.el.classList.contains('max')) return;
    const sx = e.clientX, sy = e.clientY, ox = w.el.offsetLeft, oy = w.el.offsetTop;
    bar.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
    const move = (ev) => {
      const nx = Math.min(Math.max(ox + ev.clientX - sx, -w.el.offsetWidth + 60), layer.clientWidth - 60);
      const ny = Math.min(Math.max(oy + ev.clientY - sy, 0), layer.clientHeight - 60);
      w.el.style.left = nx + 'px'; w.el.style.top = ny + 'px';
    };
    const up = () => { bar.removeEventListener('pointermove', move); document.body.classList.remove('dragging'); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up, { once: true });
    bar.addEventListener('pointercancel', up, { once: true });
  });
}

function resizify(w) {
  const grip = w.el.querySelector('.resize');
  grip.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight;
    grip.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
    const move = (ev) => { w.el.style.width = Math.max(220, ow + ev.clientX - sx) + 'px'; w.el.style.height = Math.max(140, oh + ev.clientY - sy) + 'px'; };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', () => { grip.removeEventListener('pointermove', move); document.body.classList.remove('dragging'); }, { once: true });
  });
}

export function focus(w) {
  if (!w) return;
  for (const o of wins.values()) o.el.classList.toggle('inactive', o !== w);
  if (w.el.style.zIndex != z) w.el.style.zIndex = ++z;
  active = w; emit();
}
let active = null;
export const activeWin = () => active;

export function minimize(w) { w.el.classList.add('min'); if (active === w) active = null; for (const o of wins.values()) o.el.classList.add('inactive'); emit(); }
export function restore(w) { w.el.classList.remove('min'); }
export function toggleMax(w, force) {
  const on = force ?? !w.el.classList.contains('max');
  w.el.classList.toggle('max', on);
  const b = w.el.querySelector('.mx'); if (b) b.innerHTML = icon(on ? 'restore' : 'max');
}
export function close(w) {
  if (!wins.has(w.id)) return;
  if (w.onClose && w.onClose() === false) return;
  w.cleanup.forEach((fn) => { try { fn(); } catch {} });
  w.el.remove(); wins.delete(w.id);
  if (active === w) { active = null; const top = [...wins.values()].filter((x) => !x.el.classList.contains('min')).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; if (top) focus(top); }
  emit();
}
export function closeAll() { for (const w of [...wins.values()]) { w.onClose = null; close(w); } }

export function taskClick(w) {
  if (w.el.classList.contains('min')) { restore(w); focus(w); }
  else if (active === w) minimize(w);
  else focus(w);
}

/** Classic message box. Returns a promise with the clicked button label. */
export function msgbox(title, text, { kind = 'info', buttons = ['OK'], width = 340 } = {}) {
  ding(kind === 'error' ? 'error' : 'info');
  return new Promise((resolve) => {
    const w = openWindow({
      id: 'msg' + Math.random(), single: false, title, iconName: kind, width, height: 150, resizable: false, maximizable: false,
      onClose: () => resolve(null),
      content: (body) => {
        body.innerHTML = `<div class="dialog"><svg class="big"></svg><div>${text}</div></div><div class="dialog-btns"></div>`;
        body.querySelector('svg.big').outerHTML = icon(kind).replace('<svg', '<svg class="big"');
        const bx = body.querySelector('.dialog-btns');
        buttons.forEach((b, i) => {
          const btn = h(`<button class="btn ${i === 0 ? 'primary' : ''}">${esc(b)}</button>`);
          btn.onclick = () => { w.onClose = null; close(w); resolve(b); };
          bx.appendChild(btn);
          if (i === 0) setTimeout(() => btn.focus(), 30);
        });
      },
    });
    // size to content
    requestAnimationFrame(() => { const need = w.body.scrollHeight + 34; w.el.style.height = Math.min(need, layer.clientHeight - 40) + 'px'; });
  });
}

/** Menu bar markup ("File Edit View ..."); wire the menus with wireMenus(). */
export const menubar = (...names) => `<div class="menubar">${names.map((n) => `<button type="button" data-menu="${n}" aria-haspopup="menu">${n}</button>`).join('')}</div>`;

/** Clicking a [data-menu] inside scope drops down menus[name](): [label, fn] items (no fn = greyed out) and '-' separators. */
export function wireMenus(scope, menus) {
  scope.addEventListener('click', (e) => { const m = e.target.closest('[data-menu]'); if (m) dropMenu(m, menus[m.dataset.menu]()); });
}

/** Menu element from items ([label, fn | null] or '-'); picking runs fn and closes it, Escape closes it. */
function menuEl(items, cls, onEsc) {
  document.querySelector('.ctx')?.remove();
  const acts = items.filter((it) => it !== '-');
  const m = h(`<div class="${cls}" role="menu">${items.map((it) => (it === '-' ? '<hr>' : `<button type="button" role="menuitem"${it[1] ? '' : ' disabled'}>${esc(it[0])}</button>`)).join('')}</div>`);
  m.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.remove(); acts[[...m.querySelectorAll('button')].indexOf(b)][1](); };
  m.onkeydown = (e) => { if (e.key === 'Escape') { m.remove(); onEsc(); } };
  return m;
}

/** Drop-down menu under `anchor`, inside its window. Closes on pick, Escape or a click elsewhere (the desktop removes any .ctx). */
export function dropMenu(anchor, items) {
  const win = anchor.closest('.win'), a = anchor.getBoundingClientRect(), r = win.getBoundingClientRect();
  const m = menuEl(items, 'ctx drop', () => anchor.focus());
  m.style.left = a.left - r.left + 'px'; m.style.top = a.bottom - r.top + 'px';
  win.appendChild(m);
  m.querySelector('button:not(:disabled)')?.focus();
}

/** Right-click menu at viewport point (x, y), kept inside `host`. Same items and closing rules as dropMenu. */
export function ctxMenu(host, x, y, items) {
  const back = /** @type {HTMLElement} */ (document.activeElement);
  const m = menuEl(items, 'ctx pop', () => back.focus());
  host.appendChild(m);
  m.style.left = Math.max(0, Math.min(x, host.clientWidth - m.offsetWidth)) + 'px';
  m.style.top = Math.max(0, Math.min(y, host.clientHeight - m.offsetHeight)) + 'px';
  m.querySelector('button:not(:disabled)').focus();
}
