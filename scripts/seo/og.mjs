// Renders the 1200x630 social preview (og:image) from the real billing lock screen.
//   node scripts/seo/og.mjs   -> docs/media/og.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startServer } from '../../tests/serve.mjs';

const port = 4390;
const server = await startServer(port, '/');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.route((u) => u.origin !== `http://127.0.0.1:${port}`, (r) => r.abort());
await page.goto(`http://127.0.0.1:${port}/?seed=3&nosound&lang=id`);
await page.locator('.bios').click();
await page.locator('.billing').waitFor();
await page.waitForTimeout(1500); // let the dolphins swim into frame
mkdirSync('docs/media', { recursive: true });
await page.screenshot({ path: 'docs/media/og.png' });
await browser.close();
server.close();
console.log('wrote docs/media/og.png');
