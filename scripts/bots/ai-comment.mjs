// Posts an AI result (Gemini review / agent status) as an issue or PR comment, or the
// "bot lagi istirahat" fallback with label needs-human when the AI was skipped or failed.
//   AI_OUTCOME=success|failure|skipped AI_OUTPUT=... TARGET_NUMBER=12 HEADER="..." node scripts/bots/ai-comment.mjs
import { pathToFileURL } from 'node:url';
import { github, BOT_RESTING } from './lib.mjs';

export const MAX_BODY = 60000;

/** Neutralize mentions (no pings from model output) and cap length. */
export function sanitizeAiMarkdown(text) {
  return String(text ?? '')
    .replace(/(^|[^\w`])@([A-Za-z0-9][A-Za-z0-9-]{0,38}(?:\/[A-Za-z0-9_.-]+)?)/g, '$1`@$2`')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, MAX_BODY)
    .trim();
}

/** Pure: what to post. */
export function buildComment({ outcome, output, header }) {
  const text = sanitizeAiMarkdown(output);
  if (outcome !== 'success' || !text) return { body: BOT_RESTING, labels: ['needs-human'] };
  return { body: `${header ? `${header}\n\n` : ''}${text}`, labels: [] };
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const n = Number(process.env.TARGET_NUMBER);
  const c = buildComment({ outcome: process.env.AI_OUTCOME, output: process.env.AI_OUTPUT, header: process.env.HEADER });
  const gh = github();
  await gh.post(`/repos/${repo}/issues/${n}/comments`, { body: c.body });
  if (c.labels.length) await gh.post(`/repos/${repo}/issues/${n}/labels`, { labels: c.labels });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
