import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectPublic, buildSite } from '../../../scripts/bots/build-site.mjs';

const f = (name) => ({ name, dir: false });
const d = (name, hasIndex = false) => ({ name, dir: true, hasIndex });

// source: Kelvin request 2026-11-07 "copy only public site files ... never upload tests/, scripts/, .github/, node_modules, .ops/"
test('publishes only allowlisted public files and folders', () => {
  const picked = selectPublic([
    f('index.html'), f('home.html'), f('robots.txt'), f('sitemap.xml'), f('llms.txt'), f('llms-full.txt'),
    f('.nojekyll'), f('CNAME'), f('site.webmanifest'), f('_headers'),
    d('css'), d('js'), d('data'), d('img'), d('warnet-2003', true),
    f('package.json'), f('package-lock.json'), f('playwright.config.mjs'), f('README.md'), f('AGENTS.md'), f('.env'), f('.gitignore'), f('vercel.json'),
    d('tests', true), d('scripts'), d('.github'), d('node_modules', true), d('.ops', true), d('.claude'), d('coverage', true), d('test-results', true), d('docs', true), d('random'),
  ]);
  assert.deepEqual(picked, ['.nojekyll', 'CNAME', '_headers', 'css', 'data', 'img', 'home.html', 'index.html', 'js', 'llms-full.txt', 'llms.txt', 'robots.txt', 'site.webmanifest', 'sitemap.xml', 'warnet-2003'].sort());
});

// source: bug ref 2026-11-10 launch prep: img/ was not in the allowlist, so every deploy would have shipped the lock screen without its dolphin photo
test('the built site contains every first-party file the stylesheet and pages point at', () => {
  const out = mkdtempSync(join(tmpdir(), 'site-'));
  try {
    buildSite('.', out);
    const css = readFileSync('css/style.css', 'utf8');
    const refs = [...css.matchAll(/url\("?\.\.\/([^")]+)"?\)/g)].map((m) => m[1]);
    assert.ok(refs.includes('img/lock-dolphins.jpg'));
    for (const r of refs) assert.ok(existsSync(join(out, r)), `missing in _site: ${r}`);
    for (const f of ['index.html', 'home.html', '_headers', 'js/main.js', 'data/games.json', 'img/lock-dolphins-free.jpg']) assert.ok(existsSync(join(out, f)), `missing in _site: ${f}`);
    for (const f of ['tests', 'scripts', '.ops', 'package.json', 'AGENTS.md']) assert.ok(!existsSync(join(out, f)), `private path published: ${f}`);
  } finally { rmSync(out, { recursive: true, force: true }); }
});
