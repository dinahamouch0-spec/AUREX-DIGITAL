import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { zonedToUtc } from '../src/domain/dates';
import { computeStreaks, evaluateDay, monthSummaries, sealTime, validateDefinition } from '../src/domain/perfectDays';
import type { Habit, PerfectDayResult } from '../src/domain/types';
import { MemoryDriver } from '../src/data/drivers/memory';
import { Store } from '../src/data/store';
import * as uc from '../src/data/usecases';
import { toServerRow } from '../src/data/sync';

const toServerRowForTest = (r: Parameters<typeof toServerRow>[0]) => toServerRow(r, 'u');

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
  it('seal time matches the database (04:00 Beirut next day, DST-safe, never earlier than Beirut)', () => {
    // same fixtures as supabase/tests/rls_test.sql
    expect(sealTime('2026-01-15', TZ).toISOString()).toBe('2026-01-16T02:00:00.000Z'); // winter
    expect(sealTime('2026-07-01', TZ).toISOString()).toBe('2026-07-02T01:00:00.000Z'); // summer
    expect(sealTime('2026-03-28', TZ).toISOString()).toBe('2026-03-29T01:00:00.000Z'); // spring-forward night
    expect(sealTime('2026-10-24', TZ).toISOString()).toBe('2026-10-25T02:00:00.000Z'); // fall-back night
    expect(sealTime('2026-07-01', 'Pacific/Kiritimati').toISOString()).toBe('2026-07-02T01:00:00.000Z'); // east: not earlier
    expect(sealTime('2026-07-01', 'America/New_York').toISOString()).toBe('2026-07-02T08:00:00.000Z'); // west: own 04:00
  });
  it('only produces results the database accepts (status agrees with counts)', () => {
    defineHabits(read, walk);
    done(read, '2026-11-02'); // Mon: walk not done -> incomplete
    setNow('2026-11-05', '05:00');
    uc.sealPerfectDays(store, clock, TZ);
    for (const r of store.list('perfect_day_results')) {
      const ok =
        (r.status === 'perfect' && r.applicable > 0 && r.met === r.applicable) ||
        (r.status === 'incomplete' && r.applicable > 0 && r.met < r.applicable) ||
        (r.status === 'rest' && r.applicable === 0 && r.met === 0) ||
        r.status === 'exempt';
      expect(ok, JSON.stringify(r)).toBe(true);
      expect(new Date(r.sealed_at).getTime()).toBe(sealTime(r.local_date, TZ).getTime());
    }
    expect(store.list('perfect_day_results').map((r) => r.status)).toEqual(['incomplete', 'incomplete', 'incomplete']);
  });
});

describe('historical stability: edits after a day closes never change it', () => {
  // Monday 2026-11-02 closes at Tue 04:00 Beirut. Each edit below happens at
  // Tue 05:00 — after the close but BEFORE the sealing job runs.
  const closeThenEdit = (edit: () => void) => {
    setNow('2026-11-03', '05:00');
    edit();
    uc.sealPerfectDays(store, clock, TZ);
    return store.list('perfect_day_results').find((r) => r.local_date === '2026-11-02');
  };

  it('changing a habit schedule afterwards does not turn a missed day into a rest day', () => {
    defineHabits(walk); // Mon/Wed/Fri, not done on Monday
    const r = closeThenEdit(() => store.update('habits', walk.id, { schedule_days: [2] })); // now Tue only
    expect(r?.status).toBe('incomplete');
  });

  it('archiving or pausing a habit afterwards does not erase the day', () => {
    defineHabits(read);
    const r = closeThenEdit(() => store.update('habits', read.id, { status: 'archived' }));
    expect(r).toMatchObject({ status: 'incomplete', applicable: 1, met: 0 });
  });

  it('deleting a habit afterwards does not erase the day', () => {
    defineHabits(read);
    const r = closeThenEdit(() => store.remove('habits', read.id));
    expect(r?.status).toBe('incomplete');
  });

  it('moving a task due date or completing it afterwards does not change the day', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'tasks_due' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const task = store.insert('tasks', { title: 'Report', priority: 'high', due_at: at('2026-11-02', '17:00').toISOString() });
    const r = closeThenEdit(() => {
      store.update('tasks', task.id, { due_at: at('2026-11-05', '17:00').toISOString() });
      store.update('tasks', task.id, { status: 'completed' });
    });
    expect(r).toMatchObject({ status: 'incomplete', applicable: 2, met: 1 });
  });

  it('a task created afterwards for that day does not count against it', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'tasks_due' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const r = closeThenEdit(() => store.insert('tasks', { title: 'late', priority: 'high', due_at: at('2026-11-02', '12:00').toISOString() }));
    expect(r?.status).toBe('perfect');
  });

  it('changing the workout program afterwards does not turn a training day into a rest day', () => {
    const prog = store.insert('workout_programs', { name: 'P', is_active: true, schedule_json: { '1': 'Push' } });
    uc.savePerfectDayDefinition(store, [{ type: 'planned_workout' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const r = closeThenEdit(() => store.update('workout_programs', prog.id, { schedule_json: { '2': 'Push' } }));
    expect(r).toMatchObject({ status: 'incomplete', applicable: 2, met: 1 });
  });

  it('deactivating the program afterwards does not change the day', () => {
    const prog = store.insert('workout_programs', { name: 'P', is_active: true, schedule_json: { '1': 'Push' } });
    uc.savePerfectDayDefinition(store, [{ type: 'planned_workout' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    const r = closeThenEdit(() => store.update('workout_programs', prog.id, { is_active: false }));
    expect(r?.applicable).toBe(2);
  });

  it('deleting or completing a planned study session afterwards does not change the day', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'planned_study' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const a = store.insert('study_sessions', { title: 'Algebra', planned_date: '2026-11-02', planned_minutes: 30 });
    const b = store.insert('study_sessions', { title: 'Physics', planned_date: '2026-11-02', planned_minutes: 30 });
    const r = closeThenEdit(() => {
      store.remove('study_sessions', a.id);
      store.update('study_sessions', b.id, { status: 'completed' });
    });
    expect(r).toMatchObject({ status: 'incomplete', applicable: 2, met: 1 });
  });

  it('moving a study session to another day afterwards does not change the day', () => {
    uc.savePerfectDayDefinition(store, [{ type: 'planned_study' }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const s = store.insert('study_sessions', { title: 'Algebra', planned_date: '2026-11-02', planned_minutes: 30 });
    const r = closeThenEdit(() => uc.moveStudySession(store, s.id, '2026-11-04'));
    expect(r?.status).toBe('incomplete');
  });

  it('pausing a routine afterwards does not change the day', () => {
    const routine = store.insert('routines', { name: 'Morning', kind: 'morning', status: 'active' });
    uc.savePerfectDayDefinition(store, [{ type: 'routine', ref_id: routine.id }, { type: 'habit', ref_id: read.id }], clock, TZ);
    done(read, '2026-11-02');
    const r = closeThenEdit(() => store.update('routines', routine.id, { status: 'paused' }));
    expect(r).toMatchObject({ status: 'incomplete', applicable: 2 });
  });

  it('editing a log afterwards uses the version that existed at close (both directions)', () => {
    defineHabits(read);
    uc.logHabit(store, read, '2026-11-02', 'skipped', clock);
    let r = closeThenEdit(() => uc.logHabit(store, read, '2026-11-02', 'completed', clock));
    expect(r?.status).toBe('incomplete'); // can't upgrade a closed day

    // and a later downgrade can't break a day that was perfect at close
    uc.logHabit(store, read, '2026-11-03', 'completed', clock);
    setNow('2026-11-04', '05:00');
    uc.logHabit(store, read, '2026-11-03', 'skipped', clock);
    uc.sealPerfectDays(store, clock, TZ);
    r = store.list('perfect_day_results').find((x) => x.local_date === '2026-11-03');
    expect(r?.status).toBe('perfect');
  });

  it('boundary: a record written exactly at the close instant counts, one millisecond later does not', () => {
    defineHabits(read);
    const due = sealTime('2026-11-02', TZ).getTime();
    clock = new Date(due);
    done(read, '2026-11-02');
    clock = new Date(due + 1);
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results')[0].status).toBe('perfect');

    clock = new Date(sealTime('2026-11-03', TZ).getTime() + 1);
    done(read, '2026-11-03'); // 1 ms too late
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results').find((x) => x.local_date === '2026-11-03')?.status).toBe('incomplete');
  });

  it('version history survives an app restart', async () => {
    const driver = new MemoryDriver();
    store = new Store(driver, { uuid: randomUUID, now: () => clock });
    await store.load();
    const h = store.insert('habits', { name: 'Read', schedule_type: 'daily', status: 'active', sort_order: 0 });
    uc.savePerfectDayDefinition(store, [{ type: 'habit', ref_id: h.id }], clock, TZ);
    setNow('2026-11-03', '05:00');
    store.update('habits', h.id, { status: 'archived' });
    const reloaded = new Store(driver, { uuid: randomUUID, now: () => clock });
    await reloaded.load();
    uc.sealPerfectDays(reloaded, clock, TZ);
    expect(reloaded.list('perfect_day_results')[0].status).toBe('incomplete');
  });

  it('an edit pulled from another device after the close keeps the earlier version too', () => {
    defineHabits(read);
    const r = closeThenEdit(() => store.applyRemote('habits', { ...store.getRaw('habits', read.id)!, status: 'archived', updated_at: clock.toISOString() }));
    expect(r?.status).toBe('incomplete');
  });

  it('history is local only: it is stripped before upload and capped', () => {
    for (let i = 0; i < 120; i++) store.update('habits', read.id, { name: `Read ${i}` });
    const raw = store.getRaw('habits', read.id)!;
    expect((raw._history ?? []).length).toBe(100);
    expect(Object.keys(toServerRowForTest(raw))).not.toContain('_history');
  });
});

describe('definitions are immutable', () => {
  it('cannot be updated or deleted; changing criteria creates a new version', () => {
    const d1 = defineHabits(read);
    expect(() => store.update('perfect_day_definitions', d1.id, { criteria: [] })).toThrow('append_only');
    expect(() => store.update('perfect_day_definitions', d1.id, { effective_from: '2020-01-01' })).toThrow('append_only');
    expect(() => store.remove('perfect_day_definitions', d1.id)).toThrow('append_only');
    const d2 = defineHabits(read, walk);
    expect(store.list('perfect_day_definitions').map((d) => d.id)).toEqual([d1.id, d2.id]);
  });
  it('a definition created after a day closed never applies to that day, even on the same date', () => {
    defineHabits(read);
    done(read, '2026-11-02');
    setNow('2026-11-03', '05:00');
    // a stricter definition saved now is effective Tue, never Mon
    defineHabits(read, walk);
    uc.sealPerfectDays(store, clock, TZ);
    expect(store.list('perfect_day_results')[0]).toMatchObject({ local_date: '2026-11-02', status: 'perfect', applicable: 1 });
  });
});
