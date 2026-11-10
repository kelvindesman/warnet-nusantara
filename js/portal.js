// "Portal Nusantara.Net" — the home page shown inside the time-travel browser (home.html).
// Every community-supplied string goes through esc(); links are rebuilt from data, never pasted.
import { BOOKMARKS, SUPPORTERS, LINKS, wayback } from './data.js';
import { esc } from './text.js';
import { tickerItems, sponsorBanner } from './community.js';
import { t, tx } from './i18n.js';
import { era, forEra } from './era.js';

const inFrame = window.parent !== window;
const $ = (id) => document.getElementById(id);
const link = (b) => `<a href="${esc(wayback(b.url, b.year))}" data-url="${esc(b.url)}" data-year="${esc(b.year)}">${esc(b.name)}</a>`;

// Bookmarks of the PC era the visitor picked (2003 / 2011 / 2015); `hit` rows fill "Situs Paling Hits".
const FAV = forEra(BOOKMARKS), YEAR = era().year;
const cats = [...new Set(FAV.map((b) => b.cat))];
$('side').innerHTML = cats.map((c) => `<div class="box"><h3>${esc(c)}</h3><div>${FAV.filter((b) => b.cat === c).map(link).join('')}</div></div>`).join('');

// The page's static copy (home.html is written in Indonesian; English visitors get it swapped here).
const COPY = [
  ['#cari input', t('Cari di Google {year}...', { year: YEAR }), 'placeholder'],
  ['#cari button', t('Cari!')],
  ['.nav a:nth-child(1)', t('Berita')], ['.nav a:nth-child(5)', t('Buku Tamu')], ['.nav a:nth-child(6)', t('Dukung Warnet')],
  ['.mq span', t('+++ Selamat datang di Portal Nusantara.Net +++ Semua link dibuka lewat MESIN WAKTU (Wayback Machine) +++ Pilih tahun di sebelah kotak Address +++ Optimal dilihat dengan resolusi 800x600 +++')],
  ['.hot', t('★ Situs Paling Hits di Warnet ★')],
  ['#tips h3', t('Tips Mesin Waktu')],
  ['#tips div', t('Ketik alamat apa saja di kotak <b>Address</b> (misal <code>geocities.com</code>), lalu pilih <b>Tahun</b>. Halaman diambil dari arsip <a href="https://web.archive.org" target="_blank" rel="noopener">Internet Archive</a>. Pilih <b>Live</b> untuk internet zaman sekarang (banyak situs modern menolak tampil dalam frame).'), 'html'],
  ['#visitors', t('Anda pengunjung ke-')],
  ['#kontak', t('Kontak')],
  ['.disc', t('Proyek nostalgia buatan penggemar. Tidak berafiliasi dengan merek apa pun yang disebut; semua merek milik pemiliknya. Situs lama dari Internet Archive.')],
];
for (const [sel, text, how] of COPY) {
  const el = document.querySelector(sel);
  if (how === 'placeholder') el.placeholder = text; else if (how === 'html') el.innerHTML = text; else el.textContent = text;
}
$('hits').innerHTML = FAV
  .filter((b) => b.hit)
  .map((b, i) => `<div class="card"><b>${link(b)}</b>${esc(tx(b, 'hit'))} ${i % 3 === 0 ? '<span class="new">NEW!</span>' : ''}</div>`)
  .join('');

// Supporters ticker + sponsor banner ("Pasang iklan di sini!").
const ticker = $('ticker');
ticker.textContent = tickerItems(SUPPORTERS).join('  ');
const ad = sponsorBanner(SUPPORTERS, LINKS);
const banner = $('banner');
banner.href = ad.href;
if (!ad.sponsor) banner.dataset.cmd = 'donate';
banner.querySelector('b').textContent = ad.title;
banner.querySelector('small').textContent = ad.sub;

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-url]');
  if (a && inFrame) { e.preventDefault(); parent.postMessage({ type: 'nav', url: a.dataset.url, year: +a.dataset.year }, location.origin); }
  const c = e.target.closest('[data-cmd]');
  if (c && inFrame) { e.preventDefault(); parent.postMessage({ type: 'cmd', cmd: c.dataset.cmd }, location.origin); }
});
$('cari').onsubmit = (e) => {
  e.preventDefault();
  const url = 'http://www.google.com/search?q=' + encodeURIComponent($('cari').q.value);
  if (inFrame) parent.postMessage({ type: 'nav', url, year: YEAR }, location.origin); else location.href = wayback(url, YEAR);
};
$('ctr').textContent = String(12847 + Math.floor(Date.now() / 60000) % 100000).padStart(7, '0');
