# Credits

Warnet Nusantara.Net stands on the shoulders of people who preserve and port old software. Thank you.

> **Important:** everything listed on this page belongs to its own creators and is used under **their own terms**. None of it is covered by this repository's licenses (AGPL-3.0 for code, CC BY-NC-SA 4.0 for content). This project only links to or embeds it; it does not redistribute it. See [DISCLAIMER.md](DISCLAIMER.md).

## Infrastructure and libraries

| Source | Used for | Link | Terms |
| --- | --- | --- | --- |
| **Internet Archive / Wayback Machine** | Every page in the *Penjelajah Internet* time-travel browser is loaded from `web.archive.org` (bookmarks in `js/data.js`, `BOOKMARKS`). | https://web.archive.org/ | [Internet Archive Terms of Use](https://archive.org/about/terms.php) |
| **Internet Archive software collection (DOS emulator embeds)** | DOS games in *Game Warnet* run inside `archive.org/embed/...` iframes (DOOM, Wolfenstein 3D, Sango Fighter, Mortal Kombat, The Need for Speed, Jazz Jackrabbit, Commander Keen 4, Lemmings, SimCity, Tetris, Pac-Man, Digger, Alley Cat, Gorillas). | https://archive.org/details/softwarelibrary_msdos_games | Internet Archive terms; each game belongs to its publisher |
| **Webamp** by Jordan Eldredge and contributors | The *Winamp* app: Webamp 2.2.0 is lazy-loaded from unpkg at runtime (`js/apps/winamp.js`). | https://github.com/captbaritone/webamp | MIT License |
| **unpkg** | CDN that serves the Webamp bundle. | https://unpkg.com/ | unpkg terms |

## Games and web ports (from `GAMES` in `js/data.js`)

| Game | Provider | Link | Mode |
| --- | --- | --- | --- |
| Diablo (Shareware) | **d07riv/diabloweb**, WebAssembly port | https://github.com/d07riv/diabloweb (played at https://d07riv.github.io/diabloweb/) | Embedded |
| 3D Pinball Space Cadet | **alula/SpaceCadetPinball**, decompilation and web port | https://github.com/alula/SpaceCadetPinball (played at https://alula.github.io/SpaceCadetPinball/) | Embedded |
| Prince of Persia | **princejs.com**, HTML5 port | https://princejs.com/ | Embedded |
| 98.js (Windows 98 desktop) | **98.js.org** by Isaiah Odhner and contributors | https://98.js.org/ | Embedded |
| Grand Theft Auto, Duke Nukem 3D, DOOM multiplayer | **dos.zone** | https://dos.zone/ | New tab (site blocks framing) |
| Counter-Strike 1.6 | **play-cs.com** | https://play-cs.com/ | New tab (site blocks framing) |
| DOS classics listed above | **Internet Archive** | https://archive.org/ | Embedded |

Game titles, characters and artwork are the property of their respective publishers and developers (for example id Software, Blizzard, Microsoft, Brøderbund/Ubisoft, Valve, Rockstar, 3D Realms and others).

## Websites shown through the Wayback Machine

The bookmarks (detik.com, Kompas, astaga!com, satunet, plasa, TelkomNet, Kafegaul, Kaskus, Friendster, KapanLagi, Google, Yahoo!, Lycos, Hotmail, GeoCities, Yahoo! Messenger, mIRC, Winamp, Napster, Kazaa, Ragnarok Online ID, Lyto, GunBound Boleh, BolehNet, Counter-Strike and more) are archived snapshots of third-party websites. They belong to their owners.

## Photos

- `img/lock-dolphins.jpg` (billing lock screen wallpaper): the classic moonlit-dolphin stock photo that many Indonesian warnet billing screens used in the 2000s. It is **third-party material, not ours, and not covered by this repository's licenses**. It is included by owner decision (2026-11-10), who accepts the takedown risk. Edits: the moon is moved, and the photo is upscaled 4x with [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (BSD-3-Clause) and resized. Rights holders: email kelvindsmn@gmail.com and it is replaced within 7 days.
- `img/lock-dolphins-free.jpg` (free fallback wallpaper, swap the url in `css/style.css` on a takedown): our own moonlit-lagoon composite. The night sky, moon, hills, horizon, splash and foam are drawn for this project. The leaping dolphin is cut out of "Tursiops truncatus 01" (NASA photo KSC-04pd0178, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Tursiops_truncatus_01.jpg)), a work of the U.S. federal government in the public domain. The sandy lagoon floor comes from "Dolphin - Monkey Mia, WA 2" by Dinkum ([Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dolphin_-_Monkey_Mia,_WA_2.JPG)), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Both are recoloured, cropped and blended into the scene.

## First-party work

Everything not listed above (the boot sequence, billing lock screen, desktop, window manager, Ranjau, Ular HP, IRC and Messenger bots, inline SVG icons, synthesized sounds and chiptunes, wallpapers, Indonesian copy) was made for this project. Code is [AGPL-3.0-only](LICENSE); creative content is [CC BY-NC-SA 4.0](LICENSE-CONTENT).

## Contributors

Contributors are credited in the git history. Supporters are listed in the README.

Missing a credit or found an error? Open an issue or email `kelvindsmn@gmail.com`.
