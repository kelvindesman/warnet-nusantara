// Supporters, sponsors, donation and contact links. Pure functions (no DOM), so
// they are unit tested directly and reused by the desktop, the portal and the IRC bots.
// Supporter names and messages are user content and are never translated.
import { t } from './i18n.js';

export const TIERS = {
  jam: { label: t('Paket 1 Jam'), price: 'Rp 5.000+ / $3' },
  malam: { label: t('Paket Malam'), price: t('Rp 25.000+ / $10 / $5 per bulan') },
  vip: { label: t('Member VIP'), price: t('Rp 100.000+ / $20 per bulan') },
  iklan: { label: t('Pasang Iklan'), price: t('Rp 500.000+ per bulan / $50+ per bulan') },
};
const RANK = { iklan: 0, vip: 1, malam: 2, jam: 3 };

/** Newest first, then higher tier first. Unknown tiers are dropped. */
export function sortSupporters(list) {
  return list
    .filter((s) => s && s.name && TIERS[s.tier] && !s.hidden)
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || RANK[a.tier] - RANK[b.tier]);
}

/** Lines for the 2000s running-text ticker. Plain text: callers set textContent. */
export function tickerItems(list) {
  const s = sortSupporters(list);
  if (!s.length) return [t('★ Warnet ini hidup dari patungan. Jadilah pendukung pertama: menu Start → Dukung Warnet Ini ★')];
  return s.map((x) => t('★ Terima kasih {name} ({tier}){msg} ★', { name: x.name, tier: TIERS[x.tier].label, msg: x.message ? `: "${x.message}"` : '' }));
}

/** "Registered to" names for the About box and KONTRIBUTOR.txt. */
export function creditLines(list) {
  const s = sortSupporters(list);
  return Object.keys(TIERS)
    .map((t) => [t, s.filter((x) => x.tier === t)])
    .filter(([, xs]) => xs.length)
    .map(([t, xs]) => `[${TIERS[t].label}]\n${xs.map((x) => `- ${x.name}${x.message ? ` — "${x.message}"` : ''}`).join('\n')}`);
}

const https = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u);

/** Banner on the portal: a paying sponsor if any, otherwise the "pasang iklan" invite. */
export function sponsorBanner(list, links) {
  const sp = sortSupporters(list).find((x) => x.tier === 'iklan' && https(x.url));
  if (sp) return { title: sp.name, sub: sp.message || t('Sponsor Warnet Nusantara.Net'), href: sp.url, sponsor: true };
  return { title: t('PASANG IKLAN DI SINI!'), sub: t('Hub. mas operator · banner 468×60 · dukung warnet ini'), href: supportUrl(links), sponsor: false };
}

/** Where "support the operator" points when no donation platform is configured yet. */
export const supportUrl = (links) => `${links.repo}#support-the-operator`;

/** Buy Me a Coffee's own widget page allows framing, so its checkout can open inside a warnet window.
 *  Trakteer and Saweria forbid framing (frame-ancestors / X-Frame-Options), so they get null. */
export function payFrame(href) {
  const m = /^https:\/\/(?:www\.)?buymeacoffee\.com\/([\w-]+)\/?$/.exec(href || '');
  return m ? `https://www.buymeacoffee.com/widget/page/${m[1]}?color=%23FFDD00` : null;
}

/** Donation buttons, in display order. href null = "segera hadir" (not configured yet).
 *  icon is one of our own generic icons (no platform logos); frame is set when it can open in-window. */
export function donateOptions(links) {
  const d = links.donate || {};
  return [
    { id: 'trakteer', label: 'Trakteer', icon: 'qris', note: t('QRIS, e-wallet, transfer bank'), href: d.trakteer || null },
    { id: 'saweria', label: 'Saweria', icon: 'ewallet', note: 'QRIS, GoPay, OVO, DANA', href: d.saweria || null },
    { id: 'githubSponsors', label: 'GitHub Sponsors', icon: 'support', note: t('International, monthly'), href: d.githubSponsors || null },
    { id: 'buyMeACoffee', label: 'Buy Me a Coffee', icon: 'coffee', note: t('International, one-off'), href: d.buyMeACoffee || null },
  ].map((o) => { const href = https(o.href) ? o.href : null; return { ...o, href, frame: payFrame(href) }; });
}

/** Prefilled GitHub issue form URL: no backend, no token, GitHub handles accounts. */
export function issueUrl(repo, template, { title = '', context = {} } = {}) {
  const q = new URLSearchParams({ template: `${template}.yml`, labels: 'from-web' });
  if (title) q.set('title', title);
  const ctx = Object.entries(context).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  if (ctx) q.set('body', `\n\n---\n${t('Info otomatis dari warnet:')}\n${ctx}`);
  return `${repo}/issues/new?${q}`;
}

/** The "Hubungi Operator" choices. */
export const CONTACT_KINDS = [
  { id: 'bug', label: t('Lapor bug'), template: 'bug', title: '[Bug] ' },
  { id: 'situs', label: t('Usul situs jadul'), template: 'usul-situs', title: '[Situs] ' },
  { id: 'game', label: t('Usul game'), template: 'usul-game', title: '[Game] ' },
  { id: 'kenangan', label: t('Cerita kenangan warnet'), template: 'kenangan', title: '[Kenangan] ' },
  { id: 'kerjasama', label: t('Kerja sama / sponsor'), template: 'kerja-sama', title: '[Kerja sama] ' },
];

/** Discord invite or null while the server does not exist yet. */
export const discordUrl = (links) => (https(links.discord) ? links.discord : null);

/** Share buttons. Each URL carries UTM tags so GoatCounter can tell which network worked. */
export function shareLinks(text, site, campaign) {
  const tagged = (src) => `${site}?utm_source=${src}&utm_medium=share&utm_campaign=${encodeURIComponent(campaign)}`;
  const enc = encodeURIComponent;
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${tagged('whatsapp')}`)}` },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(tagged('x'))}` },
    { id: 'threads', label: 'Threads', href: `https://www.threads.net/intent/post?text=${enc(`${text} ${tagged('threads')}`)}` },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(tagged('facebook'))}` },
  ];
}

/** "Gue main 47 menit di Warnet Nusantara, bayar Rp 3.000" — the Log Off brag line. */
export function sessionBrag(seconds, priceText) {
  const m = Math.max(1, Math.round(seconds / 60));
  const dur = m >= 60 ? t('{h} jam {m} menit', { h: Math.floor(m / 60), m: m % 60 }) : t('{m} menit', { m });
  return t('Gue main {dur} di Warnet Nusantara.Net, bayar {price} 😂 Masih ingat billing lumba-lumba?', { dur, price: priceText });
}
