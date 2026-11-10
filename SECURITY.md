# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub Security Advisories:

1. Go to https://github.com/kelvindesman/warnet-nusantara/security/advisories
2. Click **"Report a vulnerability"**.
3. Describe the issue, how to reproduce it, and its impact.

If you cannot use GitHub, email `kelvindsmn@gmail.com` with the subject `SECURITY`.

We aim to acknowledge reports within 3 days and to ship a fix or mitigation as fast as possible, usually within 14 days. We will credit you in the advisory unless you prefer to stay anonymous.

## Supported versions

Only the live site (https://warnet-nusantara.pages.dev/) and the `main` branch are supported. There are no long-term release branches.

## Scope

Warnet Nusantara.Net is a static site with no backend, no accounts and no stored user data, so the main risks are in the browser and in the supply chain.

**In scope, and especially interesting:**

- **XSS via content data.** Bookmarks, games, bot lines and other content (in `js/data.js` today, `data/*.json` later) are rendered into the page. Any way to make a content entry, URL, nickname, chat input, `/nick` or `/join` argument, or Wayback URL execute script or inject markup is a vulnerability.
- **Unsafe iframe or navigation handling**: escaping the browser or game iframes, `javascript:` or `data:` URLs reaching `src`/`href`, `window.open` without `noopener`.
- **Supply chain via workflows**: GitHub Actions that could run untrusted pull request code with write tokens or secrets (for example `pull_request_target` checking out PR code), unpinned third-party actions, script injection through issue or PR titles, or anything that lets an attacker change what gets deployed to GitHub Pages.
- **Third-party script loading**: the pinned Webamp URL being replaceable or unpinned.

**Out of scope:**

- Content and behaviour of third-party sites shown through the Wayback Machine or embedded games (report those to their owners).
- Missing security headers that the static host does not let us configure.
- Social engineering, physical attacks, denial of service.
- Reports from automated scanners without a working proof of concept.

## Safe harbor

Good-faith research that respects this policy, avoids harming other users, and gives us reasonable time to fix the issue before disclosure will not be pursued.
