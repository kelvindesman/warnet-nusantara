import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDigest, withSummary, isSensitive } from '../../../scripts/bots/digest.mjs';

// source: .github/CODEOWNERS (owner reviews /js/, /css/, *.html, /.github/)
test('PRs touching js/css/html/.github need CODEOWNERS review; data/ and docs do not', () => {
  assert.equal(isSensitive(['js/main.js']), true);
  assert.equal(isSensitive(['css/style.css']), true);
  assert.equal(isSensitive(['home.html']), true);
  assert.equal(isSensitive(['.github/workflows/gate.yml']), true);
  assert.equal(isSensitive(['data/bookmarks.json', 'README.md', 'tests/e2e/x.spec.mjs']), false);
});

// source: Kelvin request 2026-11-07 'weekly issue "Digest mingguan" listing merged PRs, open PRs needing CODEOWNERS review, open nominations, stale count'
test('digest lists every section, defangs titles, and handles empty weeks', () => {
  const md = renderDigest({
    date: '2026-11-09',
    merged: [{ number: 12, title: 'content: add plasa.com <script>x</script> @everyone', user: { login: 'budi' } }],
    sensitive: [{ number: 15, title: 'fix(wm): keep window on screen', user: { login: 'sari' } }],
    nominations: [],
    staleCount: 4,
  });
  assert.match(md, /PR yang di-merge \(1\)\n\n- #12 `content: add plasa\.com <script>x<\/script> @everyone` \(budi\)/);
  assert.doesNotMatch(md.replace(/`[^`]*`/g, ''), /<script>|@everyone/, 'only inside inline code');
  assert.match(md, /CODEOWNERS.*\(1\)\n\n- #15/);
  assert.match(md, /Nominasi terbuka \(0\)\n\n_Tidak ada\._/);
  assert.match(md, /4 issue\/PR berlabel `stale`/);
});

// source: Kelvin request 2026-11-07 "optional GitHub Models 3-sentence summary" (GitHub Models retired 2026-07-30, Gemini used instead) + skip gracefully
test('AI summary is optional and sanitized', () => {
  assert.match(withSummary('X', 'skipped', ''), /^> _Ringkasan AI: bot lagi istirahat, nunggu maintainer\._\n\nX$/);
  const s = withSummary('X', 'success', 'Minggu ramai. Cek https://evil.example @all. ' + 'b'.repeat(900));
  assert.doesNotMatch(s, /https|@all/);
  assert.ok(s.length < 700);
});
