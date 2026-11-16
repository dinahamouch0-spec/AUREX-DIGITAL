/**
 * Perfect Days & streaks.
 *
 * A day is "perfect" when every APPLICABLE criterion the user chose is met.
 * Rules (owner spec):
 * - Only criteria the user selected count; nothing is imposed by default.
 * - Inactive / archived / paused items, and items not scheduled that day
 *   (rest days, weekly-target habits, no planned session) are not applicable.
 * - A day with no applicable criterion is a neutral "rest" day; a day the user
 *   marked in advance as rest/holiday is "exempt". Neither breaks a streak.
 * - Until a day is sealed (04:00 the next morning) it is "pending", never
 *   failed. After sealing, the result is written once and never changes.
 * - Sealing evaluates records as they were at seal time: anything created or
 *   edited after the seal can't change a closed day (no fake streaks).
 * - Prayers can be one criterion but never the only one (the definition must
 *   include at least one non-DEEN criterion); no score is ever produced.
 */
import { LocalDate, addDays, dateRange, endOfMonth, localDateOf, startOfMonth, weekdayOf, zonedToUtc } from './dates';
import { dayPrayerSummary } from './deen';
import { isScheduledOn, latestLog } from './habits';
import type {
  CollectionMap,
  CollectionName,
  PerfectCriterion,
  PerfectDayDefinition,
  PerfectDayResult,
  SealedDayStatus,
} from './types';

export type Lists = <C extends CollectionName>(c: C) => CollectionMap[C][];
export type DayStatus = SealedDayStatus | 'pending' | 'not_tracked';

/** Local time on the next day at which a day closes. */
export const SEAL_GRACE = '04:00';
/** Reference zone: a day never closes before 04:00 Beirut time (mirrors public.perfect_day_seal_due). */
export const SEAL_REFERENCE_TZ = 'Asia/Beirut';

/**
 * When `date` closes: 04:00 on the next day in the user's zone, but never
 * earlier than 04:00 Beirut time (so changing the timezone can't close a day
 * early). Must stay identical to the SQL function public.perfect_day_seal_due.
 */
export function sealTime(date: LocalDate, timeZone: string): Date {
  const next = addDays(date, 1);
  const own = zonedToUtc(next, SEAL_GRACE, timeZone).getTime();
  const ref = zonedToUtc(next, SEAL_GRACE, SEAL_REFERENCE_TZ).getTime();
  return new Date(Math.max(own, ref));
}

export function criterionKey(c: PerfectCriterion): string {
  return 'ref_id' in c ? `${c.type}:${c.ref_id}` : c.type;
}

// ---------------------------------------------------------- definition
export type DefinitionError = 'empty' | 'deen_only' | 'duplicate';

export function validateDefinition(criteria: PerfectCriterion[]): DefinitionError | null {
  if (criteria.length === 0) return 'empty';
  const keys = criteria.map(criterionKey);
  if (new Set(keys).size !== keys.length) return 'duplicate';
  if (criteria.every((c) => c.type === 'prayers')) return 'deen_only';
  return null;
}

/** Definition in force on `date`: latest effective_from ≤ date (ties → newest). */
export function definitionFor(defs: PerfectDayDefinition[], date: LocalDate): PerfectDayDefinition | undefined {
  let best: PerfectDayDefinition | undefined;
  for (const d of defs) {
    if (d.deleted_at || d.effective_from > date) continue;
    if (!best || d.effective_from > best.effective_from || (d.effective_from === best.effective_from && d.created_at > best.created_at)) best = d;
  }
  return best;
}

// ---------------------------------------------------------- evaluation
export interface CriterionResult {
  criterion: PerfectCriterion;
  applicable: boolean;
  met: boolean;
  /** e.g. "2/3" for multi-item criteria */
  progress?: { done: number; total: number };
}

export interface DayEvaluation {
  date: LocalDate;
  definition: PerfectDayDefinition | null;
  results: CriterionResult[];
  applicable: number;
  met: number;
  exempt: boolean;
  /** status if the day were judged now with these records */
  status: 'perfect' | 'unmet' | 'rest' | 'exempt' | 'not_tracked';
}

/**
 * Evaluate one day. With `asOf`, only records created and last edited at or
 * before `asOf` are considered (used when sealing).
 */
export function evaluateDay(list: Lists, date: LocalDate, timeZone: string, asOf?: Date): DayEvaluation {
  const cut = asOf?.toISOString();
  const createdBy = <T extends { created_at: string }>(r: T) => !cut || r.created_at <= cut;
  const stable = <T extends { created_at: string; updated_at: string }>(r: T) => !cut || (r.created_at <= cut && r.updated_at <= cut);

  const def = definitionFor(list('perfect_day_definitions').filter(createdBy), date) ?? null;
  const base = { date, definition: def, results: [] as CriterionResult[], applicable: 0, met: 0 };
  if (!def) return { ...base, exempt: false, status: 'not_tracked' };

  // Exemptions must be created on or before the day itself (no retroactive excuses).
  const exempt = list('day_exemptions').some((e) => e.local_date === date && createdBy(e) && localDateOf(e.created_at, timeZone) <= date);

  const habits = list('habits');
  const habitLogs = list('habit_logs').filter(stable);
  const routines = list('routines');
  const routineLogs = list('routine_logs').filter(stable);
  const onDay = (iso: string | null | undefined) => !!iso && localDateOf(iso, timeZone) === date;

  const results: CriterionResult[] = def.criteria.map((c): CriterionResult => {
    switch (c.type) {
      case 'habit': {
        const h = habits.find((x) => x.id === c.ref_id);
        // archived / paused / deleted habits and weekly-target habits never count against a day
        if (!h || h.status !== 'active' || h.schedule_type === 'times_per_week' || !isScheduledOn(h, date)) return { criterion: c, applicable: false, met: false };
        return { criterion: c, applicable: true, met: latestLog(habitLogs, h.id, date)?.status === 'completed' };
      }
      case 'routine': {
        const r = routines.find((x) => x.id === c.ref_id);
        if (!r || r.status !== 'active') return { criterion: c, applicable: false, met: false };
        return { criterion: c, applicable: true, met: routineLogs.some((l) => l.routine_id === r.id && l.local_date === date && l.status === 'completed') };
      }
      case 'prayers': {
        const s = dayPrayerSummary(list('prayer_logs').filter(stable), date);
        const done = s.performed + s.excused;
        return { criterion: c, applicable: true, met: done === 5, progress: { done, total: 5 } };
      }
      case 'planned_workout': {
        const program = list('workout_programs').find((p) => p.is_active && createdBy(p));
        const label = program?.schedule_json?.[String(weekdayOf(date))];
        if (!program || !label) return { criterion: c, applicable: false, met: false }; // rest day
        const met = list('workouts').filter(stable).some((w) => onDay(w.started_at) && w.status === 'completed');
        return { criterion: c, applicable: true, met };
      }
      case 'planned_study': {
        const planned = list('study_sessions').filter((s) => s.planned_date === date && createdBy(s));
        if (planned.length === 0) return { criterion: c, applicable: false, met: false };
        const done = planned.filter((s) => s.status === 'completed' && stable(s)).length;
        return { criterion: c, applicable: true, met: done === planned.length, progress: { done, total: planned.length } };
      }
      case 'tasks_due': {
        // low-priority tasks are optional and never affect the result
        const due = list('tasks').filter((x) => onDay(x.due_at) && x.priority !== 'low' && x.status !== 'archived' && createdBy(x));
        if (due.length === 0) return { criterion: c, applicable: false, met: false };
        const done = due.filter((x) => x.status === 'completed' && stable(x)).length;
        return { criterion: c, applicable: true, met: done === due.length, progress: { done, total: due.length } };
      }
    }
  });

  const applicable = results.filter((r) => r.applicable).length;
  const met = results.filter((r) => r.applicable && r.met).length;
  const status = exempt ? 'exempt' : applicable === 0 ? 'rest' : met === applicable ? 'perfect' : 'unmet';
  return { date, definition: def, results, applicable, met, exempt, status };
}

/** Live status for a day that may not be sealed yet. */
export function liveStatus(list: Lists, date: LocalDate, timeZone: string, now: Date): DayStatus {
  const sealed = list('perfect_day_results').find((r) => r.local_date === date);
  if (sealed) return sealed.status;
  const ev = evaluateDay(list, date, timeZone);
  if (ev.status === 'not_tracked') return 'not_tracked';
  // Not sealed yet (today, or yesterday before 04:00): unmet is "pending", never failed.
  if (ev.status === 'unmet') return 'pending';
  void now;
  return ev.status;
}

// ---------------------------------------------------------- sealing
/**
 * Days that are past their seal time but have no result yet, starting from
 * the first definition's effective date. Returns the results to append.
 */
export function daysToSeal(list: Lists, timeZone: string, now: Date, maxDays = 400): Omit<PerfectDayResult, 'id' | 'created_at' | 'updated_at'>[] {
  const defs = list('perfect_day_definitions');
  if (defs.length === 0) return [];
  const first = defs.reduce((a, d) => (d.effective_from < a ? d.effective_from : a), defs[0].effective_from);
  const sealedDates = new Set(list('perfect_day_results').map((r) => r.local_date));
  const out: Omit<PerfectDayResult, 'id' | 'created_at' | 'updated_at'>[] = [];
  const today = localDateOf(now, timeZone);
  let d = first;
  for (let i = 0; i < maxDays && d < today; i++, d = addDays(d, 1)) {
    if (sealedDates.has(d)) continue;
    const at = sealTime(d, timeZone);
    if (at > now) break;
    const ev = evaluateDay(list, d, timeZone, at);
    if (ev.status === 'not_tracked' || !ev.definition) continue;
    out.push({
      local_date: d,
      status: ev.status === 'unmet' ? 'incomplete' : ev.status,
      met: ev.met,
      applicable: ev.applicable,
      sealed_at: at.toISOString(),
      definition_id: ev.definition.id,
    });
  }
  return out;
}

// ---------------------------------------------------------- streaks
export interface StreakSummary {
  current: number;
  currentStart: LocalDate | null;
  longest: number;
  longestStart: LocalDate | null;
  longestEnd: LocalDate | null;
  todayStatus: DayStatus;
  totalPerfect: number;
}

/**
 * Rest and exempt days bridge a streak without adding to it; an incomplete
 * sealed day ends it. `live` holds statuses of days that are not sealed yet
 * (today, and yesterday before 04:00): "pending" bridges, "perfect" counts.
 */
export function computeStreaks(results: PerfectDayResult[], today: LocalDate, live: Map<LocalDate, DayStatus>): StreakSummary {
  const byDate = new Map(results.filter((r) => !r.deleted_at).map((r) => [r.local_date, r.status as DayStatus]));
  const statusOf = (d: LocalDate): DayStatus | undefined => byDate.get(d) ?? live.get(d);
  const todayStatus = statusOf(today) ?? 'not_tracked';

  // longest run over sealed results (+ live days), bridging rest/exempt/pending
  const all = [...new Set([...byDate.keys(), ...live.keys()])].sort();
  let longest = 0;
  let longestStart: LocalDate | null = null;
  let longestEnd: LocalDate | null = null;
  let run = 0;
  let runStart: LocalDate | null = null;
  let prev: LocalDate | null = null;
  for (const d of all) {
    if (prev && addDays(prev, 1) !== d) {
      run = 0; // gap before tracking started
      runStart = null;
    }
    const st = statusOf(d);
    if (st === 'perfect') {
      run++;
      if (!runStart) runStart = d;
      if (run > longest) {
        longest = run;
        longestStart = runStart;
        longestEnd = d;
      }
    } else if (st === 'incomplete' || st === 'not_tracked') {
      run = 0;
      runStart = null;
    }
    prev = d;
  }

  // current streak: walk back from today
  let current = 0;
  let currentStart: LocalDate | null = null;
  let d = today;
  for (let i = 0; i < 4000; i++, d = addDays(d, -1)) {
    const st = statusOf(d);
    if (st === 'perfect') {
      current++;
      currentStart = d;
    } else if (st === 'rest' || st === 'exempt' || (st === 'pending' && live.has(d))) continue;
    else break;
  }
  const totalPerfect = all.filter((x) => statusOf(x) === 'perfect').length;
  return { current, currentStart, longest, longestStart, longestEnd, todayStatus, totalPerfect };
}

// ---------------------------------------------------------- analytics
export interface MonthSummary {
  month: LocalDate; // first day of month
  perfect: number;
  sealed: number;
  rest: number;
}

export function monthSummaries(results: PerfectDayResult[], today: LocalDate, months: number): MonthSummary[] {
  const out: MonthSummary[] = [];
  let m = startOfMonth(today);
  for (let i = 0; i < months; i++) {
    const from = m;
    const to = endOfMonth(m);
    const inMonth = results.filter((r) => !r.deleted_at && r.local_date >= from && r.local_date <= to);
    out.unshift({ month: from, perfect: inMonth.filter((r) => r.status === 'perfect').length, sealed: inMonth.length, rest: inMonth.filter((r) => r.status === 'rest' || r.status === 'exempt').length });
    m = startOfMonth(addDays(m, -1));
  }
  return out;
}

export function monthDays(month: LocalDate): LocalDate[] {
  return dateRange(startOfMonth(month), endOfMonth(month));
}
