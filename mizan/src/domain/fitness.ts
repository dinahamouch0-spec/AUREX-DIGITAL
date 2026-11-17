import type { Exercise, MealItem, WorkoutSet } from './types';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const ML_PER_FL_OZ = 29.5735295625;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const inToCm = (inch: number) => inch * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const flOzToMl = (oz: number) => oz * ML_PER_FL_OZ;

export function setLoadKg(set: Pick<WorkoutSet, 'load_value' | 'load_unit'>): number {
  if (set.load_value == null) return 0;
  return set.load_unit === 'lb' ? lbToKg(set.load_value) : set.load_value;
}

/** Training volume = Σ reps × load (kg). Bodyweight sets contribute 0 load volume. */
export function trainingVolumeKg(sets: WorkoutSet[]): number {
  return sets.filter((s) => !s.deleted_at).reduce((a, s) => a + s.reps * setLoadKg(s), 0);
}

export interface PersonalRecord {
  exercise_id: string;
  heaviestKg: number | null;
  heaviestSetId: string | null;
  mostReps: number;
  mostRepsSetId: string | null;
}

export function personalRecords(sets: WorkoutSet[]): Map<string, PersonalRecord> {
  const out = new Map<string, PersonalRecord>();
  for (const s of sets) {
    if (s.deleted_at) continue;
    let pr = out.get(s.exercise_id);
    if (!pr) {
      pr = { exercise_id: s.exercise_id, heaviestKg: null, heaviestSetId: null, mostReps: 0, mostRepsSetId: null };
      out.set(s.exercise_id, pr);
    }
    const kg = s.load_value != null ? setLoadKg(s) : null;
    if (kg != null && (pr.heaviestKg == null || kg > pr.heaviestKg)) {
      pr.heaviestKg = kg;
      pr.heaviestSetId = s.id;
    }
    if (s.reps > pr.mostReps) {
      pr.mostReps = s.reps;
      pr.mostRepsSetId = s.id;
    }
  }
  return out;
}

/** Sets per primary muscle group. */
export function muscleDistribution(sets: WorkoutSet[], exercises: Map<string, Pick<Exercise, 'primary_muscles'>>) {
  const out = new Map<string, number>();
  for (const s of sets) {
    if (s.deleted_at) continue;
    const ex = exercises.get(s.exercise_id);
    if (!ex) continue;
    for (const m of ex.primary_muscles.split(',').map((x) => x.trim()).filter(Boolean)) {
      out.set(m, (out.get(m) ?? 0) + 1);
    }
  }
  return out;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** items with no calorie data — totals are incomplete if > 0 */
  itemsMissingData: number;
  /** items whose values are estimates */
  estimatedItems: number;
  items: number;
}

/** Totals from meal-item snapshots. Values are per logged quantity (already multiplied). */
export function nutritionTotals(items: MealItem[]): NutritionTotals {
  const t: NutritionTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, itemsMissingData: 0, estimatedItems: 0, items: 0 };
  for (const i of items) {
    if (i.deleted_at) continue;
    t.items++;
    if (i.calories == null) t.itemsMissingData++;
    if (i.source !== 'package_label') t.estimatedItems++;
    t.calories += i.calories ?? 0;
    t.protein_g += i.protein_g ?? 0;
    t.carbs_g += i.carbs_g ?? 0;
    t.fat_g += i.fat_g ?? 0;
  }
  return t;
}

/** Scale a food's per-serving nutrition by quantity, rounding to 1 decimal. */
export function scaleNutrition(value: number | null | undefined, quantity: number): number | null {
  if (value == null) return null;
  return Math.round(value * quantity * 10) / 10;
}

/**
 * Overload suggestion: if every set of the last session for an exercise hit
 * at least `targetReps`, suggest a small load increase. Requires ≥2 sessions
 * of data and is always a suggestion for the user to accept or ignore.
 */
export function overloadSuggestion(
  sessions: WorkoutSet[][],
  targetReps: number,
): { suggestIncrease: boolean; basedOnSessions: number } | null {
  const valid = sessions.filter((s) => s.length > 0);
  if (valid.length < 2) return null;
  const last = valid[valid.length - 1];
  return { suggestIncrease: last.every((s) => s.reps >= targetReps), basedOnSessions: valid.length };
}

// ------------------------------------------------------------------ strength analytics

/** Estimated one-rep max (Epley). Only meaningful for 1–12 reps with a load; otherwise null. */
export function estimatedOneRepMax(loadKg: number, reps: number): number | null {
  if (!(loadKg > 0) || !(reps >= 1) || reps > 12) return null;
  return reps === 1 ? loadKg : Math.round(loadKg * (1 + reps / 30) * 10) / 10;
}

export interface ExerciseSession {
  workoutId: string;
  date: string;
  sets: WorkoutSet[];
  topKg: number | null;
  bestE1rm: number | null;
  totalReps: number;
  volumeKg: number;
}

/** Completed sessions containing the exercise, oldest first. */
export function exerciseHistory(
  exerciseId: string,
  workouts: { id: string; started_at: string; status: string; deleted_at?: string | null }[],
  sets: WorkoutSet[],
  dateOf: (iso: string) => string,
): ExerciseSession[] {
  return workouts
    .filter((w) => !w.deleted_at && w.status === 'completed')
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .map((w) => {
      const ss = sets.filter((s) => !s.deleted_at && s.workout_id === w.id && s.exercise_id === exerciseId);
      const kgs = ss.filter((s) => s.load_value != null).map(setLoadKg);
      const e1 = ss.map((s) => estimatedOneRepMax(setLoadKg(s), s.reps)).filter((x): x is number => x != null);
      return {
        workoutId: w.id,
        date: dateOf(w.started_at),
        sets: ss,
        topKg: kgs.length ? Math.max(...kgs) : null,
        bestE1rm: e1.length ? Math.max(...e1) : null,
        totalReps: ss.reduce((a, s) => a + s.reps, 0),
        volumeKg: Math.round(trainingVolumeKg(ss)),
      };
    })
    .filter((s) => s.sets.length > 0);
}

export type PRKind = 'weight' | 'reps' | 'e1rm';

/** Which records a new set would beat, compared with all earlier sets of the same exercise. */
export function newRecords(candidate: Pick<WorkoutSet, 'reps' | 'load_value' | 'load_unit'>, previous: WorkoutSet[]): PRKind[] {
  const prev = previous.filter((s) => !s.deleted_at);
  if (!prev.length) return [];
  const kg = candidate.load_value != null ? setLoadKg(candidate) : null;
  const out: PRKind[] = [];
  const prevKg = prev.filter((s) => s.load_value != null).map(setLoadKg);
  if (kg != null && kg > 0 && prevKg.length && kg > Math.max(...prevKg)) out.push('weight');
  // rep PR at the same or heavier load
  const sameOrHeavier = prev.filter((s) => (kg == null ? s.load_value == null : s.load_value != null && setLoadKg(s) >= kg));
  if (sameOrHeavier.length && candidate.reps > Math.max(...sameOrHeavier.map((s) => s.reps))) out.push('reps');
  const e1 = kg != null ? estimatedOneRepMax(kg, candidate.reps) : null;
  const prevE1 = prev.map((s) => estimatedOneRepMax(setLoadKg(s), s.reps)).filter((x): x is number => x != null);
  if (e1 != null && prevE1.length && e1 > Math.max(...prevE1)) out.push('e1rm');
  return out;
}

export interface WeekStat {
  weekStart: string;
  sessions: number;
  volumeKg: number;
  sets: number;
}

/** Sessions, sets and volume per week for the last `weeks` weeks (oldest first). */
export function weeklyTraining(
  workouts: { id: string; started_at: string; status: string; deleted_at?: string | null }[],
  sets: WorkoutSet[],
  weekStarts: string[],
  weekOf: (iso: string) => string,
): WeekStat[] {
  const byWeek = new Map<string, WeekStat>(weekStarts.map((w) => [w, { weekStart: w, sessions: 0, volumeKg: 0, sets: 0 }]));
  const wkOfWorkout = new Map<string, string>();
  for (const w of workouts) {
    if (w.deleted_at || w.status !== 'completed') continue;
    const wk = weekOf(w.started_at);
    const st = byWeek.get(wk);
    if (!st) continue;
    st.sessions++;
    wkOfWorkout.set(w.id, wk);
  }
  for (const s of sets) {
    if (s.deleted_at) continue;
    const wk = wkOfWorkout.get(s.workout_id);
    if (!wk) continue;
    const st = byWeek.get(wk)!;
    st.sets++;
    st.volumeKg += s.reps * setLoadKg(s);
  }
  return weekStarts.map((w) => ({ ...byWeek.get(w)!, volumeKg: Math.round(byWeek.get(w)!.volumeKg) }));
}
