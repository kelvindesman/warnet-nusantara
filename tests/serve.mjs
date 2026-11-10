// Zero-dependency static server used by the e2e suite.
// Serves the repo root at `/` (Vercel / custom domain layout) and under a
// prefix such as `/warnet/` (GitHub Pages project-site layout), so every test
// can run against both URL shapes.
//
//   node tests/serve.mjs <port> [prefix]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};
// Never serve private or tooling paths, mirroring what the Pages artifact excludes.
const BLOCKED = /^\/(\.|node_modules\/|tests\/|test-results\/|playwright-report\/|coverage\/)/;

export function startServer(port, prefix = '/') {
  const pre = prefix.endsWith('/') ? prefix : prefix + '/';
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let path = decodeURIComponent(url.pathname);
    if (!path.startsWith(pre)) { res.writeHead(404).end('not found'); return; }
    path = '/' + path.slice(pre.length);
    if (BLOCKED.test(path)) { res.writeHead(404).end('not found'); return; }
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [port = '4173', prefix = '/'] = process.argv.slice(2);
  await startServer(Number(port), prefix);
  console.log(`serving ${ROOT} at http://127.0.0.1:${port}${prefix}`);
}
