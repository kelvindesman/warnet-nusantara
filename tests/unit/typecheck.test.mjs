// The type check is part of the gate: tsc --checkJs over every first-party module.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// source: Kelvin request 2026-11-08 "Next: eras (2003 / 2011 / 2015), then the JSDoc + tsc --checkJs check. now"
test('gate runs tsc with checkJs over js/**', () => {
  const cfg = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  assert.equal(cfg.compilerOptions.checkJs, true);
  assert.equal(cfg.compilerOptions.noEmit, true);
  assert.ok(cfg.include.includes('js/**/*.js'));
  assert.match(readFileSync('scripts/gate.mjs', 'utf8'), /run\('npx', \['tsc', '-p', 'tsconfig\.json'\]\)/);
});
