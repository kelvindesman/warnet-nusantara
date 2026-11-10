// Content: bookmarks, game catalog, IRC bots, supporters, and the memories.
import { LANG, t } from './i18n.js';

export const wayback = (url, year) => `https://web.archive.org/web/${year}if_/${url}`;

// Community-editable content lives in data/*.json (schema-checked in CI) so
// content PRs never touch engine code. Loaded relative to this module, so it
// works at the site root and under a subpath (GitHub Pages).
const load = async (name) => {
  const r = await fetch(new URL(`../data/${name}.json`, import.meta.url));
  if (!r.ok) throw new Error(`data/${name}.json: HTTP ${r.status}`);
  return r.json();
};
const [bookmarks, games, irc, supporters, maintainers, links, demo] = await Promise.all(
  ['bookmarks', 'games', 'irc', 'supporters', 'maintainers', 'links', 'demo'].map(load),
).catch((e) => {
  // Without content the warnet cannot boot. Say so on screen (not a blank page)
  // and stop here: the module stays pending, so main.js never runs half-loaded.
  console.warn(e);
  const root = document.getElementById('root');
  root.innerHTML = `<div class="net-down" role="alert">${t('<b>Koneksi warnet putus.</b><br>Data warnet gagal dimuat. Coba refresh (F5) atau panggil mas operator.')}</div>`;
  return new Promise(() => {});
});

export const BOOKMARKS = bookmarks;
// mode: 'embed' = plays inside our window, 'tab' = site forbids framing → opens new tab, 'local' = built in
export const GAMES = games;
export const SUPPORTERS = supporters.filter((x) => !x.hidden);
export const MAINTAINERS = maintainers;
export const LINKS = links;
export const DEMO = demo;

export const TRACKS = [
  { artist: 'Operator Warnet', title: 'Billing Habis Lagi (8-bit)', bpm: 132, seed: 7, duty: 0.25, prog: [[57, 'min'], [53, 'maj'], [48, 'maj'], [55, 'maj']] },
  { artist: 'DJ Begadang', title: 'Paket Malam 00.00-06.00', bpm: 140, seed: 21, duty: 0.5, swing: 0.15, prog: [[50, 'min'], [50, 'min'], [46, 'maj'], [48, 'maj']] },
  { artist: 'Anak Bilik 07', title: 'Dial-Up Love', bpm: 112, seed: 99, duty: 0.125, prog: [[48, 'maj'], [55, 'maj'], [57, 'min'], [53, 'maj']] },
  { artist: 'Friendster Gang', title: 'Testimonial Dong', bpm: 124, seed: 314, duty: 0.25, prog: [[52, 'min'], [48, 'maj'], [55, 'maj'], [50, 'sus']] },
];

// RULES and MEMORIES come in both UI languages; LANG picks one.
export const RULES = { id: `=====================================================
          WARNET NUSANTARA.NET  -  ATURAN MAIN
=====================================================

TARIF (per jam)        : Rp 3.000
Paket 3 jam            : Rp 8.000
PAKET MALAM (00-06)    : Rp 10.000  <- favorit anak kos
Print hitam putih      : Rp 500/lembar
Burn CD                : Rp 5.000 (bawa CD sendiri)
Disket 1.44MB          : Rp 2.500

1. DILARANG buka situs yang aneh-aneh. Operator bisa
   lihat layar kamu dari meja billing. Serius.
2. DILARANG install program. PC ini pakai Deep Freeze,
   restart = hilang semua. Save tugasmu ke disket!
3. Volume headset jangan kenceng-kenceng kalau voice
   chat. Bilik sebelah lagi ngerjain skripsi.
4. Yang main Counter-Strike: jangan teriak "RUSH B"
   lewat sekat triplek. Pakai mic aja.
5. Dilarang merokok di bilik AC. Bilik non-AC boleh,
   tapi asbak bayar sendiri.
6. Kalau billing habis, PC otomatis terkunci.
   Mau nambah? Teriak "MAS, NAMBAH SEJAM!"
7. Lupa logout Friendster / Yahoo = resiko ditanggung
   sendiri. Testimonial aneh bukan tanggung jawab kami.

Wi-Fi? Apa itu Wi-Fi. Kita pakai kabel LAN, Bos.

                         - Mas Operator, sejak 2000
`, en: `=====================================================
          WARNET NUSANTARA.NET  -  HOUSE RULES
=====================================================

RATE (per hour)        : Rp 3.000
3-hour package         : Rp 8.000
NIGHT PACKAGE (00-06)  : Rp 10.000  <- boarding-house kids' favourite
B/W print              : Rp 500/page
Burn a CD              : Rp 5.000 (bring your own CD)
1.44MB floppy disk     : Rp 2.500

1. NO opening weird websites. The operator can see
   your screen from the billing desk. Seriously.
2. NO installing programs. This PC runs Deep Freeze,
   restart = everything gone. Save your homework to a floppy!
3. Keep the headset volume down on voice chat.
   The booth next door is writing a thesis.
4. Counter-Strike players: do not yell "RUSH B"
   through the plywood wall. Use the mic.
5. No smoking in the AC booths. Non-AC booths are fine,
   but you pay for the ashtray.
6. When billing runs out, the PC locks itself.
   Want more? Shout "MAS, ONE MORE HOUR!"
7. Forgot to log out of Friendster / Yahoo = your own
   risk. Weird testimonials are not our responsibility.

Wi-Fi? What is Wi-Fi. We use LAN cables, Boss.

                         - Mas Operator, since 2000
` }[LANG];

export const MEMORIES = { id: `KENANGAN WARNET INDONESIA 2000-AN.txt
(disimpan di C:\\ tapi bakal hilang pas restart karena Deep Freeze)
------------------------------------------------------------

[KONEKSI]
- Telkomnet Instan: dial 080989999, user "telkomnet@instan",
  password "telkom". Bunyi modem ngiiik-krrrkk-bongg = surga.
- Kecepatan 56k (aslinya 33.6-53.3 Kbps kalau beruntung).
- Telepon rumah ga bisa dipakai pas internetan. Tagihan pulsa
  bikin ortu ngamuk -> akhirnya kabur ke warnet.
- 2004: Telkom Speedy datang. Warnet mulai pasang "Speedy 384kbps!".

[SUASANA WARNET]
- Bilik bersekat triplek, kursi plastik/sofa butut, monitor CRT 15".
- Billing di meja operator, nomor PC di kertas yang dilaminating.
- Wallpaper lumba-lumba, layar kunci billing, timer pojok kanan.
- Paket malam = tidur di bilik, bangun subuh, mata merah.
- Bau mi instan dan kopi sachet jam 2 pagi.
- Headset dengan mic patah yang diselotip.

[CHATTING]
- mIRC di DALnet: #jakarta, #bandung, #surabaya, #cewek, #cowok.
- Kalimat pembuka wajib: "asl pls?" / "cewe/cowo?" / "salken".
- Yahoo! Messenger: BUZZ!!! sampai jendela goyang, status
  "Invisible", emoticon :)) dan room chat Indonesia.
- MSN Messenger buat yang "anak gaul".

[SOSMED & WEB]
- Friendster (2003-2008): testimonial, skin glitter, lagu autoplay
  di profil, "Who viewed me".
- Kaskus (berdiri 2000): "pertamax gan!", "cendol", "ijo-ijo", "BB17".
- detik.com, kompas.com, astaga.com, satunet.com, kafegaul.com.
- Homepage pribadi di GeoCities dengan GIF "under construction"
  dan counter pengunjung + buku tamu.
- Email Yahoo! Mail kapasitas 4MB. Hotmail 2MB.

[MUSIK & DOWNLOAD]
- Winamp + skin aneh-aneh + plugin visualisasi.
- MP3 dari Kazaa, Limewire, Napster, Morpheus, 4shared.
- Download pakai FlashGet / GetRight / IDM, resume kalau putus.
- Burn CD pakai Nero, label pakai spidol.

[GAME]
- Counter-Strike 1.5/1.6 LAN: de_dust2, cs_assault, "AWP-an".
- Ragnarok Online Indonesia (Lyto, 2003): Prontera macet, PvP,
  jual-beli di chat room.
- GunBound (BolehNet): angle 89 maunya "power full".
- Nexia, RF Online, Seal Online, Point Blank (later), DotA (WC3).
- Single player: GTA Vice City, Need for Speed Underground,
  Age of Empires II, Zuma, Feeding Frenzy, Pinball.

[HIDUP]
- Ngerjain tugas sekolah, copas dari Google, print di warnet.
- Antri karena "full", nunggu di bangku depan sambil SMS-an.
- Operator yang galak tapi jago setting jaringan.
`, en: `MEMORIES OF INDONESIAN WARNETS IN THE 2000s.txt
(saved to C:\\ but gone after a restart because of Deep Freeze)
------------------------------------------------------------

[CONNECTION]
- Telkomnet Instan: dial 080989999, user "telkomnet@instan",
  password "telkom". The modem going ngiiik-krrrkk-bongg = heaven.
- 56k speed (really 33.6-53.3 Kbps if you were lucky).
- No home phone calls while you were online. The phone bill
  made your parents furious -> so you ran off to the warnet.
- 2004: Telkom Speedy arrives. Warnets start hanging "Speedy 384kbps!" signs.

[THE WARNET]
- Plywood booths, plastic chairs or a worn-out sofa, 15" CRT monitor.
- Billing on the operator's desk, PC numbers on laminated paper.
- Dolphin wallpaper, the billing lock screen, a timer in the corner.
- Night package = sleep in the booth, wake up at dawn, red eyes.
- Smell of instant noodles and sachet coffee at 2 a.m.
- A headset with a broken mic held together with tape.

[CHATTING]
- mIRC on DALnet: #jakarta, #bandung, #surabaya, #cewek, #cowok.
- Mandatory opener: "asl pls?" / "cewe/cowo?" (girl/boy?) / "salken" (nice to meet u).
- Yahoo! Messenger: BUZZ!!! until the window shook, status
  "Invisible", the :)) emoticon and Indonesian chat rooms.
- MSN Messenger for the "cool kids".

[SOCIAL & WEB]
- Friendster (2003-2008): testimonials, glitter skins, autoplay songs
  on your profile, "Who viewed me".
- Kaskus (since 2000): "pertamax gan!", "cendol", "ijo-ijo", "BB17".
- detik.com, kompas.com, astaga.com, satunet.com, kafegaul.com.
- A personal homepage on GeoCities with an "under construction" GIF,
  a visitor counter and a guestbook.
- Yahoo! Mail with 4MB of storage. Hotmail 2MB.

[MUSIC & DOWNLOADS]
- Winamp + weird skins + visualisation plugins.
- MP3s from Kazaa, Limewire, Napster, Morpheus, 4shared.
- Downloads with FlashGet / GetRight / IDM, resume when it dropped.
- Burning CDs with Nero, labels written with a marker.

[GAMES]
- Counter-Strike 1.5/1.6 over LAN: de_dust2, cs_assault, "AWP-ing".
- Ragnarok Online Indonesia (Lyto, 2003): Prontera jammed, PvP,
  trading in chat rooms.
- GunBound (BolehNet): angle 89 and "full power" please.
- Nexia, RF Online, Seal Online, Point Blank (later), DotA (WC3).
- Single player: GTA Vice City, Need for Speed Underground,
  Age of Empires II, Zuma, Feeding Frenzy, Pinball.

[LIFE]
- Doing homework, copy-pasting from Google, printing at the warnet.
- Queueing because it was "full", waiting on the bench out front texting.
- The operator: grumpy, but a wizard at network setup.
` }[LANG];

export const IRC = {
  ...irc,
  events: [
    (n) => ['sys', `* ${n} has joined`], (n) => ['sys', `* ${n} has quit IRC (Ping timeout)`],
    (n) => ['sys', `* ${n} has quit IRC (billing habis)`], (n) => ['act', `* ${n} lagi makan indomie`],
    (n) => ['act', `* ${n} slaps you around a bit with a large trout`],
  ],
};
