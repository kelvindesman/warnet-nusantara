# Community

Warnet Nusantara.Net is built by people who spent their teenage years in plywood booths with a CRT monitor and a billing timer. Come hang out.

## Discord

**Coming soon.** A Discord server is planned. Until then, GitHub Discussions is the place to talk.

## GitHub Discussions

https://github.com/kelvindesman/warnet-nusantara/discussions

| Category | What goes there |
| --- | --- |
| **Kenangan Warnet** | Your warnet memories: the operator, the paket malam, the first time you heard a 56k modem. The best ones may become IRC bot lines, notepad texts or easter eggs (with your permission and credit). |
| **Ide** | Ideas for new apps, sites, games and features. Rough ideas are fine; when an idea has a clear shape, a triager turns it into an issue. |
| **Show & Tell** | Screenshots, videos, streams, forks (renamed, see [TRADEMARK.md](TRADEMARK.md)), fan art. |

Questions about using or running the project also belong in Discussions, not issues.

## From the website to an issue

The live site (https://warnet-nusantara.pages.dev/) has small "usul" (suggestion) links, for example on the portal and in the Game Warnet folder. They open a pre-filled GitHub issue form:

1. The link points at one of the issue forms (`usul-situs.yml`, `usul-game.yml`, `kenangan.yml`, `bug.yml`, `kerja-sama.yml`) with fields pre-filled through the URL and the extra label `from-web`, for example:
   `https://github.com/kelvindesman/warnet-nusantara/issues/new?template=usul-situs.yml&labels=needs-triage,from-web&title=Usul%20situs:%20plasa.com`
   GitHub only applies URL `labels` for people with triage access, so the forms also add `needs-triage` themselves, and triagers add `from-web` by hand when the URL label was dropped.
2. You review the text, sign in to GitHub, and submit. Nothing is sent anywhere until you press submit.
3. The issue starts as `needs-triage`. A triager checks it (for sites: is there a good Wayback snapshot? For games: which legality tier?) and moves it to `ready-for-agent`, `ready-for-human` or `wontfix`.
4. Someone picks it up and opens a PR. When it merges, it ships to the live site.

Partnership and sponsorship inquiries use the `kerja-sama` form only for a short public note; private details go to `kelvindsmn@gmail.com`.

## Support the operator

If you want to help pay the warnet's billing, see the "Support the operator" section of the [README](README.md#support-the-operator).

## Code of Conduct

Everywhere in this community, the [Code of Conduct](CODE_OF_CONDUCT.md) applies.
