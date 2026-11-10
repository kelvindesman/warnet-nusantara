// Instant messenger with the most important feature of 2003: BUZZ!!!
import { openWindow, esc } from '../wm.js';
import { icon } from '../icons.js';
import { buzz, ding } from '../sound.js';
import { getUser } from '../state.js';
import { t } from '../i18n.js';

const BUDDY = 'cewe_gaul_2003';
const REPLIES = ['hai jg :)', 'lg di warnet mana?', 'asl? :D', 'hehehe', 'ih apaan sih :p', 'udah makan blm?', 'aku lg dengerin lagu sheila on 7', 'brb ya, mama manggil', 'kamu add friendster aku blm?', 'jgn buzz2 dong :((', 'iya iya', 'wkwkwk', 'kirim testi dong', 'bentar billing aku mau abis', 'besok chat lg yah', 'bener?? :-O', 'ga percaya ahh', 'hmm..', '*malu*'];

export function openMessenger() {
  return openWindow({
    id: 'ym', title: `${BUDDY} - Instant Message`, iconName: 'messenger', width: 400, height: 420,
    content: (body, win) => {
      const me = getUser();
      body.innerHTML = `<div class="ym">
        <div class="ym-head">${icon('messenger')}<div><b>${BUDDY}</b><br><small>${t('♪ lagi dengerin: Peterpan - Mungkin Nanti ♪')}</small></div></div>
        <div class="ym-log" role="log" aria-live="polite"></div>
        <div class="ym-tools"><button title="${t('Senyum')}">:)</button><button title="${t('Ketawa')}">:))</button><button title="${t('Malu')}">:"&gt;</button><button class="bz">BUZZ!</button></div>
        <div class="ym-input"><textarea aria-label="${t('Pesan')}" placeholder="${t('Ketik pesan lalu Enter')}"></textarea><button class="btn" style="min-width:56px">${t('Kirim')}</button></div></div>`;
      const log = body.querySelector('.ym-log'), ta = body.querySelector('textarea');
      const add = (who, txt, cls) => { log.insertAdjacentHTML('beforeend', `<p><span class="${cls}">${esc(who)}:</span> ${esc(txt)}</p>`); log.scrollTop = log.scrollHeight; };
      const sys = (html) => { log.insertAdjacentHTML('beforeend', `<p>${html}</p>`); log.scrollTop = log.scrollHeight; };
      const reply = () => setTimeout(() => { ding(); add(BUDDY, REPLIES[(Math.random() * REPLIES.length) | 0], 'n2'); }, 1200 + Math.random() * 2500);
      const send = () => { const msg = ta.value.trim(); ta.value = ''; if (!msg) return; add(me, msg, 'n1'); if (Math.random() < 0.85) reply(); };
      const doBuzz = (from) => { buzz(); win.shake(); sys(`<span class="buzz">${esc(from)}: BUZZ!!!</span>`); };
      ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      body.querySelector('.ym-input .btn').onclick = send;
      body.querySelector('.ym-tools').onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('bz')) { doBuzz(me); if (Math.random() < 0.6) setTimeout(() => doBuzz(BUDDY), 2500); else reply(); }
        else { ta.value += b.textContent + ' '; ta.focus(); }
      };
      sys(`<i style="color:#888">${t('{buddy} sedang online.', { buddy: BUDDY })}</i>`);
      const t1 = setTimeout(() => { add(BUDDY, `hai ${me}! salken ya :)`, 'n2'); ding(); }, 1500);
      const t2 = setTimeout(() => doBuzz(BUDDY), 9000);
      win.cleanup.push(() => { clearTimeout(t1); clearTimeout(t2); });
      setTimeout(() => ta.focus(), 50);
    },
  });
}
