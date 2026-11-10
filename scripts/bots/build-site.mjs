// Copies only the public site into an output folder (default _site) for the static host (Cloudflare Pages).
// Allowlist, not denylist: anything not listed here never reaches visitors.
//   node scripts/bots/build-site.mjs [_site]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Root files that are public when present.
export const ROOT_FILE = /^(?:[\w-]+\.html|robots\.txt|sitemap\.xml|llms(?:-[\w-]+)?\.txt|manifest\.(?:json|webmanifest)|site\.webmanifest|\.nojekyll|CNAME|favicon\.(?:ico|svg|png)|apple-touch-icon\.png|humans\.txt|security\.txt|_headers|_redirects)$/;
// Root directories that are public as a whole.
export const PUBLIC_DIRS = ['css', 'js', 'data', 'img', '.well-known'];
// Nested public directories.
export const PUBLIC_NESTED = ['docs/media'];
// Never public, even if they contain an index.html.
export const PRIVATE_DIRS = new Set(['tests', 'scripts', '.github', 'node_modules', '.ops', '.claude', '.git', 'coverage', 'test-results', 'monocart-report', 'playwright-report', 'reports', 'docs', '.vercel', '_site', '.gemini', '.stryker-tmp']);

/** Decide which top-level entries to publish. `entries` = [{ name, dir, hasIndex }]. Pure. */
export function selectPublic(entries) {
  const out = [];
  for (const e of entries) {
    if (e.dir) {
      if (PRIVATE_DIRS.has(e.name) || e.name.startsWith('.') && e.name !== '.well-known') continue;
      if (PUBLIC_DIRS.includes(e.name) || e.hasIndex) out.push(e.name); // css/js/data or a landing dir (has index.html)
    } else if (ROOT_FILE.test(e.name)) out.push(e.name);
  }
  return out.sort();
}

export function buildSite(src = '.', dest = '_site') {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true }).map((d) => ({
    name: d.name,
    dir: d.isDirectory(),
    hasIndex: d.isDirectory() && existsSync(join(src, d.name, 'index.html')),
  }));
  const picked = selectPublic(entries);
  for (const name of picked) cpSync(join(src, name), join(dest, name), { recursive: true });
  for (const nested of PUBLIC_NESTED) if (existsSync(join(src, nested)) && statSync(join(src, nested)).isDirectory()) {
    cpSync(join(src, nested), join(dest, nested), { recursive: true });
    picked.push(nested);
  }
  if (!picked.includes('index.html')) throw new Error('index.html missing: refusing to publish an empty site');
  return picked;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const picked = buildSite('.', process.argv[2] || '_site');
  console.log(`Published entries:\n${picked.map((p) => `  ${p}`).join('\n')}`);
}
