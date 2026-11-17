/**
 * "Living" home logic — pure functions over real data:
 * - skyPhase: where the day is, from the user's computed prayer times (not the clock alone).
 * - nextUp: the single most useful next action right now.
 */
import type { PrayerType } from './prayerTimes';

export type SkyPhase = 'night' | 'dawn' | 'morning' | 'afternoon' | 'dusk';

export interface DayTimes {
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
}

const ms = (iso: string | null) => (iso ? Date.parse(iso) : null);
const DAY = 86_400_000;

/**
 * Phase of the day and position (0..1) of the sun (day) or moon (night) along its arc.
 * Falls back to clock hours when prayer times can't be computed (extreme latitudes).
 */
export function skyPhase(now: Date, t: DayTimes, localHour: number): { phase: SkyPhase; arc: number; isDay: boolean } {
  const n = now.getTime();
  const [fajr, sunrise, dhuhr, maghrib, isha] = [ms(t.fajr), ms(t.sunrise), ms(t.dhuhr), ms(t.maghrib), ms(t.isha)];
  if (fajr == null || sunrise == null || dhuhr == null || maghrib == null || isha == null) {
    const isDay = localHour >= 6 && localHour < 18;
    const phase: SkyPhase = localHour < 5 ? 'night' : localHour < 7 ? 'dawn' : localHour < 12 ? 'morning' : localHour < 18 ? 'afternoon' : localHour < 20 ? 'dusk' : 'night';
    return { phase, arc: isDay ? (localHour - 6) / 12 : ((localHour + 6) % 24) / 12, isDay };
  }
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  if (n >= sunrise && n < maghrib) {
    return { phase: n < dhuhr ? 'morning' : 'afternoon', arc: clamp((n - sunrise) / (maghrib - sunrise)), isDay: true };
  }
  // night arc: maghrib → next fajr
  const nightStart = n >= maghrib ? maghrib : maghrib - DAY;
  const nightEnd = n >= maghrib ? fajr + DAY : fajr;
  const phase: SkyPhase = n >= fajr && n < sunrise ? 'dawn' : n >= maghrib && n < isha ? 'dusk' : 'night';
  return { phase, arc: clamp((n - nightStart) / (nightEnd - nightStart)), isDay: false };
}

export type NextUpKind = 'workout-active' | 'prayer-record' | 'deadline' | 'workout-planned' | 'habits' | 'prayer-next' | 'review' | 'none';

export interface NextUpInput {
  now: Date;
  localHour: number;
  prayerTimes: Partial<Record<PrayerType, string | null>>;
  prayerStatus: Record<PrayerType, 'performed' | 'missed' | 'excused' | 'not_recorded'>;
  activeWorkout: boolean;
  plannedWorkout: string | null;
  trainedToday: boolean;
  /** open items due today, with due instant */
  dueToday: { title: string; at: string; href: string }[];
  habitsLeft: number;
}

export interface NextUp {
  kind: NextUpKind;
  prayer?: PrayerType;
  minutes?: number;
  title?: string;
  href?: string;
  count?: number;
}

const ORDER: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Priority: running workout › current prayer not yet recorded › deadline within 6 h › planned workout › habits left › next prayer › evening review. */
export function nextUp(i: NextUpInput): NextUp {
  const n = i.now.getTime();
  if (i.activeWorkout) return { kind: 'workout-active' };
  const passed = ORDER.filter((p) => {
    const at = ms(i.prayerTimes[p] ?? null);
    return at != null && at <= n;
  });
  const current = passed.at(-1);
  if (current && i.prayerStatus[current] === 'not_recorded') return { kind: 'prayer-record', prayer: current };
  const soon = i.dueToday
    .map((d) => ({ ...d, t: Date.parse(d.at) }))
    .filter((d) => d.t >= n && d.t - n <= 6 * 3_600_000)
    .sort((a, b) => a.t - b.t)[0];
  if (soon) return { kind: 'deadline', title: soon.title, href: soon.href, minutes: Math.round((soon.t - n) / 60_000) };
  if (i.plannedWorkout && !i.trainedToday && i.localHour < 22) return { kind: 'workout-planned', title: i.plannedWorkout };
  if (i.habitsLeft > 0 && i.localHour >= 6) return { kind: 'habits', count: i.habitsLeft };
  const upcoming = ORDER.map((p) => ({ p, at: ms(i.prayerTimes[p] ?? null) })).find((x) => x.at != null && x.at > n);
  if (upcoming) return { kind: 'prayer-next', prayer: upcoming.p, minutes: Math.round(((upcoming.at as number) - n) / 60_000) };
  if (i.localHour >= 18) return { kind: 'review' };
  return { kind: 'none' };
}
