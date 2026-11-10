// "Penjelajah Internet" — a real browser-in-a-window, time-travelling via the Wayback Machine.
import { openWindow, getWin, esc, menubar, wireMenus } from '../wm.js';
import { icon } from '../icons.js';
import { BOOKMARKS, wayback } from '../data.js';
import { dialup } from '../sound.js';
import { t } from '../i18n.js';
import { era, eraId, forEra, locked } from '../era.js';
// Old sites run their scripts but may not replace the whole warnet: some archived
// pages frame-bust with top.location (ragnarok.co.id 2004 did), so no allow-top-navigation.
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-pointer-lock allow-downloads';

// The portal reads the era from its own URL (it cannot see the desktop's). 2003 keeps the plain address.
const homeUrl = () => (eraId() === '2003' ? 'home.html' : `home.html?era=${eraId()}`);
// Desktop apps the portal page may open (allowlist: the frame is same-origin, but keep it narrow).
const PORTAL_CMDS = new Set(['contact', 'donate']);
let connected = false;
const YEARS = Array.from({ length: 18 }, (_, i) => 1998 + i); // 1998..2015

export function openBrowser(start) {
  if (!connected) return connectDialog(() => openBrowser(start));
  const existing = getWin('browser');
  if (existing) { if (start) existing.navigate(start); }
  const w = existing ? openWindow({ id: 'browser' }) : openWindow({
    id: 'browser', title: `Portal Nusantara.Net - ${t('Penjelajah Internet')}`, iconName: 'internet', width: 900, height: 620,
    content: (body, win) => build(body, win, start),
  });
  return w;
}

function normalize(input) {
  let u = input.trim();
  if (!u || u === 'about:home') return null;
  if (/^https?:\/\/web\.archive\.org\//.test(u)) return { raw: u };
  if (!/^[a-z]+:\/\//i.test(u)) {
    if (!/\./.test(u) || /\s/.test(u)) return { url: 'http://www.google.com/search?q=' + encodeURIComponent(u), search: true };
    u = 'http://' + u;
  }
  return { url: u };
}

function build(body, win, start) {
  const HOME = homeUrl(), FAV = forEra(BOOKMARKS);
  body.innerHTML = `
    ${menubar('File', 'Edit', 'View', 'Favorites', 'Tools', 'Help')}
    <div class="br-toolbar">
      <button data-a="back" title="Back">${icon('back')}<span>Back</span></button>
      <button data-a="fwd" title="Forward">${icon('fwd')}</button>
      <button data-a="stop" title="Stop">${icon('stop')}</button>
      <button data-a="reload" title="Refresh">${icon('refresh')}</button>
      <button data-a="home" title="Home">${icon('home')}</button>
      <button data-a="search" title="Search">${icon('search')}<span>Search</span></button>
      <button data-a="newtab" title="${t('Buka di tab asli')}">${icon('star')}<span>${t('Tab baru')}</span></button>
      <span class="br-throbber">${icon('internet')}</span>
    </div>
    <div class="br-addr">
      <span>Address</span>
      <input class="field" spellcheck="false" autocomplete="off" aria-label="Address" />
      <label title="${t('Mesin waktu Wayback Machine')}">${t('Tahun')}
        <select aria-label="${t('Tahun')}">${YEARS.map((y) => `<option ${y === era().year ? 'selected' : ''}>${y}</option>`).join('')}<option value="live">Live 🔴</option></select>
      </label>
      <button class="btn" style="min-width:40px" data-a="go">Go</button>
    </div>
    <div class="br-links">${FAV.slice(0, 14).map((b, i) => `<button data-b="${i}">${icon('web')}${esc(b.name)}</button>`).join('')}</div>
    <div class="br-view"><iframe title="${t('halaman web')}" referrerpolicy="no-referrer" allow="autoplay; fullscreen" sandbox="${SANDBOX}"></iframe></div>
    <div class="statusbar"><span class="st">${t('Selesai')}</span><span>${icon('internet').replace('<svg', '<svg width="12" height="12"')} Internet</span></div>`;

  const frame = body.querySelector('iframe');
  const addr = body.querySelector('.br-addr input');
  const year = body.querySelector('select');
  const st = body.querySelector('.st');
  const throb = body.querySelector('.br-throbber');
  const btn = (a) => body.querySelector(`[data-a="${a}"]`);
  const hist = []; let idx = -1;
  let current = HOME;

  const show = (src, label) => {
    current = src;
    addr.value = label;
    throb.classList.add('spin');
    st.textContent = src === HOME ? t('Membuka halaman awal...') : t('Menghubungi {site} lewat mesin waktu... (sabar, 56k)', { site: label });
    frame.src = src;
    btn('back').disabled = idx <= 0; btn('fwd').disabled = idx >= hist.length - 1;
    win.setTitle(`${label === 'about:home' ? 'Portal Nusantara.Net' : label} - ${t('Penjelajah Internet')}`);
  };
  const resolve = (entry) => {
    if (entry.home) return [HOME, 'about:home'];
    if (entry.raw) return [entry.raw, entry.raw];
    if (entry.year === 'live') return [entry.url, entry.url];
    return [wayback(entry.url, entry.year), entry.url];
  };
  const go = (entry, push = true) => {
    if (push) { hist.splice(idx + 1); hist.push(entry); idx = hist.length - 1; }
    const [src, label] = resolve(entry);
    show(src, label);
  };
  const navigate = (input, y) => {
    const n = normalize(input);
    if (!n) return go({ home: true });
    if (y) year.value = String(y);
    go({ ...n, year: year.value });
  };
  win.navigate = navigate;

  let stopped = false;
  frame.addEventListener('load', () => {
    throb.classList.remove('spin');
    if (stopped) { stopped = false; return; } // about:blank from Stop keeps "Dihentikan"
    st.textContent = year.value === 'live' && current !== HOME
      ? t('Selesai. (Layar putih? Situs modern sering menolak dibuka di dalam frame — klik "Tab baru".)')
      : t('Selesai');
  });
  btn('back').onclick = () => { if (idx > 0) go(hist[--idx], false); };
  btn('fwd').onclick = () => { if (idx < hist.length - 1) go(hist[++idx], false); };
  btn('stop').onclick = () => { stopped = true; frame.src = 'about:blank'; throb.classList.remove('spin'); st.textContent = t('Dihentikan'); };
  btn('reload').onclick = () => { stopped = false; frame.src = current; throb.classList.add('spin'); };
  btn('home').onclick = () => go({ home: true });
  btn('search').onclick = () => navigate('http://www.google.com/', era().year);
  btn('newtab').onclick = () => window.open(current === HOME ? HOME : current, '_blank', 'noopener');
  btn('go').onclick = () => navigate(addr.value);
  addr.onkeydown = (e) => { if (e.key === 'Enter') navigate(addr.value); };
  addr.onfocus = () => addr.select();
  year.onchange = () => { const e = hist[idx]; if (e && e.url) go({ ...e, year: year.value }); };
  body.querySelector('.br-links').onclick = (e) => {
    const b = e.target.closest('[data-b]'); if (!b) return;
    const bm = FAV[+b.dataset.b]; navigate(bm.url, bm.year);
  };
  const click = (a) => () => btn(a).click();
  wireMenus(body, {
    File: () => [[t('Buka di tab asli'), click('newtab')], '-', ['Close', win.close]],
    Edit: () => [['Select Address', () => addr.focus()]],
    View: () => [['Stop', click('stop')], ['Refresh', click('reload')]],
    Favorites: () => [['Home', click('home')], '-', ...FAV.map((bm) => [bm.name, () => navigate(bm.url, bm.year)])],
    Tools: () => [['Internet Options...', locked]],
    Help: () => [['About Internet Explorer', () => window.dispatchEvent(new CustomEvent('launch', { detail: 'about' }))]],
  });

  // Links on our local portal page post messages up to us so the address bar stays in sync.
  const onMsg = (e) => {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.type === 'nav') navigate(e.data.url, e.data.year);
    if (e.data.type === 'cmd' && PORTAL_CMDS.has(e.data.cmd)) window.dispatchEvent(new CustomEvent('launch', { detail: e.data.cmd }));
  };
  window.addEventListener('message', onMsg);
  win.cleanup.push(() => window.removeEventListener('message', onMsg));

  if (start) navigate(start); else go({ home: true });
}

/** The iconic Dial-Up Networking dialog, with the real(ish) handshake sound. */
function connectDialog(done) {
  const w = openWindow({
    id: 'dialup', title: t('Menghubungkan ke Telkomnet Instan'), iconName: 'modem', width: 380, height: 250, resizable: false, maximizable: false,
    content: (body) => {
      body.innerHTML = `
        <div class="dialog" style="flex-direction:column;gap:8px">
          <div style="display:flex;gap:12px;align-items:center">${icon('modem').replace('<svg', '<svg width="40" height="40"')}
            <table style="font-size:11px"><tr><td>${t('Nama pengguna:')}</td><td><b>telkomnet@instan</b></td></tr>
            <tr><td>${t('Kata sandi:')}</td><td><b>••••••</b> <small>(telkom)</small></td></tr>
            <tr><td>${t('Nomor:')}</td><td><b>080989999</b></td></tr></table></div>
          <div class="st">${t('Memanggil...')}</div>
          <div class="progress" style="width:100%"><i></i></div>
        </div>
        <div class="dialog-btns"><button class="btn" data-skip>${t('Lewati')}</button><button class="btn" data-cancel>${t('Batal')}</button></div>`;
    },
  });
  const st = w.body.querySelector('.st'), bar = w.body.querySelector('.progress i');
  const steps = [[0, t('Memanggil 080989999...')], [2600, t('Menunggu jawaban...')], [3700, t('Memverifikasi nama pengguna dan kata sandi...')], [6200, t('Mendaftarkan komputer Anda di jaringan...')], [8600, t('Terhubung pada 53.333 bps')]];
  let finished = false;
  const timers = steps.map(([t, s], i) => setTimeout(() => { st.textContent = s; bar.style.width = ((i + 1) / steps.length) * 100 + '%'; }, t));
  const finish = () => {
    if (finished) return; finished = true;
    timers.forEach(clearTimeout); connected = true; w.onClose = null; w.close();
    window.dispatchEvent(new CustomEvent('net-connected'));
    done();
  };
  w.onClose = () => { finished = true; timers.forEach(clearTimeout); };
  w.body.querySelector('[data-skip]').onclick = finish;
  w.body.querySelector('[data-cancel]').onclick = () => w.close();
  dialup().then(() => setTimeout(() => { if (!finished) finish(); }, 400));
}
