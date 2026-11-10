import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildComment, sanitizeAiMarkdown } from '../../../scripts/bots/ai-comment.mjs';
import { forbiddenPaths } from '../../../scripts/bots/agent-patch.mjs';
import { BOT_RESTING } from '../../../scripts/bots/lib.mjs';

// source: Kelvin request 2026-11-07 "if a secret is missing or quota is hit, comment 'bot lagi istirahat, nunggu maintainer' and add label needs-human; never fail CI because of AI quota"
test('AI skipped, failed or empty -> resting comment + needs-human', () => {
  for (const outcome of ['skipped', 'failure', '', undefined]) {
    assert.deepEqual(buildComment({ outcome, output: 'x' }), { body: BOT_RESTING, labels: ['needs-human'] });
  }
  assert.deepEqual(buildComment({ outcome: 'success', output: '   ' }), { body: BOT_RESTING, labels: ['needs-human'] });
  const ok = buildComment({ outcome: 'success', output: 'Looks fine.', header: '**Review**' });
  assert.deepEqual(ok, { body: '**Review**\n\nLooks fine.', labels: [] });
});

// source: AGENTS.md security rules (bots must not be steerable into pinging or hiding content)
test('model output cannot ping people or hide HTML comments', () => {
  const s = sanitizeAiMarkdown('cc @octocat and @org/team <!-- hidden --> mail me@example.com');
  assert.match(s, /`@octocat`/);
  assert.match(s, /`@org\/team`/);
  assert.match(s, /me@example\.com/, 'emails are not mentions');
  assert.doesNotMatch(s, /hidden/);
});

// source: Kelvin request 2026-11-07 "gemini ... implement and open PR" + AGENTS.md security rules (no CI or secret changes by agents)
test('agent patches may not touch CI, bot scripts, tooling, baselines or licences', () => {
  assert.deepEqual(forbiddenPaths(['js/apps/chat.js', 'css/style.css', 'data/bookmarks.json', 'tests/e2e/chat.spec.mjs', 'home.html', 'docs/adding-an-app.md']), []);
  const bad = ['.github/workflows/gate.yml', 'scripts/bots/agent-patch.mjs', 'package.json', 'package-lock.json', 'playwright.config.mjs',
    'tests/coverage-baseline.json', 'LICENSE', 'AGENTS.md', '.env.local', 'id.pem', '.gemini/settings.json', '../outside.txt', '.claude/skills/x.md', '.gitignore'];
  assert.deepEqual(forbiddenPaths(bad), bad);
});
