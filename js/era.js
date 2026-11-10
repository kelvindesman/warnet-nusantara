// The PC generation this warnet runs, picked on the billing screen ("Pilih PC"):
// 2003 is the original XP-style desktop, 2011 a glassy Win7-like one, 2015 a flat
// Win10-like one. The picker and the PC itself use the short names "Win XP", "Win 7",
// "Win 10" (owner decisions 2026-11-08). No vendor logos, artwork or sounds.
// The era drives the CSS theme (<html data-era>), the boot screen, the hourly rate,
// the default wallpaper and the default Wayback year of the time-travel browser.
import { pickEra } from './params.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import { esc } from './text.js';
import { msgbox, allWins, minimize, wireMenus } from './wm.js';

const KEY = 'era';
const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export const ERAS = {
  2003: {
    os: 'Win XP', label: 'Win XP', ver: 'Versi 2002 SP1', year: 2001, rate: 3000, malam: 10000, wall: 'bukit', mem: 131072,
    spec: 'Intel Pentium III 733 MHz<br>128 MB RAM · VGA 8MB<br>Modem 56k / LAN 10Mbps',
    bios: [
      '<span class="hi">Award Modular BIOS v4.51PG, An Energy Star Ally</span>',
      'Copyright (C) 1984-2000, Award Software, Inc.', '', 'WARNET NUSANTARA.NET  PC-{pc}  (i815E Chipset)', '',
      'Main Processor : Intel(R) Pentium(R) III 733MHz', 'Memory Testing : ', '', 'Award Plug and Play BIOS Extension v1.0A',
      'Detecting IDE Primary Master  ... SEAGATE ST320011A 20GB', 'Detecting IDE Primary Slave   ... None',
      'Detecting IDE Secondary Master... CD-ROM 52X', 'Detecting IDE Secondary Slave ... None', '',
      'Deep Freeze 5.0 ............. <span class="ok">[ FROZEN ]</span>', 'Realtek RTL8139 LAN ......... <span class="ok">[ OK ]</span>', 'Billing Client v3.1 ......... <span class="ok">[ OK ]</span>',
    ],
  },
  2011: {
    os: 'Win 7', label: 'Win 7', ver: 'Ultimate SP1', year: 2010, rate: 4000, malam: 15000, wall: 'aurora', mem: 2097152,
    spec: 'Intel Core i3-2100 3.1 GHz<br>2 GB DDR3 · GeForce GT 220<br>Speedy 1 Mbps / LAN 100Mbps',
    bios: [
      '<span class="hi">AMIBIOS(C) 2010 American Megatrends, Inc.</span>',
      'WARNET NUSANTARA.NET  PC-{pc}  (H61 Chipset)', '', 'CPU : Intel(R) Core(TM) i3-2100 CPU @ 3.10GHz', 'Memory Testing : ', '',
      'SATA Port 1 : WDC WD5000AAKX 500GB', 'SATA Port 2 : DVD-RW 24X', 'USB Devices total: 1 Keyboard, 1 Mouse, 1 Hub', '',
      'Deep Freeze 7.0 ............. <span class="ok">[ FROZEN ]</span>', 'Realtek PCIe FE Family ...... <span class="ok">[ OK ]</span>', 'Billing Client v5.2 ......... <span class="ok">[ OK ]</span>',
    ],
  },
  2015: {
    os: 'Win 10', label: 'Win 10', ver: 'Pro 1511', year: 2014, rate: 5000, malam: 20000, wall: 'garis', mem: 4194304,
    spec: 'Intel Core i5-4460 3.2 GHz<br>4 GB DDR3 · GeForce GTX 750 Ti<br>Fiber 10 Mbps / LAN 1Gbps',
    bios: [
      '<span class="hi">UEFI Fast Boot</span>', 'WARNET NUSANTARA.NET  PC-{pc}  (B85 Chipset)', '',
      'CPU : Intel(R) Core(TM) i5-4460 CPU @ 3.20GHz', 'Memory Testing : ', 'SSD : 120GB · HDD : 1TB', '',
      'Deep Freeze 8.3 ............. <span class="ok">[ FROZEN ]</span>', 'Billing Client v7.0 ......... <span class="ok">[ OK ]</span>',
    ],
  },
};

let cur = pickEra(location.search, saved());
document.documentElement.dataset.era = cur;

export const eraId = () => cur;
export const era = () => ERAS[cur];
/** Content rows of the current era. Rows without `era` belong to the original 2003 PC. */
export const forEra = (list) => list.filter((x) => (x.era || '2003') === cur);

/** Switch era: theme, saved choice and the URL (so a reload or shared link keeps it). */
export function setEra(id) {
  cur = id;
  document.documentElement.dataset.era = id;
  try { localStorage.setItem(KEY, id); } catch { /* private mode: the URL still carries it */ }
  const u = new URL(location.href);
  u.searchParams.set(KEY, id);
  history.replaceState(history.state, '', u.href);
}

/* ---- Explorer chrome per era. OS chrome stays English like the 2003 menus. ---- */

// [label, icon, what a click does: an app id to open, or a '!' action from DO below, indented]
const NAV = {
  2011: [['Favorites', 'star', 'docs'], ['Desktop', 'display', '!desk', 1], ['Downloads', 'folder', '!dl', 1], ['Recent Places', 'folder', 'docs', 1],
    ['Libraries', 'folder', 'docs'], ['Documents', 'docs', 'docs', 1], ['Music', 'music', 'music', 1],
    ['Computer', 'computer', 'computer'], ['Game Warnet', 'games', 'games', 1], ['Network', 'network', '!net']],
  2015: [['Quick access', 'star', 'docs'], ['Desktop', 'display', '!desk', 1], ['Documents', 'docs', 'docs', 1], ['Music', 'music', 'music', 1], ['Game Warnet', 'games', 'games', 1],
    ['This PC', 'computer', 'computer'], ['Recycle Bin', 'recycleFull', 'recycle'], ['Network', 'network', '!net']],
};

/** Write actions on a warnet PC: Deep Freeze undoes them, so say so instead of pretending. */
export const frozen = () => msgbox('Deep Freeze', t('Drive ini <b>DIBEKUKAN</b> oleh Deep Freeze.<br>Semua perubahan akan hilang saat komputer di-restart.<br><br>— Mas Operator'), { kind: 'warn' });
/** Settings dialogs the operator locked down. */
export const locked = () => msgbox('Administrator', t('Setting PC dikunci mas operator. Jangan dioprek ya!'), { kind: 'warn' });
const shareOff = () => msgbox('Network', t('Sharing dimatikan mas operator biar virus nggak nyebar ke 20 PC.'), { kind: 'info' });
const burn = () => msgbox('CD-RW', t('CD-RW warnet cuma bisa baca. Mau burn CD? Bilang mas operator, Rp 5.000 per keping.'), { kind: 'info' });
const DO = {
  desk: () => allWins().forEach(minimize), // "Show desktop"
  dl: () => msgbox('Downloads', t('Folder Downloads kosong. Deep Freeze menghapus semuanya tiap restart.'), { kind: 'info' }),
  net: shareOff,
};
const launch = (id) => () => window.dispatchEvent(new CustomEvent('launch', { detail: id }));

/** Search field: the search box on 2011/2015, the XP Search Companion in the task pane on 2003. */
const searchBox = (title) => `<label class="ex-search"><input type="search" class="ex-q" role="searchbox" spellcheck="false" autocomplete="off" placeholder="${esc(t('Cari di {folder}', { folder: title }))}" aria-label="${esc(t('Cari di {folder}', { folder: title }))}">${icon('search')}</label>`;

/** Toolbars above the file view: a command bar (2011) or ribbon tabs (2015) plus the address and search row. Empty on 2003. */
export function exBars(title) {
  if (cur === '2003') return '';
  const root = cur === '2011' ? 'Computer' : 'This PC';
  // Back/Forward stay greyed: every folder opens in its own window, so there is no history to walk.
  const nb = ['Back', 'Forward'].map((l, i) => `<button type="button" disabled aria-disabled="true" title="${l}" aria-label="${l}">${icon(i ? 'fwd' : 'back')}</button>`).join('');
  const addr = `<div class="ex-addr"><span class="ex-nb">${nb}</span><span class="ex-path">${icon('folder')}<span>› <button type="button" class="ex-crumb" data-go="computer">${root}</button> › ${esc(title)}</span></span>${searchBox(title)}</div>`;
  return cur === '2011'
    ? `<div class="ex-bars">${addr}<div class="ex-cmd"><button type="button" data-menu="Organize">Organize ▾</button><button type="button" data-cmd="open" disabled>Open</button><button type="button" data-menu="Share with">Share with ▾</button><button type="button" data-cmd="burn">Burn</button><button type="button" data-cmd="mkdir">New folder</button></div></div>`
    : `<div class="ex-bars"><div class="ex-ribbon">${['File', 'Home', 'Share', 'View'].map((m) => `<button type="button"${m === 'File' ? ' class="rb-file"' : ''} data-menu="${m}">${m}</button>`).join('')}</div>${addr}</div>`;
}

/** XP task-pane search box ("Search Companion"). Empty on 2011/2015, which search from the address row. */
export const exFind = (title) => (cur === '2003' ? `<div class="ex-box ex-find"><h5>Search</h5><div>${searchBox(title)}</div></div>` : '');

/** White navigation pane (Favorites/Libraries/Computer or Quick access/This PC). Empty on 2003. */
export function exNav() {
  if (cur === '2003') return '';
  return `<div class="ex-nav">${NAV[cur].map(([l, ic, go, sub]) => `<p class="${sub ? 'sub' : ''}" ${go[0] === '!' ? `data-do="${go.slice(1)}"` : `data-go="${go}"`}>${icon(ic)}${l}</p>`).join('')}</div>`;
}

/** Make an explorer window's chrome work: search, address crumb, navigation/task panes, menus, command bar and ribbon.
 *  Call after the window's own .ex-main handlers so "Open" sees the fresh selection. */
export function wireExplorer(body, win) {
  const main = body.querySelector('.ex-main'), st = body.querySelector('.st'), q = body.querySelector('.ex-q');
  const empty = document.createElement('p'); empty.className = 'ex-empty'; empty.hidden = true; main.appendChild(empty);
  const sel = () => main.querySelector('.icon.sel');
  const open = () => sel().dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  const ifSel = (l, fn) => [l, sel() && fn];
  const filter = () => {
    const s = q.value.trim().toLowerCase();
    // a subgroup (e.g. the rental PS shelf) lives inside its group: the group header and its
    // disclaimer show whenever any item under them matches, the subgroup header only for its own
    let n = 0, head = [], hit = false, sub = null, subHit = false;
    const endSub = () => { if (sub) sub.hidden = !subHit; sub = null; };
    const endGroup = () => { endSub(); head.forEach((x) => { x.hidden = !hit; }); };
    for (const el of main.children) {
      if (el.classList.contains('group')) { endGroup(); head = [el]; hit = false; } else if (el.classList.contains('subgroup')) { endSub(); sub = el; subHit = false; } else if (el.classList.contains('fp-disc')) head.push(el);
      else if (el.classList.contains('icon')) { el.hidden = !el.textContent.toLowerCase().includes(s); if (!el.hidden) { n++; hit = subHit = true; } }
    }
    endGroup();
    if (sel()?.hidden) sel().classList.remove('sel'); // a hidden item cannot stay the "Open" target
    empty.hidden = n > 0;
    empty.textContent = t('Tidak ada yang cocok dengan "{q}".', { q: q.value.trim() });
    st.textContent = itemCount(n);
    cmds();
  };
  const find = () => q.focus();
  const refresh = () => { q.value = ''; filter(); };
  const MENUS = {
    File: () => [ifSel('Open', open), '-', ['Close', win.close]],
    Edit: () => [['Search...', find]],
    View: () => [['Refresh', refresh]],
    Favorites: () => [['My Documents', launch('docs')], ['Game Warnet', launch('games')], [t('Lagu MP3'), launch('music')]],
    Tools: () => [['Folder Options...', locked]],
    Help: () => [['About Windows', launch('about')]],
    Organize: () => [ifSel('Open', open), ['New folder', frozen], ifSel('Delete', frozen), '-', ['Close', win.close]],
    Home: () => [ifSel('Open', open), ['New folder', frozen], ifSel('Delete', frozen)],
    'Share with': () => [['Homegroup', shareOff], ['Specific people...', shareOff]],
    Share: () => [['Burn to disc', burn], ['Email', shareOff]],
  };
  const CMD = { open, burn, mkdir: frozen };
  const cmds = () => body.querySelectorAll('[data-cmd="open"]').forEach((b) => { b.disabled = !sel(); });
  main.addEventListener('click', cmds);
  q.addEventListener('input', filter);
  wireMenus(body, MENUS);
  body.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'), act = e.target.closest('[data-do]'), c = e.target.closest('[data-cmd]');
    if (go) launch(go.dataset.go)();
    if (act) DO[act.dataset.do]();
    if (c) CMD[c.dataset.cmd]();
  });
}

/** Status bar count: "86 objek" on XP, "86 item" later. */
export const itemCount = (n) => (cur === '2003' ? t('{n} objek', { n }) : t('{n} item', { n }));
