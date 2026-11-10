// Guards the patch produced by the Gemini agent (gemini.yml) before it may become a PR.
//   node scripts/bots/agent-patch.mjs check <changed-files.txt>
// Exits 0 and prints "ok" when every path is allowed; prints the forbidden paths and exits 3 otherwise.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// The agent may touch site code, content, docs and e2e specs. Never CI, bot scripts, tooling
// config, the coverage baseline, licensing files or agent/editor settings.
export const FORBIDDEN = [
  /^\.github\//, /^scripts\//, /^\.gemini/, /^\.claude\//, /^\.ops\//, /^node_modules\//,
  /^package(-lock)?\.json$/, /^playwright\.config\.mjs$/, /^tests\/coverage-baseline\.json$/, /^tests\/serve\.mjs$/,
  /^\.gitignore$/, /^\.gitattributes$/, /^\.nojekyll$/, /^CNAME$/, /^vercel\.json$/,
  /^LICENSE/, /^CLA\.md$/, /^COMMERCIAL\.md$/, /^TRADEMARK\.md$/, /^SECURITY\.md$/, /^MAINTAINERS\.md$/,
  /^(AGENTS|GEMINI|CLAUDE)\.md$/, /(^|\/)\.env/, /\.(pem|key|jsonl)$/,
];

export function forbiddenPaths(files) {
  return files.map((f) => f.trim()).filter(Boolean).filter((f) => f.includes('..') || f.startsWith('/') || FORBIDDEN.some((re) => re.test(f)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, file] = process.argv.slice(2);
  if (cmd !== 'check' || !file) { console.error('usage: agent-patch.mjs check <changed-files.txt>'); process.exit(2); }
  const bad = forbiddenPaths(readFileSync(file, 'utf8').split('\n'));
  if (bad.length) { console.log(bad.join('\n')); process.exit(3); }
  console.log('ok');
}
