// Ular HP — a snake game in the spirit of the brick-phone era.
import { openWindow } from '../wm.js';
import { ding } from '../sound.js';
import { t } from '../i18n.js';

const N = 20;
export function open() {
  return openWindow({
    id: 'ular', title: 'Ular HP', iconName: 'snake', width: 380, height: 470, maximizable: true,
    content: (body, win) => {
      body.innerHTML = `<div class="ular"><p data-s>${t('SKOR {score} · REKOR {best}', { score: 0, best: best() })}</p><canvas width="${N * 12}" height="${N * 12}"></canvas>
        <p data-m>${t('Tekan panah / WASD / swipe untuk mulai')}</p>
        <div class="pad"><button class="btn" data-d="L">◀</button><button class="btn" data-d="U">▲</button><button class="btn" data-d="D">▼</button><button class="btn" data-d="R">▶</button></div></div>`;
      const cv = body.querySelector('canvas'), c = cv.getContext('2d');
      const sEl = body.querySelector('[data-s]'), mEl = body.querySelector('[data-m]');
      let snake, dir, next, food, score, alive, loop, speed;
      const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
      const opp = { U: 'D', D: 'U', L: 'R', R: 'L' };
      function reset() { snake = [[8, 10], [7, 10], [6, 10]]; dir = next = 'R'; score = 0; alive = false; speed = 140; place(); draw(); }
      function place() { do { food = [(Math.random() * N) | 0, (Math.random() * N) | 0]; } while (snake.some(([x, y]) => x === food[0] && y === food[1])); }
      function start() { if (alive) return; alive = true; mEl.textContent = t('Jangan nabrak!'); tick(); }
      function tick() {
        dir = next;
        const [dx, dy] = DIRS[dir];
        const head = [(snake[0][0] + dx + N) % N, (snake[0][1] + dy + N) % N];
        if (snake.some(([x, y]) => x === head[0] && y === head[1])) return die();
        snake.unshift(head);
        if (head[0] === food[0] && head[1] === food[1]) { score += 9; place(); speed = Math.max(60, speed - 3); ding(); } else snake.pop();
        sEl.textContent = t('SKOR {score} · REKOR {best}', { score, best: best() });
        draw();
        loop = setTimeout(tick, speed);
      }
      function die() {
        alive = false; win.shake();
        if (score > best()) { try { localStorage.setItem('ular-best', score); } catch {} }
        mEl.textContent = t('GAME OVER! Skor {score}. Tekan arah untuk main lagi.', { score });
        reset(); mEl.textContent = t('GAME OVER! Tekan arah untuk main lagi.');
      }
      function draw() {
        c.fillStyle = '#8bac0f'; c.fillRect(0, 0, cv.width, cv.height);
        c.fillStyle = '#0f380f';
        for (const [x, y] of snake) c.fillRect(x * 12 + 1, y * 12 + 1, 10, 10);
        c.fillStyle = '#306230'; c.fillRect(food[0] * 12 + 3, food[1] * 12 + 3, 6, 6);
      }
      function turn(d) { if (d !== opp[dir]) next = d; start(); }
      const keys = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
      const onKey = (e) => { if (!win.el.classList.contains('inactive') && keys[e.key]) { e.preventDefault(); turn(keys[e.key]); } };
      window.addEventListener('keydown', onKey);
      body.querySelector('.pad').onclick = (e) => { const d = e.target.closest('[data-d]')?.dataset.d; if (d) turn(d); };
      let t0;
      cv.addEventListener('touchstart', (e) => { t0 = e.touches[0]; }, { passive: true });
      cv.addEventListener('touchend', (e) => {
        if (!t0) return; const t = e.changedTouches[0], dx = t.clientX - t0.clientX, dy = t.clientY - t0.clientY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
      });
      win.cleanup.push(() => { clearTimeout(loop); window.removeEventListener('keydown', onKey); });
      reset();
    },
  });
}
const best = () => { try { return +localStorage.getItem('ular-best') || 0; } catch { return 0; } };
