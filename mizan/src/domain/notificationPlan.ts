/**
 * Pure planning of device notifications (what to schedule, when).
 * Delivery is handled by data/notifications.ts. Keeping this pure lets the
 * combined-prayer and quiet-hours rules be unit tested.
 */
import { LocalDate, addDays, localTimeOf, parseLocalDate, weekdayOf, zonedToUtc } from './dates';
import { dayPrayerSummary } from './deen';
import { PRAYER_ALERT_GROUPS, PrayerCalcSettings, computePrayerTimes } from './prayerTimes';
import type { Domain, PrayerLog, Reminder } from './types';

export interface PlannedNotification {
  id: string;
  at: string; // ISO
  titleKey: string;
  bodyKey?: string;
  title?: string;
  domain: Domain | 'system';
}

export interface PlanInput {
  now: Date;
  today: LocalDate;
  timeZone: string;
  days: number;
  prayer: PrayerCalcSettings | null;
  prayerFollowUpMinutes: number | null;
  prayerLogs: PrayerLog[];
  reminders: Reminder[];
  quietStart: string | null;
  quietEnd: string | null;
  channels: Record<string, boolean>;
  reviews: { daily: boolean; weekly: boolean; monthly: boolean; time: string };
  max: number;
}

export function inQuietHours(iso: string, tz: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const t = localTimeOf(iso, tz);
  return start <= end ? t >= start && t < end : t >= start || t < end;
}

const GROUP_TEXT: Record<string, string> = {
  fajr: 'notif.prayerFajr',
  dhuhr_asr: 'notif.prayerDhuhrAsr',
  maghrib_isha: 'notif.prayerMaghribIsha',
};

export function planNotifications(p: PlanInput): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const nowIso = p.now.toISOString();
  const future = (iso: string | null | undefined): iso is string => !!iso && iso > nowIso;

  for (let i = 0; i < p.days; i++) {
    const date = addDays(p.today, i);
    if (p.prayer && p.channels.deen !== false) {
      const times = computePrayerTimes(date, p.prayer).times;
      const summary = dayPrayerSummary(p.prayerLogs, date);
      for (const g of PRAYER_ALERT_GROUPS) {
        const at = times[g.at];
        // One alert per group; each prayer is still recorded separately.
        if (future(at)) out.push({ id: `prayer:${date}:${g.id}`, at, titleKey: GROUP_TEXT[g.id], domain: 'deen' });
        if (p.prayerFollowUpMinutes && at) {
          const allRecorded = g.prayers.every((pr) => summary.statuses[pr] !== 'not_recorded');
          const fu = new Date(new Date(at).getTime() + p.prayerFollowUpMinutes * 60000).toISOString();
          if (!allRecorded && future(fu)) out.push({ id: `prayer-followup:${date}:${g.id}`, at: fu, titleKey: GROUP_TEXT[g.id], bodyKey: 'notif.prayerFollowUp', domain: 'deen' });
        }
      }
    }
    if (p.channels.system !== false) {
      const at = zonedToUtc(date, p.reviews.time, p.timeZone).toISOString();
      // blueprint 09 §9: daily evening review, weekly on Sunday, monthly on the 1st
      if (p.reviews.daily && future(at)) out.push({ id: `review:daily:${date}`, at, titleKey: 'home.eveningReview', domain: 'system' });
      if (p.reviews.weekly && weekdayOf(date) === 0 && future(at)) out.push({ id: `review:weekly:${date}`, at, titleKey: 'setn.weeklyTitle', domain: 'system' });
      if (p.reviews.monthly && parseLocalDate(date).d === 1 && future(at)) out.push({ id: `review:monthly:${date}`, at, titleKey: 'setn.monthlyTitle', domain: 'system' });
    }
  }

  const horizon = zonedToUtc(addDays(p.today, p.days), '00:00', p.timeZone).toISOString();
  for (const r of p.reminders) {
    if (r.status !== 'active' || r.deleted_at || p.channels[r.domain] === false) continue;
    let at = r.scheduled_at;
    const step = r.recurrence === 'daily' ? 1 : r.recurrence === 'weekly' ? 7 : 0;
    let guard = 0;
    while (step > 0 && at <= nowIso && guard++ < 400) at = new Date(new Date(at).getTime() + step * 86400000).toISOString();
    do {
      if (future(at) && at < horizon && !inQuietHours(at, p.timeZone, p.quietStart, p.quietEnd)) {
        out.push({ id: `reminder:${r.id}:${at}`, at, titleKey: '', title: r.title, domain: r.domain });
      }
      at = new Date(new Date(at).getTime() + step * 86400000).toISOString();
    } while (step > 0 && at < horizon);
  }

  return out.sort((a, b) => a.at.localeCompare(b.at)).slice(0, p.max);
}
