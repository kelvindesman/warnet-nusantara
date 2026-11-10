// Static landing pages for search engines and AI search (SEO + GEO).
// The app itself is a JS-only desktop, so crawlers see almost nothing; these
// pages are plain HTML with real text, structured data and deep links into the
// app. Generated from data/*.json so they never drift from the catalog, and the
// output is committed (the site still has no build step: `npm run seo` only
// refreshes these files, and a unit test fails when they are stale).
//
//   node scripts/seo/pages.mjs          write the files
//   node scripts/seo/pages.mjs --check  exit 1 if any committed file is stale
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, 'data', `${f}.json`), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

export function buildPages(data = { links: read('links'), games: read('games'), bookmarks: read('bookmarks'), irc: read('irc') }) {
  const { links, games, bookmarks, irc } = data;
  const SITE = links.site;
  const NAME = 'Warnet Nusantara.Net';
  const OG = `${SITE}docs/media/og.png`;
  const playable = games.filter((g) => g.mode !== 'shrine' && g.mode !== 'fanport'); // fan ports are linked from the app only, never listed or indexed on SEO pages
  const shrines = games.filter((g) => g.mode === 'shrine');
  const channels = Object.keys(irc.channels);

  const org = { '@type': 'Organization', name: NAME, url: SITE, sameAs: [links.repo, links.discord].filter(Boolean) };
  const app = {
    '@context': 'https://schema.org', '@type': ['WebApplication', 'VideoGame'], name: NAME, url: SITE,
    description: 'Simulator warnet Indonesia tahun 2000-an di browser: billing lumba-lumba, desktop ala XP, browser mesin waktu, Winamp, mIRC, Messenger BUZZ dan game DOS jadul.',
    inLanguage: ['id', 'en'], applicationCategory: 'GameApplication', genre: ['Simulation', 'Nostalgia'], operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' }, image: OG, publisher: org,
  };
  const code = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: NAME, codeRepository: links.repo, programmingLanguage: 'JavaScript', license: 'https://www.gnu.org/licenses/agpl-3.0.html' };

  const page = ({ path, lang, title: t, desc, h1, body, alt, extraLd = [] }) => {
    const url = SITE + path;
    const title = t.includes(NAME) ? t : `${t} | ${NAME}`; // stable entity name on every page (GEO)
    const hreflang = alt ? `\n  <link rel="alternate" hreflang="id" href="${SITE}id/" />\n  <link rel="alternate" hreflang="en" href="${SITE}en/" />\n  <link rel="alternate" hreflang="x-default" href="${SITE}" />` : '';
    const enter = lang === 'en' ? 'Enter the warnet →' : 'Masuk warnet →';
    const demo = lang === 'en' ? '▶ Watch the 60-second flashback' : '▶ Tonton Kilas Balik 60 detik';
    return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />${hreflang}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${NAME}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${OG}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'id_ID'}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#0a246a" />
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="../manifest.webmanifest" />
  <link rel="stylesheet" href="../css/landing.css" />
  ${[app, ...extraLd].map(ld).join('\n  ')}
</head>
<body>
  <header><a class="brand" href="../">WARNET <b>NUSANTARA</b>.NET</a>
    <nav><a href="../id/">Beranda</a><a href="../game-warnet/">Game</a><a href="../winamp/">Winamp</a><a href="../mirc/">mIRC</a><a href="../mesin-waktu-internet/">Mesin waktu</a><a href="../tentang-warnet/">Sejarah warnet</a><a href="../en/" hreflang="en">English</a></nav></header>
  <main>
    <h1>${esc(h1)}</h1>
    <p class="cta"><a class="btn" href="../">${enter}</a> <a class="btn alt" href="../?demo">${demo}</a></p>
${body}
  </main>
  <footer><p>${lang === 'en'
    ? 'Fan-made, non-commercial nostalgia project. Not affiliated with or endorsed by any brand mentioned; all trademarks belong to their owners.'
    : 'Proyek nostalgia buatan penggemar, non-komersial. Tidak berafiliasi dengan merek yang disebut; semua merek milik pemiliknya.'}
    <a href="${esc(links.repo)}">GitHub</a> · <a href="../llms.txt">llms.txt</a></p></footer>
</body>
</html>
`;
  };

  const li = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const featuresId = li([
    '<b>Billing warnet</b> dengan lumba-lumba, voucher di kertas kuning dan timer yang terus jalan.',
    '<b>Penjelajah Internet</b> lewat mesin waktu Wayback Machine: detik.com 2001, Kaskus, Friendster 2003.',
    `<b>Game Warnet</b>: ${playable.length} game legal (DOS lewat emulator Internet Archive, port web) dan ${shrines.length} kenangan game online.`,
    '<b>Winamp</b> asli (Webamp) dengan lagu chiptune yang dibuat langsung di browser.',
    `<b>mIRC</b> dengan bot ${channels.map(esc).join(' ')} yang nanya "asl pls".`,
    '<b>Messenger</b> dengan BUZZ yang bikin jendela goyang, plus Ranjau dan Ular HP.',
  ]);
  const featuresEn = li([
    '<b>Warnet billing lock screen</b> with dolphins, a voucher on a sticky note and a running timer.',
    '<b>Time-travel browser</b> through the Wayback Machine: detik.com 2001, Kaskus, Friendster 2003.',
    `<b>Game Warnet</b>: ${playable.length} legal games (DOS via the Internet Archive emulator, web ports) and ${shrines.length} memorials for online games.`,
    '<b>Real Winamp 2</b> (Webamp) playing chiptunes generated in your browser.',
    `<b>mIRC</b>-style chat with bots in ${channels.map(esc).join(' ')} asking "asl pls".`,
    '<b>Messenger with BUZZ</b>, Minesweeper-style Ranjau and Nokia-style snake.',
  ]);

  const faq = [
    ['Apa itu warnet?', 'Warnet (warung internet) adalah tempat sewa komputer dan internet per jam. Di Indonesia warnet sangat ramai pada awal 2000-an, saat belum banyak rumah punya internet sendiri.'],
    ['Berapa tarif warnet tahun 2000-an?', 'Tarifnya beragam per kota dan tahun, umumnya beberapa ribu rupiah per jam. Banyak warnet juga punya paket malam yang lebih murah. Di Warnet Nusantara.Net tarifnya Rp 3.000 per jam (cuma pura-pura, semua gratis).'],
    ['Apa itu billing warnet?', 'Billing adalah program yang mengunci komputer klien sampai operator membuka sesi, lalu menghitung waktu dan biaya pemakaian. Layar kuncinya sering bergambar lumba-lumba.'],
    ['Kenapa save game di warnet sering hilang?', 'Banyak warnet memakai program pemulih sistem yang mengembalikan komputer ke kondisi awal setiap restart, jadi file yang disimpan pengunjung ikut hilang.'],
    ['Bagaimana orang online lewat dial-up?', 'Sebelum internet broadband menyebar, banyak orang tersambung lewat modem dial-up di saluran telepon, misalnya layanan Telkomnet Instan. Suara handshake modem jadi ciri khasnya.'],
    ['Apakah Warnet Nusantara.Net gratis?', 'Ya. Semua fitur gratis, tanpa akun dan tanpa install. Proyek ini open source (AGPL-3.0) dan hidup dari patungan sukarela.'],
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };

  const pages = {
    'id/index.html': page({
      path: 'id/', lang: 'id', alt: true,
      title: 'Warnet Nusantara.Net — Nostalgia Warnet Indonesia 2000-an di Browser',
      desc: 'Duduk lagi di PC warnet tahun 2003: billing lumba-lumba, Friendster lewat mesin waktu, Winamp, mIRC, BUZZ dan game DOS jadul. Gratis, tanpa install.',
      h1: 'Nostalgia warnet Indonesia 2000-an, langsung di browser',
      extraLd: [code],
      body: `    <p>Ingat bilik triplek, monitor CRT, wallpaper lumba-lumba dan teriakan "MAS, NAMBAH SEJAM!"? Warnet Nusantara.Net membangun ulang satu warnet lengkap di browser, supaya kamu bisa duduk lagi di PC-07, dan supaya yang belum pernah merasakannya bisa tahu rasanya.</p>
    <h2>Isinya</h2>
    ${featuresId}
    <h2>Gratis dan open source</h2>
    <p>Tanpa akun, tanpa install, jalan juga di HP. Kodenya terbuka di GitHub; siapa saja boleh menambah situs jadul, game legal atau bot IRC.</p>`,
    }),
    'en/index.html': page({
      path: 'en/', lang: 'en', alt: true,
      title: 'Warnet Nusantara.Net — an early-2000s Indonesian internet cafe in your browser',
      desc: 'Sit down at an Indonesian internet cafe (warnet) PC from 2003: dolphin billing screen, Wayback time-travel browser, Winamp, mIRC, BUZZ and DOS games. Free, no install.',
      h1: 'An early-2000s Indonesian internet cafe, in your browser',
      extraLd: [code],
      body: `    <p>In 2000s Indonesia, most people met the internet at a <b>warnet</b> (warung internet): a plywood booth, a CRT monitor, a dolphin wallpaper and a billing timer in the corner. Those cafes are mostly gone. Warnet Nusantara.Net rebuilds one as a web desktop.</p>
    <h2>What's inside</h2>
    ${featuresEn}
    <h2>Free and open source</h2>
    <p>No account, no install, works on phones. Zero dependencies and no build step; the code is on GitHub under AGPL-3.0.</p>`,
    }),
    'game-warnet/index.html': page({
      path: 'game-warnet/', lang: 'id',
      title: 'Game Warnet Jadul Online — DOOM, Sango Fighter, Command & Conquer di Browser',
      desc: `${playable.length} game warnet jadul yang legal dimainkan langsung di browser: game DOS lewat emulator Internet Archive, port web, plus kenangan Ragnarok, GunBound dan Point Blank.`,
      h1: 'Game warnet jadul, main langsung di browser',
      body: `    <p>Folder <b>Game Warnet</b> berisi game yang legal dimainkan: freeware, shareware, versi web resmi, dan abandonware yang disimpan Internet Archive. Klik dua kali, langsung main di jendela.</p>
    <h2>Main sekarang</h2>
    ${li(playable.map((g) => `<a href="../#app=${g.mode === 'local' ? esc(g.id) : 'g:' + esc(g.id)}">${esc(g.name)}</a> (${g.year})`))}
    <h2>Kenangan game online</h2>
    <p>Game yang masih dimiliki penerbitnya tidak kami tautkan ke server bajakan. Sebagai gantinya ada "kuil kenangan": situs lamanya lewat mesin waktu dan tautan ke versi resminya.</p>
    ${li(shrines.map((g) => `<a href="../#app=g:${esc(g.id)}">${esc(g.name)}</a>`))}`,
    }),
    'winamp/index.html': page({
      path: 'winamp/', lang: 'id',
      title: 'Winamp Online di Browser — Warnet Nusantara.Net',
      desc: 'Winamp 2 klasik di browser lewat Webamp, lengkap dengan playlist chiptune yang dibuat langsung oleh browser. Seret MP3 kamu sendiri ke jendelanya.',
      h1: 'Winamp online, kayak di PC warnet',
      body: `    <p>"It really whips the llama's ass." Di Warnet Nusantara.Net, Winamp 2 berjalan di browser lewat <a href="https://github.com/captbaritone/webamp">Webamp</a> (MIT). Playlist-nya lagu chiptune yang dibuat langsung oleh browser, jadi tidak ada file audio yang diunduh. Kamu juga bisa menyeret MP3 sendiri ke jendelanya.</p>
    <p><a class="btn" href="../#app=winamp">Buka Winamp →</a></p>`,
    }),
    'mirc/index.html': page({
      path: 'mirc/', lang: 'id',
      title: 'mIRC Online: Chat IRC DALnet ala Warnet 2000-an',
      desc: `Chat ala mIRC di DALnet zaman warnet: channel ${channels.join(' ')}, bot yang nanya "asl pls", dan perintah /me /nick /join /slap.`,
      h1: 'mIRC ala warnet: asl pls?',
      body: `    <p>Sebelum media sosial, anak warnet nongkrong di IRC. Di sini kamu bisa masuk lagi ke DALnet versi kenangan: ${channels.map((c) => `<b>${esc(c)}</b>`).join(', ')}, penuh bot yang ngobrol pakai bahasa gaul tahun 2000-an.</p>
    ${li(['<code>/me</code> buat aksi', '<code>/nick</code> ganti nama', '<code>/join #channel</code> pindah channel', '<code>/slap</code> tampar orang pakai ikan trout'])}
    <p><a class="btn" href="../#app=chat">Buka IRC →</a> <a class="btn alt" href="../#app=ym">Buka Messenger (BUZZ!) →</a></p>`,
    }),
    'mesin-waktu-internet/index.html': page({
      path: 'mesin-waktu-internet/', lang: 'id',
      title: 'Mesin Waktu Internet Indonesia: Buka detik.com 2001, Kaskus, Friendster',
      desc: 'Jalan-jalan ke internet Indonesia tahun 1998–2015 lewat Wayback Machine: detik.com, Kaskus, Friendster, Kafegaul, plasa.com dan lainnya, dengan suara dial-up Telkomnet.',
      h1: 'Mesin waktu internet Indonesia',
      body: `    <p><b>Penjelajah Internet</b> di warnet ini memuat setiap halaman lewat <a href="https://web.archive.org/">Wayback Machine</a> milik Internet Archive. Pilih tahunnya, dengarkan suara dial-up, dan buka situs seperti dulu.</p>
    <h2>Bookmark bawaan</h2>
    ${li(bookmarks.map((b) => `${esc(b.name)} (${b.year})`))}
    <p><a class="btn" href="../#app=browser">Buka Penjelajah Internet →</a></p>`,
    }),
    'tentang-warnet/index.html': page({
      path: 'tentang-warnet/', lang: 'id', extraLd: [faqLd],
      title: 'Sejarah Warnet Indonesia 2000-an: Billing, Paket Malam, Dial-up',
      desc: 'Apa itu warnet, berapa tarifnya, apa itu billing lumba-lumba, dan kenapa save game selalu hilang. Tanya jawab singkat tentang warnet Indonesia era 2000-an.',
      h1: 'Tentang warnet Indonesia era 2000-an',
      body: faq.map(([q, a]) => `    <h2>${esc(q)}</h2>\n    <p>${esc(a)}</p>`).join('\n'),
    }),
  };

  const paths = ['', 'id/', 'en/', ...Object.keys(pages).filter((p) => !/^(id|en)\//.test(p)).map((p) => p.replace('index.html', ''))];
  pages['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`;
  pages['robots.txt'] = `# Everyone is welcome, including AI search crawlers: discoverability is the goal.
User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`;
  const llms = (full) => `# ${NAME}

> A free, open-source web recreation of an early-2000s Indonesian internet cafe (warnet): billing lock screen with dolphins, XP-style desktop, Wayback Machine time-travel browser, Winamp (Webamp), mIRC-style chat bots, Messenger with BUZZ, and legal retro games. Indonesian UI. No account, no install.

- Play: ${SITE}
- 60-second flashback demo: ${SITE}?demo
- Source code (AGPL-3.0-only; content CC BY-NC-SA 4.0): ${links.repo}

## Pages

- [Beranda (Indonesian)](${SITE}id/)
- [Home (English)](${SITE}en/)
- [Game Warnet](${SITE}game-warnet/): ${playable.length} legal games playable in the browser, ${shrines.length} memorials for online games that are still owned by their publishers
- [Winamp](${SITE}winamp/)
- [mIRC](${SITE}mirc/)
- [Mesin waktu internet](${SITE}mesin-waktu-internet/): Indonesian websites from 1998–2015 through the Wayback Machine
- [Tentang warnet](${SITE}tentang-warnet/): FAQ about Indonesian internet cafes in the 2000s
${full ? `
## Games

${playable.map((g) => `- ${g.name} (${g.year})`).join('\n')}

## Online game memorials

${shrines.map((g) => `- ${g.name}: ${g.note}`).join('\n')}

## Time-travel bookmarks

${bookmarks.map((b) => `- ${b.name} (${b.year}): ${b.url}`).join('\n')}

## FAQ (Indonesian)

${faq.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}
` : `
## Optional

- [Full text for LLMs](${SITE}llms-full.txt)
`}`;
  pages['llms.txt'] = llms(false);
  pages['llms-full.txt'] = llms(true);
  return pages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [rel, text] of Object.entries(buildPages())) {
    const file = join(ROOT, rel);
    const same = existsSync(file) && readFileSync(file, 'utf8') === text;
    if (check) { if (!same) stale.push(rel); continue; }
    if (!same) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); console.log('wrote', rel); }
  }
  if (stale.length) { console.error(`stale SEO files (run npm run seo): ${stale.join(', ')}`); process.exit(1); }
}
