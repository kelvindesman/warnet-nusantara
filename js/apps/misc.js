// Small system apps: Notepad, My Computer, folders, Recycle Bin, Display Properties, About.
import { openWindow, esc, msgbox, menubar, wireMenus } from '../wm.js';
import { icon } from '../icons.js';
import { RULES, MEMORIES, TRACKS } from '../data.js';
import { session, fmt, used } from '../state.js';
import { aboutRows } from './operator.js';
import { LANG, t, setLang } from '../i18n.js';
import { era, exBars, exNav, exFind, wireExplorer, itemCount, frozen } from '../era.js';

export function openNotepad(name = 'Untitled.txt', text = '') {
  return openWindow({
    id: 'np-' + name, title: `${name} - Notepad`, iconName: 'notepad', width: 560, height: 440,
    content: (body, win) => {
      body.innerHTML = `${menubar('File', 'Edit', 'Format', 'View', 'Help')}<textarea class="notepad" spellcheck="false" aria-label="${esc(name)}"></textarea>`;
      const ta = body.querySelector('textarea');
      ta.value = text;
      wireMenus(body, {
        File: () => [['New', () => { ta.value = ''; ta.focus(); }], ['Save', frozen], '-', ['Exit', win.close]],
        Edit: () => [['Select All', () => ta.select()]],
        Format: () => [[`${ta.wrap === 'off' ? '' : '✓ '}Word Wrap`, () => { ta.wrap = ta.wrap === 'off' ? 'soft' : 'off'; }]],
        View: () => [['Status Bar', null]], // no status bar here; the real Notepad greys it out too while Word Wrap is on
        Help: () => [['About Notepad', launch('about')]],
      });
    },
  });
}
export const openRules = () => openNotepad(t('ATURAN_WARNET.txt'), RULES);
export const openMemories = () => openNotepad(t('Kenangan Warnet.txt'), MEMORIES);

/** Generic explorer-style folder. items: [{name, icon, sub, open()}] */
export function openFolder(id, title, iconName, items, side = '') {
  return openWindow({
    id, title, iconName, width: 620, height: 420,
    content: (body, win) => {
      body.innerHTML = `${menubar('File', 'Edit', 'View', 'Favorites', 'Tools', 'Help')}${exBars(title)}
        <div class="explorer">${exNav()}<div class="ex-side">${exFind(title)}${side}<div class="ex-box"><h5>${t('Tempat Lain')}</h5><div><p data-go="computer">▸ My Computer</p><p data-go="docs">▸ My Documents</p><p data-go="games">▸ Game Warnet</p></div></div></div>
        <div class="ex-main">${items.map((it, i) => `<button class="icon" data-i="${i}">${icon(it.icon)}<span>${esc(it.name)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</button>`).join('')}</div></div>
        <div class="statusbar"><span class="st">${itemCount(items.length)}</span><span>${esc(title)}</span></div>`;
      const main = body.querySelector('.ex-main'), st = body.querySelector('.st');
      const run = (b) => items[+b.dataset.i].open?.();
      main.addEventListener('click', (e) => {
        main.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
        const b = e.target.closest('[data-i]'); if (!b) return;
        b.classList.add('sel'); st.textContent = items[+b.dataset.i].sub || items[+b.dataset.i].name;
        if (window.matchMedia('(pointer: coarse)').matches) run(b);
      });
      main.addEventListener('dblclick', (e) => { const b = e.target.closest('[data-i]'); if (b) run(b); });
      main.addEventListener('keydown', (e) => { const b = e.target.closest('[data-i]'); if (b && e.key === 'Enter') run(b); });
      wireExplorer(body, win);
    },
  });
}

const launch = (id) => () => window.dispatchEvent(new CustomEvent('launch', { detail: id }));

export function openComputer() {
  const side = `<div class="ex-box"><h5>${t('Tugas Sistem')}</h5><div><p data-go="about">${t('▸ Lihat info sistem')}</p><p data-go="display">${t('▸ Ganti wallpaper')}</p></div></div>`;
  return openFolder('computer', 'My Computer', 'computer', [
    { name: t('Disket 3½ (A:)'), icon: 'floppy', sub: t('Masukkan disket...'), open: () => msgbox('A:\\', t('A:\\ tidak dapat diakses.<br>Perangkat tidak siap. Disketnya jamuran ya?'), { kind: 'error', buttons: ['Retry', 'Cancel'] }) },
    { name: 'Local Disk (C:)', icon: 'drive', sub: t('20 GB · Dibekukan Deep Freeze'), open: frozen },
    { name: 'DATA (D:)', icon: 'drive', sub: 'Game, MP3, installer', open: launch('games') },
    { name: 'CD Drive (E:)', icon: 'cd', sub: t('Kumpulan MP3 Vol. 7'), open: launch('music') },
    { name: 'My Documents', icon: 'docs', open: launch('docs') },
    { name: 'Control Panel', icon: 'display', sub: 'Display', open: launch('display') },
  ], side);
}

export function openDocs() {
  return openFolder('docs', 'My Documents', 'docs', [
    { name: t('ATURAN_WARNET.txt'), icon: 'txt', sub: '2 KB', open: openRules },
    { name: t('Kenangan Warnet.txt'), icon: 'txt', sub: '4 KB', open: openMemories },
    { name: 'tugas_sejarah_FINAL_revisi3.doc', icon: 'txt', sub: t('copas dari Google'), open: () => openNotepad('tugas_sejarah_FINAL_revisi3.doc', t('Proklamasi kemerdekaan Indonesia dibacakan pada tanggal 17 Agustus 1945...\n\n(sisanya belum, billing keburu habis)\n\nSumber: google.com halaman 1')) },
    { name: 'puisi_buat_dia.txt', icon: 'txt', sub: t('jangan dibuka'), open: () => openNotepad('puisi_buat_dia.txt', t('Kau bagai modem 56k di hatiku\nLambat... tapi selalu terhubung.\n\nKau bagai Friendster\nSelalu kubuka walau tak pernah kau testi.\n\n- dari bilik 7, jam 2 pagi')) },
    { name: t('Lagu MP3'), icon: 'music', sub: `${TRACKS.length} file`, open: launch('music') },
    { name: 'Game Warnet', icon: 'games', open: launch('games') },
  ]);
}

export function openMusic() {
  return openFolder('music', t('Lagu MP3'), 'music',
    TRACKS.map((x) => ({ name: `${x.artist} - ${x.title}.wav`, icon: 'winamp', sub: t('Chiptune buatan sendiri'), open: launch('winamp') })),
    `<div class="ex-box"><h5>${t('Tugas Musik')}</h5><div><p data-go="winamp">${t('▸ Putar semua di Winamp')}</p><p data-go="winamp">${t('Tips: seret file MP3 kamu ke jendela Winamp!')}</p></div></div>`);
}

export function openRecycle() {
  return openFolder('recycle', 'Recycle Bin', 'recycleFull', [
    { name: 'foto_mantan.jpg', icon: 'txt', sub: t('Dihapus dari: C:\\RAHASIA'), open: () => msgbox('foto_mantan.jpg', t('Udahlah, move on. 💔'), { kind: 'info' }) },
    { name: 'crack_nero_6.exe', icon: 'error', sub: t('Terdeteksi virus Brontok'), open: () => msgbox('Antivirus', t('W32/Brontok.A terdeteksi!<br>File dikarantina. Jangan colok flashdisk sembarangan.'), { kind: 'error' }) },
    { name: 'save_GTA_SA.dat', icon: 'txt', sub: t('100% tamat, tapi Deep Freeze...'), open: frozen },
  ]);
}

const WALLS = { bukit: [t('Bukit Hijau'), 'linear-gradient(#4b8ef0,#9cc6f7 60%,#5cb82c 61%)'], dolphin: [t('Lumba-lumba'), 'linear-gradient(#0b5aa5,#2f8fd8 50%,#021f45)'], teal: [t('Klasik'), '#3a6ea5'], friendster: ['Glitter Pink', '#ff99cc'], aurora: [t('Aurora Biru'), 'linear-gradient(135deg,#0c3f7a,#1f7fc4 45%,#7fd3f0 55%,#0c3f7a)'], garis: [t('Sinar Biru'), 'linear-gradient(160deg,#03122e,#0a4fa8 60%,#3fa0ff)'] };
const LANGS = { id: 'Bahasa Indonesia', en: 'English' };
export function openDisplay() {
  return openWindow({
    id: 'display', title: 'Display Properties', iconName: 'display', width: 420, height: 340, maximizable: false,
    content: (body, win) => {
      body.innerHTML = `<div style="padding:10px 12px 0">${t('Pilih wallpaper (hampir semua PC warnet pakai lumba-lumba):')}</div><div class="wp-list">${Object.entries(WALLS).map(([k, [n, bg]]) => `<button data-w="${k}" style="background:${bg}" class="${session.wallpaper === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="dp-lang" role="group" aria-label="${t('Bahasa / Language')}"><span>${t('Bahasa / Language')}:</span>${Object.entries(LANGS).map(([k, n]) => `<button class="btn" data-lang="${k}" lang="${k}" aria-pressed="${k === LANG}">${n}</button>`).join('')}</div>
        <div class="dialog-btns" style="justify-content:flex-end"><button class="btn primary">OK</button></div>`;
      body.querySelector('.dp-lang').onclick = (e) => { const l = e.target.closest('[data-lang]')?.dataset.lang; if (l) setLang(l, '#desktop'); };
      body.querySelector('.wp-list').onclick = (e) => {
        const k = e.target.closest('[data-w]')?.dataset.w; if (!k) return;
        session.wallpaper = k; body.querySelectorAll('[data-w]').forEach((b) => b.classList.toggle('on', b.dataset.w === k));
        window.dispatchEvent(new CustomEvent('wallpaper', { detail: k }));
      };
      body.querySelector('.dialog-btns .btn').onclick = () => win.close();
    },
  });
}

export function openAbout() {
  return openWindow({
    id: 'about', title: 'System Properties', iconName: 'computer', width: 440, height: 330, maximizable: false,
    content: (body) => {
      body.innerHTML = `<div class="about">${icon('dolphin')}<table>
        <tr><td colspan=2>${t('<b>Sistem:</b> {os}<br>{ver} (Edisi Bilik)', era())}</td></tr>
        <tr><td>${t('Terdaftar atas:')}</td><td>${esc(session.user)}<br>Warnet Nusantara.Net</td></tr>
        <tr><td>${t('Komputer:')}</td><td>PC-${String(session.pc).padStart(2, '0')}<br>${era().spec}</td></tr>
        <tr><td>${t('Uptime sesi:')}</td><td>${fmt(used())}</td></tr>
        <tr><td>${t('Mesin:')}</td><td>${t('Vanilla JS, 0 dependency,<br>&lt; 100 KB sebelum Winamp dimuat')}</td></tr>${aboutRows()}</table></div>`;
      body.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); window.dispatchEvent(new CustomEvent('launch', { detail: g.dataset.go })); } });
    },
  });
}
