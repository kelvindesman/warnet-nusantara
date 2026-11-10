// Tiny WebAudio sound kit: everything is synthesized, zero audio files shipped.
let ctx;
let muted = false;
export const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
export const setMuted = (m) => { muted = m; if (ctx) (m ? ctx.suspend() : ctx.resume()); };
export const isMuted = () => muted;

/** @param {number} freq @param {number} start @param {number} dur @param {{ type?: OscillatorType, vol?: number, attack?: number, release?: number, dest?: AudioNode }} [opts] */
function tone(freq, start, dur, { type = 'sine', vol = 0.15, attack = 0.01, release = 0.08, dest } = {}) {
  const a = audio();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + attack);
  g.gain.setValueAtTime(vol, Math.max(start + attack, start + dur - release));
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g).connect(dest || a.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
  return o;
}

let noiseBuf;
/** @param {number} start @param {number} dur @param {{ vol?: number, freq?: number, q?: number, dest?: AudioNode }} [opts] */
function noise(start, dur, { vol = 0.1, freq = 2000, q = 0.7, dest } = {}) {
  const a = audio();
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = a.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, start); g.gain.setValueAtTime(vol, start + dur - 0.02); g.gain.linearRampToValueAtTime(0, start + dur);
  src.connect(f).connect(g).connect(dest || a.destination);
  src.start(start); src.stop(start + dur + 0.05);
}

const ok = () => !muted && (audio().state !== 'suspended' || (audio().resume(), true));

/** Warm, original "PC boot" chime. */
export function chime() {
  if (!ok()) return;
  const t = audio().currentTime + 0.05;
  const notes = [[63, 0], [70, 0.25], [75, 0.5], [79, 0.75], [82, 1.0]];
  for (const [m, d] of notes) {
    const f = 440 * 2 ** ((m - 69) / 12);
    tone(f, t + d, 2.6 - d, { type: 'triangle', vol: 0.09, attack: 0.05, release: 1.4 });
    tone(f * 2, t + d, 1.8 - d * 0.6, { type: 'sine', vol: 0.03, attack: 0.05, release: 1 });
  }
  tone(440 * 2 ** ((51 - 69) / 12), t, 3, { type: 'sine', vol: 0.12, attack: 0.3, release: 1.5 });
}

export function ding(kind = 'info') {
  if (!ok()) return;
  const t = audio().currentTime;
  if (kind === 'error') { tone(330, t, 0.18, { type: 'square', vol: 0.05 }); tone(247, t + 0.16, 0.3, { type: 'square', vol: 0.05 }); }
  else { tone(880, t, 0.35, { type: 'triangle', vol: 0.1, release: 0.3 }); tone(1320, t + 0.08, 0.35, { type: 'sine', vol: 0.05, release: 0.3 }); }
}

export function click() { if (!ok()) return; const t = audio().currentTime; noise(t, 0.02, { vol: 0.15, freq: 3000 }); }

export function buzz() {
  if (!ok()) return;
  const t = audio().currentTime;
  for (let i = 0; i < 6; i++) tone(i % 2 ? 180 : 140, t + i * 0.09, 0.09, { type: 'sawtooth', vol: 0.08, attack: 0.002, release: 0.01 });
}

export function door(open = true) {
  if (!ok()) return;
  const t = audio().currentTime;
  const seq = open ? [523, 659, 784] : [784, 659, 523];
  seq.forEach((f, i) => tone(f, t + i * 0.09, 0.2, { type: 'triangle', vol: 0.08 }));
}

/** ~9 seconds of the most iconic sound of the era: the dial-up handshake.
 *  Returns a promise that resolves when done (or immediately when muted). */
export function dialup(number = '080989999') {
  if (!ok()) return Promise.resolve();
  const a = audio();
  const out = a.createGain(); out.gain.value = 0.7; out.connect(a.destination);
  const dest = out;
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], 0: [941, 1336] };
  let t = a.currentTime + 0.05;
  // dial tone
  tone(350, t, 0.9, { vol: 0.07, dest }); tone(440, t, 0.9, { vol: 0.07, dest }); t += 1.0;
  for (const d of number) {
    const [lo, hi] = DTMF[d];
    tone(lo, t, 0.09, { vol: 0.08, attack: 0.003, release: 0.01, dest }); tone(hi, t, 0.09, { vol: 0.08, attack: 0.003, release: 0.01, dest });
    t += 0.14;
  }
  t += 0.6;
  // ring-back
  tone(440, t, 0.8, { vol: 0.05, dest }); tone(480, t, 0.8, { vol: 0.05, dest }); t += 1.1;
  // answer tone with phase-reversal clicks
  tone(2100, t, 1.3, { vol: 0.06, dest });
  for (let i = 0; i < 3; i++) noise(t + 0.45 * i, 0.015, { vol: 0.2, freq: 2100, dest });
  t += 1.3;
  // V.8 negotiation chirps
  for (let i = 0; i < 6; i++) {
    tone(i % 2 ? 1650 : 980, t + i * 0.11, 0.11, { type: 'square', vol: 0.025, attack: 0.002, release: 0.01, dest });
    tone(i % 2 ? 1850 : 1180, t + i * 0.11, 0.11, { type: 'square', vol: 0.02, attack: 0.002, release: 0.01, dest });
  }
  t += 0.7;
  // the "bong"
  tone(1200, t, 0.55, { vol: 0.07, dest }); tone(2400, t, 0.55, { vol: 0.04, dest }); tone(600, t + 0.05, 0.4, { type: 'triangle', vol: 0.05, dest });
  t += 0.6;
  // training: warbles then hiss
  for (let i = 0; i < 10; i++) tone(1800 + (i % 3) * 300, t + i * 0.05, 0.05, { type: 'square', vol: 0.02, attack: 0.001, release: 0.005, dest });
  t += 0.5;
  noise(t, 2.2, { vol: 0.22, freq: 1800, q: 0.4, dest });
  noise(t + 0.4, 1.6, { vol: 0.12, freq: 600, q: 1.5, dest });
  tone(1650, t + 0.2, 0.5, { type: 'sawtooth', vol: 0.02, dest });
  t += 2.3;
  return new Promise((r) => setTimeout(r, (t - a.currentTime) * 1000));
}

/* --------------------------------------------------------------------------
   Chiptune renderer → WAV blob URL (fed to Webamp). Pure math, no nodes.
   -------------------------------------------------------------------------- */
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const CHORD = { maj: [0, 4, 7, 12], min: [0, 3, 7, 12], sus: [0, 5, 7, 12], m7: [0, 3, 7, 10] };

export function renderSong({ bpm = 128, prog, seed = 1, bars = 24, duty = 0.25, swing = 0, rate = 22050 }) {
  const r = rng(seed);
  const step = 60 / bpm / 4;
  const steps = bars * 16;
  const len = Math.ceil(steps * step * rate) + rate;
  const buf = new Float32Array(len);
  // write a one-phrase motif (8 bars) and reuse it so the song feels composed
  const motif = Array.from({ length: 32 }, () => (r() < 0.62 ? Math.floor(r() * 4) : -1));
  const motif2 = Array.from({ length: 32 }, () => (r() < 0.7 ? Math.floor(r() * 4) : -1));
  const add = (startSec, durSec, fn) => {
    const s0 = Math.floor(startSec * rate), n = Math.floor(durSec * rate);
    for (let i = 0; i < n && s0 + i < len; i++) buf[s0 + i] += fn(i / rate, i / n);
  };
  let nz = 1;
  const noiseS = () => ((nz = (nz * 1103515245 + 12345) >>> 0) / 2147483648 - 1);
  for (let st = 0; st < steps; st++) {
    const bar = Math.floor(st / 16), pos = st % 16;
    const [root, kind] = prog[bar % prog.length];
    const ch = CHORD[kind];
    const t = st * step + (pos % 2 ? swing * step : 0);
    const section = Math.floor(bar / 8) % 3; // 0 intro-ish, 1 main, 2 variation
    // bass (triangle)
    if (pos % 2 === 0) {
      const m = root - 12 + (pos % 4 === 2 ? 12 : 0);
      const f = mtof(m);
      add(t, step * 1.8, (x, p) => (Math.abs(((x * f) % 1) * 4 - 2) - 1) * 0.28 * (1 - p * 0.6));
    }
    // arpeggio (thin square)
    if (section > 0 || bar % 2) {
      const f = mtof(root + 12 + ch[pos % 4]);
      add(t, step * 0.9, (x, p) => (((x * f) % 1) < 0.125 ? 1 : -1) * 0.05 * (1 - p));
    }
    // lead melody
    const mo = (section === 2 ? motif2 : motif)[(bar % 2) * 16 + pos];
    if (section > 0 && mo >= 0 && pos % 2 === 0) {
      const f = mtof(root + 24 + ch[mo]);
      const vib = 5.5;
      add(t, step * 1.9, (x, p) => {
        const ff = f * (1 + 0.006 * Math.sin(2 * Math.PI * vib * x));
        return (((x * ff) % 1) < duty ? 1 : -1) * 0.11 * Math.min(1, (1 - p) * 3);
      });
    }
    // drums
    if (pos === 0 || pos === 8 || (section === 2 && pos === 10)) {
      add(t, 0.16, (x, p) => Math.sin(2 * Math.PI * (60 + 140 * (1 - p) ** 3) * x) * 0.55 * (1 - p));
    }
    if (pos === 4 || pos === 12) add(t, 0.12, (x, p) => noiseS() * 0.22 * (1 - p) ** 2);
    if (pos % 2 === 1 || (section === 2 && pos % 2 === 0)) add(t, 0.03, (x, p) => noiseS() * 0.07 * (1 - p));
  }
  // fade out + soft clip
  const fadeN = rate * 3, end = Math.floor(steps * step * rate);
  for (let i = 0; i < len; i++) {
    let v = buf[i];
    if (i > end - fadeN) v *= Math.max(0, (end - i) / fadeN);
    buf[i] = Math.tanh(v * 1.2);
  }
  return { wav: toWav(buf, rate), duration: Math.round(steps * step) };
}

function toWav(samples, rate) {
  const b = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(b);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  return new Blob([b], { type: 'audio/wav' });
}
