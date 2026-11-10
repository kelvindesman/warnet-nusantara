// Shared helpers for the repo bots in scripts/bots/. No dependencies: Node 22 built-ins only.
// Everything that touches untrusted text (issue bodies, supporter names, AI output) goes
// through the pure functions here so it can be unit-tested in tests/unit/bots/.
import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

export const BOT_RESTING = 'bot lagi istirahat, nunggu maintainer';

/** Remove HTML tags, URLs, control chars and markdown link/mention syntax; collapse whitespace. */
export function stripUnsafe(text) {
  return String(text ?? '')
    .replace(/<[^>]*>?/g, ' ')                       // HTML tags (also unterminated ones)
    .replace(/\b(?:https?|ftp|javascript|data):\/*[^\s]*/gi, ' ') // URLs and pseudo-URLs
    .replace(/\bwww\.[^\s]+/gi, ' ')
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|id|io|co|xyz|me|info|biz|ly|gg|link|site|online|top|click|ru|cn)\b(?:\/\S*)?/gi, ' ') // bare domains
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ')
    .replace(/[`*_~[\]()<>|\\#]/g, '')               // markdown control characters
    .replace(/@(?=[A-Za-z0-9])/g, '')                 // no pings
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut to `max` characters on a code-point boundary, adding an ellipsis when shortened. */
export function cap(text, max) {
  const chars = Array.from(String(text ?? ''));
  return chars.length <= max ? chars.join('') : chars.slice(0, Math.max(0, max - 1)).join('').trimEnd() + '…';
}

/** Write a step output safely (multi-line aware, random delimiter so content cannot close it). */
export function setOutput(name, value, file = process.env.GITHUB_OUTPUT) {
  const v = String(value ?? '');
  if (!file) { console.log(`[output] ${name}=${v}`); return; }
  const delim = `EOF_${randomBytes(8).toString('hex')}`;
  appendFileSync(file, `${name}<<${delim}\n${v}\n${delim}\n`);
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

/** Minimal GitHub REST client using fetch. Token comes from env, never from arguments on a command line. */
export function github({ token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN, api = process.env.GITHUB_API_URL || 'https://api.github.com', fetchImpl = globalThis.fetch } = {}) {
  async function call(method, path, body) {
    const res = await fetchImpl(path.startsWith('http') ? path : `${api}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'warnet-bots',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) { const err = new Error(`GitHub ${method} ${path} -> ${res.status}: ${data?.message ?? ''}`); err.status = res.status; throw err; }
    return data;
  }
  return {
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b),
    put: (p, b) => call('PUT', p, b),
    patch: (p, b) => call('PATCH', p, b),
    graphql: (query, variables) => call('POST', '/graphql', { query, variables }),
  };
}

/** Parse a GitHub issue-form body ("### Label\n\nvalue" sections) into { label: value }. */
export function parseIssueForm(body) {
  const out = {};
  const text = String(body ?? '').replace(/\r\n?/g, '\n');
  const parts = text.split(/^###[ \t]+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = (nl === -1 ? part : part.slice(0, nl)).trim();
    let value = nl === -1 ? '' : part.slice(nl + 1).trim();
    if (value === '_No response_') value = '';
    if (label && !(label in out)) out[label] = value;
  }
  return out;
}
