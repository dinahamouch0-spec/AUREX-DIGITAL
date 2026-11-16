import { LocalDate, dateRange } from './dates';
import { PRAYERS, PrayerType } from './prayerTimes';
import type { PrayerDisplayStatus, PrayerLog } from './types';

/**
 * Display status of one prayer on one day. Absence of a record is
 * "not_recorded" — never inferred as missed (blueprint 05 §2).
 */
export function prayerStatusFor(logs: PrayerLog[], date: LocalDate, prayer: PrayerType): PrayerDisplayStatus {
  const log = findPrayerLog(logs, date, prayer);
  return log ? log.status : 'not_recorded';
}

export function findPrayerLog(logs: PrayerLog[], date: LocalDate, prayer: PrayerType): PrayerLog | undefined {
  // If duplicates exist (e.g. two devices offline), the most recently updated wins for display.
  let best: PrayerLog | undefined;
  for (const l of logs) {
    if (l.deleted_at || l.local_date !== date || l.prayer_type !== prayer) continue;
    if (!best || l.updated_at > best.updated_at) best = l;
  }
  return best;
}

export interface DayPrayerSummary {
  date: LocalDate;
  statuses: Record<PrayerType, PrayerDisplayStatus>;
  performed: number;
  missed: number;
  excused: number;
  notRecorded: number;
}

export function dayPrayerSummary(logs: PrayerLog[], date: LocalDate): DayPrayerSummary {
  const statuses = {} as Record<PrayerType, PrayerDisplayStatus>;
  const s: DayPrayerSummary = { date, statuses, performed: 0, missed: 0, excused: 0, notRecorded: 0 };
  for (const p of PRAYERS) {
    const st = prayerStatusFor(logs, date, p);
    statuses[p] = st;
    if (st === 'performed') s.performed++;
    else if (st === 'missed') s.missed++;
    else if (st === 'excused') s.excused++;
    else s.notRecorded++;
  }
  return s;
}

export function rangePrayerSummary(logs: PrayerLog[], from: LocalDate, to: LocalDate) {
  const days = dateRange(from, to).map((d) => dayPrayerSummary(logs, d));
  const totals = days.reduce(
    (acc, d) => {
      acc.performed += d.performed;
      acc.missed += d.missed;
      acc.excused += d.excused;
      acc.notRecorded += d.notRecorded;
      return acc;
    },
    { performed: 0, missed: 0, excused: 0, notRecorded: 0 },
  );
  return { days, totals, slots: days.length * PRAYERS.length };
}
