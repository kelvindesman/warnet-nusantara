// The gate: the definition of done for every change.
//   npm run gate            -> typecheck (tsc --checkJs) + repo hygiene + e2e (chromium, both layouts) + coverage ratchet
//   npm run gate -- --full  -> full browser/device matrix (CI)
//   npm run gate -- --strict-> coverage must be 100% on every metric (required before going public)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const run = (cmd, argv, env = {}) => {
  console.log(`\n▶ ${cmd} ${argv.join(' ')}`);
  const r = spawnSync(cmd, argv, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`\n✖ GATE FAILED at: ${cmd} ${argv.join(' ')}`); process.exit(r.status || 1); }
};

run('npx', ['tsc', '-p', 'tsconfig.json']);
run('node', ['--test', 'tests/unit/**/*.test.mjs']);
run('npx', ['playwright', 'test'], args.has('--full') ? { FULL: '1' } : {});

const METRICS = ['lines', 'statements', 'functions', 'branches'];
const total = JSON.parse(readFileSync('coverage/e2e/coverage-summary.json', 'utf8')).total;
const basePath = 'tests/coverage-baseline.json';
const base = JSON.parse(readFileSync(basePath, 'utf8'));
let failed = false;
console.log('\nCoverage (first-party js/** + home.html):');
for (const m of METRICS) {
  const pct = total[m].pct;
  const floor = args.has('--strict') ? 100 : base[m];
  const ok = pct >= floor;
  if (!ok) failed = true;
  console.log(`  ${ok ? '✔' : '✖'} ${m.padEnd(10)} ${String(pct).padStart(6)}%  (floor ${floor}%, target 100%)`);
}
if (failed) { console.error('\n✖ GATE FAILED: coverage dropped below the floor.'); process.exit(1); }
// Ratchet: the floor only ever goes up.
const next = Object.fromEntries(METRICS.map((m) => [m, Math.max(base[m], Math.floor(total[m].pct * 100) / 100)]));
writeFileSync(basePath, JSON.stringify(next, null, 2) + '\n');
const all100 = METRICS.every((m) => total[m].pct === 100);
console.log(all100 ? '\n✔ GATE PASSED (coverage 100%)' : '\n✔ GATE PASSED (ratchet; coverage not yet 100% — required before public launch)');
