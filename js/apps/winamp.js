// Winamp: the real deal via Webamp (open-source Winamp 2 recreation, MIT), lazy-loaded from CDN.
// Tracks are chiptunes synthesized in-browser on first launch, so we ship 0 bytes of audio.
import { TRACKS } from '../data.js';
import { renderSong } from '../sound.js';
import { t } from '../i18n.js';
import { msgbox } from '../wm.js';

const WEBAMP_URL = 'https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.mjs';
let instance = null, loading = false, tracksCache = null;
const listeners = new Set();
export const onWinampChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (state) => listeners.forEach((fn) => fn(state));

function tracks() {
  if (tracksCache) return tracksCache;
  tracksCache = TRACKS.map((t) => {
    const { wav, duration } = renderSong(t);
    return { metaData: { artist: t.artist, title: t.title }, url: URL.createObjectURL(wav), duration };
  });
  return tracksCache;
}

export async function openWinamp() {
  if (instance) { instance.reopen?.(); emit('open'); return; }
  if (loading) return;
  loading = true; emit('loading');
  try {
    const mod = await import(/* @vite-ignore */ WEBAMP_URL);
    const Webamp = mod.default || mod.Webamp;
    if (!Webamp.browserIsSupported()) throw new Error(t('Browser tidak didukung Webamp'));
    // let the "loading" cursor paint before the synth work
    await new Promise((r) => setTimeout(r, 30));
    // Logged off while downloading: there is no desktop to play on any more.
    const desk = document.querySelector('.desktop');
    if (!desk) { emit('closed'); return; }
    const webamp = new Webamp({
      initialTracks: tracks(),
      zIndex: 8000,
      enableHotkeys: false,
    });
    // Webamp takes over its container, so give it a dedicated click-through layer.
    let host = /** @type {HTMLElement} */ (desk.querySelector('.wa-host'));
    if (!host) { host = document.createElement('div'); host.className = 'wa-host'; desk.appendChild(host); }
    await webamp.renderWhenReady(host);
    // Logged off while rendering: drop the player instead of keeping one nobody can see.
    if (!host.isConnected) { webamp.dispose(); emit('closed'); return; }
    instance = webamp;
    instance.reopen = () => { const el = document.getElementById('webamp'); if (el) el.style.display = ''; };
    webamp.onClose(() => { webamp.dispose(); instance = null; emit('closed'); });
    webamp.onMinimize(() => { const el = document.getElementById('webamp'); if (el) el.style.display = 'none'; emit('min'); });
    emit('open');
  } catch (err) {
    console.error(err);
    emit('closed');
    msgbox('Winamp', `${t('Winamp gagal dimuat (perlu koneksi ke unpkg.com).')}<br><small>${String(err.message || err)}</small>`, { kind: 'error' });
  } finally {
    loading = false;
  }
}

export function toggleWinamp() {
  const el = document.getElementById('webamp');
  if (!instance || !el) return openWinamp();
  el.style.display = el.style.display === 'none' ? '' : 'none';
  emit(el.style.display === 'none' ? 'min' : 'open');
}

export function closeWinamp() { if (instance) { try { instance.dispose(); } catch {} instance = null; emit('closed'); } }
export const winampOpen = () => !!instance;
