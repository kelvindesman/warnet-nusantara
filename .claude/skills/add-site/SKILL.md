---
name: add-site
description: Add an old website to the Penjelajah Internet time-travel browser and the Portal Nusantara.Net home page (BOOKMARKS in js/data.js, served via the Wayback Machine). Use when asked to "add a site", "tambah situs", "add a bookmark", "add detik/kaskus/friendster-era website", "usul situs", or when picking up an issue made from the usul-situs form.
---

# Add a site to the time-travel browser

Old websites are never copied into the repo. Each bookmark is a URL plus a year; the browser and `home.html` load it from the Internet Archive Wayback Machine through `wayback(url, year)` in `js/data.js` (`https://web.archive.org/web/<year>if_/<url>`).

## Inputs you need

- **Name** as people remembered it (`'Kafegaul'`, `'astaga!com'`).
- **Original URL**, `http://` with trailing slash, as it was in that era (`http://www.kafegaul.com/`).
- **Era** (optional `era`: `"2011"` or `"2015"`). Without it the site belongs to the original 2003 PC. Each PC era shows only its own bookmarks in the browser and on the portal.
- **Year** that fits the era: 1996–2008 for 2003, 2008–2012 for 2011, 2012–2015 for 2015 (pick the year with the best snapshot).
- **Category**, reusing an existing one when possible: `Berita`, `Portal`, `Komunitas`, `Hiburan`, `Cari`, `Email`, `Download`, `Game Online`. A new category creates a new box on the portal, so only add one if at least two sites need it.
- **Source**: the issue number (`usul-situs` form) or maintainer request.

## Steps

1. **Check the snapshot exists and looks right.**
   ```bash
   curl -s "https://archive.org/wayback/available?url=www.kafegaul.com&timestamp=2002" 
   ```
   The response must contain an `archived_snapshots.closest` entry with `"available": true` and a timestamp in or near the chosen year. Then open `https://web.archive.org/web/2002if_/http://www.kafegaul.com/` in a browser and confirm the page actually renders (not a parked domain, redirect loop, error page or adult content). If the year is poor, try neighbouring years.
2. **Check it is appropriate.** No adult, gambling, piracy/warez or hate sites, even if they were popular. Sites with ROM or crack downloads are out (see the add-game skill tiers). When in doubt, label the issue `ready-for-human`.
3. **Add the entry to `BOOKMARKS` in `js/data.js`** (or `data/bookmarks.json` once content has moved there), next to sites of the same category:
   ```js
   { name: 'Kafegaul', url: 'http://www.kafegaul.com/', year: 2002, cat: 'Komunitas' },
   ```
   - The first 14 entries appear in the browser's links bar; only reorder if a maintainer asked.
   - `home.html` groups bookmarks by `cat` automatically. A bookmark with a `hit` tagline (plus `hit_en`) also shows in the portal's "Situs Paling Hits" list.
   - Do not escape inside the data; the renderers escape. Never put HTML in `name`.
4. **Optionally add a memory line** to `MEMORIES` if the site has a story (Indonesian, warnet voice).

## Validation and tests

- Run `npm run dev`, open `http://localhost:3000/#desktop`, open Penjelajah Internet, and check the site loads from the portal sidebar under its category.
- Content validation tests must pass: every bookmark has a non-empty `name`, an `http(s)://` `url`, an integer `year` in range, a known `cat`, and unique `name`s.
- If you added a category or changed portal/browser behaviour, add or update the e2e spec tagged `@app:browser`, with a `// source:` comment citing the issue:
  ```js
  // source: #57 (usul situs: Kafegaul 2002)
  ```
- Run `npm run gate` and paste the output in the PR. Fill in the "content source" line of the PR template with the Wayback snapshot URL you checked.

## Do not

- Do not download, mirror or screenshot-scrape the site into the repo.
- Do not point to `live` modern URLs as the default; the bookmark is about the era.
- Do not add tracking parameters or shortened URLs.
