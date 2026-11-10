// Weekly digest issue (digest.yml).
//   node scripts/bots/digest.mjs collect <out.md>  gather last week's activity into Markdown
//   node scripts/bots/digest.mjs post <in.md>      open "Digest mingguan <date>" (+ optional AI summary)
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { github, stripUnsafe, cap, BOT_RESTING } from './lib.mjs';

/** Paths owned by the project owner in CODEOWNERS (code and CI). */
export const SENSITIVE = /^(js|css)\/|\.html$|^\.github\//;
export const isSensitive = (files) => files.some((f) => SENSITIVE.test(f));

// Titles are untrusted: inline code renders them literally (no mentions, links or HTML).
const code = (s) => `\`${cap(String(s ?? '').replace(/[`\r\n]/g, ' '), 100)}\``;
const line = (i) => `- #${i.number} ${code(i.title)} (${stripUnsafe(i.user?.login ?? 'ghost')})`;

export function renderDigest({ date, merged, sensitive, nominations, staleCount }) {
  const section = (title, rows, empty) => [`### ${title}`, '', ...(rows.length ? rows.map(line) : [`_${empty}_`]), ''];
  return [
    `Rangkuman minggu sampai ${date}.`,
    '',
    ...section(`PR yang di-merge (${merged.length})`, merged, 'Belum ada yang di-merge minggu ini.'),
    ...section(`PR terbuka yang butuh review CODEOWNERS: js/, css/, *.html, .github/ (${sensitive.length})`, sensitive, 'Tidak ada.'),
    ...section(`Nominasi terbuka (${nominations.length})`, nominations, 'Tidak ada.'),
    `### Stale`,
    '',
    `${staleCount} issue/PR berlabel \`stale\`.`,
  ].join('\n');
}

export function withSummary(digest, aiOutcome, aiText) {
  const summary = cap(stripUnsafe(aiText), 600);
  const head = aiOutcome === 'success' && summary ? `> **Ringkasan (Gemini):** ${summary}` : `> _Ringkasan AI: ${BOT_RESTING}._`;
  return `${head}\n\n${digest}`;
}

async function search(gh, q) {
  return gh.get(`/search/issues?q=${encodeURIComponent(q)}&per_page=100`);
}

async function collect(gh, repo, now = new Date()) {
  const since = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);
  const merged = (await search(gh, `repo:${repo} is:pr is:merged merged:>=${since}`)).items;
  const open = await gh.get(`/repos/${repo}/pulls?state=open&per_page=100`);
  const sensitive = [];
  for (const pr of open) {
    const files = await gh.get(`/repos/${repo}/pulls/${pr.number}/files?per_page=100`);
    if (isSensitive(files.map((f) => f.filename))) sensitive.push(pr);
  }
  const nominations = (await search(gh, `repo:${repo} is:issue is:open label:nomination`)).items;
  const staleCount = (await search(gh, `repo:${repo} is:open label:stale`)).total_count;
  return renderDigest({ date: now.toISOString().slice(0, 10), merged, sensitive, nominations, staleCount });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, file] = process.argv.slice(2);
  const repo = process.env.GITHUB_REPOSITORY;
  const gh = github();
  if (cmd === 'collect') writeFileSync(file, await collect(gh, repo));
  else if (cmd === 'post') {
    const body = withSummary(readFileSync(file, 'utf8'), process.env.AI_OUTCOME, process.env.AI_OUTPUT);
    await gh.post(`/repos/${repo}/issues`, { title: `Digest mingguan ${new Date().toISOString().slice(0, 10)}`, body });
  } else { console.error('usage: digest.mjs collect|post <file>'); process.exit(2); }
}
