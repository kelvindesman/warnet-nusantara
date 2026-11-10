// Guards the public/private split: private paths must stay ignored and untracked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const REQUIRED_IGNORES = ['.ops/', '.env', '.env.*', '*.local.*', 'CLAUDE.local.md', '.claude/settings.local.json', '.claude/memory/', '.claude/plans/', '.claude/todos/', '.claude/worktrees/', '*.jsonl', '*.pem', '*.key', 'node_modules', 'coverage/', 'test-results/'];
const PRIVATE_PATH = /(^|\/)(\.ops\/|\.env($|\.)(?!example)|CLAUDE\.local\.md|settings\.local\.json|\.claude\/(memory|plans|todos|worktrees)\/)|\.(jsonl|pem|key)$/;
const LEAK = /\/Users\/[a-z]|kelvin2@|ghp_[A-Za-z0-9]{20,}|github_pat_|sk-ant-|AIza[0-9A-Za-z_-]{30,}/;

// source: Kelvin request 2026-11-07 "internal stuff credential sensitive ... ensure not publicly pushed only locally"
test('.gitignore keeps every private pattern', () => {
  const lines = readFileSync('.gitignore', 'utf8').split('\n').map((l) => l.trim());
  for (const p of REQUIRED_IGNORES) assert.ok(lines.includes(p), `.gitignore is missing ${p}`);
});

// source: Kelvin request 2026-11-07 (same as above)
test('no private paths are tracked by git', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
  const bad = files.filter((f) => PRIVATE_PATH.test(f));
  assert.deepEqual(bad, []);
});

// source: Kelvin request 2026-11-07 (same as above)
test('tracked text files contain no local paths, personal email or tokens', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
    .filter((f) => f && !/^LICENSE$|\.(png|gif|jpg|ico|woff2?)$/.test(f) && f !== 'tests/unit/repo-hygiene.test.mjs');
  const hits = [];
  for (const f of files) {
    let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
    if (LEAK.test(text)) hits.push(f);
  }
  assert.deepEqual(hits, []);
});
