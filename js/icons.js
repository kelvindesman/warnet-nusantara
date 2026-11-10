// Hand-drawn inline SVG icons (no image requests = fast boot).
const s = (body, vb = '0 0 32 32') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

const G = {
  blue: `<defs><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#1b5fd0"/></linearGradient></defs>`,
};

export const icons = {
  computer: s(`<rect x="3" y="4" width="22" height="17" rx="2" fill="#d9d4c3" stroke="#6b6658"/><rect x="5.5" y="6.5" width="17" height="12" fill="#2a6fe0"/><path d="M5.5 15c4-4 10-5 17-3v6.5h-17z" fill="#62b440"/><rect x="11" y="21" width="6" height="3" fill="#a9a493"/><rect x="7" y="24" width="14" height="3" rx="1" fill="#d9d4c3" stroke="#6b6658"/><rect x="24" y="12" width="6" height="16" rx="1" fill="#d9d4c3" stroke="#6b6658"/><rect x="25.5" y="14" width="3" height="1.2" fill="#555"/><circle cx="27" cy="25" r=".9" fill="#3c3"/>`),
  folder: s(`<path d="M2 7h10l3 3h15v17H2z" fill="#e8b84a" stroke="#a87b16"/><path d="M2 12h28v15H2z" fill="#fbd96b" stroke="#a87b16"/>`),
  docs: s(`<path d="M2 7h10l3 3h15v17H2z" fill="#e8b84a" stroke="#a87b16"/><rect x="7" y="5" width="15" height="17" fill="#fff" stroke="#888"/><path d="M9 9h11M9 12h11M9 15h8" stroke="#5a8be0"/><path d="M2 13h28v14H2z" fill="#fbd96b" stroke="#a87b16"/>`),
  music: s(`<path d="M2 7h10l3 3h15v17H2z" fill="#e8b84a" stroke="#a87b16"/><path d="M2 12h28v15H2z" fill="#fbd96b" stroke="#a87b16"/><path d="M13 23V15l8-2v8" stroke="#a24" stroke-width="1.8" fill="none"/><circle cx="11.5" cy="23" r="2" fill="#a24"/><circle cx="19.5" cy="21" r="2" fill="#a24"/>`),
  games: s(`<path d="M2 7h10l3 3h15v17H2z" fill="#e8b84a" stroke="#a87b16"/><path d="M2 12h28v15H2z" fill="#fbd96b" stroke="#a87b16"/><rect x="8" y="16" width="16" height="8" rx="4" fill="#444"/><path d="M11 18v4M9 20h4" stroke="#fff" stroke-width="1.4"/><circle cx="20" cy="19" r="1.1" fill="#f44"/><circle cx="22" cy="21.2" r="1.1" fill="#4c4"/>`),
  recycle: s(`<path d="M7 9h18l-2 19H9z" fill="#cfe3f5" stroke="#5f86b0"/><ellipse cx="16" cy="9" rx="9.5" ry="2.5" fill="#e9f3fb" stroke="#5f86b0"/><path d="M12 14l-1.5 11M16 14v11M20 14l1.5 11" stroke="#9cbbd8"/><path d="M13 19l3-3 3 3" stroke="#2a9a3a" stroke-width="1.6" fill="none"/>`),
  recycleFull: s(`<path d="M7 9h18l-2 19H9z" fill="#cfe3f5" stroke="#5f86b0"/><rect x="10" y="3" width="8" height="9" fill="#fff" stroke="#999" transform="rotate(-14 14 8)"/><rect x="15" y="4" width="8" height="8" fill="#ffe680" stroke="#b9a040" transform="rotate(12 19 8)"/><ellipse cx="16" cy="9.5" rx="9.5" ry="2.5" fill="#e9f3fb" stroke="#5f86b0" fill-opacity=".7"/><path d="M12 14l-1.5 11M16 14v11M20 14l1.5 11" stroke="#9cbbd8"/>`),
  internet: s(`${G.blue}<circle cx="16" cy="16" r="12" fill="url(#gB)"/><path d="M7 11c3 1 4 4 7 3s2 5 0 7-1 5 1 6M19 5c-1 3 2 4 5 4s4 3 3 6" stroke="#4fb34a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M2 20c6-12 23-16 28-9" stroke="#ffc31f" stroke-width="2.4" fill="none"/><text x="16" y="22" font-size="16" font-weight="bold" text-anchor="middle" fill="#fff" font-family="Georgia,serif" stroke="#0d3d9a" stroke-width=".6">e</text>`),
  winamp: s(`<rect x="3" y="5" width="26" height="22" rx="4" fill="#2b2b2b" stroke="#aaa"/><path d="M8 20l3-8 3 6 3-9 3 7 2-3 2 4" stroke="#ffb31a" stroke-width="2" fill="none" stroke-linejoin="round"/><rect x="6" y="22" width="20" height="2" fill="#3c3"/>`),
  chat: s(`<path d="M3 5h18v12H11l-5 4v-4H3z" fill="#fff" stroke="#3a6ed8" stroke-width="1.4"/><path d="M12 11h17v11h-3v4l-5-4h-9z" fill="#ffe46b" stroke="#c09218" stroke-width="1.4"/><path d="M6 9h11M6 12h8" stroke="#3a6ed8"/><text x="20.5" y="19.5" font-size="8" text-anchor="middle" font-family="Arial" font-weight="bold" fill="#a06a00">#</text>`),
  messenger: s(`<circle cx="16" cy="16" r="13" fill="#ffd21f" stroke="#b18600"/><circle cx="11.5" cy="13" r="2" fill="#333"/><circle cx="20.5" cy="13" r="2" fill="#333"/><path d="M9 19c3 5 11 5 14 0" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 3l4 4" stroke="#7a2bd6" stroke-width="3" stroke-linecap="round"/>`),
  notepad: s(`<rect x="6" y="4" width="20" height="25" fill="#fff" stroke="#7a8aa0"/><rect x="6" y="2" width="20" height="5" fill="#4b7ad8"/><path d="M9 11h14M9 14h14M9 17h14M9 20h10M9 23h12" stroke="#99a"/>`),
  txt: s(`<path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#7a8aa0"/><path d="M20 3v6h6" fill="#dde" stroke="#7a8aa0"/><path d="M10 13h13M10 16h13M10 19h13M10 22h9" stroke="#99a"/>`),
  mine: s(`<circle cx="16" cy="17" r="8" fill="#222"/><path d="M16 5v24M4 17h24M8 9l16 16M24 9L8 25" stroke="#222" stroke-width="2.4"/><circle cx="13" cy="14" r="2.2" fill="#fff"/>`),
  snake: s(`<rect x="2" y="2" width="28" height="28" rx="3" fill="#9bbc0f"/><path d="M6 24h8v-8h8V8h4" stroke="#0f380f" stroke-width="4" fill="none" stroke-linejoin="round"/><rect x="6" y="6" width="4" height="4" fill="#306230"/>`),
  dos: s(`<rect x="2" y="5" width="28" height="22" rx="2" fill="#000" stroke="#888"/><rect x="2" y="5" width="28" height="4" fill="#0a246a"/><text x="5" y="20" font-size="9" fill="#ccc" font-family="monospace">C:\\&gt;_</text>`),
  game: s(`<rect x="3" y="10" width="26" height="14" rx="7" fill="#555" stroke="#222"/><path d="M9 14v6M6 17h6" stroke="#fff" stroke-width="2"/><circle cx="21" cy="15.5" r="1.7" fill="#f33"/><circle cx="24.5" cy="18.5" r="1.7" fill="#3c3"/><circle cx="21" cy="21" r="1.4" fill="#fc3"/>`),
  web: s(`${G.blue}<circle cx="16" cy="16" r="12" fill="url(#gB)"/><path d="M4 16h24M16 4c-6 6-6 18 0 24M16 4c6 6 6 18 0 24M6 9h20M6 23h20" stroke="#fff" stroke-opacity=".8" fill="none"/>`),
  link: s(`<path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#7a8aa0"/><rect x="5" y="19" width="10" height="10" fill="#fff" stroke="#333"/><path d="M8 26l5-5M10 21h3v3" stroke="#0a0" stroke-width="1.6" fill="none"/>`),
  drive: s(`<rect x="3" y="10" width="26" height="12" rx="2" fill="#d6d2c4" stroke="#6b6658"/><rect x="5" y="17" width="16" height="2" fill="#888"/><circle cx="25" cy="18" r="1.3" fill="#3c3"/>`),
  floppy: s(`<rect x="5" y="4" width="22" height="24" rx="1" fill="#333"/><rect x="10" y="4" width="12" height="8" fill="#ccc"/><rect x="18" y="5" width="3" height="6" fill="#333"/><rect x="8" y="16" width="16" height="12" fill="#fff"/>`),
  cd: s(`<circle cx="16" cy="16" r="12" fill="#ddd" stroke="#888"/><circle cx="16" cy="16" r="12" fill="url(#cdg)" opacity=".6"/><defs><linearGradient id="cdg"><stop offset="0" stop-color="#f6c"/><stop offset=".5" stop-color="#6cf"/><stop offset="1" stop-color="#fe6"/></linearGradient></defs><circle cx="16" cy="16" r="3" fill="#fff" stroke="#888"/>`),
  taskmgr: s(`<rect x="3" y="4" width="26" height="19" rx="2" fill="#d9d4c3" stroke="#6b6658"/><rect x="5.5" y="6.5" width="21" height="14" fill="#04140a"/><path d="M5.5 11.5h21M5.5 15.5h21M11 6.5v14M16.5 6.5v14M22 6.5v14" stroke="#0b4a1f" stroke-width=".6"/><path d="M6 18l3-2 2 1 3-6 3 4 3-7 2 3 4-4" fill="none" stroke="#3f3" stroke-width="1.4"/><rect x="12" y="23" width="8" height="3" fill="#a9a493"/><rect x="8" y="26" width="16" height="2.5" fill="#d9d4c3" stroke="#6b6658"/>`),
  display: s(`<rect x="3" y="4" width="26" height="19" rx="2" fill="#d9d4c3" stroke="#6b6658"/><rect x="5.5" y="6.5" width="21" height="14" fill="#3a6ea5"/><rect x="12" y="23" width="8" height="3" fill="#a9a493"/><rect x="8" y="26" width="16" height="2.5" fill="#d9d4c3" stroke="#6b6658"/><circle cx="12" cy="13" r="3" fill="#fe5"/>`),
  power: s(`<rect x="1" y="1" width="30" height="30" rx="5" fill="#e05a2a" stroke="#fff"/><path d="M11 10a8 8 0 1 0 10 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 6v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
  restart: s(`<rect x="1" y="1" width="30" height="30" rx="5" fill="#3aa83a" stroke="#fff"/><path d="M23 13a8 8 0 1 0 1 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 6v8h-8" fill="#fff"/>`),
  logoff: s(`<rect x="1" y="1" width="30" height="30" rx="5" fill="#e3a51f" stroke="#fff"/><path d="M8 8h9v16H8z" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M14 16h12M22 12l4 4-4 4" stroke="#fff" stroke-width="2.6" fill="none"/>`),
  standby: s(`<rect x="1" y="1" width="30" height="30" rx="5" fill="#e3a51f" stroke="#fff"/><path d="M19 7a9 9 0 1 0 6 13A8 8 0 0 1 19 7z" fill="#fff"/>`),
  help: s(`<circle cx="16" cy="16" r="13" fill="#2a6ed8" stroke="#0a3a9a"/><text x="16" y="22" font-size="17" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Georgia,serif">?</text>`),
  info: s(`<circle cx="16" cy="16" r="13" fill="#2a6ed8" stroke="#fff" stroke-width="1.5"/><text x="16" y="23" font-size="18" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Georgia,serif">i</text>`),
  warn: s(`<path d="M16 3L30 28H2z" fill="#ffd21f" stroke="#9a7a00" stroke-linejoin="round"/><text x="16" y="25" font-size="16" text-anchor="middle" font-weight="bold" font-family="Arial">!</text>`),
  error: s(`<circle cx="16" cy="16" r="13" fill="#e33" stroke="#900"/><path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
  back: s(`<circle cx="16" cy="16" r="13" fill="#3db33d" stroke="#1d7a1d"/><path d="M20 9l-8 7 8 7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  fwd: s(`<circle cx="16" cy="16" r="13" fill="#3db33d" stroke="#1d7a1d"/><path d="M12 9l8 7-8 7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  stop: s(`<rect x="4" y="4" width="24" height="24" rx="4" fill="#e33" stroke="#900"/><path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3"/>`),
  refresh: s(`<path d="M24 10a10 10 0 1 0 2 8" stroke="#2a8a2a" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M26 3v9h-9" fill="#2a8a2a"/>`),
  home: s(`<path d="M4 16L16 5l12 11" stroke="#a33" stroke-width="3" fill="none"/><path d="M8 15v13h16V15" fill="#ffefb0" stroke="#865"/><rect x="14" y="20" width="5" height="8" fill="#a65"/>`),
  search: s(`<circle cx="13" cy="13" r="8" fill="#d8ecff" stroke="#335" stroke-width="2.4"/><path d="M19 19l8 8" stroke="#a63" stroke-width="4" stroke-linecap="round"/>`),
  star: s(`<path d="M16 3l4 9 9 1-7 6 2 10-8-5-8 5 2-10-7-6 9-1z" fill="#ffd21f" stroke="#b18600"/>`),
  user: s(`<rect width="32" height="32" fill="#78b4ff"/><circle cx="16" cy="12" r="6" fill="#ffd3a6"/><path d="M4 32c1-9 6-12 12-12s11 3 12 12z" fill="#f60"/><path d="M10 10c0-5 12-6 12 0-3-2-9-2-12 0z" fill="#432"/>`),
  // "Dukung Warnet Ini": the open-source supporter heart (sponsor-style) with a gold star for the repo
  qris: s(`<rect x="4" y="3" width="24" height="26" rx="3" fill="#fff" stroke="#3a3a4a" stroke-width="1.6"/><g fill="#1b1b2b"><path d="M7 6h7v7H7zM18 6h7v7h-7zM7 17h7v7H7z" fill="none" stroke="#1b1b2b" stroke-width="1.8"/><rect x="9.3" y="8.3" width="2.4" height="2.4"/><rect x="20.3" y="8.3" width="2.4" height="2.4"/><rect x="9.3" y="19.3" width="2.4" height="2.4"/><rect x="17" y="17" width="2.5" height="2.5"/><rect x="21" y="17" width="2.5" height="2.5"/><rect x="19" y="20" width="2.5" height="2.5"/><rect x="23" y="21" width="2" height="3"/><rect x="17" y="22" width="2" height="2"/></g><rect x="4" y="25.5" width="24" height="3.5" rx="1.5" fill="#d0143a"/>`),
  ewallet: s(`<defs><linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa3ff"/><stop offset="1" stop-color="#1550c0"/></linearGradient><radialGradient id="gC" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff3a8"/><stop offset="1" stop-color="#e0a400"/></radialGradient></defs><rect x="6" y="2" width="15" height="27" rx="3" fill="url(#gW)" stroke="#0d3480" stroke-width="1.2"/><rect x="8" y="5" width="11" height="17" rx="1" fill="#e8f4ff"/><circle cx="13.5" cy="25.5" r="1.4" fill="#cfe4ff"/><circle cx="22" cy="20" r="7.5" fill="url(#gC)" stroke="#8a6400" stroke-width="1.2"/><text x="22" y="23" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#6b4a00">Rp</text>`),
  coffee: s(`<defs><linearGradient id="gK" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9d4c8"/></linearGradient></defs><path d="M10 4c-2 2 2 3 0 5M15 3c-2 2 2 3 0 5M20 4c-2 2 2 3 0 5" fill="none" stroke="#9aa3ad" stroke-width="1.4" stroke-linecap="round"/><path d="M23 15h2.5a3.5 3.5 0 0 1 0 7H22" fill="none" stroke="#7a4a1e" stroke-width="2.2"/><path d="M5 12h19v9a7 7 0 0 1-7 7h-5a7 7 0 0 1-7-7z" fill="url(#gK)" stroke="#5a3514" stroke-width="1.4"/><ellipse cx="14.5" cy="12.6" rx="8.6" ry="1.6" fill="#6b3d17"/><rect x="5" y="17" width="19" height="3" fill="#ffdd00"/>`),
  support: s(`<defs><linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a93"/><stop offset="1" stop-color="#d0143a"/></linearGradient></defs><path d="M16 28.5C6.5 21.8 2.5 16.8 2.5 11.2 2.5 7 5.6 3.8 9.6 3.8c2.7 0 4.9 1.5 6.4 3.9 1.5-2.4 3.7-3.9 6.4-3.9 4 0 7.1 3.2 7.1 7.4 0 5.6-4 10.6-13.5 17.3z" fill="url(#gH)" stroke="#8a0f25" stroke-width="1.2"/><ellipse cx="9.3" cy="9.6" rx="3" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 9.3 9.6)"/><path d="M25.5 1.2l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.7 1.4.5-3-2.1-2.1 3-.4z" fill="#ffd23f" stroke="#a87b16" stroke-width=".8"/>`),
  dolphin: s(`<rect width="32" height="32" fill="#1d6fd6"/><path d="M3 20c4-8 13-12 21-7 2 1 4 3 5 5-2-1-4-1-6 0l2 4c-3-1-6-2-8-2-5 1-9 1-14 0z" fill="#d6ecff" stroke="#0a3a7a"/><circle cx="23" cy="15" r=".9" fill="#000"/><path d="M14 13c0-3 2-5 4-6-1 2-1 4 0 6z" fill="#b5d8ff"/><path d="M0 26c5-2 10 2 16 0s11-2 16 0v6H0z" fill="#0a3a7a"/>`),
  freeze: s(`<path d="M16 2v28M4 9l24 14M28 9L4 23M12 4l4 4 4-4M12 28l4-4 4 4" stroke="#bff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`),
  volume: s(`<path d="M4 12h6l7-6v20l-7-6H4z" fill="#fff"/><path d="M21 11c2 2 2 8 0 10M24 8c4 4 4 12 0 16" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  network: s(`<rect x="2" y="4" width="13" height="10" fill="#cfe" stroke="#fff"/><rect x="17" y="18" width="13" height="10" fill="#cfe" stroke="#fff"/><path d="M8 14v6h12M24 18v-6h-8" stroke="#fff" stroke-width="2" fill="none"/>`),
  merahputih: s(`<path d="M5 3v27" stroke="#ddd" stroke-width="2"/><path d="M6 5c6-2 10 2 22 0v8c-12 2-16-2-22 0z" fill="#e8202a"/><path d="M6 13c6-2 10 2 22 0v8c-12 2-16-2-22 0z" fill="#fff"/>`),
  modem: s(`<rect x="2" y="12" width="28" height="10" rx="2" fill="#ddd" stroke="#666"/><circle cx="7" cy="17" r="1.2" fill="#3c3"/><circle cx="11" cy="17" r="1.2" fill="#3c3"/><circle cx="15" cy="17" r="1.2" fill="#fc3"/><circle cx="19" cy="17" r="1.2" fill="#f33"/><path d="M6 12V6M26 12l2-6" stroke="#666" stroke-width="1.6"/>`),
  paint: s(`<path d="M5 20c0-8 7-15 15-14s9 7 6 10-6 0-7 3 2 4 0 6-14 4-14-5z" fill="#f4e2b8" stroke="#8a6a3a"/><circle cx="11" cy="15" r="2" fill="#e33"/><circle cx="15" cy="11" r="2" fill="#3a3"/><circle cx="21" cy="11" r="2" fill="#33e"/><circle cx="11" cy="21" r="2" fill="#fc0"/>`),
  close: s(`<path d="M3 3l7 7M10 3l-7 7" stroke="#fff" stroke-width="2"/>`, '0 0 13 13'),
  min: s(`<rect x="2" y="9" width="6" height="2.5" fill="#fff"/>`, '0 0 13 13'),
  max: s(`<rect x="1.5" y="1.5" width="10" height="10" fill="none" stroke="#fff" stroke-width="1.4"/><rect x="1.5" y="1.5" width="10" height="2.5" fill="#fff"/>`, '0 0 13 13'),
  restore: s(`<rect x="4" y="1" width="8" height="7" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="1" y="5" width="8" height="7" fill="#2a66e8" stroke="#fff" stroke-width="1.2"/><rect x="1" y="5" width="8" height="2" fill="#fff"/>`, '0 0 13 13'),
};

let uid = 0;
// Gradient ids must be unique per instance, otherwise hidden copies break rendering.
export const icon = (name) => {
  const raw = icons[name] || icons.txt;
  if (!raw.includes('id="')) return raw;
  const k = ++uid;
  return raw.replace(/id="(\w+)"/g, `id="$1_${k}"`).replace(/url\(#(\w+)\)/g, `url(#$1_${k})`);
};

/** Distinct box-art style icon per game: colored cartridge + short label (+ shortcut arrow for external links). */
export function gameIcon(id, label, mode) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  const txt = label.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || '?';
  const fs = txt.length > 2 ? 9 : 12;
  const arrow = mode === 'tab' ? `<rect x="1" y="19" width="12" height="12" fill="#fff" stroke="#333"/><path d="M4 28l6-6M6.5 22H10v3.5" stroke="#0a0" stroke-width="1.8" fill="none"/>` : '';
  const key = 'gi:' + id;
  icons[key] = s(`<defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 80% 62%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 75% 32%)"/></linearGradient></defs>
    <rect x="4" y="2" width="24" height="28" rx="3" fill="url(#g${id})" stroke="#222"/><rect x="7" y="5" width="18" height="15" rx="1.5" fill="#0006"/>
    <text x="16" y="${fs > 10 ? 17 : 16}" font-size="${fs}" font-weight="bold" text-anchor="middle" fill="#fff" font-family="Arial Black,Arial,sans-serif">${txt}</text>
    <rect x="9" y="23" width="14" height="3" rx="1" fill="#0005"/>${arrow}`);
  return key;
}
