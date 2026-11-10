---
name: add-game
description: Add a game to the Game Warnet folder (GAMES in js/data.js) with the right legality tier and the right launch mode (embed in a window vs open in a new tab). Use when asked to "add a game", "tambah game", "usul game", "put DOOM/Sango/CS/Ragnarok in Game Warnet", "embed a DOS game", or when picking up an issue made from the usul-game form.
---

# Add a game to Game Warnet

Games are never hosted in this repo. Each entry in `GAMES` (`js/data.js`, later `data/games.json`) points at a third party that legally provides the game. `js/apps/games.js` renders the folder and launches entries; `js/main.js` gives every non-local game its own desktop shortcut automatically.

## Step 1: decide the legality tier (mandatory)

| Tier | What | Allowed? | Examples |
| --- | --- | --- | --- |
| **A** | Legal to play: free, open source, shareware, official free web versions, or official/open-source ports that respect the original license. | Yes, embed or link. | Diablo shareware via d07riv/diabloweb, 3D Pinball via alula/SpaceCadetPinball, 98.js, princejs.com, official free-to-play sites. |
| **B** | Abandonware preserved and hosted by the **Internet Archive** (its software collection, playable in the in-browser emulator). | Yes, only via `archive.org/embed/<identifier>`. | DOOM, Sango Fighter, Lemmings, SimCity, Wolfenstein 3D. |
| **C** | Anything that is not clearly A or B: **private servers**, emulators of online games, **ROMs or downloads of games that are still sold or operated**, cracked clients, "repacks". | **Never link.** Use a Shrine instead. | Ragnarok Online private servers, GunBound private servers, Point Blank, still-sold console or PC games, Steam games. |

| **D** | **Fan-made browser ports** of commercial games (decompilations, recompilations, engine re-implementations) hosted by someone else. Owner decision 2026-11-08. | **Link out only**, `mode: "fanport"`, never embedded. The host must be on `FANPORT_HOSTS` in `tests/unit/data-schema.test.mjs` (a maintainer reviews every new host). Year ≤ 2015 like every game (warnet eras run to 2015). | GTA Vice City (revc.wasm.ltd), C&C Generals (generals.wasm.ltd), Halo CE, Tekken 5 DR. |

PlayStation-era fan ports (PS1/PS2 games, even when the port is built from the PC version) add `"console": "ps1"` or `"ps2"`: they move to the "Pojok Rental PS" shelf right under the fan-port disclaimer, and the folder shows the console next to the year. They also get a desktop shortcut in the "Pojok Rental PS" corner at the bottom right (the only fan ports on the desktop). Other desktop game shortcuts are shuffled every session so each game gets a fair chance near the top (owner requests 2026-11-10).

Tier D entries: `"status": "live"` with `url`, or `"status": "down"` with no `url` and a `news` link about the takedown. Every launcher shows the "tidak berafiliasi" disclaimer (`FAN_DISCLAIMER` in `js/apps/games.js`). Tier D is never listed on SEO pages or in `llms.txt`. Remove an entry at once on any takedown request.

Owner exception (2026-11-08): Lost Arena (`play.lostarena.online`), Project I.G.I. web (`playigi.com`), PES 6 (`pes6.optijuegos.net`), GunZ (`gunz.sigr.io`) and the Plants vs. Zombies remake (`dannishen60.github.io`) serve original game data or are built from leaked source. The owner approved linking exactly these, as tier D. Do not treat this as precedent: any new host like this is tier C unless the owner approves it by name.

Owner exception (2026-11-10): `www.retrogames.cc` PS1 game pages (in-browser emulator, `"console": "ps1"`, name suffix "(emulator)") on the rental PS shelf, as tier D. Link the game page, never a file. Same rule: no other ROM site without the owner's OK by name.

Playability: run `node scripts/games-live.mjs [ids...]` (needs the network, not part of the gate). For a game that does not play, add `"broken"` + `"broken_en"` (why, ≤160 chars). The folder sorts it last in its group, marks it ⚠ and asks before launching.

If you cannot prove A or B with a link to the license, official page or Internet Archive item, it is C. If the issue is ambiguous, label it `ready-for-human` and stop.

### Tier C: build a Shrine instead

For beloved games we cannot link (Ragnarok Online, GunBound, Point Blank, Nexia, Seal Online...), make a **Shrine**: a memorial that respects the rights holder.

- Add (or reuse) a `BOOKMARKS` entry for the game's **official site from that era** via the Wayback Machine (see the add-site skill), for example `http://www.ragnarok.co.id/` 2004 or `http://gunbound.boleh.com/` 2004.
- Make an icon that opens that Wayback page in Penjelajah Internet instead of a game, with a joke such as `'Server lagi maintenance (sejak 2008)'`. Today this works like the existing `friendster`/`kaskus` entries in `APPS` in `js/main.js` (`run: ... openBrowser('http://www.ragnarok.co.id/')`). `GAMES` has no shrine mode yet; putting shrines inside the Game Warnet folder needs a small code change in `js/apps/games.js` (for example `mode: 'shrine'` that shows the maintenance joke in a `msgbox` and then calls `openBrowser(url)`), which must ship with an `@app:games` e2e spec.
- Add a link to the **current official** game or publisher page if the game still exists (so players can play legally).
- Optionally add memories to `MEMORIES` or IRC lines (`'ada yg main RO di server chaos?'`).

## Step 2: embed or new tab?

Many sites forbid being framed. Check the headers of the exact URL you will use:

```bash
curl -sI "https://example.com/game/" | grep -iE '^(x-frame-options|content-security-policy)'
```

- `X-Frame-Options: DENY` or `SAMEORIGIN` → **`mode: 'tab'`**.
- `Content-Security-Policy` with a `frame-ancestors` directive that does not include `*` or our origin (`https://warnet-nusantara.pages.dev`) → **`mode: 'tab'`**.
- Neither header present → `mode: 'embed'` is possible; still verify in the browser that it loads, gets keyboard focus, and has no console errors about framing, cookies or `SharedArrayBuffer`.
- Internet Archive `https://archive.org/embed/<id>` URLs are designed for embedding → `'embed'`.

`'tab'` entries show a "tidak mengizinkan dibuka di dalam jendela" dialog and open with `noopener`.

## Step 3: add the entry

Use the `ia()` helper for Internet Archive items. Fields: `id` (unique, lowercase), `name`, `note` (Indonesian, shown as tooltip/status), `note_en` (optional English version for English visitors; same rules as `note`), `mode` (`'embed'` | `'tab'`; `'local'` is only for built-ins), `url`, `icon` (`'dos'` for IA DOS, `'game'` for web ports, `'link'` for tab; `gameIcon()` generates box art from `id`/`name` anyway), `year`, optional `w`/`h` for the window size, and optional `hot` (`["2011"]`, `["2015"]` or both): the game was what every booth played on that PC era, so it moves to the "Lagi rame" group at the top of Game Warnet on that era. Never on fan ports (they stay next to their disclaimer).

```js
{ id: 'prince2', name: 'Prince of Persia 2', note: 'Emulator DOS — Internet Archive', mode: 'embed', url: ia('msdos_Prince_of_Persia_2_-_The_Shadow_and_the_Flame_1993'), icon: 'dos', year: 1993 },
{ id: 'cs16', name: 'Counter-Strike 1.6', note: 'Online beneran! play-cs.com (tab baru)', mode: 'tab', url: 'https://play-cs.com/', icon: 'link', year: 2003 },
```

Verify Internet Archive identifiers exist:

```bash
curl -s "https://archive.org/metadata/msdos_Prince_of_Persia_2_-_The_Shadow_and_the_Flame_1993" | head -c 300
```

Then:

- Add the provider to [CREDITS.md](../../../CREDITS.md) if it is new (name, link, terms).
- Do not add a hand-written `APPS` entry; `main.js` creates `g:<id>` automatically. Only add to `APPS` if a maintainer wants a named alias (like `sango`, `diablo`).

## Validation and tests

- `npm run dev`, open `http://localhost:3000/#desktop`, open Game Warnet, double-click the new game: embed opens a window with the iframe and "Layar penuh"/"Tab baru" buttons; tab shows the dialog.
- Content validation tests must pass: unique `id`, valid `mode`, `https://` `url` for embed/tab, `year` is an integer, embed URLs are on an allow-list of known providers (Internet Archive and the credited ports). Extend the allow-list in the same PR when adding a new provider, citing the issue.
- If behaviour changed, update the e2e spec tagged `@app:games` with a `// source:` comment:
  ```js
  // source: #88 (usul game: Prince of Persia 2, tier B)
  ```
- `npm run gate` passes; paste output in the PR. In the PR template's "content source" line, state the **tier** and the link that proves it (license page, IA item, official page) and the header check result for embed vs tab.

## Never

- Never link private servers, ROM sites (except the owner-approved `www.retrogames.cc` game pages above), ROM/ISO download links (even inside a tier D entry), warez, "abandonware" download sites outside the Internet Archive, or cracked clients.
- Never commit game binaries, ROMs, WADs, music or artwork from games.
- Never embed something whose headers forbid framing by working around them (proxies, header stripping).
