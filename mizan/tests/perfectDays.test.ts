import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { zonedToUtc } from '../src/domain/dates';
import { computeStreaks, evaluateDay, monthSummaries, sealTime, validateDefinition } from '../src/domain/perfectDays';
import type { Habit, PerfectDayResult } from '../src/domain/types';
import { MemoryDriver } from '../src/data/drivers/memory';
import { Store } from '../src/data/store';
import * as uc from '../src/data/usecases';

const TZ = 'Asia/Beirut';
let clock: Date;
let store: Store;
const at = (date: string, time: string) => zonedToUtc(date, time, TZ);
const setNow = (date: string, time: string) => {
  clock = at(date, time);
};
const list = () => store.list.bind(store) as never;

let read: Habit;
let walk: Habit;

beforeEach(async () => {
  setNow('2026-11-02', '08:00'); // Monday
  store = new Store(new MemoryDriver(), { uuid: randomUUID, now: () => clock });
  await store.load();
  read = store.insert('habits', { name: 'Read', schedule_type: 'daily', status: 'active', sort_order: 0 });
  // walk only Mon/Wed/Fri
  walk = store.insert('habits', { name: 'Walk', schedule_type: 'weekdays', schedule_days: [1, 3, 5], status: 'active', sort_order: 1 });
});

const done = (h: Habit, date: string) => uc.logHabit(store, h, date, 'completed', clock);
const defineHabits = (...hs: Habit[]) => uc.savePerfectDayDefinition(store, hs.map((h) => ({ type: 'habit' as const, ref_id: h.id })), clock, TZ);

describe('definition', () => {
  it('requires explicit criteria, rejects duplicates and DEEN-only definitions', () => {
    expect(validateDefinition([])).toBe('empty');
    expect(validateDefinition([{ type: 'prayers' }])).toBe('deen_only');
    expect(validateDefinition([{ type: 'habit', ref_id: 'a' }, { type: 'habit', ref_id: 'a' }])).toBe('duplicate');
    expect(validateDefinition([{ type: 'prayers' }, { type: 'habit', ref_id: 'a' }])).toBeNull();
    expect(() => uc.savePerfectDayDefinition(store, [{ type: 'prayers' }], clock, TZ)).toThrow('deen_only');
  });
  it('tracks nothing until the user defines a perfect day (no imposed defaults)', () => {
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('not_tracked');
    expect(uc.streakSummary(store, clock, TZ).current).toBe(0);
  });
  it('a new definition is effective from today, never backdated', () => {
    const d = defineHabits(read);
    expect(d.effective_from).toBe('2026-11-02');
    expect(evaluateDay(list(), '2026-11-01', TZ).status).toBe('not_tracked');
  });
});

describe('day evaluation', () => {
  it('is perfect only when every applicable criterion is met; otherwise pending today', () => {
    defineHabits(read, walk);
    done(read, '2026-11-02');
    expect(uc.streakSummary(store, clock, TZ).todayStatus).toBe('pending');
    done(walk, '2026-11-02');
    const s = uc.streakSummary(store, clock, TZ);
    expect(s.todayStatus).toBe('perfect');
    expect(s.current).toBe(1);
  });
  it('does not count unscheduled habits against a day (rest days are fair)', () => {
    defineHabits(read, walk);
    const tue = evaluateDay(list(), '2026-11-03', TZ);
    expect(tue.results.find((r) => r.criterion.type === 'habit' && r.criterion.ref_id === walk.id)?.applicable).toBe(false);
    expect(tue.applicable).toBe(1);
  });
  it('treats a day with no applicable criteria as a neutral rest day', () => {
    defineHabits(walk);
    expect(evaluateDay(list(), '2026-11-03', TZ).status).toBe('rest');
  });
  it('excludes archived/paused habits and weekly-target habits', () => {
    const weekly = store.insert('habits', { name: 'Gym', schedule_type: 'times_per_week', times_per_week: 3, status: 'active', sort_order: 2 });
    defineHabits(read, weekly);
    store.update('habits', read.id, { status: 'archived' });
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('rest');
  });
  it('ignores optional (low-priority) tasks', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'tasks_due' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    store.insert('tasks', { title: 'optional', priority: 'low', due_at: at('2026-11-02', '12:00').toISOString() });
    done(read, '2026-11-02');
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('perfect');
    store.insert('tasks', { title: 'important', priority: 'high', due_at: at('2026-11-02', '12:00').toISOString() });
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('unmet');
  });
  it('workout criterion applies only on programmed days', () => {
    store.insert('workout_programs', { name: 'P', is_active: true, schedule_json: { '1': 'Push' } }); // Monday only
    uc.savePerfectDayDefinition(store, [{ type: 'planned_workout' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    expect(evaluateDay(list(), '2026-11-03', TZ).results[0].applicable).toBe(false); // Tuesday = rest day
    expect(evaluateDay(list(), '2026-11-02', TZ).results[0].applicable).toBe(true);
  });
  it('prayers can be one criterion (excused counts as fulfilled)', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'prayers' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib'] as const) uc.setPrayerStatus(store, '2026-11-02', p, 'performed', clock, TZ);
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('unmet');
    uc.setPrayerStatus(store, '2026-11-02', 'isha', 'excused', clock, TZ);
    expect(evaluateDay(list(), '2026-11-02', TZ).status).toBe('perfect');
  });
});

describe('sealing and day change', () => {
  it('seals a day only after 04:00 the next morning, then never changes it', () => {
    defineHabits(read);
    done(read, '2026-11-02');
    setNow('2026-11-03', '03:00');
    expect(uc.sealPerfectDays(store, clock, TZ)).toBe(0);
    // during the grace window yesterday stays live and still counts
    expect(uc.streakSummary(store, clock, TZ).current).toBe(1);
    setNow('2026-11-03', '04:01');
    expect(uc.sealPerfectDays(store, clock, TZ)).toBe(1);
    expect(uc.sealPerfectDays(store, clock, TZ)).toBe(0); // idempotent
    const [r] = store.list('perfect_day_results');
    expect(r).toMatchObject({ local_date: '2026-11-02', status: 'perfect', met: 1, applicable: 1 });
    expect(() => store.update('perfect_day_results', r.id, { status: 'incomplete' })).toThrow('append_only');
    expect(() => store.remove('perfect_day_results', r.id)).toThrow('append_only');
  });

  it('allows late logging inside the grace window', () => {
    defineHabits(read);
    setNow('2026-11-03', '01:30'); // forgot to log last night
    done(read, '2026-11-02');
    setNow('2026-11-03', '05:00');
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results')[0].status).toBe('perfect');
  });

  it('rejects fake streaks: logs back-filled after the seal do not count', () => {
    defineHabits(read);
    setNow('2026-11-04', '10:00'); // two days later, app not opened
    done(read, '2026-11-02'); // back-filled
    done(read, '2026-11-03');
    uc.sealPerfectDays(store, clock, TZ);
    const statuses = store.list('perfect_day_results').map((r) => [r.local_date, r.status]);
    expect(statuses).toEqual([
      ['2026-11-02', 'incomplete'],
      ['2026-11-03', 'incomplete'],
    ]);
  });

  it('a sealed result is preserved when the source record is later edited or deleted', () => {
    defineHabits(read);
    done(read, '2026-11-02');
    setNow('2026-11-03', '05:00');
    uc.sealPerfectDays(store, clock, TZ);
    uc.logHabit(store, read, '2026-11-02', null, clock); // delete the log afterwards
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results').find((r) => r.local_date === '2026-11-02')?.status).toBe('perfect');
  });

  it('edits made before the seal are honoured (corrections)', () => {
    defineHabits(read);
    uc.logHabit(store, read, '2026-11-02', 'skipped', clock);
    setNow('2026-11-02', '21:00');
    uc.logHabit(store, read, '2026-11-02', 'completed', clock); // corrected the same evening
    setNow('2026-11-03', '05:00');
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results')[0].status).toBe('perfect');
  });

  it('changing the definition later never rewrites closed days', () => {
    defineHabits(read);
    done(read, '2026-11-02');
    setNow('2026-11-03', '05:00');
    uc.sealPerfectDays(store, clock, TZ);
    defineHabits(read, walk); // stricter from today (Tue)
    expect(store.list('perfect_day_results')[0].status).toBe('perfect');
    expect(evaluateDay(list(), '2026-11-02', TZ).definition?.criteria).toHaveLength(1);
  });
});

describe('exemptions (rest / holiday)', () => {
  it('can only be planned for today or later and bridges the streak', () => {
    defineHabits(read);
    expect(() => uc.addDayExemption(store, '2026-11-01', 'holiday', clock, TZ)).toThrow('past_date');
    done(read, '2026-11-02');
    uc.addDayExemption(store, '2026-11-03', 'holiday', clock, TZ);
    setNow('2026-11-04', '09:00');
    done(read, '2026-11-04');
    uc.sealPerfectDays(store, clock, TZ);
    const s = uc.streakSummary(store, clock, TZ);
    expect(store.list('perfect_day_results').map((r) => r.status)).toEqual(['perfect', 'exempt']);
    expect(s.current).toBe(2); // Mon + Wed, holiday bridged without counting
    expect(s.currentStart).toBe('2026-11-02');
  });
});

describe('streak computation', () => {
  const r = (local_date: string, status: PerfectDayResult['status']): PerfectDayResult => ({ id: local_date, created_at: '', updated_at: '', local_date, status, met: 0, applicable: 0, sealed_at: '', definition_id: 'd' });
  it('counts consecutive perfect days, bridging rest days, and keeps the record after a break', () => {
    const results = [r('2026-11-01', 'perfect'), r('2026-11-02', 'perfect'), r('2026-11-03', 'rest'), r('2026-11-04', 'perfect'), r('2026-11-05', 'incomplete'), r('2026-11-06', 'perfect')];
    const s = computeStreaks(results, '2026-11-07', new Map([['2026-11-07', 'pending']]));
    expect(s.current).toBe(1);
    expect(s.currentStart).toBe('2026-11-06');
    expect(s.longest).toBe(3);
    expect([s.longestStart, s.longestEnd]).toEqual(['2026-11-01', '2026-11-04']);
    expect(s.totalPerfect).toBe(4);
  });
  it('a pending today keeps the streak; a perfect today extends it', () => {
    const results = [r('2026-11-05', 'perfect'), r('2026-11-06', 'perfect')];
    expect(computeStreaks(results, '2026-11-07', new Map([['2026-11-07', 'pending']])).current).toBe(2);
    expect(computeStreaks(results, '2026-11-07', new Map([['2026-11-07', 'perfect']])).current).toBe(3);
  });
  it('summarises months for comparison', () => {
    const m = monthSummaries([r('2026-10-30', 'perfect'), r('2026-11-01', 'perfect'), r('2026-11-02', 'rest')], '2026-11-10', 2);
    expect(m).toEqual([
      { month: '2026-10-01', perfect: 1, sealed: 1, rest: 0 },
      { month: '2026-11-01', perfect: 1, sealed: 2, rest: 1 },
    ]);
  });
  it('seal time is 04:00 local the next day (DST-safe)', () => {
    expect(sealTime('2026-11-02', TZ).toISOString()).toBe('2026-11-03T02:00:00.000Z');
    expect(sealTime('2026-07-01', TZ).toISOString()).toBe('2026-07-02T01:00:00.000Z');
  });
});
