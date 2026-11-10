import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestoneFor, effectiveCount, nominationIssue, parseNominee } from '../../../scripts/bots/nominate.mjs';

// source: MAINTAINERS.md "Self-serve ladder" (3 merged PRs -> triage nomination, 10 -> maintainer nomination)
test('nominations fire at exactly 3 and 10 merged PRs', () => {
  assert.deepEqual([1, 2, 3, 4, 9, 10, 11].map(milestoneFor), [null, null, 'triage', null, null, 'maintainer', null]);
});

// source: MAINTAINERS.md "Self-serve ladder" (the just-merged PR must count even if search has not indexed it yet)
test('effective count includes the just-merged PR exactly once', () => {
  assert.equal(effectiveCount(2, [{ number: 1 }, { number: 2 }], 5), 3);
  assert.equal(effectiveCount(3, [{ number: 1 }, { number: 2 }, { number: 5 }], 5), 3);
});

// source: Kelvin request 2026-11-07 'open issue "Nominasi triager: @user" with label nomination' + MAINTAINERS.md (write access never automatic)
test('nomination issue has the expected title and a parseable marker', () => {
  const t = nominationIssue('budi-dev', 'triage', 'kelvindesman/warnet-nusantara');
  assert.equal(t.title, 'Nominasi triager: @budi-dev');
  assert.deepEqual(parseNominee(t.body), { login: 'budi-dev', role: 'triage' });
  assert.match(t.body, /https:\/\/github\.com\/kelvindesman\/warnet-nusantara\/blob\/HEAD\/MAINTAINERS\.md/);
  const m = nominationIssue('budi-dev', 'maintainer', 'o/r');
  assert.equal(m.title, 'Nominasi maintainer: @budi-dev');
  assert.match(m.body, /tidak pernah diberikan otomatis/);
});

// source: Kelvin request 2026-11-07 "never auto-grant without the label" (marker must be well-formed)
test('marker parsing rejects malformed logins and roles', () => {
  assert.equal(parseNominee('<!-- nominee:evil;rm role:triage -->'), null);
  assert.equal(parseNominee('<!-- nominee:-bad role:triage -->'), null);
  assert.equal(parseNominee('<!-- nominee:ok role:admin -->'), null);
  assert.equal(parseNominee('no marker'), null);
});
