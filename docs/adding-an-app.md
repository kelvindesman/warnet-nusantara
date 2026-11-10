# Adding a desktop app

This recipe adds a new windowed app (for example a fake "Nero Burning ROM", a "Paint" clone or a "Kalkulator") to the desktop and Start menu. It is based on how the existing apps are wired today; read `js/main.js`, `js/wm.js` and one small app such as `js/apps/ular.js` before starting.

Throughout, `<id>` is the short key of your app (lowercase, no spaces, for example `nero`) and `<name>` is the module file name (usually the same).

## 1. Draw an icon in `js/icons.js`

Icons are hand-written inline SVG strings in the `icons` object, built with the local `s(body, viewBox = '0 0 32 32')` helper:

```js
export const icons = {
  // ...
  nero: s(`<circle cx="16" cy="16" r="12" fill="#ddd" stroke="#888"/><path d="M10 22c4-10 8-10 12 0" stroke="#e33" stroke-width="3" fill="none"/>`),
};
```

Rules:

- 32×32 viewBox, flat colors, a 1px darker stroke, readable at 32px on the desktop and 16px in the taskbar.
- If you use gradients, give them an `id="..."` and reference them with `url(#...)`; `icon()` rewrites ids per instance so copies do not clash.
- No external images, no `<script>`, no event attributes.

If you skip this step, `icon()` falls back to the `txt` icon.

## 2. Write the module `js/apps/<name>.js`

Each app module exports an open function that calls `openWindow` from `js/wm.js` and returns the window object:

```js
// Nero Burning ROM — burn a CD that never finishes.
import { openWindow, esc } from '../wm.js';
import { ding } from '../sound.js';

export function openNero() {
  return openWindow({
    id: 'nero',              // single-instance key; opening again focuses the existing window
    title: 'Nero Burning ROM',
    iconName: 'nero',        // key in js/icons.js
    width: 460, height: 340, // clamped to the desktop size; maximized automatically on phones
    // resizable: true, maximizable: true, single: true  (defaults)
    content: (body, win) => {
      body.innerHTML = `<div class="nero"><p data-s>Siap burn.</p><button class="btn">Burn!</button></div>`;
      const status = body.querySelector('[data-s]');
      body.querySelector('.btn').onclick = () => { status.textContent = 'Buffer underrun! CD jadi tatakan gelas.'; ding('error'); };
      const t = setInterval(() => {}, 1000);
      win.cleanup.push(() => clearInterval(t)); // always clean up timers/listeners on close
    },
  });
}
```

What `openWindow` gives you (see `js/wm.js`):

- `content(body, win)` is called once with the window body element and the window object.
- `win.setTitle(text)`, `win.close()`, `win.shake()` (used by BUZZ), and `win.cleanup` (array of functions run on close).
- `onClose()` may return `false` to cancel closing.
- `msgbox(title, html, { kind, buttons })` for classic dialogs; it resolves with the clicked label.
- `h(html)` turns a template string into an element; `esc(s)` escapes text.

Rules:

- **Escape everything** that is not a literal in your template: `esc(value)` or `textContent`. Never put data, user input or URLs into `innerHTML` unescaped.
- UI copy in **Indonesian**, warnet voice.
- No new dependencies. Use `js/sound.js` for audio (synthesized) and `js/state.js` for session data (`getUser()`, `session`).
- Use relative imports (`'../wm.js'`).
- App-specific styles go in `css/style.css`, scoped under a class unique to your app (`.nero ...`).

## 3. Register it in `APPS` in `js/main.js`

Add one line to the `APPS` object. The `run` function must lazy-load the module with `import()` so the app costs nothing until opened:

```js
nero: { name: 'Nero Burning ROM', icon: 'nero', run: async () => (await import('./apps/nero.js')).openNero() },
```

`launch(id)` handles the progress cursor and shows an Indonesian error box if `run` throws.

Then decide where it appears:

- **Desktop icon:** add `'nero'` to `DESKTOP_ICONS`.
- **Start menu:** add `${item('nero', 'optional subtitle')}` to the left or right column in `openStart()`.
- **Quick launch:** only for the most important apps; add a `data-app` button in the taskbar `.quick` block.
- **From other code:** `window.dispatchEvent(new CustomEvent('launch', { detail: 'nero' }))` opens it (used by folders in `misc.js`).

## 4. Add an e2e spec tagged `@app:<id>`

Every app has an end-to-end spec that opens it and drives its main interaction. Tag the test title with `@app:<id>` (the `APPS` key) so the gate can run and check it per app. Start the page at `#desktop` to skip the boot.

```js
// source: #123 (issue "Tambah Nero Burning ROM")
test('Nero opens from the desktop and fails the burn @app:nero', async ({ page }) => {
  await page.goto('./#desktop');                       // relative: works on / and /warnet/
  await page.getByRole('button', { name: 'Nero Burning ROM' }).dblclick();
  const win = page.getByRole('dialog', { name: 'Nero Burning ROM' });
  await win.getByRole('button', { name: 'Burn!' }).click();
  await expect(win).toContainText('Buffer underrun');
});
```

Requirements:

- A `// source:` comment above every test citing the requirement (issue number, README feature or maintainer request).
- Use relative URLs (`./#desktop`) so the spec passes on both the root `/` and subpath `/warnet/` layouts.
- Cover the close path too (cleanup runs without errors), and touch behaviour if your app does anything special on phones.
- Keep first-party coverage at 100%: every branch in your module must be exercised by some test.

## 5. Add it to the tests matrix

The gate checks that every `APPS` entry has at least one `@app:<id>` spec and runs each app on both layouts. Add your `<id>` to the app list in the tests matrix next to the existing ids (`browser`, `winamp`, `games`, `chat`, `ym`, `ranjau`, `ular`, ...). The gate fails if an `APPS` key is missing from the matrix or has no tagged spec.

## 6. Validate

```bash
npm run dev     # try it by hand at http://localhost:3000/#desktop (desktop + phone width)
npm run gate    # must pass; paste the output into the PR
```

Checklist before opening the PR:

- [ ] Icon renders at desktop and taskbar size.
- [ ] Opens via double-click (desktop) and single tap (touch), and from the Start menu if listed.
- [ ] Every rendered value is escaped.
- [ ] Timers and listeners are removed via `win.cleanup`.
- [ ] e2e spec tagged `@app:<id>` with a `// source:` comment; app id in the tests matrix.
- [ ] `npm run gate` green, output pasted in the PR, screenshot attached.
