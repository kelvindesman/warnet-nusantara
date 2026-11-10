// English UI strings. Keys are the Indonesian source strings exactly as written in
// t('...') calls; js/i18n.js only downloads this file for English visitors.
// tests/unit/i18n.test.mjs fails on missing keys, unused keys and placeholder drift.
// Voice: casual early-2000s warnet, same as the Indonesian. Brands and proper nouns stay as-is.
// Not translated on purpose: IRC/Messenger bot chatter, bookmark site names, supporter names/messages.
export default {
  // --- boot, BIOS, lock screen (billing client)
  'Press <b>DEL</b> to enter SETUP, <b>klik / tombol apa saja</b> untuk lewati': 'Press <b>DEL</b> to enter SETUP, <b>click / any key</b> to skip',
  'Lumba-lumba berenang di laut biru': 'Dolphins swimming in a blue sea',
  'Paket': 'Package',
  'Panduan': 'Guide',
  'Tidak (No)': 'No',
  'Menit 30': '30 min',
  'Menit 60': '60 min',
  'Menit': 'Min',
  'Menit peringatan': 'Warning minutes',
  'Jl. Kenangan No. 56K, Nusantara · Buka 24 jam': 'Jl. Kenangan No. 56K, Nusantara · Open 24 hours',
  'Pre-Paid — Login Voucher': 'Pre-Paid — Voucher Login',
  '● TERKUNCI': '● LOCKED',
  'Tarif': 'Rate',
  '<b>{rate}</b>/jam': '<b>{rate}</b>/hour',
  'Paket malam': 'Night package',
  'Voucher kamu': 'Your voucher',
  'Voucher baru': 'New voucher',
  'Masuk': 'Log in',
  '▶ Tonton Kilas Balik 60 detik': '▶ Watch the 60-second Flashback',
  'Klik buat isi otomatis': 'Click to fill in automatically',
  'Voucher dari operator:': 'Voucher from the operator:',
  '(klik kertas ini kalau malas ngetik)': '(click this note if you are too lazy to type)',
  'DICARI: operator shift malam.<br><small>Lamar di GitHub →</small>': 'WANTED: night-shift operator.<br><small>Apply on GitHub →</small>',
  '★ Selamat datang di WARNET NUSANTARA.NET ★ Buka 24 jam ★ Paket malam {malam} ★ Dilarang membuka situs terlarang ★ Save tugas ke disket, PC di-Deep Freeze ★ Sekarang pakai koneksi SPEEDY! ★ Yang main CS jangan teriak-teriak ★ Terima kasih atas kunjungan Anda ★':
    '★ Welcome to WARNET NUSANTARA.NET ★ Open 24 hours ★ Night package {malam} ★ No forbidden websites ★ Save your homework to a floppy, these PCs run Deep Freeze ★ Now on SPEEDY broadband! ★ CS players, no yelling ★ Thank you for your visit ★',
  'Voucher baru dicetak. Cek kertas kuning.': 'New voucher printed. Check the yellow note.',
  'Billing Personal harus dibuka mas operator. Pakai voucher Pre-Paid aja, ada di kertas kuning.': 'Personal billing has to be opened by the operator. Just use the Pre-Paid voucher on the yellow note.',
  'Paket: {rate}/jam · Paket malam {malam} (00.00–06.00). Beli voucher di kasir.': 'Packages: {rate}/hour · Night package {malam} (00.00–06.00). Buy vouchers at the counter.',
  'Masukkan user dan password dari voucher Pre-Paid kamu.': 'Enter the user and password from your Pre-Paid voucher.',
  'Khusus operator! Mas operator lagi ngopi di depan.': 'Operator only! The operator is out front having coffee.',
  'Panduan: klik kertas kuning (isi otomatis), lalu Masuk. Waktu habis? Teriak "MAS, NAMBAH SEJAM!"': 'Guide: click the yellow note (fills in for you), then Log in. Out of time? Shout "MAS, ONE MORE HOUR!"',
  'Username tidak terdaftar. Tanya mas operator!': 'Username not registered. Ask the operator!',
  'Password salah! Cek lagi kertasnya.': 'Wrong password! Check the note again.',
  '1 Jam': '1 Hour',
  '2 Jam': '2 Hours',
  'Paket 3 Jam': '3-Hour Package',
  'Paket Malam': 'Night Package',

  // --- welcome, desktop, tray, start menu
  'selamat datang': 'welcome',
  'Memuat pengaturan pribadi {user}...': 'Loading personal settings for {user}...',
  'Penjelajah Internet': 'Internet Browser',
  'Lagu MP3': 'MP3 Songs',
  'ATURAN_WARNET.txt': 'WARNET_RULES.txt',
  'Kenangan Warnet.txt': 'Warnet Memories.txt',
  'Dukung Warnet Ini': 'Support this Project',
  'Hubungi Operator': 'Contact the Operator',
  'LOWONGAN_OPERATOR.txt': 'OPERATOR_WANTED.txt',
  'KONTRIBUTOR.txt': 'CONTRIBUTORS.txt',
  'Gagal membuka {app}.': 'Could not open {app}.',
  'Sisa waktu billing — klik untuk nambah': 'Billing time left — click to add more',
  'Terima kasih para pendukung — klik untuk ikut patungan': 'Thanks to our supporters — click to chip in',
  'LAN terhubung': 'LAN connected',
  'Memuat Winamp...': 'Loading Winamp...',
  'Tentang PC ini': 'About this PC',
  'Jalan-jalan ke tahun {year}': 'Take a trip back to {year}',
  'Donasi, star, fork, lapor bug': 'Donate, star, fork, report bugs',
  'Jadi operator': 'Become an operator',
  'Lapor, usul, kerja sama': 'Report, suggest, partner up',
  'Waktu kamu tinggal {n} menit! Klik timer untuk nambah.': 'Only {n} minutes left! Click the timer to add more.',
  'Nambah 1 jam': 'Add 1 hour',
  'User: <b>{user}</b><br>Paket: {pkg}<br>Terpakai: {used}<br>Sisa: {left}<br>Biaya: <b>{price}</b>': 'User: <b>{user}</b><br>Package: {pkg}<br>Used: {used}<br>Left: {left}<br>Cost: <b>{price}</b>',
  'MAS, NAMBAH SEJAM! ✔ Waktu ditambah 1 jam ({rate}).': 'MAS, ONE MORE HOUR! ✔ 1 hour added ({rate}).',
  'Suara mati': 'Sound off',
  'Kecepatan: 10.0 Mbps<br>Dibagi rame-rame 20 PC. Sabar ya.': 'Speed: 10.0 Mbps<br>Shared by all 20 PCs. Be patient.',
  'Terhubung ke Telkomnet Instan pada 53.3 Kbps. Tagihan telepon dimulai sekarang 😬': 'Connected to Telkomnet Instan at 53.3 Kbps. The phone bill starts now 😬',
  'Selamat datang, {user}!': 'Welcome, {user}!',
  'Kamu di PC-{pc}. Klik 2x <b>Penjelajah Internet</b> buat jalan-jalan ke internet tahun {year}, atau buka <b>Game Warnet</b>.': 'You are on PC-{pc}. Double-click <b>Internet Browser</b> to surf the internet of {year}, or open <b>Game Warnet</b>.',
  'Tutup': 'Close',

  // --- log off, shut down, time up
  'Terima kasih, <b>{user}</b>! Pemakaian {used}. Silakan bayar <b>{total}</b> di kasir.': 'Thanks, <b>{user}</b>! Time used {used}. Please pay <b>{total}</b> at the counter.',
  'Bagikan sesi warnet kamu:': 'Share your warnet session:',
  '☕ Bayar ke operator beneran (dukung warnet ini)': '☕ Pay the operator for real (support this warnet)',
  'Matikan Komputer': 'Turn Off Computer',
  'Batal': 'Cancel',
  'Sekarang aman untuk mematikan komputer Anda.': 'It is now safe to turn off your computer.',
  '(Jangan lupa bayar {price} ke mas operator · klik untuk menyalakan lagi)': '(Do not forget to pay the operator {price} · click to switch it back on)',
  '<b>WAKTU HABIS!</b> PC terkunci otomatis. Total: {price}': '<b>TIME IS UP!</b> PC locked automatically. Total: {price}',
  '<b>Koneksi warnet putus.</b><br>Data warnet gagal dimuat. Coba refresh (F5) atau panggil mas operator.': '<b>The warnet connection dropped.</b><br>Could not load the warnet data. Try refreshing (F5) or call the operator.',

  // --- Kilas Balik demo
  'Lewati ⏭': 'Skip ⏭',
  'Masih ingat billing lumba-lumba, BUZZ!!! dan "asl pls"? Main lagi di Warnet Nusantara.Net': 'Remember the dolphin billing screen, BUZZ!!! and "asl pls"? Play again at Warnet Nusantara.Net',
  'Kilas Balik selesai': 'Flashback finished',
  'Masih ingat semua ini?': 'Remember all this?',
  'Warnetnya masih buka. Gratis. Selamanya.': 'The warnet is still open. Free. Forever.',
  'Masuk warnet →': 'Enter the warnet →',
  '☕ Dukung Warnet Ini': '☕ Support this Project',

  // --- community: tiers, ticker, sponsor, donate, contact, share
  'Paket 1 Jam': '1-Hour Package',
  'Rp 25.000+ / $10 / $5 per bulan': 'Rp 25.000+ / $10 / $5 per month',
  'Member VIP': 'VIP Member',
  'Rp 100.000+ / $20 per bulan': 'Rp 100.000+ / $20 per month',
  'Pasang Iklan': 'Advertise',
  'Rp 500.000+ per bulan / $50+ per bulan': 'Rp 500.000+ per month / $50+ per month',
  '★ Warnet ini hidup dari patungan. Jadilah pendukung pertama: menu Start → Dukung Warnet Ini ★': '★ This warnet runs on donations. Be the first supporter: Start menu → Support this Project ★',
  '★ Terima kasih {name} ({tier}){msg} ★': '★ Thank you {name} ({tier}){msg} ★',
  'Sponsor Warnet Nusantara.Net': 'Warnet Nusantara.Net sponsor',
  'PASANG IKLAN DI SINI!': 'ADVERTISE HERE!',
  'Hub. mas operator · banner 468×60 · dukung warnet ini': 'Contact the operator · 468×60 banner · support this warnet',
  'QRIS, e-wallet, transfer bank': 'QRIS, e-wallet, bank transfer',
  'International, monthly': 'International, monthly',
  'International, one-off': 'International, one-off',
  'Info otomatis dari warnet:': 'Sent automatically by the warnet:',
  'Lapor bug': 'Report a bug',
  'Usul situs jadul': 'Suggest an old website',
  'Usul game': 'Suggest a game',
  'Cerita kenangan warnet': 'Share a warnet memory',
  'Kerja sama / sponsor': 'Partnership / sponsor',
  '{h} jam {m} menit': '{h} h {m} min',
  '{m} menit': '{m} minutes',
  'Gue main {dur} di Warnet Nusantara.Net, bayar {price} 😂 Masih ingat billing lumba-lumba?': 'I played {dur} at Warnet Nusantara.Net and paid {price} 😂 Remember the dolphin billing screen?',

  // --- operator corner
  '<b>Warnet ini gratis selamanya.</b> Listrik, domain dan kopi mas operator dibayar dari patungan. Mau ikut bayar billing? Namamu (dan pesanmu) muncul di running text, KONTRIBUTOR.txt dan README di GitHub.':
    '<b>This warnet is free forever.</b> Electricity, the domain and the operator\'s coffee are paid for by donations. Want to chip in for the billing? Your name (and message) shows up in the running text, CONTRIBUTORS.txt and the README on GitHub.',
  'Segera hadir': 'Coming soon',
  'segera hadir': 'coming soon',
  'Minimal Rp 5.000 / $3 supaya namamu tercatat. Semua fitur tetap gratis.': 'Minimum Rp 5.000 / $3 to get your name listed. Every feature stays free.',
  'Detail di GitHub': 'Details on GitHub',
  'Mau lapor, usul, atau cerita? Pilih di bawah. Kamu akan dibawa ke GitHub (perlu akun gratis); semua usulan dibaca mas operator dan bot.': 'Want to report, suggest or tell a story? Pick one below. You will be taken to GitHub (free account needed); the operator and the bots read every suggestion.',
  'Urusan pribadi atau bisnis: kirim email ke operator (alamat di halaman GitHub). Data pribadi jangan ditulis di issue publik.': 'Private or business matters: email the operator (address on the GitHub page). Never put personal data in a public issue.',
  'Nongkrong bareng:': 'Hang out with us:',
  'Discord — segera hadir': 'Discord — coming soon',
  [`=============================================
   LOWONGAN KERJA - WARNET NUSANTARA.NET
=============================================

DICARI: OPERATOR SHIFT MALAM (sukarelawan)

Warnet ini open source. Siapa saja boleh ikut jaga:
  [ ] nambah situs jadul (detik 2001, Kaskus 2003, ...)
  [ ] nambah game warnet yang legal
  [ ] nambah bot IRC #jakarta #bandung #surabaya
  [ ] benerin bug, bikin aplikasi baru

SYARAT:
  - Pernah antri di depan warnet sambil SMS-an
  - Tahu bedanya paket malam dan paket 3 jam
  - Punya akun GitHub (gratis)

JENJANG KARIR:
  3 PR diterima  -> Triager (bantu sortir usulan)
  10 PR diterima -> Operator (maintainer)

DAFTAR:
  {repo}/contribute
  Panduan: {repo}/blob/main/CONTRIBUTING.md

Gaji: kebanggaan + nama kamu di System Properties.

                       - Mas Operator`]: `=============================================
   JOB OPENING - WARNET NUSANTARA.NET
=============================================

WANTED: NIGHT-SHIFT OPERATOR (volunteer)

This warnet is open source. Anyone can help run it:
  [ ] add old websites (detik 2001, Kaskus 2003, ...)
  [ ] add legal warnet games
  [ ] add IRC bots #jakarta #bandung #surabaya
  [ ] fix bugs, build new apps

REQUIREMENTS:
  - Once queued outside a warnet while texting
  - Know the difference between the night package and the 3-hour package
  - Have a GitHub account (free)

CAREER LADDER:
  3 PRs merged  -> Triager (helps sort suggestions)
  10 PRs merged -> Operator (maintainer)

APPLY:
  {repo}/contribute
  Guide: {repo}/blob/main/CONTRIBUTING.md

Pay: pride + your name in System Properties.

                       - Mas Operator`,
  [`KONTRIBUTOR.txt - yang bikin warnet ini tetap buka
===================================================

OPERATOR (maintainer):
{operators}

PENDUKUNG (patungan bayar billing):
{supporters}

Terima kasih juga untuk semua yang kirim situs, game,
bot IRC dan kenangan lewat GitHub. Kalian keren.`]: `CONTRIBUTORS.txt - the people keeping this warnet open
===================================================

OPERATORS (maintainers):
{operators}

SUPPORTERS (chipping in for the billing):
{supporters}

Thanks also to everyone who sent websites, games,
IRC bots and memories through GitHub. You rock.`,
  '- Belum ada. Jadilah yang pertama! Start -> Dukung Warnet Ini': '- Nobody yet. Be the first! Start -> Support this Project',
  'Didukung:': 'Supported by:',
  '{n} pendukung': '{n} supporters',
  'belum ada pendukung': 'no supporters yet',
  'Proyek nostalgia buatan penggemar. Tidak berafiliasi dengan merek yang disebut; semua merek milik pemiliknya.': 'A fan-made nostalgia project. Not affiliated with any brand mentioned; all trademarks belong to their owners.',

  // --- Penjelajah Internet + dial-up
  'Buka di tab asli': 'Open in a real tab',
  'Tab baru': 'New tab',
  'Mesin waktu Wayback Machine': 'Wayback Machine time machine',
  'Tahun': 'Year',
  'halaman web': 'web page',
  'Selesai': 'Done',
  'Membuka halaman awal...': 'Opening the home page...',
  'Menghubungi {site} lewat mesin waktu... (sabar, 56k)': 'Contacting {site} through the time machine... (patience, 56k)',
  'Selesai. (Layar putih? Situs modern sering menolak dibuka di dalam frame — klik "Tab baru".)': 'Done. (Blank page? Modern sites often refuse to open inside a frame — click "New tab".)',
  'Dihentikan': 'Stopped',
  'Menghubungkan ke Telkomnet Instan': 'Connecting to Telkomnet Instan',
  'Nama pengguna:': 'User name:',
  'Kata sandi:': 'Password:',
  'Nomor:': 'Phone number:',
  'Memanggil...': 'Dialing...',
  'Lewati': 'Skip',
  'Memanggil 080989999...': 'Dialing 080989999...',
  'Menunggu jawaban...': 'Waiting for an answer...',
  'Memverifikasi nama pengguna dan kata sandi...': 'Verifying user name and password...',
  'Mendaftarkan komputer Anda di jaringan...': 'Registering your computer on the network...',
  'Terhubung pada 53.333 bps': 'Connected at 53,333 bps',

  // --- portal (home.html)
  'Cari di Google {year}...': 'Search Google {year}...',
  'Lagi rame di warnet {era}': 'All the rage at the warnet in {era}',
  'Cari!': 'Search!',
  'Berita': 'News',
  'Buku Tamu': 'Guestbook',
  'Dukung Warnet': 'Support the Warnet',
  '+++ Selamat datang di Portal Nusantara.Net +++ Semua link dibuka lewat MESIN WAKTU (Wayback Machine) +++ Pilih tahun di sebelah kotak Address +++ Optimal dilihat dengan resolusi 800x600 +++':
    '+++ Welcome to Portal Nusantara.Net +++ Every link opens through the TIME MACHINE (Wayback Machine) +++ Pick a year next to the Address box +++ Best viewed at 800x600 +++',
  '★ Situs Paling Hits di Warnet ★': '★ The Hottest Sites at the Warnet ★',
  'Tips Mesin Waktu': 'Time Machine Tips',
  'Ketik alamat apa saja di kotak <b>Address</b> (misal <code>geocities.com</code>), lalu pilih <b>Tahun</b>. Halaman diambil dari arsip <a href="https://web.archive.org" target="_blank" rel="noopener">Internet Archive</a>. Pilih <b>Live</b> untuk internet zaman sekarang (banyak situs modern menolak tampil dalam frame).':
    'Type any address in the <b>Address</b> box (say <code>geocities.com</code>), then pick a <b>Year</b>. Pages come from the <a href="https://web.archive.org" target="_blank" rel="noopener">Internet Archive</a>. Pick <b>Live</b> for today\'s internet (many modern sites refuse to show inside a frame).',
  'Anda pengunjung ke-': 'You are visitor no.',
  'Kontak': 'Contact',
  'Proyek nostalgia buatan penggemar. Tidak berafiliasi dengan merek apa pun yang disebut; semua merek milik pemiliknya. Situs lama dari Internet Archive.': 'A fan-made nostalgia project. Not affiliated with any brand mentioned; all trademarks belong to their owners. Old websites come from the Internet Archive.',

  // --- Game Warnet
  'Port buatan fans, TIDAK resmi. Warnet Nusantara.Net tidak berafiliasi dengan, tidak didukung oleh, dan tidak menyimpan game ini; kami cuma menautkan situs pihak ketiga. Semua merek milik pemiliknya. Buka dengan risiko sendiri. Pemilik hak cipta bisa minta link dihapus lewat Hubungi Operator.':
    'Fan-made port, NOT official. Warnet Nusantara.Net is not affiliated with, not endorsed by, and does not host this game; we only link to a third-party site. All trademarks belong to their owners. Open at your own risk. Copyright owners can have the link removed through Contact the Operator.',
  'Tugas Game': 'Game Tasks',
  '▸ Klik 2x untuk main': '▸ Double-click to play',
  '▸ Game DOS jalan via emulator Internet Archive': '▸ DOS games run in the Internet Archive emulator',
  '▸ Ikon panah = buka di tab baru': '▸ Arrow icon = opens in a new tab',
  'Pilih dulu game-nya, terus klik 2x ikonnya.': 'Pick a game first, then double-click its icon.',
  'Jenis: {type}<br>Lokasi: {where}<br><br>Dikunci Deep Freeze, nggak bisa diubah.': 'Type: {type}<br>Location: {where}<br><br>Locked by Deep Freeze, can\'t be changed.',
  'Jangan dimatiin, nanti PC-nya ngambek.': 'Don\'t kill it, the PC will sulk.',
  'Kalau explorer.exe dimatiin, desktopnya hilang dan kamu harus manggil mas operator. Jangan ya.': 'Kill explorer.exe and your desktop vanishes, then you have to call the operator. Please don\'t.',
  'Akses ditolak. Billing dijaga mas operator. Ketahuan matiin billing = di-banned seminggu!': 'Access denied. The operator guards the billing. Caught killing it = banned for a week!',
  'Akses ditolak. Deep Freeze nggak bisa dimatiin dari sini.': 'Access denied. Deep Freeze can\'t be stopped from here.',
  'Folder sistem': 'System folder',
  '{n} objek': '{n} objects',
  'Tips Operator': 'Operator Tips',
  'Game DOS: klik layar dulu supaya keyboard nyangkut. Panah = jalan, Ctrl/Alt/Spasi = aksi.': 'DOS games: click the screen first so the keyboard sticks. Arrows = move, Ctrl/Alt/Space = action.',
  'Game favorit zaman warnet belum ada di sini?': 'Your favourite warnet game is not here yet?',
  'Usul game ke operator': 'Suggest a game to the operator',
  'Bawaan PC': 'Built in',
  'Main di sini (port web &amp; emulator)': 'Play here (web ports &amp; emulators)',
  'Online beneran (buka tab baru)': 'Really online (opens a new tab)',
  'Kenangan (server lama sudah tutup)': 'Memories (the old servers are gone)',
  'Port Fan (tidak resmi, buka tab baru)': 'Fan Ports (unofficial, opens a new tab)',
  'Pojok Rental PS: PS1 &amp; PS2 (port fan, buka tab baru)': 'PS Rental Corner: PS1 &amp; PS2 (fan ports, opens a new tab)',
  'Pojok Rental PS': 'PS Rental Corner',
  'Komputer Saya': 'My Computer',
  'Buka': 'Open',
  'Catatan operator:': 'Operator note:',
  'Tetap coba': 'Try anyway',
  '<b>{name}</b> tidak mengizinkan dibuka di dalam jendela.<br>Buka di tab baru?<br><small>{url}</small>': '<b>{name}</b> does not allow being opened inside a window.<br>Open it in a new tab?<br><small>{url}</small>',
  'Layar penuh': 'Full screen',
  'Menghubungkan ke server...': 'Connecting to server...',
  'Lihat situs lama ({year})': 'See the old site ({year})',
  'Versi resmi sekarang': 'Official version today',
  'Game ini masih dimiliki penerbitnya, jadi warnet ini cuma menyimpan kenangannya. Main yang resmi ya!': 'This game still belongs to its publisher, so this warnet only keeps the memories. Play the official one!',
  'Server lagi maintenance, coba lagi nanti. (Patch 0.0.1 gagal di-download)': 'Server under maintenance, try again later. (Patch 0.0.1 failed to download)',
  'Port fan tidak resmi, jalan di situs orang lain.': 'Unofficial fan port, running on someone else\'s site.',
  'Sudah ditutup / kena DMCA.': 'Shut down / hit by a DMCA.',
  'Main di tab baru': 'Play in a new tab',
  'Baca beritanya': 'Read the story',

  // --- IRC Chat + Messenger (window chrome only; the bots keep their slang)
  'Ketik pesan... (/me, /nick, /join #channel, /slap nick)': 'Type a message... (/me, /nick, /join #channel, /slap nick)',
  'Pesan': 'Message',
  'Kirim': 'Send',
  '♪ lagi dengerin: Peterpan - Mungkin Nanti ♪': '♪ listening to: Peterpan - Mungkin Nanti ♪',
  'Senyum': 'Smile',
  'Ketawa': 'Laugh',
  'Malu': 'Blush',
  'Ketik pesan lalu Enter': 'Type a message, then Enter',
  '{buddy} sedang online.': '{buddy} is online.',

  // --- system apps (misc.js)
  'Tempat Lain': 'Other Places',
  'Drive ini <b>DIBEKUKAN</b> oleh Deep Freeze.<br>Semua perubahan akan hilang saat komputer di-restart.<br><br>— Mas Operator': 'This drive is <b>FROZEN</b> by Deep Freeze.<br>Every change will be lost when the computer restarts.<br><br>— Mas Operator',
  'Tugas Sistem': 'System Tasks',
  '▸ Lihat info sistem': '▸ View system info',
  '▸ Ganti wallpaper': '▸ Change wallpaper',
  'Disket 3½ (A:)': '3½ Floppy (A:)',
  'Masukkan disket...': 'Insert a floppy...',
  'A:\\ tidak dapat diakses.<br>Perangkat tidak siap. Disketnya jamuran ya?': 'A:\\ is not accessible.<br>The device is not ready. Mouldy floppy?',
  '20 GB · Dibekukan Deep Freeze': '20 GB · Frozen by Deep Freeze',
  'Kumpulan MP3 Vol. 7': 'MP3 Collection Vol. 7',
  'copas dari Google': 'copy-pasted from Google',
  'Proklamasi kemerdekaan Indonesia dibacakan pada tanggal 17 Agustus 1945...\n\n(sisanya belum, billing keburu habis)\n\nSumber: google.com halaman 1': 'The proclamation of Indonesian independence was read on 17 August 1945...\n\n(rest not written yet, the billing ran out)\n\nSource: google.com page 1',
  'jangan dibuka': 'do not open',
  'Kau bagai modem 56k di hatiku\nLambat... tapi selalu terhubung.\n\nKau bagai Friendster\nSelalu kubuka walau tak pernah kau testi.\n\n- dari bilik 7, jam 2 pagi': 'You are like a 56k modem in my heart\nSlow... but always connected.\n\nYou are like Friendster\nI always open you, though you never testi me.\n\n- from booth 7, 2 a.m.',
  'Chiptune buatan sendiri': 'Home-made chiptune',
  'Tugas Musik': 'Music Tasks',
  '▸ Putar semua di Winamp': '▸ Play all in Winamp',
  'Tips: seret file MP3 kamu ke jendela Winamp!': 'Tip: drag your own MP3 files onto the Winamp window!',
  'Dihapus dari: C:\\RAHASIA': 'Deleted from: C:\\SECRET',
  'Udahlah, move on. 💔': 'Let it go, move on. 💔',
  'Terdeteksi virus Brontok': 'Brontok virus detected',
  'W32/Brontok.A terdeteksi!<br>File dikarantina. Jangan colok flashdisk sembarangan.': 'W32/Brontok.A detected!<br>File quarantined. Stop plugging in random flash drives.',
  '100% tamat, tapi Deep Freeze...': '100% complete, but Deep Freeze...',
  'Bukit Hijau': 'Green Hill',
  'Lumba-lumba': 'Dolphins',
  'Klasik': 'Classic',
  'Pilih wallpaper (hampir semua PC warnet pakai lumba-lumba):': 'Pick a wallpaper (nearly every warnet PC had the dolphins):',
  'Bahasa / Language': 'Language / Bahasa',
  '<b>Sistem:</b> {os}<br>{ver} (Edisi Bilik)': '<b>System:</b> {os}<br>{ver} (Booth Edition)',
  'Pilih PC': 'Pick a PC',
  '<b>Gratis, 1 klik:</b> bantu warnet ini tanpa keluar duit.': '<b>Free, one click:</b> help this warnet without spending a rupiah.',
  '★ Kasih Star': '★ Give it a Star',
  'di GitHub': 'on GitHub',
  '⑂ Fork': '⑂ Fork',
  'bikin versimu sendiri': 'make your own copy',
  '🐞 Lapor bug': '🐞 Report a bug',
  'atau kasih komentar': 'or leave a comment',
  '{n} item': '{n} items',
  'Ketik di sini untuk mencari': 'Type here to search',
  'Memulai {os}...': 'Starting {os}...',
  'Aurora Biru': 'Blue Aurora',
  'Sinar Biru': 'Blue Beams',
  'Terdaftar atas:': 'Registered to:',
  'Komputer:': 'Computer:',
  'Uptime sesi:': 'Session uptime:',
  'Mesin:': 'Engine:',
  'Vanilla JS, 0 dependency,<br>&lt; 100 KB sebelum Winamp dimuat': 'Vanilla JS, 0 dependencies,<br>&lt; 100 KB before Winamp loads',

  // --- OS chrome: explorer search, menus, command bar, ribbon, tray
  'Cari di {folder}': 'Search {folder}',
  'Tidak ada yang cocok dengan "{q}".': 'Nothing matches "{q}".',
  'Setting PC dikunci mas operator. Jangan dioprek ya!': 'PC settings are locked by the operator. Hands off!',
  'Sharing dimatikan mas operator biar virus nggak nyebar ke 20 PC.': "The operator turned sharing off so viruses don't spread to all 20 PCs.",
  'CD-RW warnet cuma bisa baca. Mau burn CD? Bilang mas operator, Rp 5.000 per keping.': 'The warnet CD-RW only reads. Want a CD burned? Ask the operator, Rp 5.000 a disc.',
  'Folder Downloads kosong. Deep Freeze menghapus semuanya tiap restart.': 'The Downloads folder is empty. Deep Freeze wipes it on every restart.',
  'Billing nggak bisa ditutup, mas. Masukkan voucher dulu!': "The billing can't be closed, mate. Enter your voucher first!",
  'Status: FROZEN. Semua perubahan hilang saat restart, jadi save tugas ke disket ya.': 'Status: FROZEN. Every change is lost on restart, so save your homework to a floppy.',
  // --- games: Ranjau, Ular HP, Winamp
  'Pemula': 'Beginner',
  'Menengah': 'Intermediate',
  'Jago': 'Expert',
  'Baru': 'New game',
  'SKOR {score} · REKOR {best}': 'SCORE {score} · BEST {best}',
  'Tekan panah / WASD / swipe untuk mulai': 'Press arrows / WASD / swipe to start',
  'Jangan nabrak!': 'Do not crash!',
  'GAME OVER! Skor {score}. Tekan arah untuk main lagi.': 'GAME OVER! Score {score}. Press a direction to play again.',
  'GAME OVER! Tekan arah untuk main lagi.': 'GAME OVER! Press a direction to play again.',
  'Browser tidak didukung Webamp': 'This browser is not supported by Webamp',
  'Winamp gagal dimuat (perlu koneksi ke unpkg.com).': 'Winamp failed to load (needs a connection to unpkg.com).',
};
