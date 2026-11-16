/**
 * Functional end-to-end flows (npm run test:e2e runs this after smoke.mjs).
 * Each flow performs real actions in the web build and asserts on the
 * resulting data/behaviour, not just that a screen renders.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'tests/e2e/screenshots');
mkdirSync(SHOTS, { recursive: true });
const PORT = 8092;
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let f = join(DIST, p);
  if (!existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(PORT);
const BASE = `http://localhost:${PORT}`;

const results = [];
const errors = [];
let page;
const check = (name, cond, detail = '') => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};
const tid = (id) => page.getByTestId(id);
const prefix = (p) => page.locator(`[data-testid^="${p}"]`);
const go = async (path) => {
  await page.goto(BASE + path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
};
const fill = (id, v) => tid(id).first().fill(v);
const save = async () => {
  await tid('form-save').click();
  await page.waitForTimeout(250);
};
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date());
const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
const visibleText = (t) => page.getByText(t).last().isVisible();

async function flow(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(`${name} (completed without exception)`, false, String(e?.message ?? e).split('\n')[0]);
    try {
      await page.screenshot({ path: join(SHOTS, `flow-fail-${name.replace(/\W+/g, '-')}.png`) });
    } catch {}
  }
}

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Beirut', locale: 'en-GB', acceptDownloads: true });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

  await go('/');
  await tid('screen-onboarding').waitFor({ timeout: 20000 });
  await tid('onb-lang-en').click();
  await tid('onb-next').click();
  await tid('onb-next').click();
  await tid('onb-start').click();
  await tid('screen-home').waitFor();

  await flow('goals', async () => {
    await go('/records/goals/new');
    await fill('field-title', 'Finish term strong');
    await save();
    await go('/goals');
    await prefix('goal-').filter({ hasText: 'Finish term strong' }).first().click();
    await tid('screen-goal').waitFor();
    for (const m of ['Plan revision', 'Sit mock exam']) {
      await tid('add-milestone').click();
      await fill('field-title', m);
      await save();
    }
    await go('/goals');
    await prefix('goal-').filter({ hasText: 'Finish term strong' }).first().click();
    await prefix('milestone-').filter({ hasText: 'Plan revision' }).getByRole('button', { name: 'Done' }).click();
    check('goal progress is computed from milestones (1 of 2 = 50%)', (await tid('screen-goal').last().innerText()).includes('50% · 1 of 2 milestones'));
  });

  await flow('reminders', async () => {
    await go('/records/reminders/new');
    await fill('field-title', 'Call grandma');
    await save();
    await go('/notifications');
    const card = prefix('notif-').filter({ hasText: 'Call grandma' }).first();
    check('a due reminder appears in the notification centre', await card.isVisible());
    await card.getByRole('button', { name: 'Mark read' }).click();
    check('notification can be marked read', !(await card.getByRole('button', { name: 'Mark read' }).isVisible().catch(() => false)));
  });

  await flow('invoice + partial payment', async () => {
    await go('/business/finance');
    await tid('invoice-add').click();
    await fill('field-invoice_number', 'AUR-001');
    await fill('field-amount_minor', '100');
    await tid('field-status-sent').click();
    await save();
    await go('/business/finance');
    await prefix('invoice-').filter({ hasText: 'AUR-001' }).first().click();
    await tid('invoice-add-payment').click();
    await fill('field-amount_minor', '40');
    await save();
    const out = await tid('invoice-outstanding').last().innerText();
    check('outstanding = 100 − 40 = $60.00', out.includes('60.00'), out);
    await go('/business');
    check('receivables on the business overview reflect the payment', (await tid('bus-receivables').innerText()).includes('60.00'));
  });

  await flow('clients + interactions', async () => {
    await go('/records/clients/new');
    await fill('field-name', 'Rania Studio');
    await save();
    await go('/business/clients');
    await prefix('row-clients-').filter({ hasText: 'Rania Studio' }).first().click();
    await tid('screen-client').waitFor();
    await tid('add-client_interactions').click();
    await fill('field-summary', 'Sent the logo proposal');
    await save();
    check('interaction appears on the client timeline', await visibleText('Sent the logo proposal'));
  });

  await flow('pipeline', async () => {
    await go('/business/pipeline');
    await tid('deal-add').click();
    await fill('field-title', 'Website for Rania');
    await fill('field-value_minor', '500');
    await save();
    await go('/business/pipeline');
    const deal = prefix('deal-move-').first();
    await deal.click();
    await tid('select-option-won').click();
    await page.waitForTimeout(200);
    check('moving a deal updates the stage counts', await page.getByText('Won (1)').first().isVisible());
  });

  await flow('workout program', async () => {
    await go('/fitness/programs');
    await tid('program-add').click();
    await fill('field-name', 'Teen strength');
    await save();
    await go('/fitness/programs');
    const day = prefix('program-').filter({ has: page.locator('input') }).locator(`[data-testid$="-day-${weekday}"]`).first();
    const input = page.locator(`[data-testid$="-day-${weekday}"]`).first();
    void day;
    await input.fill('Push day');
    await input.blur();
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForLoadState('networkidle');
    check('program schedule persists after reload', (await page.locator(`[data-testid$="-day-${weekday}"]`).first().inputValue()) === 'Push day');
    await go('/fitness');
    check("fitness dashboard shows today's planned workout", await page.getByText('Push day').first().isVisible());
  });

  await flow('meal from food library', async () => {
    await go('/records/food_items/new');
    await fill('field-name', 'Labneh sandwich');
    await fill('field-calories', '300');
    await save();
    await go('/fitness/nutrition');
    await tid('meal-add').click();
    await tid('screen-meal').waitFor();
    await tid('meal-food').click();
    await prefix('select-option-').filter({ hasText: 'Labneh sandwich' }).first().click();
    await tid('meal-add-food').click();
    await page.waitForTimeout(200);
    check('meal total uses the food library values (~300 kcal)', (await tid('screen-meal').last().innerText()).includes('~300 kcal'));
  });

  await flow('routine run', async () => {
    await go('/records/routines/new');
    await fill('field-name', 'Morning');
    await save();
    await go('/habits');
    await prefix('routine-').filter({ hasText: 'Morning' }).first().click();
    await tid('screen-routine').waitFor();
    await tid('routine-add-step').click();
    await fill('field-title', 'Make bed');
    await save();
    await tid('routine-start').click();
    await prefix('step-').first().click();
    check('routine progress counts completed steps', (await tid('routine-progress').innerText()).includes('1 of 1'));
    await tid('routine-finish').click();
    await page.waitForTimeout(200);
    check('finished routine is recorded in history as completed', await page.getByText('Completed').first().isVisible());
  });

  await flow('study planner', async () => {
    await go('/academics/planner');
    await tid(`planner-add-${today}`).click();
    await fill('field-title', 'Revise chapter 3');
    await save();
    await go('/academics/planner');
    await prefix('session-done-').first().click();
    await page.waitForTimeout(200);
    check('a study session can be marked done', await prefix('session-').filter({ hasText: 'Completed' }).first().isVisible());
  });

  await flow('calendar + assistant', async () => {
    await go('/records/subjects/new');
    await fill('field-name', 'Physics');
    await save();
    await go('/records/exams/new');
    await fill('field-title', 'Physics midterm');
    await tid('field-subject_id').click();
    await prefix('select-option-').filter({ hasText: 'Physics' }).first().click();
    const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10);
    await fill('field-exam_at-date', tomorrow);
    await fill('field-exam_at-time', '09:00');
    await save();
    await go('/calendar');
    await tid('cal-mode-week').click();
    if (!(await page.getByText('Exam: Physics midterm').first().isVisible())) await tid('cal-next').click();
    check('calendar week view shows the exam from Academics', await page.getByText('Exam: Physics midterm').first().isVisible());
    await go('/assistant');
    check('assistant flags an exam with no study plan', await page.getByText('Physics midterm is in 2 days').first().isVisible());
    await prefix('ai-action-').first().click();
    await tid('confirm-ok').click();
    await go('/records/study_sessions');
    check('approving the suggestion creates a study session (only after confirmation)', await page.getByText('Physics midterm').first().isVisible());
  });

  await flow('prayer settings', async () => {
    await go('/deen');
    const before = await tid('prayer-fajr').innerText();
    await go('/settings/prayer');
    await page.getByLabel('Fajr', { exact: true }).fill('7');
    await tid('ps-save').click();
    await go('/deen');
    const after = await tid('prayer-fajr').innerText();
    const t = (s) => {
      const m = s.match(/(\d{1,2}):(\d{2})/);
      return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
    };
    check('a manual adjustment moves the displayed Fajr time by 7 minutes', t(after) - t(before) === 7, `${before.replace(/\n/g, ' ')} → ${after.replace(/\n/g, ' ')}`);
  });

  await flow('notification settings', async () => {
    await go('/settings/notifications');
    await tid('setn-weekly').click();
    await page.reload();
    await page.waitForLoadState('networkidle');
    check('weekly review preference persists', await tid('setn-weekly').locator('input').isChecked());
  });

  await flow('AI switch', async () => {
    await go('/settings/ai');
    await tid('ai-enabled').click();
    await go('/assistant');
    check('turning the assistant off hides insights', await page.getByText('The assistant is turned off').first().isVisible());
  });

  await flow('export', async () => {
    await go('/settings/data');
    const [dl] = await Promise.all([page.waitForEvent('download'), tid('data-export').click()]);
    const data = JSON.parse(readFileSync(await dl.path(), 'utf8'));
    check('export is a valid MIZAN JSON with schema version and records', data.format === 'mizan-export' && data.schema_version === 1 && data.records.goals.length === 1 && data.records.invoices.length === 1);
    check('export contains no local-only fields', !JSON.stringify(data).includes('_history') && !JSON.stringify(data).includes('_server_updated_at'));
  });

  await browser.close();
} catch (e) {
  check('flows ran', false, String(e?.stack ?? e).slice(0, 400));
} finally {
  server.close();
}
const relevant = errors.filter((e) => !/favicon|DevTools/.test(e));
check('no runtime errors in console', relevant.length === 0, relevant.slice(0, 5).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} flow checks passed`);
process.exit(failed.length ? 1 : 0);
