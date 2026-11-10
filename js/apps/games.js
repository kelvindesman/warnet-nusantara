// Game Warnet folder + launcher. Embeds what can be framed, opens a new tab for the rest.
import { openWindow, esc, msgbox, menubar } from '../wm.js';
import { icon, gameIcon } from '../icons.js';
import { GAMES, LINKS, wayback } from '../data.js';
import { issueUrl } from '../community.js';
import { track } from '../stats.js';
import { t, tx } from '../i18n.js';
import { exBars, exNav, exFind, wireExplorer, itemCount, eraId } from '../era.js';

// Legal text: the English entry in js/i18n/en.js must stay equivalent (not affiliated, not endorsed, not hosted, takedown path).
const FAN_DISCLAIMER = t('Port buatan fans, TIDAK resmi. Warnet Nusantara.Net tidak berafiliasi dengan, tidak didukung oleh, dan tidak menyimpan game ini; kami cuma menautkan situs pihak ketiga. Semua merek milik pemiliknya. Buka dengan risiko sendiri. Pemilik hak cipta bisa minta link dihapus lewat Hubungi Operator.');

/** Playable today: not marked broken by the live check, and not a fan port that was taken down. */
const playable = (g) => !g.broken && g.status !== 'down';

export function openGamesFolder() {
  return openWindow({
    id: 'games', title: 'Game Warnet', iconName: 'games', width: 720, height: 500,
    content: (body, win) => {
      // within each group, games that play today come first; known-broken ones sink to the end
      // what the booths were playing on this era's PC goes on top, out of its usual group
      const hot = (g) => (g.hot || []).includes(eraId());
      const by = (mode) => GAMES.filter((g) => g.mode === mode && !hot(g)).sort((a, b) => Number(playable(b)) - Number(playable(a)));
      const rame = GAMES.filter(hot);
      const local = by('local'), embed = by('embed'), tab = by('tab'), shrine = by('shrine'), fans = by('fanport');
      // PlayStation fan ports get their own shelf, like the rental PS corner of the warnet
      const fan = fans.filter((g) => !g.console), ps = fans.filter((g) => g.console);
      const ic = (g) => (g.mode === 'local' || g.icon === 'computer' ? g.icon : gameIcon(g.id, g.name, g.mode));
      const item = (g) => `<button class="icon${playable(g) ? '' : ' rusak'}" data-g="${g.id}" title="${esc(tx(g, 'note'))}">${icon(ic(g))}<span>${esc(g.name)}</span><small>${g.year}${g.console ? ` · ${esc(g.console.toUpperCase())}` : ''}${playable(g) ? '' : ' ⚠'}</small></button>`;
      body.innerHTML = `
        ${menubar('File', 'Edit', 'View', 'Favorites', 'Tools', 'Help')}${exBars('Game Warnet')}
        <div class="explorer">${exNav()}
          <div class="ex-side">${exFind('Game Warnet')}
            <div class="ex-box"><h5>${t('Tugas Game')}</h5><div><p data-hint="play">${t('▸ Klik 2x untuk main')}</p><p><a data-hint="dos" target="_blank" rel="noopener" href="https://archive.org/details/softwarelibrary_msdos_games">${t('▸ Game DOS jalan via emulator Internet Archive')}</a></p><p data-hint="tab">${t('▸ Ikon panah = buka di tab baru')}</p></div></div>
            <div class="ex-box"><h5>Detail</h5><div class="det"><b>Game Warnet</b><br>${t('Folder sistem')}<br><br>${itemCount(GAMES.length)}</div></div>
            <div class="ex-box"><h5>${t('Tips Operator')}</h5><div>${t('Game DOS: klik layar dulu supaya keyboard nyangkut. Panah = jalan, Ctrl/Alt/Spasi = aksi.')}</div></div>
          </div>
          <div class="ex-main">
            <div class="usul-game"><span>${t('Game favorit zaman warnet belum ada di sini?')}</span><a class="btn" data-usul-game target="_blank" rel="noopener" href="${esc(issueUrl(LINKS.repo, 'usul-game', { title: '[Game] ', context: { app: 'games' } }))}">${t('Usul game ke operator')}</a></div>
            ${rame.length ? `<div class="group rame">${t('Lagi rame di warnet {era}', { era: eraId() })}</div>${rame.map(item).join('')}` : ''}
            <div class="group">${t('Bawaan PC')}</div>${local.map(item).join('')}
            <div class="group">${t('Main di sini (port web &amp; emulator)')}</div>${embed.map(item).join('')}
            <div class="group g-tab">${t('Online beneran (buka tab baru)')}</div>${tab.map(item).join('')}
            <div class="group">${t('Port Fan (tidak resmi, buka tab baru)')}</div><p class="fp-disc">${FAN_DISCLAIMER}</p>${fan.map(item).join('')}
            <div class="subgroup g-ps">${t('Pojok Rental PS: PS1 &amp; PS2 (port fan, buka tab baru)')}</div>${ps.map(item).join('')}
            <div class="group">${t('Kenangan (server lama sudah tutup)')}</div>${shrine.map(item).join('')}
          </div>
        </div>
        <div class="statusbar"><span class="st">${itemCount(GAMES.length)}</span><span>${t('Komputer Saya')}</span></div>`;
      body.querySelector('[data-usul-game]').addEventListener('click', () => track('cta:usul-game'));
      const main = body.querySelector('.ex-main'), st = body.querySelector('.st'), det = body.querySelector('.det');
      main.addEventListener('click', (e) => {
        const b = e.target.closest('[data-g]');
        main.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
        if (!b) return;
        b.classList.add('sel');
        const g = GAMES.find((x) => x.id === b.dataset.g);
        st.textContent = tx(g, 'note');
        det.innerHTML = `<b>${esc(g.name)}</b><br>${g.year}<br>${esc(tx(g, 'note'))}${g.broken ? `<br><br><b>⚠ ${t('Catatan operator:')}</b> ${esc(tx(g, 'broken'))}` : ''}`;
        if (window.matchMedia('(pointer: coarse)').matches) launchGame(g.id);
      });
      main.addEventListener('dblclick', (e) => { const b = e.target.closest('[data-g]'); if (b) launchGame(b.dataset.g); });
      main.addEventListener('keydown', (e) => { const b = e.target.closest('[data-g]'); if (b && e.key === 'Enter') launchGame(b.dataset.g); });
      // XP task pane links: play the selected game, open the IA DOS library, jump to the new-tab group
      body.querySelector('.ex-side').addEventListener('click', (e) => {
        const hint = e.target.closest('[data-hint]')?.dataset.hint;
        if (hint === 'play') { const g = main.querySelector('.icon.sel'); if (g) launchGame(g.dataset.g); else msgbox(t('Tugas Game'), t('Pilih dulu game-nya, terus klik 2x ikonnya.'), { kind: 'info' }); }
        if (hint === 'dos') track('cta:ia-dos');
        if (hint === 'tab') main.querySelector('.g-tab').scrollIntoView({ block: 'start' });
      });
      wireExplorer(body, win);
    },
  });
}

export async function launchGame(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) return;
  if (g.broken) { // known not playable right now: say why, let them try anyway
    const yes = t('Tetap coba');
    const r = await msgbox(g.name, `<b>${t('Catatan operator:')}</b> ${esc(tx(g, 'broken'))}`, { kind: 'warn', buttons: [yes, t('Batal')] });
    if (r !== yes) return;
  }
  if (g.mode === 'local') {
    const m = g.id === 'ranjau' ? await import('./ranjau.js') : await import('./ular.js');
    return m.open();
  }
  if (g.mode === 'tab') {
    const yes = t('Buka');
    const r = await msgbox(g.name, t('<b>{name}</b> tidak mengizinkan dibuka di dalam jendela.<br>Buka di tab baru?<br><small>{url}</small>', { name: esc(g.name), url: esc(g.url) }), { kind: 'info', buttons: [yes, t('Batal')] });
    if (r === yes) window.open(g.url, '_blank', 'noopener');
    return;
  }
  if (g.mode === 'shrine') return openShrine(g);
  if (g.mode === 'fanport') return openFanPort(g);
  return openWindow({
    id: 'game-' + g.id, title: g.name, iconName: g.icon, width: g.w || 760, height: g.h || 580,
    content: (body) => {
      body.innerHTML = `<div class="frame-bar"><span class="grow">${esc(tx(g, 'note'))} — ${esc(g.url)}</span><button class="btn" data-full>${t('Layar penuh')}</button><button class="btn" data-tab>${t('Tab baru')}</button></div>
        <div class="frame-wrap"><iframe title="${esc(g.name)}" src="${esc(g.url)}" allow="autoplay; fullscreen; gamepad; cross-origin-isolated" allowfullscreen></iframe></div>`;
      const fr = body.querySelector('iframe');
      body.querySelector('[data-tab]').onclick = () => window.open(g.url, '_blank', 'noopener');
      body.querySelector('[data-full]').onclick = () => fr.requestFullscreen?.();
      fr.addEventListener('load', () => fr.focus());
    },
  });
}

/** Tier C: games we may not link (still sold or private servers). A memorial
 *  launcher that never connects, the old site via the Wayback Machine, and the
 *  official current version when one exists. */
function openShrine(g) {
  return openWindow({
    id: 'game-' + g.id, title: g.name, iconName: 'games', width: 440, height: 330, maximizable: false,
    content: (body) => {
      body.innerHTML = `<div class="shrine">
        <div class="sh-title">${esc(g.name)}</div>
        <div class="sh-bar"><i></i></div>
        <p class="sh-st">${t('Menghubungkan ke server...')}</p>
        <p class="sh-note">${esc(tx(g, 'note'))}</p>
        <div class="sh-btns"><button class="btn" data-site>${t('Lihat situs lama ({year})', { year: g.siteYear })}</button>${g.official ? `<button class="btn" data-official>${t('Versi resmi sekarang')}</button>` : ''}</div>
        <p class="op-small">${t('Game ini masih dimiliki penerbitnya, jadi warnet ini cuma menyimpan kenangannya. Main yang resmi ya!')}</p>
      </div>`;
      const st = body.querySelector('.sh-st');
      setTimeout(() => { st.textContent = t('Server lagi maintenance, coba lagi nanti. (Patch 0.0.1 gagal di-download)'); body.querySelector('.shrine').classList.add('down'); }, 1500);
      body.querySelector('[data-site]').onclick = async () => (await import('./browser.js')).openBrowser(wayback(g.site, g.siteYear));
      const off = body.querySelector('[data-official]');
      if (off) off.onclick = () => window.open(g.official, '_blank', 'noopener');
    },
  });
}

/** Fan-made browser ports (owner decision 2026-11-08): never framed inside the
 *  warnet, only linked out after a disclaimer. Ports that were taken down keep
 *  a news link so the story stays. */
function openFanPort(g) {
  const live = g.status === 'live';
  return openWindow({
    id: 'game-' + g.id, title: g.name, iconName: 'games', width: 460, height: 340, maximizable: false,
    content: (body) => {
      body.innerHTML = `<div class="fanport${live ? '' : ' down'}">
        <div class="sh-title">${esc(g.name)}</div>
        <p class="fp-st">${live ? t('Port fan tidak resmi, jalan di situs orang lain.') : t('Sudah ditutup / kena DMCA.')}</p>
        <p class="sh-note">${esc(tx(g, 'note'))}</p>
        <div class="sh-btns">${live ? `<button class="btn" data-play>${t('Main di tab baru')}</button>` : ''}${g.news ? `<button class="btn" data-news>${t('Baca beritanya')}</button>` : ''}</div>
        <p class="op-small">${FAN_DISCLAIMER}</p>
      </div>`;
      const play = body.querySelector('[data-play]'), news = body.querySelector('[data-news]');
      if (play) play.onclick = () => window.open(g.url, '_blank', 'noopener');
      if (news) news.onclick = () => window.open(g.news, '_blank', 'noopener');
    },
  });
}
