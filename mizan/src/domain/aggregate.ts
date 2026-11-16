/**
 * Cross-domain read models: calendar agenda, local insights, search and
 * export. Pure functions over a `Lists` accessor so they are testable and
 * never duplicate source records (blueprint 09 §10).
 */
import { isAssignmentOverdue, workloadByDay } from './academics';
import { invoiceBalance } from './business';
import { LocalDate, addDays, daysBetween, localDateOf, startOfWeek, weekdayOf } from './dates';
import { dayPrayerSummary } from './deen';
import { completedThisWeek, habitDayStatus, isScheduledOn } from './habits';
import { PrayerCalcSettings, PrayerType, computePrayerTimes } from './prayerTimes';
import { SCHEMAS } from './schema';
import { COLLECTIONS, CollectionMap, CollectionName, Domain } from './types';

export type Lists = <C extends CollectionName>(c: C) => CollectionMap[C][];

// ------------------------------------------------------------------ agenda
export interface AgendaItem {
  key: string;
  domain: Domain;
  /** i18n key + params; or literal title */
  labelKey?: string;
  labelParams?: Record<string, string>;
  title?: string;
  start: string | null; // null = all-day
  end?: string | null;
  source?: { collection: CollectionName; id: string };
  prayer?: PrayerType;
  done?: boolean;
  conflict?: boolean;
}

export interface AgendaOptions {
  timeZone: string;
  prayer: PrayerCalcSettings | null;
  domains?: Domain[];
}

export function agendaForDay(list: Lists, date: LocalDate, opts: AgendaOptions): AgendaItem[] {
  const tz = opts.timeZone;
  const on = (iso: string | null | undefined) => !!iso && localDateOf(iso, tz) === date;
  const items: AgendaItem[] = [];

  if (opts.prayer) {
    const pt = computePrayerTimes(date, opts.prayer);
    const summary = dayPrayerSummary(list('prayer_logs'), date);
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerType[]) {
      items.push({
        key: `prayer:${date}:${p}`,
        domain: 'deen',
        labelKey: 'cal.prayerTime',
        labelParams: { prayer: `opt.prayer.${p}` },
        start: pt.times[p],
        prayer: p,
        done: summary.statuses[p] === 'performed',
      });
    }
  }
  for (const e of list('calendar_events')) {
    const startDay = localDateOf(e.starts_at, tz);
    const endDay = e.ends_at ? localDateOf(e.ends_at, tz) : startDay;
    if (date < startDay || date > endDay) continue;
    items.push({
      key: `event:${e.id}`,
      domain: e.domain,
      title: e.title,
      start: e.all_day ? null : e.starts_at,
      end: e.all_day ? null : e.ends_at,
      source: { collection: 'calendar_events', id: e.id },
    });
  }
  for (const t of list('tasks')) {
    if (!on(t.due_at) || t.status === 'archived') continue;
    items.push({ key: `task:${t.id}`, domain: t.domain, title: t.title, start: t.due_at ?? null, source: { collection: 'tasks', id: t.id }, done: t.status === 'completed' });
  }
  const subjects = new Map(list('subjects').map((s) => [s.id, s.name]));
  for (const a of list('assignments')) {
    if (!on(a.due_at)) continue;
    items.push({ key: `asg:${a.id}`, domain: 'academics', labelKey: 'cal.homework', labelParams: { name: a.title }, start: a.due_at, source: { collection: 'assignments', id: a.id }, done: a.status === 'completed' });
  }
  for (const x of list('exams')) {
    if (!on(x.exam_at)) continue;
    items.push({ key: `exam:${x.id}`, domain: 'academics', labelKey: 'cal.exam', labelParams: { name: `${x.title}${subjects.get(x.subject_id) ? ' · ' + subjects.get(x.subject_id) : ''}` }, start: x.exam_at, source: { collection: 'exams', id: x.id } });
  }
  for (const s of list('study_sessions')) {
    if (s.planned_date !== date) continue;
    items.push({ key: `study:${s.id}`, domain: 'academics', labelKey: 'cal.study', labelParams: { name: s.title }, start: null, source: { collection: 'study_sessions', id: s.id }, done: s.status === 'completed' });
  }
  const workoutsToday = list('workouts').filter((w) => on(w.started_at));
  for (const w of workoutsToday) {
    items.push({ key: `workout:${w.id}`, domain: 'fitness', labelKey: 'cal.workoutPlan', labelParams: { name: w.title }, start: w.started_at, end: w.ended_at, source: { collection: 'workouts', id: w.id }, done: w.status === 'completed' });
  }
  if (workoutsToday.length === 0) {
    const program = list('workout_programs').find((p) => p.is_active);
    const label = program?.schedule_json?.[String(weekdayOf(date))];
    if (program && label) items.push({ key: `plan:${program.id}:${date}`, domain: 'fitness', labelKey: 'cal.workoutPlan', labelParams: { name: label }, start: null, source: { collection: 'workout_programs', id: program.id } });
  }
  const habitLogs = list('habit_logs');
  for (const h of list('habits')) {
    if (!isScheduledOn(h, date) || h.schedule_type === 'times_per_week') continue;
    items.push({ key: `habit:${h.id}:${date}`, domain: 'habits', labelKey: 'cal.habit', labelParams: { name: h.name }, start: null, source: { collection: 'habits', id: h.id }, done: habitDayStatus(h, habitLogs, date) === 'completed' });
  }
  for (const c of list('clients')) {
    if (c.follow_up_on !== date) continue;
    items.push({ key: `client:${c.id}`, domain: 'business', labelKey: 'cal.followUp', labelParams: { name: c.name }, start: null, source: { collection: 'clients', id: c.id } });
  }
  for (const d of list('deals')) {
    if (d.follow_up_on !== date || d.stage === 'won' || d.stage === 'lost') continue;
    items.push({ key: `deal:${d.id}`, domain: 'business', labelKey: 'cal.followUp', labelParams: { name: d.title }, start: null, source: { collection: 'deals', id: d.id } });
  }
  const payments = list('invoice_payments');
  for (const inv of list('invoices')) {
    if (inv.due_on !== date || inv.status !== 'sent') continue;
    if (invoiceBalance(inv, payments, date).outstanding <= 0) continue;
    items.push({ key: `inv:${inv.id}`, domain: 'business', labelKey: 'cal.invoiceDue', labelParams: { name: inv.invoice_number }, start: null, source: { collection: 'invoices', id: inv.id } });
  }
  for (const r of list('reminders')) {
    if (!on(r.scheduled_at) || r.status !== 'active') continue;
    items.push({ key: `rem:${r.id}`, domain: r.domain, title: r.title, start: r.scheduled_at, source: { collection: 'reminders', id: r.id } });
  }
  for (const g of list('goals')) {
    if (g.target_date !== date) continue;
    items.push({ key: `goal:${g.id}`, domain: g.domain, title: g.title, start: null, source: { collection: 'goals', id: g.id }, done: g.status === 'completed' });
  }

  let out = opts.domains ? items.filter((i) => opts.domains!.includes(i.domain) || i.domain === 'general') : items;
  // Conflict detection between items that have an explicit end.
  const timed = out.filter((i) => i.start && i.end);
  for (const a of timed) {
    for (const b of timed) {
      if (a === b) continue;
      if (a.start! < b.end! && b.start! < a.end!) a.conflict = true;
    }
  }
  out = out.sort((a, b) => {
    if (!a.start && b.start) return -1;
    if (a.start && !b.start) return 1;
    return (a.start ?? '').localeCompare(b.start ?? '');
  });
  return out;
}

// ---------------------------------------------------------------- insights
export interface Insight {
  id: string;
  domain: Domain;
  key: string;
  params: Record<string, string | number>;
  sourceKey: string;
  confidence: 'high' | 'medium' | 'low';
  /** optional in-app route the user can open; never an automatic action */
  route?: string;
}

export interface InsightContext {
  today: LocalDate;
  now: Date;
  timeZone: string;
  weekStart: number;
  allowedDomains: Domain[];
}

/**
 * Deterministic, on-device insights. Each states its data source. Nothing
 * here changes data — insights only point to screens the user can open.
 */
export function generateInsights(list: Lists, ctx: InsightContext): Insight[] {
  const out: Insight[] = [];
  const allow = (d: Domain) => ctx.allowedDomains.includes(d);

  if (allow('deen')) {
    const s = dayPrayerSummary(list('prayer_logs'), ctx.today);
    const recorded = s.performed + s.missed + s.excused;
    if (recorded > 0 && s.notRecorded > 0)
      out.push({ id: 'prayers-today', domain: 'deen', key: 'ins.prayersToday', params: { n: recorded, remaining: s.notRecorded }, sourceKey: 'ins.src.prayers', confidence: 'high', route: '/deen' });
  }
  if (allow('academics')) {
    const assignments = list('assignments');
    const overdue = assignments.filter((a) => isAssignmentOverdue(a, ctx.now)).length;
    if (overdue > 0) out.push({ id: 'overdue-hw', domain: 'academics', key: 'ins.overdueHomework', params: { n: overdue }, sourceKey: 'ins.src.assignments', confidence: 'high', route: '/academics' });
    const heavy = workloadByDay(assignments, ctx.today, 7, ctx.timeZone).find((d) => d.minutes >= 180);
    if (heavy) out.push({ id: `heavy-${heavy.date}`, domain: 'academics', key: 'ins.heavyDay', params: { date: heavy.date, minutes: heavy.minutes }, sourceKey: 'ins.src.assignments', confidence: 'medium', route: '/academics/planner' });
    const sessions = list('study_sessions');
    for (const ex of list('exams')) {
      const d = localDateOf(ex.exam_at, ctx.timeZone);
      const days = daysBetween(ctx.today, d);
      if (days < 1 || days > 7) continue;
      const planned = sessions.some((s) => s.exam_id === ex.id && s.planned_date >= ctx.today && s.planned_date <= d);
      if (!planned) out.push({ id: `exam-${ex.id}`, domain: 'academics', key: 'ins.examSoon', params: { name: ex.title, days }, sourceKey: 'ins.src.exams', confidence: 'low', route: '/academics/planner' });
    }
  }
  if (allow('business')) {
    const due = list('clients').filter((c) => c.follow_up_on && c.follow_up_on <= ctx.today).length +
      list('deals').filter((d) => d.follow_up_on && d.follow_up_on <= ctx.today && d.stage !== 'won' && d.stage !== 'lost').length;
    if (due > 0) out.push({ id: 'followups', domain: 'business', key: 'ins.followUps', params: { n: due }, sourceKey: 'ins.src.clients', confidence: 'high', route: '/business' });
    const payments = list('invoice_payments');
    const overdueInv = list('invoices').filter((i) => invoiceBalance(i, payments, ctx.today).status === 'overdue').length;
    if (overdueInv > 0) out.push({ id: 'overdue-inv', domain: 'business', key: 'ins.overdueInvoices', params: { n: overdueInv }, sourceKey: 'ins.src.invoices', confidence: 'high', route: '/business/finance' });
  }
  if (allow('habits')) {
    const logs = list('habit_logs');
    const ws = startOfWeek(ctx.today, ctx.weekStart);
    const n = logs.filter((l) => l.status === 'completed' && l.local_date >= ws && l.local_date <= ctx.today).length;
    if (n > 0) out.push({ id: 'habit-week', domain: 'habits', key: 'ins.habitWeek', params: { n }, sourceKey: 'ins.src.habits', confidence: 'high', route: '/habits' });
    void completedThisWeek;
  }
  if (allow('fitness')) {
    const workouts = list('workouts');
    if (workouts.length > 0) {
      const since = addDays(ctx.today, -7);
      const recent = workouts.some((w) => localDateOf(w.started_at, ctx.timeZone) >= since && w.status === 'completed');
      if (!recent) out.push({ id: 'no-workout', domain: 'fitness', key: 'ins.noWorkoutWeek', params: {}, sourceKey: 'ins.src.workouts', confidence: 'medium', route: '/fitness' });
    }
  }
  return out;
}

// ------------------------------------------------------------------ search
export interface SearchResult {
  collection: CollectionName;
  id: string;
  title: string;
  field: string;
  domain: Domain;
}

const SEARCHABLE: CollectionName[] = COLLECTIONS.filter(
  (c) => !['audit_logs', 'workout_sets', 'routine_step_logs', 'routine_logs', 'notifications', 'prayer_logs', 'perfect_day_results', 'perfect_day_definitions', 'body_photos'].includes(c),
);

export function searchRecords(list: Lists, query: string, domainOf: (c: CollectionName) => Domain, filter?: Domain[], limit = 50): SearchResult[] {
  const q = query.trim().toLocaleLowerCase();
  if (q.length < 2) return [];
  const out: SearchResult[] = [];
  for (const c of SEARCHABLE) {
    const domain = domainOf(c);
    if (filter && filter.length > 0 && !filter.includes(domain)) continue;
    const schema = SCHEMAS[c];
    const textFields = schema.fields.filter((f) => f.type === 'text' || f.type === 'multiline').map((f) => f.name);
    for (const row of list(c) as unknown as Record<string, unknown>[]) {
      const hit = textFields.find((f) => typeof row[f] === 'string' && (row[f] as string).toLocaleLowerCase().includes(q));
      if (!hit) continue;
      const title = String(row[schema.titleField] ?? '');
      out.push({ collection: c, id: row.id as string, title, field: hit, domain });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ------------------------------------------------------------------ export
export const EXPORT_SCHEMA_VERSION = 1;

export function buildExport(list: Lists, meta: { timeZone: string; locale: string; appVersion: string; exportedAt: string }) {
  const records: Record<string, unknown[]> = {};
  for (const c of COLLECTIONS) {
    records[c] = (list(c) as unknown as Record<string, unknown>[]).map((r) => {
      const copy: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) if (!k.startsWith('_')) copy[k] = v;
      return copy;
    });
  }
  return {
    format: 'mizan-export',
    schema_version: EXPORT_SCHEMA_VERSION,
    app_version: meta.appVersion,
    exported_at: meta.exportedAt,
    timezone: meta.timeZone,
    locale: meta.locale,
    conventions: {
      instants: 'ISO-8601 UTC',
      local_dates: 'YYYY-MM-DD in the timezone above',
      money: 'integer minor units; USD = cents, LBP = whole pounds; never converted',
      units: { weight: 'kg', length: 'cm', volume: 'ml', duration: 'minutes', load: 'see load_unit per set' },
      not_recorded: 'absence of a record means not recorded — not missed',
    },
    records,
  };
}
