// IRC-style chat room, populated by very 2002 bots.
import { openWindow, esc } from '../wm.js';
import { IRC } from '../data.js';
import { getUser } from '../state.js';
import { t } from '../i18n.js';
import { eraId } from '../era.js';

const pick = (a) => a[(Math.random() * a.length) | 0];
const stamp = () => { const d = new Date(); return `[${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}]`; };

export function openChat() {
  return openWindow({
    id: 'chat', title: `IRC Chat - [${IRC.server}]`, iconName: 'chat', width: 680, height: 440,
    content: (body, win) => {
      // newer PCs: the same channels, talking about that era's games and apps
      const E = { since: 'Sat Jan 12 2002', lines: IRC.lines, replies: IRC.replies, ...IRC.eras[eraId()] };
      const me = getUser().replace(/\W/g, '_').slice(0, 14) || 'tamu';
      const state = Object.fromEntries(Object.entries(IRC.channels).map(([k, v]) => [k, { nicks: [...v], log: [] }]));
      let cur = '#jakarta';
      body.innerHTML = `<div class="irc-chan">${Object.keys(state).map((c) => `<button data-c="${c}">${c}</button>`).join('')}</div>
        <div class="irc"><div class="irc-log" role="log" aria-live="polite"></div><div class="irc-nicks"></div></div>
        <div class="irc-input"><input class="field" placeholder="${t('Ketik pesan... (/me, /nick, /join #channel, /slap nick)')}" aria-label="${t('Pesan')}" /><button class="btn" style="min-width:50px">${t('Kirim')}</button></div>`;
      const logEl = body.querySelector('.irc-log'), nickEl = body.querySelector('.irc-nicks'), input = body.querySelector('input');
      let nick = me;

      const line = (ch, cls, html) => {
        const s = state[ch]; s.log.push(`<p class="${cls}"><span class="t">${stamp()}</span> ${html}</p>`);
        if (s.log.length > 300) s.log.shift();
        if (ch === cur) { logEl.insertAdjacentHTML('beforeend', s.log.at(-1)); if (logEl.childElementCount > 300) logEl.firstElementChild.remove(); logEl.scrollTop = logEl.scrollHeight; }
        else body.querySelector(`[data-c="${ch}"]`)?.classList.add('hl');
      };
      const say = (ch, who, text, cls = '') => line(ch, cls, `&lt;${esc(who)}&gt; ${esc(text)}`);
      const render = () => {
        body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b.dataset.c === cur));
        body.querySelector(`[data-c="${cur}"]`).classList.remove('hl');
        logEl.innerHTML = state[cur].log.join(''); logEl.scrollTop = logEl.scrollHeight;
        nickEl.innerHTML = ['@ChanServ', `${nick}`, ...state[cur].nicks].map((n) => `<div>${esc(n)}</div>`).join('');
        win.setTitle(`IRC Chat - [${IRC.server}] ${cur} [${state[cur].nicks.length + 2}]`);
      };
      body.querySelector('.irc-chan').onclick = (e) => { const c = e.target.closest('[data-c]')?.dataset.c; if (c) { cur = c; render(); input.focus(); } };

      for (const ch of Object.keys(state)) {
        line(ch, 'sys', `* Now talking in ${esc(ch)}`);
        line(ch, 'sys', `* Topic is 'Selamat datang di ${esc(ch)} ~ NO FLOOD, NO CAPS, NO SPAM ~ asl pls dilarang (bohong) ~'`);
        line(ch, 'sys', `* Set by ChanServ on ${esc(E.since)}`);
      }
      render();

      const send = () => {
        const t = input.value.trim(); input.value = ''; if (!t) return;
        if (t.startsWith('/')) {
          const [cmd, ...rest] = t.slice(1).split(' '); const arg = rest.join(' ');
          if (cmd === 'me') line(cur, 'act', `* ${esc(nick)} ${esc(arg)}`);
          else if (cmd === 'nick' && arg) { line(cur, 'sys', `* ${esc(nick)} is now known as ${esc(arg)}`); nick = arg.slice(0, 16); render(); }
          else if (cmd === 'join' && arg.startsWith('#')) { if (!state[arg]) { state[arg] = { nicks: [pick(IRC.channels['#jakarta'])], log: [] }; body.querySelector('.irc-chan').insertAdjacentHTML('beforeend', `<button data-c="${esc(arg)}">${esc(arg)}</button>`); line(arg, 'sys', `* Now talking in ${esc(arg)}`); } cur = arg; render(); }
          else if (cmd === 'slap') line(cur, 'act', `* ${esc(nick)} slaps ${esc(arg || pick(state[cur].nicks))} around a bit with a large trout`);
          else line(cur, 'err', `* Unknown command: ${esc(cmd)}`);
          return;
        }
        say(cur, nick, t, 'me');
        if (Math.random() < 0.75) setTimeout(() => say(cur, pick(state[cur].nicks), pick(E.replies).replace('{me}', nick)), 900 + Math.random() * 2500);
      };
      input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
      body.querySelector('.irc-input .btn').onclick = send;

      let alive = true;
      const chatter = () => {
        if (!alive) return;
        const ch = Math.random() < 0.6 ? cur : pick(Object.keys(state));
        const s = state[ch];
        if (Math.random() < 0.12) {
          const n = pick(s.nicks); const [cls, msg] = pick(IRC.events)(n);
          line(ch, cls, esc(msg).replace('you', esc(nick)));
          if (msg.includes('quit')) { s.nicks = s.nicks.filter((x) => x !== n); setTimeout(() => { s.nicks.push(n); line(ch, 'sys', `* ${esc(n)} has joined ${esc(ch)}`); if (ch === cur) render(); }, 8000); }
          if (ch === cur) render();
        } else say(ch, pick(s.nicks), pick(E.lines));
        setTimeout(chatter, 1200 + Math.random() * 3800);
      };
      setTimeout(chatter, 800);
      win.cleanup.push(() => { alive = false; });
      setTimeout(() => input.focus(), 50);
    },
  });
}
