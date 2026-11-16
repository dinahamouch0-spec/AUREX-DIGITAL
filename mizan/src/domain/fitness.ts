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
