import { describe, expect, it } from 'vitest';

import { computePrayerTimes, DEFAULT_PRAYER_SETTINGS } from '../src/domain/prayerTimes';
import { nextUp, skyPhase } from '../src/domain/today';

const t = computePrayerTimes('2026-11-17', DEFAULT_PRAYER_SETTINGS).times;
const at = (iso: string) => new Date(iso);
const none = { fajr: 'not_recorded', dhuhr: 'not_recorded', asr: 'not_recorded', maghrib: 'not_recorded', isha: 'not_recorded' } as const;
const base = { localHour: 12, prayerTimes: t, prayerStatus: { ...none }, activeWorkout: false, plannedWorkout: null, trainedToday: false, dueToday: [], habitsLeft: 0 };

describe('sky phase from real prayer times', () => {
  it('is day between sunrise and maghrib, with the sun moving along its arc', () => {
    const mid = new Date((Date.parse(t.sunrise!) + Date.parse(t.maghrib!)) / 2);
    const s = skyPhase(mid, t, 12);
    expect(s.isDay).toBe(true);
    expect(s.arc).toBeCloseTo(0.5, 1);
    expect(skyPhase(new Date(Date.parse(t.sunrise!) + 60_000), t, 7).phase).toBe('morning');
    expect(skyPhase(new Date(Date.parse(t.dhuhr!) + 60_000), t, 12).phase).toBe('afternoon');
  });
  it('is dawn between fajr and sunrise, dusk between maghrib and isha, night otherwise', () => {
    expect(skyPhase(new Date(Date.parse(t.fajr!) + 60_000), t, 5).phase).toBe('dawn');
    expect(skyPhase(new Date(Date.parse(t.maghrib!) + 60_000), t, 17).phase).toBe('dusk');
    const late = skyPhase(new Date(Date.parse(t.isha!) + 3_600_000), t, 21);
    expect(late.phase).toBe('night');
    expect(late.isDay).toBe(false);
    expect(late.arc).toBeGreaterThan(0);
  });
  it('falls back to clock hours when prayer times are unavailable', () => {
    const empty = { fajr: null, sunrise: null, dhuhr: null, asr: null, maghrib: null, isha: null };
    expect(skyPhase(at('2026-11-17T10:00:00Z'), empty, 9).phase).toBe('morning');
    expect(skyPhase(at('2026-11-17T10:00:00Z'), empty, 23).phase).toBe('night');
  });
});

describe('next up', () => {
  it('a running workout comes first', () => {
    expect(nextUp({ ...base, now: at(t.asr!), activeWorkout: true }).kind).toBe('workout-active');
  });
  it('suggests recording the current prayer only when it is not recorded', () => {
    const now = new Date(Date.parse(t.asr!) + 10 * 60_000);
    expect(nextUp({ ...base, now })).toEqual({ kind: 'prayer-record', prayer: 'asr' });
    const r = nextUp({ ...base, now, prayerStatus: { ...none, fajr: 'performed', dhuhr: 'performed', asr: 'performed' } });
    expect(r.kind).toBe('prayer-next');
    expect(r.prayer).toBe('maghrib');
    expect(r.minutes).toBeGreaterThan(0);
  });
  it('then a deadline within 6 hours, then the planned workout, then habits', () => {
    const now = new Date(Date.parse(t.dhuhr!) + 5 * 60_000);
    const done = { ...none, fajr: 'performed', dhuhr: 'performed' } as const;
    const due = [{ title: 'Physics', at: new Date(now.getTime() + 2 * 3_600_000).toISOString(), href: '/x' }];
    expect(nextUp({ ...base, now, prayerStatus: done, dueToday: due }).kind).toBe('deadline');
    expect(nextUp({ ...base, now, prayerStatus: done, plannedWorkout: 'Push' })).toEqual({ kind: 'workout-planned', title: 'Push' });
    expect(nextUp({ ...base, now, prayerStatus: done, plannedWorkout: 'Push', trainedToday: true, habitsLeft: 2 })).toEqual({ kind: 'habits', count: 2 });
  });
  it('offers the evening review after the last prayer when nothing else is pending', () => {
    const all = { fajr: 'performed', dhuhr: 'performed', asr: 'performed', maghrib: 'performed', isha: 'excused' } as const;
    expect(nextUp({ ...base, now: new Date(Date.parse(t.isha!) + 60_000), localHour: 21, prayerStatus: all }).kind).toBe('review');
  });
});
