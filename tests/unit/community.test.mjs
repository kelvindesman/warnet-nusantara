// Unit tests for js/community.js (pure helpers).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import './browser-env.mjs';
import { TIERS, sortSupporters, tickerItems, creditLines, sponsorBanner, supportUrl, donateOptions, payFrame, issueUrl, CONTACT_KINDS, discordUrl } from '../../js/community.js';
import { readdirSync } from 'node:fs';

const REPO = 'https://github.com/kelvindesman/warnet-nusantara';
const LINKS = { repo: REPO, discord: '', donate: {} };
const S = [
  { name: 'A', tier: 'jam', date: '2026-01-01' },
  { name: 'B', tier: 'vip', date: '2026-02-01', message: 'mantap' },
  { name: 'C', tier: 'iklan', date: '2026-02-01', url: 'https://c.example' },
  { name: 'D', tier: 'nope', date: '2026-03-01' },
  { name: 'E', tier: 'malam', date: '2026-03-01', hidden: true },
  { name: '', tier: 'jam' },
  null,
];

// source: Kelvin request 2026-11-07 tier table (Paket 1 Jam / Paket Malam / Member VIP / Pasang Iklan)
test('TIERS has the four warnet-themed tiers with minimums', () => {
  assert.deepEqual(Object.keys(TIERS), ['jam', 'malam', 'vip', 'iklan']);
  assert.match(TIERS.jam.price, /Rp 5\.000\+ \/ \$3/);
});

// source: Kelvin request 2026-11-07 "show supporter name ... everywhere" (hidden/invalid entries excluded)
test('sortSupporters drops invalid/hidden and orders newest, then higher tier', () => {
  assert.deepEqual(sortSupporters(S).map((x) => x.name), ['C', 'B', 'A']);
});

// source: Kelvin request 2026-11-07 "message maybe running text"
test('tickerItems formats name, tier, message; invites when empty', () => {
  assert.deepEqual(tickerItems(S), ['★ Terima kasih C (Pasang Iklan) ★', '★ Terima kasih B (Member VIP): "mantap" ★', '★ Terima kasih A (Paket 1 Jam) ★']);
  assert.match(tickerItems([])[0], /Jadilah pendukung pertama/);
});

// source: Kelvin request 2026-11-07 (KONTRIBUTOR.txt grouped by tier)
test('creditLines groups by tier in tier order and includes messages', () => {
  assert.deepEqual(creditLines(S), ['[Paket 1 Jam]\n- A', '[Member VIP]\n- B — "mantap"', '[Pasang Iklan]\n- C']);
  assert.deepEqual(creditLines([]), []);
});

// source: Kelvin request 2026-11-07 "subtly softsell" (sponsor banner or invite)
test('sponsorBanner uses an https sponsor, else invites to advertise', () => {
  assert.deepEqual(sponsorBanner(S, LINKS), { title: 'C', sub: 'Sponsor Warnet Nusantara.Net', href: 'https://c.example', sponsor: true });
  const bad = [{ name: 'X', tier: 'iklan', date: '1', url: 'javascript:alert(1)', message: 'm' }];
  const inv = sponsorBanner(bad, LINKS);
  assert.equal(inv.sponsor, false);
  assert.equal(inv.href, `${REPO}#support-the-operator`);
  assert.equal(sponsorBanner([{ name: 'Y', tier: 'iklan', date: '1', url: 'https://y.example', message: 'Beli disket' }], LINKS).sub, 'Beli disket');
  assert.equal(supportUrl(LINKS), `${REPO}#support-the-operator`);
});

// source: Kelvin request 2026-11-07 "Saweria/Trakteer ... github sponsor and buymeacoffee"
test('donateOptions keeps order, accepts https only, null = segera hadir', () => {
  const o = donateOptions({ donate: { trakteer: 'https://trakteer.id/x', saweria: 'http://saweria.co/x', githubSponsors: 'javascript:1' } });
  assert.deepEqual(o.map((x) => [x.id, x.href]), [['trakteer', 'https://trakteer.id/x'], ['saweria', null], ['githubSponsors', null], ['buyMeACoffee', null]]);
  assert.equal(donateOptions({}).every((x) => x.href === null), true);
});

// source: Kelvin request 2026-11-08 "can this without leaving page?" + "opensource icon?" (answers: BMC in-window, Trakteer/Saweria popup, own icon per button)
test('payFrame frames only Buy Me a Coffee; every option carries its own icon', () => {
  assert.equal(payFrame('https://buymeacoffee.com/kelvindsmn'), 'https://www.buymeacoffee.com/widget/page/kelvindsmn?color=%23FFDD00');
  assert.equal(payFrame('https://www.buymeacoffee.com/a-b_c/'), 'https://www.buymeacoffee.com/widget/page/a-b_c?color=%23FFDD00');
  assert.equal(payFrame('https://trakteer.id/x'), null);
  assert.equal(payFrame('https://evil.example/buymeacoffee.com/x'), null);
  assert.equal(payFrame(null), null);
  const o = donateOptions({ donate: { trakteer: 'https://trakteer.id/x', buyMeACoffee: 'https://buymeacoffee.com/k' } });
  assert.deepEqual(o.map((x) => [x.id, x.icon, x.frame]), [['trakteer', 'qris', null], ['saweria', 'ewallet', null], ['githubSponsors', 'support', null], ['buyMeACoffee', 'coffee', 'https://www.buymeacoffee.com/widget/page/k?color=%23FFDD00']]);
});

// source: Kelvin request 2026-11-07 "inquiry from the web automatically create issue on the github repo"
test('issueUrl builds a prefilled issue-form URL', () => {
  const u = new URL(issueUrl(REPO, 'bug', { title: '[Bug] ', context: { app: 'ranjau', layar: '800x600' } }));
  assert.equal(u.pathname, '/kelvindesman/warnet-nusantara/issues/new');
  assert.equal(u.searchParams.get('template'), 'bug.yml');
  assert.equal(u.searchParams.get('labels'), 'from-web');
  assert.equal(u.searchParams.get('title'), '[Bug] ');
  assert.match(u.searchParams.get('body'), /- app: ranjau\n- layar: 800x600$/);
  const bare = new URL(issueUrl(REPO, 'kenangan'));
  assert.equal(bare.searchParams.has('title'), false);
  assert.equal(bare.searchParams.has('body'), false);
});

// source: .github/ISSUE_TEMPLATE (every contact kind must point at a real issue form)
test('every CONTACT_KINDS template exists in .github/ISSUE_TEMPLATE', () => {
  const forms = readdirSync('.github/ISSUE_TEMPLATE');
  for (const k of CONTACT_KINDS) assert.ok(forms.includes(`${k.template}.yml`), k.template);
});

// source: Kelvin request 2026-11-07 "add discord placeholder"
test('discordUrl returns https invite or null', () => {
  assert.equal(discordUrl({ discord: '' }), null);
  assert.equal(discordUrl({ discord: 'https://discord.gg/x' }), 'https://discord.gg/x');
  assert.equal(discordUrl({}), null);
});

// source: Kelvin request 2026-11-07 virality plan (share loops with UTM per network)
test('shareLinks builds 4 networks, each with UTM source/campaign', async () => {
  const { shareLinks } = await import('../../js/community.js');
  const s = shareLinks('Halo & "warnet"', 'https://w.example/', 'demo');
  assert.deepEqual(s.map((x) => x.id), ['whatsapp', 'x', 'threads', 'facebook']);
  for (const x of s) {
    const d = decodeURIComponent(x.href);
    assert.ok(d.includes(`utm_source=${x.id}`) && d.includes('utm_campaign=demo'), x.id);
  }
  assert.ok(decodeURIComponent(s[0].href).includes('Halo & "warnet"'));
});

// source: Kelvin request 2026-11-07 virality plan ("Gue main 47 menit di Warnet Nusantara, bayar Rp 3.000")
test('sessionBrag formats minutes and hours', async () => {
  const { sessionBrag } = await import('../../js/community.js');
  assert.match(sessionBrag(47 * 60, 'Rp 3.000'), /^Gue main 47 menit di Warnet Nusantara\.Net, bayar Rp 3\.000/);
  assert.match(sessionBrag(10, 'Rp 3.000'), /main 1 menit/);
  assert.match(sessionBrag(125 * 60, 'Rp 6.000'), /main 2 jam 5 menit/);
});
