// Unit tests for js/params.js (pure helpers; no DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';

// params.js imports sound.js, which only touches window lazily; stub enough for import.
globalThis.window ??= {};
const { seeded, parseParams, pickEra, ERA_IDS } = await import('../../js/params.js');

// source: Kelvin request 2026-11-07 deterministic "?seed" switch for tests and agents
test('seeded() is deterministic and stays in [0, 1)', () => {
  const a = seeded(42), b = seeded(42);
  const xs = Array.from({ length: 1000 }, a);
  assert.deepEqual(xs.slice(0, 5), Array.from({ length: 5 }, b));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notEqual(seeded(1)(), seeded(2)());
});

// source: Kelvin request 2026-11-07 "?seed" and "?nosound" switches
test('parseParams() reads seed and nosound, rejects non-numeric seeds', () => {
  const base = { seed: null, nosound: false, demo: false, speed: 1 };
  assert.deepEqual(parseParams('?seed=7&nosound'), { ...base, seed: 7, nosound: true });
  assert.deepEqual(parseParams(''), base);
  assert.deepEqual(parseParams('?seed=abc'), base);
  assert.deepEqual(parseParams('?seed=-1'), base);
});

// source: Kelvin request 2026-11-07 "quick killer attractive demo" (?demo, test speed-up)
test('parseParams() reads demo and clamps speed to (0, 20]', () => {
  assert.equal(parseParams('?demo').demo, true);
  assert.equal(parseParams('?speed=10').speed, 10);
  assert.equal(parseParams('?speed=0').speed, 1);
  assert.equal(parseParams('?speed=99').speed, 1);
  assert.equal(parseParams('?speed=x').speed, 1);
});

// source: Kelvin request 2026-11-08 "support multiple eras the current xp and abit before modern internet era until 2012,2013,2014,2015 windows 7 windows 10"
test('pickEra() takes ?era=, then the saved pick, else 2003; unknown eras are ignored', () => {
  assert.equal(pickEra('?era=2011', '2015'), '2011');
  assert.equal(pickEra('', '2015'), '2015');
  assert.equal(pickEra('?era=1999', '2011'), '2011');
  assert.equal(pickEra('?era=1999', 'x'), '2003');
  assert.equal(pickEra('', null), '2003');
  assert.deepEqual(ERA_IDS, ['2003', '2011', '2015']);
});
