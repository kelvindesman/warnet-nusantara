// Boot sequence → warnet billing lock (the dolphin) → welcome → desktop.
import { applyParams } from './params.js';
import { LANG, t, tx, setLang } from './i18n.js';
import { icon, gameIcon } from './icons.js';
import { h, esc, initWM, onChange, taskClick, closeAll, msgbox, allWins, ctxMenu, minimize, restore, focus, toggleMax, close } from './wm.js';
import { chime, door, ding, setMuted, isMuted, audio } from './sound.js';
import { GAMES, SUPPORTERS, LINKS, DEMO } from './data.js';
import { tickerItems, donateOptions, supportUrl, shareLinks, sessionBrag } from './community.js';
import { track } from './stats.js';
import { ERAS, era, eraId, setEra, frozen, locked } from './era.js';
import { session, newVoucher, startBilling, remaining, used, addTime, fmt, rupiah } from './state.js';

const params = applyParams();
const root = document.getElementById('root');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const coarse = () => window.matchMedia('(pointer: coarse)').matches;
let billTimer, clockTimer, offWinamp;
let warnMinutes = 5; // billing "Time Warning": balloon this many minutes before time runs out (0 = never)
// Bumped by every screen change, so a slow screen (BIOS, welcome) that was
// overtaken (demo skip, deep link) does not jump back when its timers finish.
let screenGen = 0;

/* ------------------------------------------------------------------ apps */
const APPS = {
  browser: { name: t('Penjelajah Internet'), icon: 'internet', run: async (arg) => (await import('./apps/browser.js')).openBrowser(arg) },
  winamp: { name: 'Winamp', icon: 'winamp', run: async () => (await import('./apps/winamp.js')).openWinamp() },
  games: { name: 'Game Warnet', icon: 'games', run: async () => (await import('./apps/games.js')).openGamesFolder() },
  chat: { name: 'IRC Chat', icon: 'chat', run: async () => (await import('./apps/chat.js')).openChat() },
  ym: { name: 'Messenger', icon: 'messenger', run: async () => (await import('./apps/messenger.js')).openMessenger() },
  ranjau: { name: 'Ranjau', icon: 'mine', run: async () => (await import('./apps/ranjau.js')).open() },
  ular: { name: 'Ular HP', icon: 'snake', run: async () => (await import('./apps/ular.js')).open() },
  computer: { name: 'My Computer', icon: 'computer', run: async () => (await import('./apps/misc.js')).openComputer() },
  docs: { name: 'My Documents', icon: 'docs', run: async () => (await import('./apps/misc.js')).openDocs() },
  music: { name: t('Lagu MP3'), icon: 'music', run: async () => (await import('./apps/misc.js')).openMusic() },
  recycle: { name: 'Recycle Bin', icon: 'recycleFull', run: async () => (await import('./apps/misc.js')).openRecycle() },
  rules: { name: t('ATURAN_WARNET.txt'), icon: 'txt', run: async () => (await import('./apps/misc.js')).openRules() },
  memories: { name: t('Kenangan Warnet.txt'), icon: 'txt', run: async () => (await import('./apps/misc.js')).openMemories() },
  notepad: { name: 'Notepad', icon: 'notepad', run: async () => (await import('./apps/misc.js')).openNotepad() },
  display: { name: 'Display Properties', icon: 'display', run: async () => (await import('./apps/misc.js')).openDisplay() },
  about: { name: 'System Properties', icon: 'help', run: async () => (await import('./apps/misc.js')).openAbout() },
  taskmgr: { name: 'Task Manager', icon: 'taskmgr', run: async () => (await import('./apps/taskmgr.js')).openTaskManager() },
  friendster: { name: 'Friendster', icon: 'web', run: async () => (await import('./apps/browser.js')).openBrowser('http://www.friendster.com/') },
  kaskus: { name: 'Kaskus', icon: 'web', run: async () => (await import('./apps/browser.js')).openBrowser('http://www.kaskus.com/') },
  cs16: { name: 'Counter-Strike 1.6', icon: 'link', run: async () => (await import('./apps/games.js')).launchGame('cs16') },
  diablo: { name: 'Diablo', icon: 'game', run: async () => (await import('./apps/games.js')).launchGame('diablo') },
  pinball: { name: '3D Pinball', icon: 'game', run: async () => (await import('./apps/games.js')).launchGame('pinball') },
  sango: { name: 'Sango Fighter', icon: 'dos', run: async () => (await import('./apps/games.js')).launchGame('sango') },
  donate: { name: t('Dukung Warnet Ini'), icon: 'support', run: async () => (await import('./apps/operator.js')).openDonate() },
  contact: { name: t('Hubungi Operator'), icon: 'messenger', run: async (arg) => (await import('./apps/operator.js')).openContact(arg) },
  lowongan: { name: t('LOWONGAN_OPERATOR.txt'), icon: 'txt', run: async () => (await import('./apps/operator.js')).openLowongan() },
  kontributor: { name: t('KONTRIBUTOR.txt'), icon: 'txt', run: async () => (await import('./apps/operator.js')).openKontributor() },
};
const launch = (id, arg) => {
  const a = APPS[id]; if (!a) return;
  track(`app:${id}`);
  document.body.style.cursor = 'progress';
  Promise.resolve(a.run(arg)).catch((e) => { console.error(e); msgbox('Error', t('Gagal membuka {app}.', { app: esc(a.name) }), { kind: 'error' }); }).finally(() => { document.body.style.cursor = ''; });
};
window.addEventListener('launch', (e) => launch(e.detail));
// Ctrl+Shift+Esc opens Task Manager (Ctrl+Alt+Del never reaches a web page)
window.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key === 'Escape' && root.querySelector('.desktop')) launch('taskmgr'); });

// every game gets its own desktop shortcut
for (const g of GAMES) {
  if (g.mode === 'local') continue; // ranjau/ular already registered
  APPS['g:' + g.id] = { name: g.name, icon: g.icon === 'computer' ? g.icon : gameIcon(g.id, g.name, g.mode), run: async () => (await import('./apps/games.js')).launchGame(g.id) };
}
const DESKTOP_ICONS = [
  'computer', 'docs', 'recycle', 'browser', 'winamp', 'games', 'chat', 'ym', 'friendster', 'kaskus', 'rules', 'memories', 'lowongan', 'kontributor', 'donate',
  'ranjau', 'ular',
];
const DESKTOP_GAMES = GAMES.filter((g) => g.mode !== 'local' && g.mode !== 'shrine' && g.desktop !== false).map((g) => 'g:' + g.id);
// the rental PS corner: PS1/PS2 fan ports get their own cluster in the bottom-right of the desktop
const PS_ICONS = GAMES.filter((g) => g.console).map((g) => 'g:' + g.id);
/** A fresh random order (Fisher-Yates), so every game gets its turn near the top. */
const shuffled = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/* ------------------------------------------------------------------ 1. BIOS */
async function bios() {
  const gen = ++screenGen;
  root.innerHTML = '';
  const el = h(`<div class="bios" role="presentation"><div class="logo">ENERGY<br>★ STAR ★</div><div class="txt"></div><div class="foot">${t('Press <b>DEL</b> to enter SETUP, <b>klik / tombol apa saja</b> untuk lewati')}</div></div>`);
  root.appendChild(el);
  const txt = el.querySelector('.txt');
  let skip = false;
  const onSkip = () => { skip = true; };
  // skip on click, not pointerdown: a tap's click must land on the BIOS, not on the login field drawn under the finger
  el.addEventListener('click', onSkip); window.addEventListener('keydown', onSkip, { once: true });
  const E = era();
  const lines = E.bios.map((l) => l.replace('{pc}', String(session.pc || 7).padStart(2, '0')));
  for (const l of lines) {
    if (skip || gen !== screenGen) break;
    if (l === 'Memory Testing : ') {
      const p = document.createElement('div'); txt.appendChild(p);
      for (let k = 0; k <= E.mem && !skip; k += E.mem / 16) { p.textContent = `Memory Testing : ${k}K`; await wait(35); }
      p.innerHTML = `Memory Testing : ${E.mem}K <span class="ok">OK</span>`;
      continue;
    }
    txt.insertAdjacentHTML('beforeend', `<div>${l || '&nbsp;'}</div>`);
    await wait(110);
  }
  if (!skip) await wait(500);
  if (eraId() !== '2003' && !skip) { // newer PCs show the OS splash after POST
    el.innerHTML = `<div class="splash"><div class="orb"></div><b>${E.os}</b><small>${t('Memulai {os}...', { os: E.os })}</small></div>`;
    await wait(1400);
  }
  el.removeEventListener('click', onSkip);
  window.removeEventListener('keydown', onSkip);
  if (gen === screenGen) lock();
}

/* ------------------------------------------------------------------ 2. LOCK (billing + dolphins) */
// The billing lock screen is modelled on the classic warnet billing client of the
// mid-2000s: a cyan button panel, a blue banner with the warnet's name card, and a
// dolphin wallpaper (a CC0 photo, credited in CREDITS.md; no vendor logo or artwork).

function lock(message = '') {
  ++screenGen;
  clearInterval(billTimer); clearInterval(clockTimer);
  closeAll();
  import('./apps/winamp.js').then((m) => m.closeWinamp()).catch(() => {});
  let v = newVoucher();
  const R = { rate: rupiah(era().rate), malam: rupiah(era().malam) };
  root.innerHTML = '';
  const ws = String(v.pc).padStart(2, '0');
  const btn = (k, label, on = true) => `<button type="button" class="be-btn" data-be="${k}"${on ? '' : ' disabled'}><u>${label[0]}</u>${label.slice(1)}</button>`;
  const el = h(`<div class="lock">
    <div class="sea" role="img" aria-label="${t('Lumba-lumba berenang di laut biru')}"></div>
    <div class="be-top">
      <div class="be-panel">
        <div class="be-btns">${btn('personal', 'Personal')}${btn('group', 'Group', false)}${btn('game', 'Game', false)}${btn('paket', t('Paket'))}${btn('member', 'Member', false)}${btn('prepaid', 'Pre-Paid')}${btn('admin', 'Admin ##')}${btn('panduan', t('Panduan'))}</div>
        <div class="be-ws"><div class="be-wshead"><div class="be-wsn">WS - <span>${ws}</span></div>${langSwitch()}</div><div>Time Warning</div>
          <label><input type="radio" name="tw" value="0"> ${t('Tidak (No)')}</label><label><input type="radio" name="tw" value="30"> ${t('Menit 30')}</label><label><input type="radio" name="tw" value="60"> ${t('Menit 60')}</label>
          <label><input type="radio" name="tw" value="x" checked> ${t('Menit')} <input class="be-min" type="number" min="1" max="999" value="${warnMinutes}" aria-label="${t('Menit peringatan')}"></label></div>
      </div>
      <div class="be-banner"><div class="be-logo"><b>NusaBilling.Net</b><i>Client Pro 2006</i></div><div class="be-blue"></div>
        <div class="be-card"><h1>Warnet Nusantara.Net</h1><span>${t('Jl. Kenangan No. 56K, Nusantara · Buka 24 jam')}</span><span>Internet · Game · Print - ${esc(LINKS.site.replace(/^https?:\/\//, 'http://'))}</span></div></div>
    </div>
    <form class="billing" autocomplete="off">
      <div class="tb"><span>${t('Pre-Paid — Login Voucher')}</span><button type="button" class="tb-x" aria-label="${t('Tutup')}">×</button></div>
      <div class="body">
        <div class="pc"><b>PC-${ws}</b><span class="status">${t('● TERKUNCI')}</span></div>
        <div class="eras" role="group" aria-label="${t('Pilih PC')}"><span>${t('Pilih PC')}:</span>${Object.entries(ERAS).map(([k, e]) => `<button type="button" class="be-btn" data-era="${k}" aria-pressed="${k === eraId()}" title="${e.os}"><b>${k}</b><small>${e.label}</small></button>`).join('')}</div>
        ${message ? `<div class="tarif msg">${message}</div>` : ''}
        <label>Username <input class="field" name="u" spellcheck="false" autocapitalize="off" autocomplete="one-time-code" data-1p-ignore data-lpignore="true" aria-label="Username"></label>
        <label>Password <input class="field" name="p" type="password" autocomplete="one-time-code" data-1p-ignore data-lpignore="true" aria-label="Password"></label>
        <table class="tarif"><tr><td>${t('Tarif')}</td><td>${t('<b>{rate}</b>/jam', R)}</td></tr><tr><td>${t('Paket malam')}</td><td><b>${R.malam}</b> (00.00–06.00)</td></tr><tr><td>${t('Voucher kamu')}</td><td class="pkg"></td></tr></table>
        <div class="err" role="alert"></div>
        <div class="row"><button type="button" class="btn" data-new>${t('Voucher baru')}</button><button type="submit" class="btn primary">${t('Masuk')}</button></div>
        <button type="button" class="btn demo-btn" data-demo>${t('▶ Tonton Kilas Balik 60 detik')}</button>
      </div>
    </form>
    <div class="sticky" role="button" tabindex="0" title="${t('Klik buat isi otomatis')}">
      ${t('Voucher dari operator:')}<br>user: <b class="vu"></b><br>pass: <b class="vp"></b><small>${t('(klik kertas ini kalau malas ngetik)')}</small>
    </div>
    <a class="lowongan" href="${esc(LINKS.repo)}/blob/main/MAINTAINERS.md" target="_blank" rel="noopener" data-cta="lowongan">${t('DICARI: operator shift malam.<br><small>Lamar di GitHub →</small>')}</a>
    <div class="marquee thanks"><span class="ticker"></span></div>
    <div class="marquee"><span>${t('★ Selamat datang di WARNET NUSANTARA.NET ★ Buka 24 jam ★ Paket malam {malam} ★ Dilarang membuka situs terlarang ★ Save tugas ke disket, PC di-Deep Freeze ★ Sekarang pakai koneksi SPEEDY! ★ Yang main CS jangan teriak-teriak ★ Terima kasih atas kunjungan Anda ★', R)}</span></div>
  </div>`);
  root.appendChild(el);
  el.querySelector('.ticker').textContent = tickerItems(SUPPORTERS).join('   ');
  el.querySelector('.be-lang').onclick = (e) => { const l = e.target.closest('[data-lang]')?.dataset.lang; if (l) setLang(l, '#lock'); };
  el.querySelector('.eras').onclick = (e) => { const k = e.target.closest('[data-era]')?.dataset.era; if (k && k !== eraId()) { setEra(k); session.wallpaper = era().wall; track(`era:${k}`); lock(); } };
  el.querySelector('.lowongan').onclick = () => track('cta:lowongan-lock');
  el.querySelector('[data-demo]').onclick = () => { try { audio().resume(); } catch {} startDemo(); };
  const form = el.querySelector('form'), err = el.querySelector('.err');
  const fill = () => {
    el.querySelector('.vu').textContent = v.user; el.querySelector('.vp').textContent = v.pass;
    el.querySelector('.pkg').textContent = `${v.pkgName} · ${rupiah(v.price)}`;
    el.querySelector('.pc b').textContent = 'PC-' + String(v.pc).padStart(2, '0');
    el.querySelector('.be-wsn span').textContent = String(v.pc).padStart(2, '0');
  };
  fill();
  el.querySelector('.tb-x').onclick = () => { err.textContent = t('Billing nggak bisa ditutup, mas. Masukkan voucher dulu!'); };
  el.querySelector('[data-new]').onclick = () => { v = newVoucher(); fill(); err.textContent = t('Voucher baru dicetak. Cek kertas kuning.'); };
  const BE = {
    personal: t('Billing Personal harus dibuka mas operator. Pakai voucher Pre-Paid aja, ada di kertas kuning.'),
    paket: t('Paket: {rate}/jam · Paket malam {malam} (00.00–06.00). Beli voucher di kasir.', R),
    prepaid: t('Masukkan user dan password dari voucher Pre-Paid kamu.'),
    admin: t('Khusus operator! Mas operator lagi ngopi di depan.'),
    panduan: t('Panduan: klik kertas kuning (isi otomatis), lalu Masuk. Waktu habis? Teriak "MAS, NAMBAH SEJAM!"'),
  };
  el.querySelector('.be-btns').onclick = (e) => {
    const k = e.target.closest('[data-be]')?.dataset.be; if (!k) return;
    err.textContent = BE[k];
    if (k === 'prepaid') form.u.focus();
    if (k === 'paket') { const tbl = el.querySelector('table.tarif'); tbl.classList.remove('flash'); void tbl.offsetWidth; tbl.classList.add('flash'); }
  };
  const minBox = el.querySelector('.be-min');
  const setWarn = () => {
    const r = el.querySelector('[name=tw]:checked').value;
    warnMinutes = r === 'x' ? Math.max(0, Math.min(999, Math.round(Number(minBox.value)) || 0)) : Number(r);
  };
  el.querySelector('.be-ws').addEventListener('change', setWarn);
  minBox.addEventListener('input', () => { el.querySelector('[name=tw][value=x]').checked = true; setWarn(); });
  const sticky = el.querySelector('.sticky');
  const autofill = () => { form.u.value = v.user; form.p.value = v.pass; form.querySelector('[type=submit]').focus(); };
  sticky.onclick = autofill; sticky.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); autofill(); } }; // fill only, like a click
  form.onsubmit = (e) => {
    e.preventDefault();
    try { audio().resume(); } catch {}
    if (form.u.value.trim() === v.user && form.p.value === v.pass) {
      startBilling(v); track('login'); welcome();
    } else {
      ding('error');
      err.textContent = form.u.value.trim() !== v.user ? t('Username tidak terdaftar. Tanya mas operator!') : t('Password salah! Cek lagi kertasnya.');
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    }
  };
  if (!coarse()) setTimeout(() => form.u.focus(), 50);
}

/* ------------------------------------------------------------------ 3. WELCOME */
async function welcome() {
  const gen = ++screenGen;
  root.innerHTML = `<div class="welcome"><div class="top"></div><div class="mid"><div>${t('selamat datang')}<small>${t('Memuat pengaturan pribadi {user}...', { user: esc(session.user) })}</small></div></div><div class="bot"></div></div>`;
  chime();
  await wait(1700);
  if (gen === screenGen) desktop();
}

/* ------------------------------------------------------------------ 4. DESKTOP */
/** @param {string} id */
const deskIcon = (id) => `<button class="icon" role="listitem" data-app="${id}">${icon(APPS[id].icon)}<span>${esc(APPS[id].name)}</span></button>`;
function desktop() {
  ++screenGen;
  root.innerHTML = '';
  const el = h(`<div class="desktop wp-${session.wallpaper}">
    <div class="icons" role="list">${[...DESKTOP_ICONS, ...shuffled(DESKTOP_GAMES)].map(deskIcon).join('')}</div>
    <div class="ps-corner" role="list" aria-label="${t('Pojok Rental PS')}">${shuffled(PS_ICONS).map(deskIcon).join('')}</div>
    <div class="taskbar">
      <button class="startbtn" aria-label="Start">${icon('merahputih')}<span>start</span></button><div class="tb-search">${icon('search')}<input type="search" spellcheck="false" autocomplete="off" placeholder="${t('Ketik di sini untuk mencari')}" aria-label="${t('Ketik di sini untuk mencari')}"></div>
      <div class="quick"><button data-app="browser" title="${esc(APPS.browser.name)}">${icon('internet')}</button><button data-app="winamp" title="Winamp">${icon('winamp')}</button><button data-app="chat" title="IRC Chat">${icon('chat')}</button><button data-app="games" title="${esc(APPS.games.name)}">${icon('games')}</button></div>
      <div class="tasks"></div>
      <button class="tb-ticker" title="${t('Terima kasih para pendukung — klik untuk ikut patungan')}"><span></span></button>
      <div class="tray">
        <span class="bill" title="${t('Sisa waktu billing — klik untuk nambah')}">--:--:--</span>
        <span class="df" title="Deep Freeze: FROZEN">${icon('freeze')}</span>
        <span class="net" title="${t('LAN terhubung')}">${icon('network')}</span>
        <span class="vol" title="Volume">${icon('volume')}</span>
        <span class="clock"></span>
      </div>
    </div></div>`);
  root.appendChild(el);
  initWM(el, el.querySelector('.tasks'));
  const tasks = el.querySelector('.tasks');
  // supporters running text: a thin LED strip in the taskbar, no extra height and no overlap with windows
  const tick = el.querySelector('.tb-ticker'), tickText = tickerItems(SUPPORTERS).join('   ');
  tick.querySelector('span').textContent = tickText;
  tick.style.setProperty('--dur', `${Math.max(12, Math.round(tickText.length / 4))}s`);
  tick.onclick = () => { track('cta:ticker'); launch('donate'); };
  const winampTask = { btn: null };
  const taskWin = new WeakMap();

  // taskbar sync
  onChange((wins) => {
    tasks.querySelectorAll('.task.w').forEach((b) => b.remove());
    for (const w of wins) {
      const b = h(`<button class="task w ${w.el.classList.contains('inactive') || w.el.classList.contains('min') ? '' : 'on'}">${icon(w.iconName)}<span>${esc(w.title)}</span></button>`);
      b.onclick = () => taskClick(w);
      taskWin.set(b, w);
      tasks.appendChild(b);
    }
  });
  import('./apps/winamp.js').then(({ onWinampChange, toggleWinamp }) => {
    offWinamp?.(); // one listener per desktop: drop the previous desktop's
    offWinamp = onWinampChange((s) => {
      if (s === 'closed') { winampTask.btn?.remove(); winampTask.btn = null; return; }
      if (!winampTask.btn) { winampTask.btn = h(`<button class="task wa">${icon('winamp')}<span></span></button>`); winampTask.btn.onclick = toggleWinamp; tasks.prepend(winampTask.btn); }
      winampTask.btn.querySelector('span').textContent = s === 'loading' ? t('Memuat Winamp...') : 'Winamp';
      winampTask.btn.classList.toggle('on', s === 'open');
    });
  });

  // icons: click select, dblclick open (tap opens on touch)
  const iconsEl = el.querySelector('.icons');
  const unselect = () => el.querySelectorAll('.icons .sel, .ps-corner .sel').forEach((x) => x.classList.remove('sel'));
  for (const box of [iconsEl, el.querySelector('.ps-corner')]) {
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.icon');
      unselect();
      if (!b) return; b.classList.add('sel');
      if (coarse()) launch(b.dataset.app);
    });
    box.addEventListener('dblclick', (e) => { const b = e.target.closest('.icon'); if (b) launch(b.dataset.app); });
    box.addEventListener('keydown', (e) => { const b = e.target.closest('.icon'); if (b && e.key === 'Enter') launch(b.dataset.app); });
  }
  el.querySelector('.quick').onclick = (e) => { const b = e.target.closest('[data-app]'); if (b) launch(b.dataset.app); };
  el.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.startmenu, .startbtn, .tb-search')) closeStart();
    if (!e.target.closest('.ctx')) el.querySelector('.ctx')?.remove();
    if (e.target === el || e.target === iconsEl) unselect();
  });

  // context menu on wallpaper
  el.addEventListener('contextmenu', (e) => {
    const items = menuFor(/** @type {HTMLElement} */ (e.target));
    if (items) { e.preventDefault(); ctxMenu(el, e.clientX, e.clientY, items); return; }
    if (e.target !== el && e.target !== iconsEl) return;
    e.preventDefault();
    el.querySelector('.ctx')?.remove();
    const m = h(`<div class="ctx"><button data-c="refresh">Refresh</button><button data-c="notepad">New ▸ Text Document</button><hr><button data-c="display">Properties</button><button data-c="about">${t('Tentang PC ini')}</button></div>`);
    m.style.left = Math.min(e.clientX, el.clientWidth - 180) + 'px'; m.style.top = Math.min(e.clientY, el.clientHeight - 140) + 'px';
    m.onclick = (ev) => { const c = ev.target.closest('[data-c]')?.dataset.c; m.remove(); if (c === 'refresh') { iconsEl.style.opacity = '0'; setTimeout(() => (iconsEl.style.opacity = '1'), 120); } else if (c) launch(c); };
    el.appendChild(m);
  });

  /** Right-click menu for a desktop icon, folder item, task button, Start or the taskbar. null: the wallpaper's own menu below, or the browser's. */
  function menuFor(tg) {
    const ic = tg.closest('.icons > .icon, .ps-corner > .icon'), item = tg.closest('.ex-main .icon'), task = tg.closest('.task.w');
    const pick = (b) => { b.parentElement.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); }; // select it, as Windows does
    const props = (name, type, where) => () => msgbox(name, t('Jenis: {type}<br>Lokasi: {where}<br><br>Dikunci Deep Freeze, nggak bisa diubah.', { type, where: esc(where) }), { kind: 'info' });
    if (ic) {
      pick(ic);
      const id = ic.dataset.app;
      return [['Open', () => launch(id)], '-', ['Rename', frozen], ['Delete', frozen], '-', ['Properties', props(APPS[id].name, 'Shortcut', 'Desktop')]];
    }
    if (item) {
      pick(item);
      const name = item.querySelector('span').textContent, where = item.closest('.win').getAttribute('aria-label');
      return [['Open', () => item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))], '-', ['Delete', frozen], ['Properties', props(name, 'File', where)]];
    }
    if (task) {
      const w = taskWin.get(task), min = w.el.classList.contains('min'), max = w.el.classList.contains('max');
      return [
        ['Restore', min || max ? () => { toggleMax(w, false); restore(w); focus(w); } : null],
        ['Minimize', min ? null : () => minimize(w)],
        ['Maximize', max || !w.el.querySelector('.mx') ? null : () => { restore(w); toggleMax(w, true); focus(w); }],
        '-', ['Close', () => close(w)],
      ];
    }
    if (tg.closest('.startbtn')) return [['Open', () => { closeStart(); openStart(); }], ['Explore', () => launch('computer')]];
    if (tg.closest('.taskbar') && !tg.closest('input')) return [['Task Manager', () => launch('taskmgr')], '-', ['Show the Desktop', () => allWins().forEach(minimize)], '-', ['Properties', locked]];
    return null;
  }

  // start menu
  const startBtn = el.querySelector('.startbtn');
  startBtn.onclick = () => (el.querySelector('.startmenu') ? closeStart() : openStart());
  // 2015 taskbar search: a click opens Start like before, typing searches every app and game by name, Enter opens the first hit
  const tbq = el.querySelector('.tb-search input');
  el.querySelector('.tb-search').onclick = () => { if (!el.querySelector('.startmenu')) openStart(); else if (!tbq.value) closeStart(); tbq.focus(); };
  tbq.oninput = () => {
    const m = el.querySelector('.startmenu') || openStart(), s = tbq.value.trim().toLowerCase(), seen = new Set();
    const hits = Object.keys(APPS).filter((id) => { const n = APPS[id].name; if (seen.has(n) || !n.toLowerCase().includes(s)) return false; seen.add(n); return true; });
    m.classList.toggle('searching', !!s);
    m.querySelector('.sm-results').innerHTML = hits.length ? hits.slice(0, 10).map((id) => item(id)).join('') : `<p class="sm-none">${esc(t('Tidak ada yang cocok dengan "{q}".', { q: tbq.value.trim() }))}</p>`;
  };
  tbq.onkeydown = (e) => { if (e.key === 'Enter') el.querySelector('.startmenu.searching .sm-results [data-app]')?.click(); };
  function closeStart() { el.querySelector('.startmenu')?.remove(); startBtn.classList.remove('on'); tbq.value = ''; }
  function item(id, sub) { return `<button class="sm-item" data-app="${id}">${icon(APPS[id].icon)}<span><b>${esc(APPS[id].name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`; }
  function openStart() {
    const m = h(`<div class="startmenu">
      <div class="head"><div class="avatar">${icon('dolphin')}</div>${esc(session.user)}</div>
      <div class="cols"><div class="left">${item('browser', t('Jalan-jalan ke tahun {year}', era()))}${item('ym', 'BUZZ!!!')}<div class="hr"></div>${item('winamp')}${item('chat')}${item('games')}${item('ranjau')}${item('ular')}${item('notepad')}</div>
      <div class="right">${item('docs')}${item('music')}${item('computer')}<div class="hr"></div>${item('display')}${item('memories')}${item('rules')}${item('about')}<div class="hr"></div>${item('donate', t('Donasi, star, fork, lapor bug'))}${item('lowongan', t('Jadi operator'))}${item('contact', t('Lapor, usul, kerja sama'))}</div></div>
      <div class="sm-results"></div>
      <div class="foot"><button data-p="logoff">${icon('logoff')} Log Off</button><button data-p="off">${icon('power')} Turn Off Computer</button></div></div>`);
    m.onclick = (e) => {
      const a = e.target.closest('[data-app]'); const p = e.target.closest('[data-p]');
      if (a) { closeStart(); launch(a.dataset.app); }
      if (p) { closeStart(); p.dataset.p === 'logoff' ? logoff() : shutdownDialog(); }
    };
    el.appendChild(m); startBtn.classList.add('on');
    return m;
  }

  // tray
  const bill = el.querySelector('.bill'), clock = el.querySelector('.clock'), vol = el.querySelector('.vol');
  const tickClock = () => { const d = new Date(); clock.textContent = d.toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' }); };
  tickClock(); clockTimer = setInterval(tickClock, 15000);
  let warned = false;
  const tickBill = () => {
    const r = remaining();
    bill.textContent = fmt(r);
    bill.classList.toggle('low', r < 300);
    if (warnMinutes && r < warnMinutes * 60 && !warned) { warned = true; balloon('Billing', t('Waktu kamu tinggal {n} menit! Klik timer untuk nambah.', { n: warnMinutes }), 'warn'); }
    if (r <= 0) { clearInterval(billTimer); timeUp(); }
  };
  tickBill(); billTimer = setInterval(tickBill, 1000);
  bill.onclick = async () => {
    const more = t('Nambah 1 jam');
    const r = await msgbox('Billing', t('User: <b>{user}</b><br>Paket: {pkg}<br>Terpakai: {used}<br>Sisa: {left}<br>Biaya: <b>{price}</b>', { user: esc(session.user), pkg: esc(session.pkgName), used: fmt(used()), left: fmt(remaining()), price: rupiah(session.price) }), { buttons: [more, 'OK'] });
    if (r === more) { addTime(60); warned = false; tickBill(); balloon('Billing', t('MAS, NAMBAH SEJAM! ✔ Waktu ditambah 1 jam ({rate}).', { rate: rupiah(era().rate) })); }
  };
  vol.onclick = () => { setMuted(!isMuted()); vol.style.opacity = isMuted() ? '0.4' : '1'; vol.title = isMuted() ? t('Suara mati') : 'Volume'; };
  vol.style.opacity = isMuted() ? '0.4' : '1';
  el.querySelector('.df').onclick = () => balloon('Deep Freeze', t('Status: FROZEN. Semua perubahan hilang saat restart, jadi save tugas ke disket ya.'), 'freeze');
  clock.onclick = () => balloon('Date and Time', esc(new Date().toLocaleDateString(LANG, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })), 'info');
  el.querySelector('.net').onclick = () => balloon('Local Area Connection', t('Kecepatan: 10.0 Mbps<br>Dibagi rame-rame 20 PC. Sabar ya.'), 'network');

  window.addEventListener('wallpaper', (e) => { el.className = `desktop wp-${e.detail}`; });
  window.addEventListener('net-connected', () => balloon('Dial-Up Networking', t('Terhubung ke Telkomnet Instan pada 53.3 Kbps. Tagihan telepon dimulai sekarang 😬'), 'modem'), { once: true });
  setTimeout(() => balloon(t('Selamat datang, {user}!', { user: session.user }), t('Kamu di PC-{pc}. Klik 2x <b>Penjelajah Internet</b> buat jalan-jalan ke internet tahun {year}, atau buka <b>Game Warnet</b>.', { pc: String(session.pc).padStart(2, '0'), year: era().year }), 'info'), 900);
}

function balloon(title, html, ic = 'info') {
  const d = document.querySelector('.desktop'); if (!d) return;
  d.querySelector('.balloon')?.remove();
  const b = h(`<div class="balloon" role="status"><button class="x" aria-label="${t('Tutup')}">×</button><h4>${icon(ic)} ${esc(title)}</h4><div>${html}</div></div>`);
  b.querySelector('.x').onclick = () => b.remove();
  d.appendChild(b);
  setTimeout(() => b.remove(), 9000);
}

/* ------------------------------------------------------------------ 5. SHUTDOWN / LOGOFF */
function logoff() {
  door(false);
  const total = rupiah(session.price);
  track('logoff');
  const brag = sessionBrag(used(), total);
  const share = shareLinks(brag, LINKS.site, 'logoff').map((s) => `<a href="${esc(s.href)}" target="_blank" rel="noopener" data-share="${s.id}">${esc(s.label)}</a>`).join(' · ');
  lock(t('Terima kasih, <b>{user}</b>! Pemakaian {used}. Silakan bayar <b>{total}</b> di kasir.', { user: esc(session.user), used: fmt(used()), total }) + `${payLink()}<br><span class="share">${t('Bagikan sesi warnet kamu:')} ${share}</span>`);
}

/** "Bayar ke operator" link for screens without a desktop (lock, shutdown). */
function payLink() {
  const href = donateOptions(LINKS).find((o) => o.href)?.href || supportUrl(LINKS);
  return `<br><a class="paylink" href="${esc(href)}" target="_blank" rel="noopener">${t('☕ Bayar ke operator beneran (dukung warnet ini)')}</a>`;
}

function shutdownDialog() {
  const d = document.querySelector('.desktop');
  document.body.classList.add('grayscale');
  const o = h(`<div class="shutdown-overlay"><div class="sd-box"><h3>${t('Matikan Komputer')}</h3><div class="opts">
    <button data-s="standby">${icon('standby')}Stand By</button><button data-s="off">${icon('power')}Turn Off</button><button data-s="restart">${icon('restart')}Restart</button></div>
    <div class="foot"><button class="btn">${t('Batal')}</button></div></div></div>`);
  o.onclick = (e) => {
    const s = e.target.closest('[data-s]')?.dataset.s;
    if (!s && !e.target.closest('.foot .btn')) return;
    o.remove(); document.body.classList.remove('grayscale');
    if (s === 'standby') logoff();
    if (s === 'restart') { closeAll(); bios(); }
    if (s === 'off') turnOff();
  };
  document.body.appendChild(o);
}

function turnOff() {
  clearInterval(billTimer); clearInterval(clockTimer); closeAll();
  import('./apps/winamp.js').then((m) => m.closeWinamp()).catch(() => {});
  root.innerHTML = `<div class="bye">${t('Sekarang aman untuk mematikan komputer Anda.')}<small>${t('(Jangan lupa bayar {price} ke mas operator · klik untuk menyalakan lagi)', { price: rupiah(session.price) })}</small><small>${payLink()}</small></div>`;
  /** @type {HTMLElement} */ (root.firstElementChild).onclick = (e) => { if (!e.target.closest('a')) bios(); };
}

/* ------------------------------------------------------------------ 6. KILAS BALIK (demo) */
async function startDemo() {
  const { runDemo } = await import('./demo.js');
  return runDemo({
    speed: params.speed,
    boot: bios,
    launch,
    balloon,
    timeout: timeUp,
    toDesktop: () => { if (!document.querySelector('.desktop')) { startBilling(newVoucher()); desktop(); } },
  }, DEMO.beats.map((b) => ({ ...b, caption: tx(b, 'caption'), title: tx(b, 'title'), text: tx(b, 'text') })));
}

function timeUp() { lock(t('<b>WAKTU HABIS!</b> PC terkunci otomatis. Total: {price}', { price: rupiah(session.price) })); }

/** "ID | EN" switch, styled like the billing client's buttons. The active language is pressed. */
function langSwitch() {
  const b = (l) => `<button type="button" class="be-btn" data-lang="${l}" aria-pressed="${l === LANG}" lang="${l}">${l.toUpperCase()}</button>`;
  return `<div class="be-lang" role="group" aria-label="Bahasa / Language">${b('id')}${b('en')}</div>`;
}

document.addEventListener('click', (e) => { const s = e.target.closest('[data-share]'); if (s) track(`share:${s.dataset.share}`); });

// Deep links: /#desktop skips straight in; /#app=<id> also opens that app (shares, landing pages).
const deep = /^#app=([\w:-]+)$/.exec(location.hash);
track('boot');
if (params.demo) startDemo();
else if (location.hash === '#desktop' || (deep && APPS[deep[1]])) { startBilling(newVoucher()); desktop(); if (deep) launch(deep[1]); } else if (location.hash === '#lock') lock(); else bios();
