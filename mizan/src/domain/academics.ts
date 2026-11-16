import { LocalDate, addDays, localDateOf } from './dates';
import type { Assignment, Grade, Lesson, MasteryStatus } from './types';

export const MASTERY_STATES: MasteryStatus[] = ['not_started', 'learning', 'practicing', 'good', 'mastered'];

export function gradePercent(score: number, max: number): number | null {
  if (!(max > 0) || !Number.isFinite(score)) return null;
  return (score / max) * 100;
}

export type AverageMethod = 'weighted' | 'simple' | 'simple_weights_incomplete';

export interface AverageResult {
  percent: number;
  method: AverageMethod;
  count: number;
  /** Human-readable formula, shown in the UI for transparency. */
  formula: string;
}

/**
 * Average of grades as a percentage.
 * - All grades have a weight  -> weighted mean Σ(pct·w)/Σw.
 * - No weights               -> simple mean of percentages.
 * - Some weights missing     -> simple mean, labelled as such (weights are
 *   ignored rather than guessed).
 */
export function averageGrades(grades: Grade[]): AverageResult | null {
  const valid = grades.filter((g) => !g.deleted_at && gradePercent(g.score, g.max_score) != null);
  if (valid.length === 0) return null;
  const withWeight = valid.filter((g) => g.weight != null && g.weight > 0);
  if (withWeight.length === valid.length) {
    const wsum = valid.reduce((a, g) => a + (g.weight as number), 0);
    const total = valid.reduce((a, g) => a + (gradePercent(g.score, g.max_score) as number) * (g.weight as number), 0);
    return { percent: total / wsum, method: 'weighted', count: valid.length, formula: 'Σ(score/max × 100 × weight) ÷ Σ weight' };
  }
  const mean = valid.reduce((a, g) => a + (gradePercent(g.score, g.max_score) as number), 0) / valid.length;
  return {
    percent: mean,
    method: withWeight.length === 0 ? 'simple' : 'simple_weights_incomplete',
    count: valid.length,
    formula: 'Σ(score/max × 100) ÷ number of grades',
  };
}

export interface GradeTrend {
  direction: 'up' | 'down' | 'flat';
  /** percentage points per grade, least-squares slope */
  slope: number;
  basedOn: number;
}

/** Trend is withheld (null) with fewer than 3 grades — not enough evidence. */
export function gradeTrend(grades: Grade[]): GradeTrend | null {
  const pts = grades
    .filter((g) => !g.deleted_at)
    .sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : 1))
    .map((g) => gradePercent(g.score, g.max_score))
    .filter((p): p is number => p != null);
  if (pts.length < 3) return null;
  const n = pts.length;
  const xm = (n - 1) / 2;
  const ym = pts.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  pts.forEach((y, x) => {
    num += (x - xm) * (y - ym);
    den += (x - xm) ** 2;
  });
  const slope = num / den;
  return { slope, direction: Math.abs(slope) < 1 ? 'flat' : slope > 0 ? 'up' : 'down', basedOn: n };
}

export function isAssignmentOpen(a: Assignment): boolean {
  return !a.deleted_at && a.status !== 'completed' && a.status !== 'skipped' && a.status !== 'archived';
}

export function isAssignmentOverdue(a: Assignment, now: Date): boolean {
  return isAssignmentOpen(a) && new Date(a.due_at).getTime() < now.getTime();
}

export function masteryDistribution(lessons: Lesson[]): Record<MasteryStatus, number> {
  const out = { not_started: 0, learning: 0, practicing: 0, good: 0, mastered: 0 } as Record<MasteryStatus, number>;
  for (const l of lessons) if (!l.deleted_at) out[l.mastery_status]++;
  return out;
}

/** Open assignment workload (minutes and count) per local day for `days` days from `from`. */
export function workloadByDay(assignments: Assignment[], from: LocalDate, days: number, timeZone: string) {
  const out: { date: LocalDate; count: number; minutes: number; unestimated: number }[] = [];
  for (let i = 0; i < days; i++) out.push({ date: addDays(from, i), count: 0, minutes: 0, unestimated: 0 });
  for (const a of assignments) {
    if (!isAssignmentOpen(a)) continue;
    const d = localDateOf(a.due_at, timeZone);
    const slot = out.find((o) => o.date === d);
    if (!slot) continue;
    slot.count++;
    if (a.estimate_minutes) slot.minutes += a.estimate_minutes;
    else slot.unestimated++;
  }
  return out;
}

/** Gap between current average and a target (percentage points); null when either is unknown. */
export function targetGap(current: AverageResult | null, target: number | null | undefined): number | null {
  if (!current || target == null) return null;
  return target - current.percent;
}
