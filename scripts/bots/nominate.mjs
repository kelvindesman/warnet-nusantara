// Self-serve contributor ladder (MAINTAINERS.md), used by nominate.yml.
//   node scripts/bots/nominate.mjs count    on PR merged: at exactly 3 merged PRs open a triager
//                                           nomination, at exactly 10 a maintainer nomination
//   node scripts/bots/nominate.mjs approve  on `approved` label by an admin: add the nominee to the
//                                           org team (needs ORG_ADMIN_TOKEN; skips with a comment)
// Nothing is ever granted without the owner's `approved` label.
import { pathToFileURL } from 'node:url';
import { github } from './lib.mjs';

export const LADDER = { 3: 'triage', 10: 'maintainer' };
export const ROLE_TITLE = { triage: 'triager', maintainer: 'maintainer' };
export const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

export const milestoneFor = (count) => LADDER[count] ?? null;

/** Search results can lag behind the merge: count the just-merged PR even if not indexed yet. */
export function effectiveCount(total, items, prNumber) {
  return items.some((i) => i.number === prNumber) ? total : total + 1;
}

export function nominationIssue(login, role, repo) {
  const title = `Nominasi ${ROLE_TITLE[role]}: @${login}`;
  const body = [
    `<!-- nominee:${login} role:${role} -->`,
    `Selamat @${login}! Kamu sudah punya **${role === 'triage' ? 3 : 10} PR yang di-merge** di warnet ini.`,
    '',
    role === 'triage'
      ? 'Mau jadi **triager**? Triager memberi label issue, menutup duplikat, menjaga Discussions dan ikut review PR konten (`data/**`).'
      : 'Mau jadi **maintainer**? Maintainer review dan merge PR setelah gate lulus, membuat rilis, dan ikut menentukan roadmap.',
    '',
    '1. Kalau mau, balas di issue ini untuk menerima nominasi.',
    '2. Owner menyetujui dengan memberi label `approved`.',
    role === 'triage'
      ? '3. Bot mengirim undangan ke tim triage; terima undangannya dari email/notifikasi GitHub.'
      : '3. Owner memberi akses tulis secara manual (akses tulis tidak pernah diberikan otomatis).',
    '',
    `Detail: [MAINTAINERS.md](https://github.com/${repo}/blob/HEAD/MAINTAINERS.md). Tidak berminat? Tutup saja issue ini, tidak apa-apa.`,
  ].join('\n');
  return { title, body };
}

/** Read the bot marker from the nomination issue body. */
export function parseNominee(body) {
  const m = String(body ?? '').match(/<!-- nominee:([^\s]+) role:(triage|maintainer) -->/);
  if (!m || !LOGIN.test(m[1])) return null;
  return { login: m[1], role: m[2] };
}

async function count(gh, env) {
  const repo = env.GITHUB_REPOSITORY;
  const login = env.PR_AUTHOR;
  if (!LOGIN.test(login || '') || env.AUTHOR_TYPE === 'Bot' || env.AUTHOR_ASSOCIATION === 'OWNER') { console.log('skip: bot, owner or invalid login'); return; }
  const q = encodeURIComponent(`repo:${repo} is:pr is:merged author:${login}`);
  const res = await gh.get(`/search/issues?q=${q}&per_page=100`);
  const n = effectiveCount(res.total_count, res.items, Number(env.PR_NUMBER));
  const role = milestoneFor(n);
  console.log(`${login}: ${n} merged PRs -> ${role ?? 'no nomination'}`);
  if (!role) return;
  const { title, body } = nominationIssue(login, role, repo);
  const dupQ = encodeURIComponent(`repo:${repo} is:issue label:nomination in:title "${title}"`);
  const dup = await gh.get(`/search/issues?q=${dupQ}`);
  if (dup.items.some((i) => i.title === title)) { console.log('nomination already exists'); return; }
  await gh.post(`/repos/${repo}/issues`, { title, body, labels: ['nomination'] });
}

async function approve(gh, env) {
  const repo = env.GITHUB_REPOSITORY;
  const issue = Number(env.ISSUE_NUMBER);
  const comment = (body) => gh.post(`/repos/${repo}/issues/${issue}/comments`, { body });
  const perm = await gh.get(`/repos/${repo}/collaborators/${encodeURIComponent(env.SENDER)}/permission`).catch(() => null);
  if (perm?.role_name !== 'admin') { await comment('Label `approved` pada nominasi hanya berlaku kalau dipasang owner. Tidak ada akses yang diberikan.'); return; }
  const nominee = parseNominee(env.ISSUE_BODY);
  if (nominee && env.ISSUE_TITLE !== nominationIssue(nominee.login, nominee.role, repo).title) {
    await comment('Judul dan data nominasi tidak cocok (issue mungkin diedit). Owner perlu menambahkan anggota secara manual.'); return;
  }
  if (!nominee) { await comment('Bot tidak menemukan data nominasi di issue ini. Owner perlu menambahkan anggota secara manual.'); return; }
  const team = nominee.role === 'triage' ? (env.TRIAGE_TEAM || 'triage') : env.MAINTAINER_TEAM;
  if (!team) { await comment(`Disetujui! Owner: beri @${nominee.login} akses tulis secara manual (Settings -> Collaborators and teams), lalu tambahkan ke MAINTAINERS.md.`); return; }
  if (!env.ORG_ADMIN_TOKEN) { await comment(`Disetujui, tapi secret \`ORG_ADMIN_TOKEN\` belum diset, jadi bot tidak bisa menambahkan @${nominee.login} ke tim \`${team}\`. Owner perlu menambahkannya manual.`); return; }
  const admin = github({ token: env.ORG_ADMIN_TOKEN });
  try {
    await admin.put(`/orgs/${env.GITHUB_REPOSITORY_OWNER}/teams/${encodeURIComponent(team)}/memberships/${nominee.login}`, { role: 'member' });
    await comment(`Undangan ke tim \`${team}\` sudah dikirim ke @${nominee.login}. Selamat datang di shift operator! Jangan lupa tambahkan dirimu ke MAINTAINERS.md lewat PR.`);
  } catch (e) {
    await comment(`Gagal menambahkan @${nominee.login} ke tim \`${team}\` (HTTP ${e.status ?? '?'}). Owner perlu cek token/tim lalu menambahkan manual.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  const gh = github();
  if (cmd === 'count') await count(gh, process.env);
  else if (cmd === 'approve') await approve(gh, process.env);
  else { console.error('usage: nominate.mjs count|approve'); process.exit(2); }
}
