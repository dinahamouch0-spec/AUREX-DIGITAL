/**
 * End-to-end smoke test of the exported web build (npm run test:e2e).
 * Drives real user flows in Chromium at iPhone size and asserts on
 * behaviour, persistence across reloads, RTL/LTR, console errors and
 * untranslated keys. Screenshots go to tests/e2e/screenshots/.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Uses the project's playwright if installed, otherwise the machine's global one.
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'tests/e2e/screenshots');
mkdirSync(SHOTS, { recursive: true });
const PORT = 8091;
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let f = join(DIST, p);
  if (!existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html'); // SPA fallback
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(PORT);

const BASE = `http://localhost:${PORT}`;
const results = [];
const errors = [];
let page;

function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const tid = (id) => page.getByTestId(id);
async function go(path) {
  await page.goto(BASE + path);
  await page.waitForLoadState('networkidle');
}
async function fill(id, value) {
  await tid(id).first().fill(value);
}
async function shot(name) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });
}
const KEY_LEAK = /\b(?:opt|field|common|home|deen|fit|ac|bus|hab|set|setn|sync|notif|ai|ins|an|cal|goals|col|domain|data|diag|about|onb|state|error|qa|int|lim|ps|auth|toast|confirm|weekday|search|tab|nav|sec)\.[a-zA-Z_]+(?:\.[a-zA-Z_]+)?\b/;
async function noKeyLeak(label) {
  const text = await page.locator('body').innerText();
  const m = text.match(KEY_LEAK);
  check(`no untranslated keys: ${label}`, !m, m ? m[0] : '');
}

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Beirut', locale: 'ar-LB' });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });

  // ---- Onboarding (Arabic default, RTL)
  await go('/');
  await tid('screen-onboarding').waitFor({ timeout: 20000 });
  check('first launch shows onboarding', true);
  check('Arabic is RTL', (await page.evaluate(() => document.documentElement.dir)) === 'rtl');
  await shot('01-onboarding-ar');
  await noKeyLeak('onboarding');
  await tid('onb-next').click();
  await fill('onb-name', 'دينا');
  await tid('onb-next').click();
  await tid('onb-start').click();
  await tid('screen-home').waitFor();
  check('onboarding completes to home', true);
  check('greeting uses the name', (await tid('home-greeting').innerText()).includes('دينا'));
  await shot('02-home-ar');
  await noKeyLeak('home ar');

  // ---- DEEN: independent prayers, not-recorded default, persistence
  await go('/deen');
  await tid('screen-deen').waitFor();
  check('deen starts with 0/5 recorded', (await tid('deen-count').innerText()).includes('0'));
  await tid('prayer-dhuhr').click();
  await tid('prayer-asr').click();
  const countText = await tid('deen-count').innerText();
  check('two prayers recorded independently', countText.includes('2'), countText);
  await tid('prayer-more-asr').click();
  await tid('select-option-not_recorded').click();
  check('clearing one prayer leaves the other', (await tid('deen-count').innerText()).includes('1'));
  await shot('03-deen-ar');
  await noKeyLeak('deen');
  await page.reload();
  await tid('screen-deen').waitFor();
  check('prayer record persists after reload', (await tid('deen-count').innerText()).includes('1'));
  await go('/deen/tasbih');
  for (let i = 0; i < 33; i++) await tid('tasbih-tap').click();
  check('tasbih counts taps', (await tid('tasbih-count').innerText()).includes('33'));
  await tid('tasbih-save').click();
  await go('/records/adhkar_logs');
  check('tasbih saved to adhkar history', (await page.locator('[data-testid^="row-adhkar_logs-"]').count()) === 1);
  await go('/deen/history');
  await noKeyLeak('deen history');

  // ---- Switch to English (LTR) without losing data
  await go('/settings');
  await tid('set-lang-en').click();
  check('English is LTR', (await page.evaluate(() => document.documentElement.dir)) === 'ltr');
  await go('/deen');
  check('data kept after language switch', (await tid('deen-count').innerText()).includes('1'));
  await shot('04-deen-en');

  // ---- Generic form validation + save
  await go('/records/tasks/new');
  await tid('form-save').click();
  check('empty required field shows validation error', await page.getByText('This field is required').first().isVisible());
  await fill('field-title', 'Prepare AUREX proposal');
  await tid('form-save').click();
  await page.waitForTimeout(300);
  await go('/records/tasks');
  check('task saved and listed', await page.getByText('Prepare AUREX proposal').first().isVisible());

  // ---- HABITS: create + one-tap check-in + detail
  await go('/records/habits/new');
  await fill('field-name', 'Read 10 pages');
  await tid('form-save').click();
  await go('/habits');
  const habitRow = page.locator('[data-testid^="habit-"]').filter({ hasText: 'Read 10 pages' }).first();
  await habitRow.click();
  check('habit one-tap marks done', (await habitRow.innerText()).includes('Done'));
  await shot('05-habits-en');
  await noKeyLeak('habits');

  // ---- ACADEMICS: subject + grades → transparent average
  await go('/records/subjects/new');
  await fill('field-name', 'Mathematics');
  await tid('form-save').click();
  await go('/academics');
  await page.locator('[data-testid^="subject-"]').filter({ hasText: 'Mathematics' }).first().click();
  await tid('screen-subject').waitFor();
  for (const [title, score, max] of [['Quiz 1', '16', '20'], ['Quiz 2', '9', '10']]) {
    await tid('subject-add-grade').click();
    await fill('field-title', title);
    await fill('field-score', score);
    await fill('field-max_score', max);
    await tid('form-save').click();
    await tid('screen-subject').waitFor();
  }
  const avg = await tid('subject-average').innerText();
  check('subject average = 85% (simple mean of 80% and 90%)', avg.includes('85'), avg);
  check('average method disclosed', await tid('screen-subject').getByText('Simple average (no weights entered)').last().isVisible());
  await shot('06-subject-en');
  await noKeyLeak('subject');

  // ---- BUSINESS: USD + LBP kept separate, decimal-safe
  await go('/records/transactions/new');
  await fill('field-amount_minor', '12.50');
  await fill('field-occurred_on', new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date()));
  await tid('form-save').click();
  await go('/records/transactions/new');
  await tid('field-currency-LBP').click();
  await fill('field-amount_minor', '12.5');
  await tid('form-save').click();
  check('LBP rejects decimals instead of rounding', await page.getByText('Too many decimal places for this currency').first().isVisible());
  await fill('field-amount_minor', '900000');
  await fill('field-occurred_on', new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date()));
  await tid('form-save').click();
  await go('/business');
  const cash = await tid('bus-cash').innerText();
  check('cash received shows USD 12.50 and LBP separately', cash.includes('12.50') && /900,000/.test(cash), cash.replace(/\n/g, ' '));
  await shot('07-business-en');
  await noKeyLeak('business');

  // ---- FITNESS: live workout logging
  await go('/fitness/workout/active');
  await tid('workout-start').click();
  await tid('screen-workout').waitFor();
  await tid('workout-exercise').click();
  await tid('select-option-builtin:push_up').click();
  await fill('set-reps', '12');
  await tid('set-add').click();
  check('set logged in live workout', (await page.locator('[data-testid^="set-"]').filter({ hasText: '12' }).count()) >= 1);
  await tid('workout-finish').click();
  await page.waitForTimeout(300);
  check('workout finished', await page.getByText('Completed').first().isVisible());
  await go('/fitness');
  await tid('water-250').click();
  check('quick water add', (await tid('fit-water').innerText()).includes('250'));
  await shot('08-fitness-en');
  await noKeyLeak('fitness');

  // ---- Undo after delete
  await go('/records/tasks');
  await page.getByText('Prepare AUREX proposal').click();
  await tid('form-delete').click();
  await tid('confirm-ok').click();
  await tid('toast-action').click();
  await go('/records/tasks');
  check('undo restores a deleted record', await page.getByText('Prepare AUREX proposal').first().isVisible());

  // ---- Theme switch
  await go('/settings');
  await tid('set-theme-light').click();
  await shot('09-settings-light');
  await tid('set-theme-dark').click();

  // ---- Visit every screen: renders, no crash, no key leaks
  const routes = ['/', '/calendar', '/analytics', '/goals', '/sections', '/search', '/notifications', '/assistant', '/settings', '/settings/prayer', '/settings/notifications', '/settings/ai', '/settings/sync', '/settings/data', '/settings/diagnostics', '/settings/about', '/settings/integrations', '/auth', '/deen', '/deen/history', '/deen/tasbih', '/fitness', '/fitness/body', '/fitness/nutrition', '/fitness/workout/active', '/fitness/exercises', '/fitness/programs', '/fitness/recovery', '/fitness/analytics', '/academics', '/academics/planner', '/business', '/business/clients', '/business/pipeline', '/business/finance', '/habits', '/records/goals', '/records/reminders', '/records/calendar_events'];
  for (const r of routes) {
    await go(r);
    await page.waitForTimeout(150);
    const hasScreen = (await page.locator('[data-testid^="screen-"]').count()) > 0;
    check(`renders ${r}`, hasScreen);
    await noKeyLeak(r);
  }
  await go('/calendar');
  await tid('cal-mode-month').click();
  await shot('10-calendar-month-en');
  await go('/analytics');
  await shot('11-analytics-en');

  // ---- Arabic pass over every screen
  await go('/settings');
  await tid('set-lang-ar').click();
  for (const r of routes) {
    await go(r);
    await page.waitForTimeout(100);
    await noKeyLeak(`ar ${r}`);
  }
  await go('/');
  await shot('12-home-ar-data');
  await go('/business');
  await shot('13-business-ar');

  // ---- Search
  await go('/search');
  await fill('search-input', 'Mathem');
  check('search finds records across domains', (await page.locator('[data-testid^="search-result-"]').count()) >= 1);

  // ---- Wipe local data
  await go('/settings/data');
  await tid('data-wipe').click();
  await fill('confirm-input', 'DELETE');
  await tid('confirm-ok').click();
  await tid('screen-onboarding').waitFor();
  check('delete-all wipes data and returns to onboarding', true);

  await browser.close();
} catch (e) {
  check('e2e run completed without exceptions', false, String(e?.stack ?? e).slice(0, 600));
  try {
    await shot('zz-failure');
  } catch {}
} finally {
  server.close();
}

const relevantErrors = errors.filter((e) => !/favicon|DevTools/.test(e));
check('no runtime errors in console', relevantErrors.length === 0, relevantErrors.slice(0, 5).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
