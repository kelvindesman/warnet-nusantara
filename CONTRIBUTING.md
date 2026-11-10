# Contributing to Warnet Nusantara.Net

Selamat datang di bilik! Thanks for wanting to help. Whether you fix a bug, add a 2003 website to the bookmarks, write a new IRC bot line, or just share a warnet memory, you are welcome here.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. For agent-assisted work, [AGENTS.md](AGENTS.md) has the architecture map and the definition of done.

## Ways to contribute without code

- **Share a memory**: open a [Kenangan Warnet](.github/ISSUE_TEMPLATE/kenangan.yml) issue or post in GitHub Discussions. Good memories become bot lines, notepad text or easter eggs.
- **Suggest a site**: use the [Usul Situs](.github/ISSUE_TEMPLATE/usul-situs.yml) form (Indonesian sites from 1996 to 2008 are especially welcome).
- **Suggest a game**: use the [Usul Game](.github/ISSUE_TEMPLATE/usul-game.yml) form. Read the legality tiers in [.claude/skills/add-game/SKILL.md](.claude/skills/add-game/SKILL.md) first.
- **Report a bug**: use the [bug form](.github/ISSUE_TEMPLATE/bug.yml).

## Run it locally

There is no build step. Any static file server works.

```bash
npm run dev                  # serves the repo at http://localhost:3000
# or, without Node:
python3 -m http.server 3000
```

Open http://localhost:3000. Add `#desktop` to the URL (http://localhost:3000/#desktop) to skip the BIOS and billing lock and land straight on the desktop.

## Where things live

| You want to change | Look in |
| --- | --- |
| Browser bookmarks (Wayback sites and years) | `BOOKMARKS` in `js/data.js` |
| Game Warnet catalog | `GAMES` in `js/data.js` |
| Winamp chiptune playlist | `TRACKS` in `js/data.js` (rendered by `renderSong` in `js/sound.js`) |
| Warnet rules and memories texts | `RULES` and `MEMORIES` in `js/data.js` |
| IRC nicks, chatter lines, replies, events | `IRC` in `js/data.js`; behaviour in `js/apps/chat.js` |
| Messenger buddy replies | `REPLIES` in `js/apps/messenger.js` |
| Desktop apps registry | `APPS` in `js/main.js` |
| Window manager | `js/wm.js` |
| Icons | `js/icons.js` (inline SVG) |
| In-frame home portal | `home.html` |

Content will move from `js/data.js` and the app modules into `data/*.json` files later, so that content-only contributions never touch code. When that happens this table will be updated; the rules below stay the same.

Step-by-step recipes: [docs/adding-an-app.md](docs/adding-an-app.md), [add a site](.claude/skills/add-site/SKILL.md), [add a game](.claude/skills/add-game/SKILL.md), [add an IRC bot](.claude/skills/add-irc-bot/SKILL.md). The skills are written for Claude Code but are plain Markdown that any human or agent can follow.

## Project rules

1. **No build step.** The repo is served as-is. No bundlers, transpilers or generated files in the deploy path.
2. **No runtime dependencies.** Vanilla ES modules only. The single exception is Webamp, loaded lazily from a pinned CDN URL when the user opens Winamp. Do not add more without a maintainer agreeing in an issue first. Dev-only tooling (test runner, coverage) is fine.
3. **Relative paths only.** The site must work both at the domain root (`/`) and under a subpath (`/warnet/`). Never hard-code a leading `/` for first-party files.
4. **Every rendered string is escaped.** Use `esc()` from `js/wm.js` (or `textContent`) for anything that comes from data, user input or a URL. Never put untrusted strings into `innerHTML`.
5. **UI copy is Indonesian**, in the casual early-2000s warnet voice. Code, comments, commit messages and docs are English.
6. **Small, focused pull requests.** One feature or fix per PR.

## Testing bar

- **Every change ships with tests.** Behaviour changes need an end-to-end spec that drives the changed screen or flow; content changes need at least the content validation tests to pass.
- **`npm run gate` must pass** on your final commit. The gate runs lint, unit tests, coverage and the e2e suite on both the root (`/`) and subpath (`/warnet/`) layouts.
- **100% coverage of first-party JS is enforced.** If a line cannot be tested, explain why in the PR; do not lower the threshold.
- **Every test carries a `// source:` comment** directly above it, citing where the requirement comes from: a README feature, an issue number (`// source: #42`), or a maintainer request. A test whose only source is your own reading of the requirement just locks in an assumption.
- Paste the gate output into the pull request template.

## Contributor License Agreement

Before your first PR can be merged you must sign the [CLA](CLA.md). The CLA Assistant bot will comment on your PR with a link. You keep your copyright; the CLA lets the maintainer offer the project under commercial terms as well as the open licenses (see [COMMERCIAL.md](COMMERCIAL.md)).

## Issue labels and triage

Every new issue starts as `needs-triage`. A triager then moves it along this state machine:

```
needs-triage ──► ready-for-agent   (clear spec, acceptance checks written, safe for an AI agent or a newcomer)
             ├─► ready-for-human   (needs judgement, design taste, legal checks or real testing on old hardware)
             └─► wontfix           (out of scope, legally unsafe, or duplicate; closed with a reason)
ready-for-agent / ready-for-human ──► wontfix (if it turns out to be unworkable)
```

Other labels: `from-web` (the issue came from the website's suggestion links), `good first issue`, `content`, `bug`.

Pick up `ready-for-agent` or `ready-for-human` issues by commenting that you are working on it.

## AI-assisted contributions

AI-assisted contributions are welcome. Please disclose them in the PR template (which tool, and what it did). You are responsible for every line: review it, run the gate, and make sure tests carry real `// source:` citations.

Optional agent plugins that work well with this repo (per developer, **not vendored** into the repo, not required):

- [obra/superpowers](https://github.com/obra/superpowers): in Claude Code, `/plugin install superpowers@claude-plugins-official`.
- [mattpocock/skills](https://github.com/mattpocock/skills).

The repo itself ships tool-neutral guidance in [AGENTS.md](AGENTS.md) plus a few project skills in `.claude/skills/`.

## Commit and PR conventions

- Commit messages: short imperative summary, for example `feat(chat): add #surabaya channel`, `content: add plasa.com 2002`, `fix(wm): keep window on screen after resize`.
- Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) completely, including screenshots for visual changes.

Terima kasih, dan jangan lupa bayar billing!
