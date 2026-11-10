// Ranjau — classic mine-sweeping puzzle, written from scratch.
import { openWindow } from '../wm.js';
import { ding } from '../sound.js';
import { t } from '../i18n.js';

const MODES = { Pemula: [9, 9, 10], Menengah: [16, 16, 40], Jago: [30, 16, 99] };
const LABELS = { Pemula: t('Pemula'), Menengah: t('Menengah'), Jago: t('Jago') };
const COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000', '#808080'];

export function open(mode = 'Pemula') {
  const [cols, rows] = MODES[mode];
  return openWindow({
    id: 'ranjau', title: 'Ranjau', iconName: 'mine', width: Math.max(240, cols * 22 + 40), height: rows * 22 + 150, resizable: false, maximizable: false,
    content: (body, win) => game(body, win, mode),
  });
}

function game(body, win, mode) {
  const [W, H, M] = MODES[mode];
  body.innerHTML = `<div class="ranjau">
    <div class="rj-modes">${Object.keys(MODES).map((m) => `<button class="btn ${m === mode ? 'primary' : ''}" data-m="${m}">${LABELS[m]}</button>`).join('')}</div>
    <div class="rj-top" style="width:${W * 22 + 6}px"><span class="rj-lcd" data-left>000</span><button class="rj-face" aria-label="${t('Baru')}">🙂</button><span class="rj-lcd" data-time>000</span></div>
    <div class="rj-grid" style="grid-template-columns:repeat(${W},22px)"></div></div>`;
  const grid = body.querySelector('.rj-grid'), face = body.querySelector('.rj-face');
  const lcdLeft = body.querySelector('[data-left]'), lcdTime = body.querySelector('[data-time]');
  let cells, mines, opened, flags, over, started, timer, secs;
  const pad = (n) => (n < 0 ? '-' + String(Math.min(99, -n)).padStart(2, '0') : String(Math.min(999, n)).padStart(3, '0'));
  const idx = (x, y) => y * W + x;
  const around = (i) => { const x = i % W, y = (i / W) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) r.push(idx(nx, ny)); } return r; };

  function reset() {
    clearInterval(timer); secs = 0; over = false; started = false; opened = 0; flags = new Set(); mines = new Set();
    face.textContent = '🙂'; lcdTime.textContent = '000'; lcdLeft.textContent = pad(M);
    grid.innerHTML = '';
    cells = Array.from({ length: W * H }, (_, i) => { const b = document.createElement('button'); b.className = 'rj-c'; b.dataset.i = String(i); grid.appendChild(b); return b; });
  }
  function plant(safe) {
    const no = new Set([safe, ...around(safe)]);
    while (mines.size < M) { const r = (Math.random() * W * H) | 0; if (!no.has(r)) mines.add(r); }
    started = true; timer = setInterval(() => { secs++; lcdTime.textContent = pad(secs); }, 1000);
  }
  function reveal(i) {
    const stack = [i];
    while (stack.length) {
      const c = stack.pop(), el = cells[c];
      if (el.classList.contains('open') || flags.has(c)) continue;
      el.classList.add('open'); opened++;
      const n = around(c).filter((a) => mines.has(a)).length;
      if (n) { el.textContent = n; el.style.color = COLORS[n]; } else stack.push(...around(c));
    }
  }
  function click(i) {
    if (over || flags.has(i)) return;
    if (!started) plant(i);
    const el = cells[i];
    if (el.classList.contains('open')) { // chord
      const nb = around(i), n = nb.filter((a) => mines.has(a)).length;
      if (nb.filter((a) => flags.has(a)).length === n) nb.forEach((a) => { if (!cells[a].classList.contains('open') && !flags.has(a)) step(a); });
    } else step(i);
    check();
  }
  function step(i) {
    if (mines.has(i)) {
      over = true; clearInterval(timer); face.textContent = '😵'; ding('error');
      mines.forEach((m) => { cells[m].textContent = '💣'; cells[m].classList.add('open'); });
      cells[i].classList.add('boom'); win.shake();
      return;
    }
    reveal(i);
  }
  function check() {
    if (!over && opened === W * H - M) {
      over = true; clearInterval(timer); face.textContent = '😎'; ding();
      mines.forEach((m) => { cells[m].textContent = '🚩'; });
      lcdLeft.textContent = '000';
    }
  }
  function flag(i) {
    if (over || cells[i].classList.contains('open')) return;
    if (flags.has(i)) { flags.delete(i); cells[i].textContent = ''; } else { flags.add(i); cells[i].textContent = '🚩'; }
    lcdLeft.textContent = pad(M - flags.size);
  }

  let pressT;
  grid.addEventListener('click', (e) => { const b = e.target.closest('.rj-c'); if (b && !b.dataset.long) click(+b.dataset.i); if (b) delete b.dataset.long; });
  grid.addEventListener('contextmenu', (e) => { e.preventDefault(); const b = e.target.closest('.rj-c'); if (b) flag(+b.dataset.i); });
  // long-press to flag on touch
  grid.addEventListener('pointerdown', (e) => {
    if (!over) face.textContent = '😮';
    const b = e.target.closest('.rj-c'); if (!b || e.pointerType !== 'touch') return;
    pressT = setTimeout(() => { b.dataset.long = 1; flag(+b.dataset.i); }, 400);
  });
  const up = () => { clearTimeout(pressT); if (!over) face.textContent = '🙂'; };
  grid.addEventListener('pointerup', up); grid.addEventListener('pointerleave', up);
  face.onclick = reset;
  body.querySelector('.rj-modes').onclick = (e) => {
    const m = e.target.closest('[data-m]')?.dataset.m; if (!m || m === mode) return;
    win.onClose = null; win.close(); open(m);
  };
  win.cleanup.push(() => clearInterval(timer));
  reset();
}
