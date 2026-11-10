// Windows Task Manager (Ctrl+Shift+Esc, or right-click the taskbar): the open windows,
// the warnet's processes (the operator's ones refuse to die) and a live CPU graph.
import { openWindow, allWins, close, restore, focus, minimize, msgbox, esc } from '../wm.js';
import { icon } from '../icons.js';
import { t } from '../i18n.js';
import { eraId, locked } from '../era.js';

const TABS = [['apps', 'Applications'], ['procs', 'Processes'], ['perf', 'Performance']];
/** Physical memory of the booth PC in each era, in K. */
const RAM = { 2003: 262144, 2011: 2097152, 2015: 4194304 };
/** Always-running processes: [image name, user, mem K, why ending it is refused]. */
const SYS = [
  ['System Idle Process', 'SYSTEM', 16, t('Jangan dimatiin, nanti PC-nya ngambek.')],
  ['explorer.exe', 'warnet', 18204, t('Kalau explorer.exe dimatiin, desktopnya hilang dan kamu harus manggil mas operator. Jangan ya.')],
  ['billing.exe', 'SYSTEM', 6120, t('Akses ditolak. Billing dijaga mas operator. Ketahuan matiin billing = di-banned seminggu!')],
  ['DeepFrz.exe', 'SYSTEM', 2348, t('Akses ditolak. Deep Freeze nggak bisa dimatiin dari sini.')],
];
/** Image name of a window's process: the real program where there was one, else the window id. */
const EXE = { browser: 'iexplore', chat: 'mirc32', ym: 'msmsgs', winamp: 'winamp' };
const exe = (w) => `${EXE[w.id] || w.id.replace(/^np-.*/, 'notepad').replace(/^(game|pay)-/, '').replace(/[^\w-]/g, '')}.exe`;
const memOf = (w) => 4000 + ((w.title.length * 7919) % 30000);
const kb = (n) => `${n.toLocaleString('en-US')} K`;

export function openTaskManager() {
  let tab = 'apps', pick = '', cpu = 4, seen = '';
  const hist = Array(40).fill(4);
  return openWindow({
    id: 'taskmgr', title: 'Windows Task Manager', iconName: 'taskmgr', width: 420, height: 440,
    content: (body, win) => {
      body.innerHTML = `<div class="tm"><div class="tm-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}">${l}</button>`).join('')}</div>
        <div class="tm-page" role="tabpanel"></div><div class="tm-btns"></div></div>
        <div class="statusbar"><span class="tm-st"></span><span class="tm-cpu"></span></div>`;
      const page = body.querySelector('.tm-page'), btns = body.querySelector('.tm-btns');
      const others = () => allWins().filter((w) => w !== win);
      const rows = () => (tab === 'apps'
        ? others().map((w) => ({ key: w.id, w, why: '', cells: [`${icon(w.iconName)}${esc(w.title)}`, 'Running'] }))
        : [...SYS.map(([n, u, m, why]) => ({ key: n, w: null, why, cells: [n, u, n === 'System Idle Process' ? String(100 - cpu).padStart(2, '0') : '00', kb(m)] })),
          ...others().map((w) => ({ key: `w:${w.id}`, w, why: '', cells: [exe(w), 'warnet', '00', kb(memOf(w))] }))]);
      const perf = () => {
        const used = 98304 + others().reduce((a, w) => a + memOf(w), 0), total = RAM[eraId()];
        const pts = hist.map((v, i) => `${i * 5},${100 - v}`).join(' ');
        return `<div class="tm-perf"><b>CPU Usage</b><b>CPU Usage History</b>
          <div class="tm-meter"><i style="height:${cpu}%"></i><span>${cpu} %</span></div>
          <svg class="tm-graph" viewBox="0 0 195 100" preserveAspectRatio="none"><polyline points="${pts}"/></svg>
          <b>Physical Memory (K)</b><b></b>
          <dl><dt>Total</dt><dd>${kb(total)}</dd><dt>Available</dt><dd>${kb(total - used)}</dd><dt>In use</dt><dd>${kb(used)}</dd></dl></div>`;
      };
      const render = () => {
        body.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
        body.querySelector('.tm-st').textContent = `Processes: ${SYS.length + others().length}`;
        body.querySelector('.tm-cpu').textContent = `CPU Usage: ${cpu}%`;
        seen = others().map((w) => w.id).join();
        if (tab === 'perf') { page.innerHTML = perf(); btns.innerHTML = ''; return; }
        const rs = rows(), head = tab === 'apps' ? ['Task', 'Status'] : ['Image Name', 'User Name', 'CPU', 'Mem Usage'];
        if (!rs.some((r) => r.key === pick)) pick = '';
        page.innerHTML = `<table class="tm-list"><thead><tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rs.map((r) => `<tr data-k="${esc(r.key)}"${r.key === pick ? ' class="sel"' : ''}>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        const off = pick ? '' : ' disabled';
        btns.innerHTML = tab === 'apps'
          ? `<button type="button" class="btn" data-a="end"${off}>End Task</button><button type="button" class="btn" data-a="switch"${off}>Switch To</button><button type="button" class="btn" data-a="new">New Task...</button>`
          : `<button type="button" class="btn" data-a="end"${off}>End Process</button>`;
      };
      const act = (a) => {
        if (a === 'new') return locked();
        const r = rows().find((x) => x.key === pick);
        if (a === 'switch') { minimize(win); restore(r.w); focus(r.w); return; } // Options ▸ Minimize On Use, on by default
        if (r.why) return msgbox('Unable to Terminate Process', r.why, { kind: 'error' });
        close(r.w); render();
      };
      body.addEventListener('click', (e) => {
        const tb = e.target.closest('[data-tab]'), row = e.target.closest('tr[data-k]'), a = e.target.closest('[data-a]');
        if (tb) { tab = tb.dataset.tab; pick = ''; render(); }
        if (row) { pick = row.dataset.k; render(); }
        if (a) act(a.dataset.a);
      });
      // every second: the CPU wobbles, the graph scrolls, and the lists follow windows opened or closed elsewhere
      const timer = setInterval(() => {
        cpu = Math.max(1, Math.min(97, cpu + Math.round((Math.random() - 0.45) * 12)));
        hist.shift(); hist.push(cpu);
        body.querySelector('.tm-cpu').textContent = `CPU Usage: ${cpu}%`;
        if (tab === 'perf' || seen !== others().map((w) => w.id).join()) render();
      }, 1000);
      win.cleanup.push(() => clearInterval(timer));
      render();
    },
  });
}
