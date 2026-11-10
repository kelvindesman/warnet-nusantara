import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildPages } from '../../scripts/seo/pages.mjs';

const root = new URL('../../', import.meta.url);

// source: plan "SEO + GEO": landing pages, sitemap, robots, llms.txt generated from data/*.json so they never drift
test('committed SEO pages match data/*.json (run npm run seo when this fails)', () => {
  for (const [rel, text] of Object.entries(buildPages())) {
    assert.ok(existsSync(new URL(rel, root)), `missing ${rel}`);
    assert.equal(readFileSync(new URL(rel, root), 'utf8'), text, `stale ${rel}`);
  }
});

// source: AGENTS.md "Escape everything rendered" (catalog names are community content)
test('landing pages escape catalog content and JSON-LD cannot close its script tag', () => {
  const evil = '<img src=x onerror=alert(1)></script>';
  const pages = buildPages({
    links: { site: 'https://example.org/', repo: 'https://github.com/x/y', discord: '' },
    games: [{ id: 'x', name: evil, mode: 'embed', url: 'https://archive.org/embed/x', year: 1999, note: evil }, { id: 's', name: evil, mode: 'shrine', year: 2003, site: 'http://a.b/', siteYear: 2003, note: evil }],
    bookmarks: [{ name: evil, url: 'http://a.b/', year: 2001, cat: 'x' }],
    irc: { channels: { [evil]: [] } },
  });
  for (const [rel, html] of Object.entries(pages)) {
    if (!rel.endsWith('.html')) continue;
    assert.ok(!html.includes('<img src=x'), rel);
    const scripts = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    for (const s of scripts) JSON.parse(s.replace(/^<script[^>]*>|<\/script>$/g, ''));
  }
});
