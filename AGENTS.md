# AGENTS.md

Guide for AI coding agents (Claude Code, Codex, Gemini CLI, Cursor, Copilot, opencode and others) and for humans who like a map. Tool-neutral: read this first, then the file you are changing.

## What this is

**Warnet Nusantara.Net** recreates an early-2000s Indonesian internet cafe in the browser: Award-style BIOS boot, billing lock screen with dolphins and a voucher, XP-style desktop, a Wayback Machine time-travel browser, Webamp (Winamp), a Game Warnet folder, IRC chat bots, Messenger with BUZZ, Ranjau (minesweeper) and Ular HP (snake).

It is a **static, zero-dependency, no-build, vanilla ES-module** web app. The repo is served as-is.

## Architecture map

```
index.html ── loads js/main.js (type=module) + css/style.css
js/main.js    boot flow: bios() → lock() (billing + dolphins + voucher) → welcome() → desktop()
              APPS registry: id → { name, icon, run } ; each run() lazy-imports its module
              DESKTOP_ICONS, start menu, taskbar, tray (billing timer, clock, volume), balloons
              location.hash === '#desktop' skips straight to the desktop (dev shortcut)
js/wm.js      window manager: openWindow(opts), msgbox(), focus/minimize/maximize/close,
              drag + resize, taskbar sync via onChange(); helpers h() (HTML → element) and esc()
js/i18n.js    LANG (?lang= > saved > device > en), t() gettext lookup, tx() for *_en data fields, setLang()
js/era.js     PC era (2003 / 2011 / 2015, ?era= > saved > 2003): <html data-era> theme, BIOS lines, rate, wallpaper, Wayback year
js/state.js   session + billing: newVoucher(), startBilling(), remaining(), used(), addTime(), fmt(), rupiah()
js/data.js    content: BOOKMARKS, GAMES, TRACKS, RULES, MEMORIES, IRC (+ wayback() URL helper)
js/sound.js   every sound synthesized with WebAudio: chime, ding, buzz, door, dialup, renderSong (chiptunes)
js/icons.js   inline SVG icon set (icons, icon(name)) + gameIcon() box-art generator
js/apps/      one module per app, loaded on demand with import():
              browser.js (Penjelajah Internet, Wayback year picker, dial-up)  winamp.js (Webamp from unpkg)
              games.js (Game Warnet folder + launchGame)  chat.js (IRC bots)  messenger.js (BUZZ)
              ranjau.js  ular.js  misc.js (My Computer, Documents, Recycle Bin, Notepad, Display, About)
home.html     the in-frame portal page ("Portal Nusantara.Net") shown as the browser's home page
css/style.css all styling (XP-ish theme, lock screen, apps)
```

Content will move from `js/data.js` and app modules into `data/*.json` later. Follow whichever location exists when you work.

## Conventions

- **No build step, no runtime dependencies.** Vanilla ES modules only. Webamp (pinned CDN URL, lazy) is the only runtime third-party code. Do not add packages to the runtime path; dev-only tooling is fine.
- **Relative paths only** for first-party files. The site must work at `/` and under `/warnet/`.
- **Escape everything rendered.** Use `esc()` from `js/wm.js` or `textContent`. `innerHTML` is acceptable only for trusted first-party template markup with every interpolated value escaped.
- **Indonesian UI copy**, casual early-2000s warnet voice ("Tanya mas operator!"). Code, comments, commits and docs in English.
- **Two UI languages.** Indonesian is the source; wrap every user-visible string in `t('...')` from `js/i18n.js` and add its English to `js/i18n/en.js` (the unit completeness test fails on missing or unused keys). Data twins use `*_en` fields read with `tx(obj, key)`. Bot chatter, site names and supporter text stay untranslated.
- **Lazy loading.** New apps go in `js/apps/<name>.js` and are imported inside `APPS[id].run`, never statically from `main.js`.
- **Icons are inline SVG** in `js/icons.js`. No image files for UI icons. Gradient ids are de-duplicated by `icon()`.
- **Sounds are synthesized.** No audio files in the repo.
- **Types via JSDoc, checked by `tsc --checkJs`** (`npm run typecheck`, in the gate). No `.ts` sources. DOM lookups are typed by the shims in `types/dom.d.ts`; add a JSDoc `@param`/`@type` where inference falls short. No `@ts-ignore`.
- Keep diffs small and consistent with the surrounding style (dense, single-line helpers are normal here).

## Commands

```bash
npm run dev     # static server on http://localhost:3000 (or: python3 -m http.server 3000)
npm run e2e     # end-to-end suite (browser-driven)
npm run typecheck  # tsc --checkJs over js/** (JSDoc types; DOM shims in types/dom.d.ts)
npm run gate    # full gate: typecheck, lint, unit, 100% coverage, e2e on root (/) and subpath (/warnet/) layouts
```

Append `#desktop` to the local URL to skip boot and login while developing.

## Definition of done

A change is done only when **all** of these hold:

1. `npm run gate` passes on the exact commit you are proposing, **including e2e on both the root `/` and subpath `/warnet/` layouts**.
2. **100% coverage** of first-party JS is maintained. Do not lower thresholds or add ignore comments to get there.
3. Every changed screen or flow has an e2e spec that drives it end to end. Specs for an app are tagged `@app:<id>` (the `APPS` key).
4. Every test has a `// source:` comment above it citing the requirement: a README feature, an issue number, or a maintainer request. Not your own reading of the task.
5. The gate output is **quoted in the PR** (PR template section), with screenshots for visual changes.

Never report a change as done without the gate output. Never bypass hooks (`--no-verify`) or edit thresholds, baselines or evidence to make the gate pass; if the gate is wrong, fix the gate in its own commit and say so.

## Security rules

- **Never write credentials, tokens, account handles, private contact info, personal emails, local absolute paths or ops notes into tracked files.** Those belong in the gitignored `.ops/` directory. Placeholders such as `TODO_GH_SPONSORS` stay as placeholders until the owner fills them. The public contact email and the GoatCounter code in `data/links.json`, and the owner handle `@kelvindesman` in CODEOWNERS and MAINTAINERS.md, were filled by the owner (2026-11-10).
- **Never use `innerHTML` (or `insertAdjacentHTML`, `outerHTML`) with untrusted strings.** Content data, user input, URLs and nicknames are untrusted. Escape with `esc()`.
- Only allow `http:`/`https:` URLs into `src`/`href`; open new tabs with `noopener`.
- **Never add `pull_request_target` workflows that check out or run PR code.** Pin third-party actions to a commit SHA. Do not interpolate issue or PR titles/bodies directly into `run:` scripts.
- Do not add trackers, analytics or third-party scripts.
- Respect the game legality tiers (see `.claude/skills/add-game/SKILL.md`): never link private servers or ROMs of games that are still sold. Fan-made browser ports (tier D, owner decision 2026-11-08) are linked out only, never embedded, only on allowlisted hosts, always with the not-affiliated disclaimer, and never listed on SEO pages. Owner decision 2026-11-08 also allows these specific ports that ship original game data or are built from leaked source, under the same tier D rules: `play.lostarena.online`, `playigi.com`, `pes6.optijuegos.net`, `gunz.sigr.io`, `dannishen60.github.io`. Owner decision 2026-11-10 adds `www.retrogames.cc` (browser emulator of PS1 games, ads on their side) for the rental PS shelf, same tier D rules. That is not a general rule: any other such host needs the owner's explicit OK.

## How to add things

| Task | Recipe |
| --- | --- |
| New desktop app | [docs/adding-an-app.md](docs/adding-an-app.md) |
| New website in the time-travel browser | [.claude/skills/add-site/SKILL.md](.claude/skills/add-site/SKILL.md) |
| New game in Game Warnet | [.claude/skills/add-game/SKILL.md](.claude/skills/add-game/SKILL.md) |
| New IRC channel, nick or bot line | [.claude/skills/add-irc-bot/SKILL.md](.claude/skills/add-irc-bot/SKILL.md) |

The `.claude/skills/*` files are Claude Code skills, but they are plain Markdown recipes any agent or human can follow.

## Issue workflow

Issues flow `needs-triage` → `ready-for-agent` / `ready-for-human` → (`wontfix`). Agents should pick up `ready-for-agent` issues only; each should contain acceptance checks. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licensing reminders

Code is AGPL-3.0-only ([LICENSE](LICENSE)); creative content is CC BY-NC-SA 4.0 ([LICENSE-CONTENT](LICENSE-CONTENT)); the name is reserved ([TRADEMARK.md](TRADEMARK.md)). Contributors sign the [CLA](CLA.md). Third-party material is credited in [CREDITS.md](CREDITS.md) and is never copied into the repo. Single owner exception (2026-11-10): the lock-screen stock photo `img/lock-dolphins.jpg`; its free fallback is `img/lock-dolphins-free.jpg`. Do not add other third-party files.
