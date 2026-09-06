#!/usr/bin/env node
// Runs every suite. Requires the dev server on :8899 for the browser suites.
import { spawn } from 'node:child_process';

const suites = [
  ['API acceptance (Part 2 §58, Part 3 §67-83)', 'tests/run.mjs'],
  ['Storefront audit (links, a11y, SEO, responsive)', 'tests/audit.mjs'],
  ['E2E customizer + cart (Part 3 §67, §71-73)', 'tests/e2e-customizer.mjs'],
  ['E2E checkout + confirmation (Part 2 §23-34)', 'tests/e2e-checkout.mjs'],
  ['E2E admin dashboard (Part 3 §5-9, §16, §78)', 'tests/e2e-admin.mjs'],
];

const run = (file) => new Promise((res) => {
  const p = spawn('node', [file], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { out += d; });
  p.on('close', (code) => res({ code, out }));
});

let failed = 0;
for (const [name, file] of suites) {
  process.stdout.write(`\n▸ ${name}\n`);
  const { code, out } = await run(file);
  const summary = out.split('\n').filter((l) => /passed|no issues|ISSUES|FAIL/.test(l)).slice(-4);
  console.log(summary.map((l) => '   ' + l.trim()).join('\n') || '   (no output)');
  if (code !== 0) { failed++; console.log('   ✗ suite failed'); }
}

console.log('\n' + '='.repeat(56));
console.log(failed ? `  ${failed} suite(s) FAILED` : '  ALL SUITES PASSED');
console.log('='.repeat(56));
process.exit(failed ? 1 : 0);
