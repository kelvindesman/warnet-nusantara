// "Mas Operator" corner: support the warnet, contact the operator, the job ad
// (maintainer call) and the supporters list. Subtle, in-world, never a popup.
import { openWindow, esc } from '../wm.js';
import { icon } from '../icons.js';
import { SUPPORTERS, MAINTAINERS, LINKS } from '../data.js';
import { TIERS, donateOptions, issueUrl, CONTACT_KINDS, creditLines, discordUrl, supportUrl } from '../community.js';
import { openNotepad } from './misc.js';
import { track } from '../stats.js';
import { t } from '../i18n.js';

export function openDonate() {
  return openWindow({
    id: 'donate', title: t('Dukung Warnet Ini'), iconName: 'support', width: 460, height: 430, maximizable: false,
    content: (body) => {
      const opts = donateOptions(LINKS);
      const repo = LINKS.repo;
      const free = [
        { id: 'star', label: t('★ Kasih Star'), note: t('di GitHub'), href: repo },
        { id: 'fork', label: t('⑂ Fork'), note: t('bikin versimu sendiri'), href: `${repo}/fork` },
        { id: 'issue', label: t('🐞 Lapor bug'), note: t('atau kasih komentar'), href: issueUrl(repo, 'bug', { title: '[Bug] ', context: { app: 'donate' } }) },
      ];
      body.innerHTML = `<div class="op">
        <p>${t('<b>Gratis, 1 klik:</b> bantu warnet ini tanpa keluar duit.')}</p>
        <div class="op-free">${free.map((f) => `<a class="btn op-act" href="${esc(f.href)}" target="_blank" rel="noopener" data-free="${f.id}"><b>${esc(f.label)}</b><small>${esc(f.note)}</small></a>`).join('')}</div>
        <p>${t('<b>Warnet ini gratis selamanya.</b> Listrik, domain dan kopi mas operator dibayar dari patungan. Mau ikut bayar billing? Namamu (dan pesanmu) muncul di running text, KONTRIBUTOR.txt dan README di GitHub.')}</p>
        <div class="op-btns">${opts.map((o) => o.href
          ? `<a class="btn op-pay" href="${esc(o.href)}" target="_blank" rel="noopener" data-pay="${o.id}">${icon(o.icon)}<b>${esc(o.label)}</b><small>${esc(o.note)}</small></a>`
          : `<span class="btn op-pay off" data-pay="${o.id}" title="${t('Segera hadir')}">${icon(o.icon)}<b>${esc(o.label)}</b><small>${t('segera hadir')}</small></span>`).join('')}</div>
        <table class="op-tiers">${Object.values(TIERS).map((t) => `<tr><td><b>${esc(t.label)}</b></td><td>${esc(t.price)}</td></tr>`).join('')}</table>
        <p class="op-small">${t('Minimal Rp 5.000 / $3 supaya namamu tercatat. Semua fitur tetap gratis.')} <a href="${esc(supportUrl(LINKS))}" target="_blank" rel="noopener">${t('Detail di GitHub')}</a></p>
      </div>`;
      body.querySelector('.op-btns').addEventListener('click', (e) => {
        const p = e.target.closest('[data-pay]');
        if (!p) return;
        track(`cta:pay:${p.dataset.pay}`);
        const o = opts.find((x) => x.id === p.dataset.pay);
        if (!o.href) return;
        // Stay on the warnet: in a window when the platform allows framing, otherwise a small popup over it.
        e.preventDefault();
        if (o.frame) openPayFrame(o);
        else window.open(o.href, 'warnet-pay', PAY_POPUP);
      });
      body.querySelector('.op-free').addEventListener('click', (e) => { const f = e.target.closest('[data-free]'); if (f) track(`cta:free:${f.dataset.free}`); });
    },
  });
}

const PAY_POPUP = 'popup,noopener,width=480,height=760';

/** Checkout of a platform that allows framing, inside a warnet window. */
function openPayFrame(o) {
  return openWindow({
    id: 'pay-' + o.id, title: o.label, iconName: o.icon, width: 440, height: 640,
    content: (body) => {
      body.innerHTML = `<div class="frame-bar"><span class="grow">${esc(o.note)} — ${esc(o.href)}</span><button class="btn" data-tab>${t('Tab baru')}</button></div>
        <div class="frame-wrap"><iframe title="${esc(o.label)}" src="${esc(o.frame)}" allow="payment"></iframe></div>`;
      body.querySelector('[data-tab]').onclick = () => window.open(o.href, '_blank', 'noopener');
    },
  });
}

export function openContact(appId = '') {
  return openWindow({
    id: 'contact', title: t('Hubungi Operator'), iconName: 'messenger', width: 420, height: 360, maximizable: false,
    content: (body) => {
      const ctx = { versi: 'web', halaman: location.pathname, layar: `${innerWidth}x${innerHeight}`, browser: navigator.userAgent.slice(0, 120), ...(appId ? { app: appId } : {}) };
      const discord = discordUrl(LINKS);
      body.innerHTML = `<div class="op">
        <p>${t('Mau lapor, usul, atau cerita? Pilih di bawah. Kamu akan dibawa ke GitHub (perlu akun gratis); semua usulan dibaca mas operator dan bot.')}</p>
        <div class="op-list">${CONTACT_KINDS.map((k) => `<a class="btn" target="_blank" rel="noopener" data-contact="${k.id}" href="${esc(issueUrl(LINKS.repo, k.template, { title: k.title, context: ctx }))}">${esc(k.label)}</a>`).join('')}</div>
        <p class="op-small">${t('Urusan pribadi atau bisnis: kirim email ke operator (alamat di halaman GitHub). Data pribadi jangan ditulis di issue publik.')}</p>
        <p>${t('Nongkrong bareng:')} ${discord ? `<a href="${esc(discord)}" target="_blank" rel="noopener" data-contact="discord">Discord Warnet Nusantara</a>` : `<span class="op-soon">${t('Discord — segera hadir')}</span>`}</p>
      </div>`;
      body.addEventListener('click', (e) => { const c = e.target.closest('[data-contact]'); if (c) track(`cta:contact:${c.dataset.contact}`); });
    },
  });
}

export function lowonganText(links = LINKS) {
  return t(`=============================================
   LOWONGAN KERJA - WARNET NUSANTARA.NET
=============================================

DICARI: OPERATOR SHIFT MALAM (sukarelawan)

Warnet ini open source. Siapa saja boleh ikut jaga:
  [ ] nambah situs jadul (detik 2001, Kaskus 2003, ...)
  [ ] nambah game warnet yang legal
  [ ] nambah bot IRC #jakarta #bandung #surabaya
  [ ] benerin bug, bikin aplikasi baru

SYARAT:
  - Pernah antri di depan warnet sambil SMS-an
  - Tahu bedanya paket malam dan paket 3 jam
  - Punya akun GitHub (gratis)

JENJANG KARIR:
  3 PR diterima  -> Triager (bantu sortir usulan)
  10 PR diterima -> Operator (maintainer)

DAFTAR:
  {repo}/contribute
  Panduan: {repo}/blob/main/CONTRIBUTING.md

Gaji: kebanggaan + nama kamu di System Properties.

                       - Mas Operator`, { repo: links.repo });
}
export const openLowongan = () => { track('cta:lowongan'); return openNotepad(t('LOWONGAN_OPERATOR.txt'), lowonganText()); };

export function kontributorText(supporters = SUPPORTERS, maintainers = MAINTAINERS) {
  const lines = creditLines(supporters);
  return t(`KONTRIBUTOR.txt - yang bikin warnet ini tetap buka
===================================================

OPERATOR (maintainer):
{operators}

PENDUKUNG (patungan bayar billing):
{supporters}

Terima kasih juga untuk semua yang kirim situs, game,
bot IRC dan kenangan lewat GitHub. Kalian keren.`, {
    operators: maintainers.map((m) => `- ${m.name} (${m.role})`).join('\n'),
    supporters: lines.length ? lines.join('\n\n') : t('- Belum ada. Jadilah yang pertama! Start -> Dukung Warnet Ini'),
  });
}
export const openKontributor = () => openNotepad(t('KONTRIBUTOR.txt'), kontributorText());

/** About box rows about the community (used by misc.js openAbout). */
export function aboutRows(supporters = SUPPORTERS, maintainers = MAINTAINERS) {
  return `<tr><td>Operator:</td><td>${maintainers.map((m) => esc(m.name)).join(', ')}</td></tr>
    <tr><td>${t('Didukung:')}</td><td>${supporters.length ? t('{n} pendukung', { n: supporters.length }) : t('belum ada pendukung')} · <a href="#" data-go="kontributor">${t('KONTRIBUTOR.txt')}</a></td></tr>
    <tr><td colspan=2 class="op-small">${t('Proyek nostalgia buatan penggemar. Tidak berafiliasi dengan merek yang disebut; semua merek milik pemiliknya.')}</td></tr>`;
}
