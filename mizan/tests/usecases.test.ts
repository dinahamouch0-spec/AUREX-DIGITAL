import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildAiContext, LocalInsightsProvider, ExternalProviderSlot } from '../src/ai/provider';
import { dayPrayerSummary } from '../src/domain/deen';
import { habitDayStatus } from '../src/domain/habits';
import { MemoryDriver } from '../src/data/drivers/memory';
import { Store } from '../src/data/store';
import * as uc from '../src/data/usecases';
import { appleHealth } from '../src/integrations/appleHealth';

const TZ = 'Asia/Beirut';
const now = new Date('2026-11-16T10:00:00Z'); // 12:00 Beirut
let store: Store;
beforeEach(async () => {
  store = new Store(new MemoryDriver(), { uuid: randomUUID, now: () => now });
  await store.load();
});

describe('DEEN use cases', () => {
  it('logs, changes and clears each prayer independently with undo', () => {
    uc.setPrayerStatus(store, '2026-11-16', 'dhuhr', 'performed', now, TZ);
    uc.setPrayerStatus(store, '2026-11-16', 'asr', 'performed', now, TZ);
    let s = dayPrayerSummary(store.list('prayer_logs'), '2026-11-16');
    expect(s.performed).toBe(2);
    expect(store.list('prayer_logs')).toHaveLength(2);
    const undo = uc.setPrayerStatus(store, '2026-11-16', 'asr', 'excused', now, TZ);
    expect(dayPrayerSummary(store.list('prayer_logs'), '2026-11-16').statuses.asr).toBe('excused');
    undo();
    expect(dayPrayerSummary(store.list('prayer_logs'), '2026-11-16').statuses.asr).toBe('performed');
    uc.setPrayerStatus(store, '2026-11-16', 'dhuhr', null, now, TZ);
    s = dayPrayerSummary(store.list('prayer_logs'), '2026-11-16');
    expect(s.statuses.dhuhr).toBe('not_recorded');
    expect(s.statuses.asr).toBe('performed');
  });
  it('does not stamp a performed time when logging a past day', () => {
    uc.setPrayerStatus(store, '2026-11-10', 'fajr', 'performed', now, TZ);
    expect(store.list('prayer_logs')[0].performed_at).toBeNull();
  });
  it('saves tasbih counts and rejects zero', () => {
    expect(uc.saveDhikrCount(store, 'tasbih', 33, now).count).toBe(33);
    expect(() => uc.saveDhikrCount(store, 'tasbih', 0, now)).toThrow();
  });
});

describe('HABITS use cases', () => {
  it('toggles one-tap check-ins and records detailed logs', () => {
    const h = store.insert('habits', { name: 'Read', schedule_type: 'daily', status: 'active', sort_order: 0 });
    uc.toggleHabitDone(store, h, '2026-11-16', now);
    expect(habitDayStatus(h, store.list('habit_logs'), '2026-11-16')).toBe('completed');
    uc.toggleHabitDone(store, h, '2026-11-16', now);
    expect(habitDayStatus(h, store.list('habit_logs'), '2026-11-16')).toBe('not_recorded');
    uc.logHabit(store, h, '2026-11-16', 'partial', now, { duration_minutes: 10 });
    expect(store.list('habit_logs')[0]).toMatchObject({ status: 'partial', duration_minutes: 10 });
  });
  it('keeps per-step routine history and derives routine status', () => {
    const r = store.insert('routines', { name: 'Morning', kind: 'morning', status: 'active' });
    const s1 = store.insert('routine_steps', { routine_id: r.id, title: 'Wake', sort_order: 0 });
    const s2 = store.insert('routine_steps', { routine_id: r.id, title: 'Stretch', sort_order: 1 });
    const log = uc.startRoutine(store, r, '2026-11-16', now);
    expect(uc.startRoutine(store, r, '2026-11-16', now).id).toBe(log.id);
    uc.setRoutineStep(store, log.id, s1.id, 'completed', now);
    uc.setRoutineStep(store, log.id, s2.id, 'skipped', now);
    expect(uc.finishRoutine(store, log.id, now).status).toBe('partial');
    expect(store.list('routine_step_logs')).toHaveLength(2);
  });
});

describe('FITNESS use cases', () => {
  it('runs a live workout with numbered sets', () => {
    const w = uc.startWorkout(store, 'Push', now);
    expect(uc.startWorkout(store, 'Other', now).id).toBe(w.id); // resumes, no duplicate
    uc.addSet(store, w.id, 'builtin:push_up', 12, null, 'kg');
    const s2 = uc.addSet(store, w.id, 'builtin:push_up', 10, null, 'kg');
    expect(s2.set_number).toBe(2);
    uc.finishWorkout(store, w.id, now);
    expect(uc.activeWorkout(store)).toBeUndefined();
  });
  it('snapshots nutrition from the food library and repeats meals', () => {
    const food = store.insert('food_items', { name: 'Labneh sandwich', serving_label: '1', calories: 320, protein_g: 12, source: 'estimate' });
    const meal = store.insert('meals', { meal_type: 'breakfast', logged_at: now.toISOString() });
    const item = uc.addFoodToMeal(store, meal.id, food, 1.5);
    expect(item).toMatchObject({ calories: 480, protein_g: 18, source: 'estimate' });
    const copy = uc.repeatMeal(store, meal.id, now);
    expect(store.list('meal_items').filter((i) => i.meal_id === copy.id)).toHaveLength(1);
  });
});

describe('AI provider abstraction', () => {
  it('local provider returns insights with sources and proposes (never executes) actions', async () => {
    const subj = store.insert('subjects', { name: 'Math' });
    store.insert('exams', { subject_id: subj.id, title: 'Algebra test', exam_at: '2026-11-19T07:00:00Z' });
    const before = store.list('study_sessions').length;
    const res = await new LocalInsightsProvider().analyse(store.list.bind(store) as never, { today: '2026-11-16', now, timeZone: TZ, weekStart: 1, allowedDomains: ['academics'] });
    expect(res.insights.some((i) => i.key === 'ins.examSoon')).toBe(true);
    expect(res.actions[0].kind).toBe('create_study_session');
    expect(store.list('study_sessions').length).toBe(before);
  });
  it('external slot is unavailable until set up and holds no keys', async () => {
    const ext = new ExternalProviderSlot(undefined);
    expect(ext.isAvailable()).toBe(false);
    await expect(ext.analyse()).rejects.toThrow('external_provider_not_configured');
  });
  it('AI context excludes disabled domains and sensitive fields', () => {
    store.insert('clients', { name: 'Client', status: 'lead', phone: '+961 70 000000', notes: 'private' });
    store.insert('prayer_logs', { prayer_type: 'fajr', local_date: '2026-11-16', status: 'performed' });
    const ctx = buildAiContext(store.list.bind(store) as never, ['business']);
    expect(ctx.prayer_logs).toBeUndefined();
    expect(ctx.clients[0].name).toBe('Client');
    expect(ctx.clients[0].phone).toBeUndefined();
    expect(ctx.clients[0].notes).toBeUndefined();
  });
});

describe('integrations', () => {
  it('Apple Health reports unavailable and never fabricates data', async () => {
    expect(await appleHealth.status()).toBe('unavailable');
    expect(await appleHealth.sync()).toEqual({ imported: 0, errors: 0 });
  });
});

describe('local-only progress photos', () => {
  it('never enters the sync outbox or AI context', () => {
    store.insert('body_photos', { local_uri: 'file:///doc/p.jpg', captured_at: now.toISOString() });
    expect(store.list('body_photos')).toHaveLength(1);
    expect(store.pendingOutbox().some((o) => o.collection === 'body_photos')).toBe(false);
    expect(buildAiContext(store.list.bind(store) as never, ['fitness']).body_photos).toBeUndefined();
  });
});
