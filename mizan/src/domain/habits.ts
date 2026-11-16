import { LocalDate, dateRange, startOfWeek, weekdayOf } from './dates';
import type { Habit, HabitDayStatus, HabitLog, HabitLogStatus } from './types';

/** Whether a habit is expected on a given day. times_per_week habits may be done any day. */
export function isScheduledOn(habit: Habit, date: LocalDate): boolean {
  if (habit.status !== 'active') return false;
  if (habit.schedule_type === 'daily') return true;
  if (habit.schedule_type === 'weekdays') return (habit.schedule_days ?? []).includes(weekdayOf(date));
  return true;
}

export function latestLog(logs: HabitLog[], habitId: string, date: LocalDate): HabitLog | undefined {
  let best: HabitLog | undefined;
  for (const l of logs) {
    if (l.deleted_at || l.habit_id !== habitId || l.local_date !== date) continue;
    if (!best || l.updated_at > best.updated_at) best = l;
  }
  return best;
}

/** A missing log is "not_recorded", never a failure (blueprint 09 §1). */
export function habitDayStatus(habit: Habit, logs: HabitLog[], date: LocalDate): HabitDayStatus {
  const log = latestLog(logs, habit.id, date);
  if (log) return log.status;
  if (habit.schedule_type === 'weekdays' && !(habit.schedule_days ?? []).includes(weekdayOf(date))) return 'not_scheduled';
  return 'not_recorded';
}

export interface HabitSummary {
  from: LocalDate;
  to: LocalDate;
  scheduledDays: number;
  counts: Record<HabitLogStatus | 'not_recorded', number>;
  /** completed / (days that have any record); null if nothing recorded. */
  completionOfRecorded: number | null;
  /** For times_per_week habits: weeks where the target was reached. */
  weeksOnTarget?: { reached: number; weeks: number };
}

export function habitSummary(habit: Habit, logs: HabitLog[], from: LocalDate, to: LocalDate, weekStart = 1): HabitSummary {
  const counts = { completed: 0, partial: 0, skipped: 0, deferred: 0, paused: 0, not_recorded: 0 };
  let scheduledDays = 0;
  for (const d of dateRange(from, to)) {
    const st = habitDayStatus(habit, logs, d);
    if (st === 'not_scheduled') continue;
    if (habit.schedule_type === 'times_per_week' && st === 'not_recorded') continue;
    scheduledDays++;
    counts[st]++;
  }
  const recorded = counts.completed + counts.partial + counts.skipped + counts.deferred + counts.paused;
  const summary: HabitSummary = {
    from,
    to,
    scheduledDays,
    counts,
    completionOfRecorded: recorded > 0 ? counts.completed / recorded : null,
  };
  if (habit.schedule_type === 'times_per_week' && habit.times_per_week) {
    const weeks = new Map<LocalDate, number>();
    for (const d of dateRange(from, to)) {
      const ws = startOfWeek(d, weekStart);
      if (!weeks.has(ws)) weeks.set(ws, 0);
      if (habitDayStatus(habit, logs, d) === 'completed') weeks.set(ws, (weeks.get(ws) ?? 0) + 1);
    }
    let reached = 0;
    for (const v of weeks.values()) if (v >= habit.times_per_week) reached++;
    summary.weeksOnTarget = { reached, weeks: weeks.size };
  }
  return summary;
}

/** Completed count in the current week, for times_per_week habits. */
export function completedThisWeek(habit: Habit, logs: HabitLog[], today: LocalDate, weekStart = 1): number {
  const ws = startOfWeek(today, weekStart);
  return dateRange(ws, today).filter((d) => habitDayStatus(habit, logs, d) === 'completed').length;
}
