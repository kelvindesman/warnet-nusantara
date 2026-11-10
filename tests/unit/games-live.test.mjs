// Verdict logic of the live playability sweep (scripts/games-live.mjs). The sweep
// itself needs the network and runs outside the gate; its classifier must not drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, frameable } from '../../scripts/games-live.mjs';

const ok = { status: 200, headers: {}, canvas: 1, iframe: 0, text: '' };

// source: Kelvin request 2026-11-08 "ensure all game is web ready palyable active and can be loaded in brwoser anything that not playable should have note and less priority"
test('frameable: X-Frame-Options and CSP frame-ancestors block framing, a wildcard allows it', () => {
  assert.equal(frameable({}), true);
  assert.equal(frameable({ 'x-frame-options': 'DENY' }), false);
  assert.equal(frameable({ 'x-frame-options': 'SAMEORIGIN' }), false);
  assert.equal(frameable({ 'content-security-policy': "default-src 'self'; frame-ancestors 'self'" }), false);
  assert.equal(frameable({ 'content-security-policy': 'frame-ancestors *' }), true);
  assert.equal(frameable({ 'content-security-policy': "default-src 'self'" }), true);
});

// source: Kelvin request 2026-11-08 "ensure all game is web ready palyable active and can be loaded in brwoser anything that not playable should have note and less priority"
test('classify: network errors, HTTP errors, missing IA items, unframeable embeds and dead pages fail; a canvas passes', () => {
  const embed = { mode: 'embed' }, fan = { mode: 'fanport' };
  assert.equal(classify(fan, ok).ok, true);
  assert.match(classify(fan, { error: 'net::ERR_NAME_NOT_RESOLVED' }).why, /ERR_NAME_NOT_RESOLVED/);
  assert.match(classify(fan, { ...ok, status: 404 }).why, /404/);
  assert.equal(classify(embed, { ...ok, ia: { exists: false } }).ok, false);
  assert.equal(classify(embed, { ...ok, ia: { exists: true, emulated: false } }).ok, false);
  assert.equal(classify(embed, { ...ok, ia: { exists: true, emulated: true }, headers: { 'x-frame-options': 'DENY' } }).ok, true); // IA embeds are judged by IA metadata
  assert.match(classify(embed, { ...ok, headers: { 'x-frame-options': 'DENY' } }).why, /menolak/);
  assert.equal(classify(fan, { ...ok, headers: { 'x-frame-options': 'DENY' } }).ok, true); // fan ports open in a new tab
  assert.equal(classify(fan, { ...ok, canvas: 0, text: 'This domain is for sale' }).ok, false);
  assert.equal(classify(fan, { ...ok, canvas: 0, iframe: 1, text: '404' }).ok, true);
  assert.equal(classify(fan, { ...ok, canvas: 0, text: 'Click to start' }).why, 'halaman termuat');
});
