/**
 * Structured workout programs: named training days, each with an ordered list of
 * exercises and a sets/reps/rest prescription, assigned to weekdays.
 *
 * Stored in workout_programs.days_json. schedule_json (weekday → day name) is kept
 * in sync because the dashboard and Perfect Days use it to tell rest days apart.
 */
import { CATALOG_BY_ID } from './exerciseCatalog';

export interface ProgramExercise {
  exercise_id: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
}

export interface ProgramDay {
  id: string;
  name: string;
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  exercises: ProgramExercise[];
}

export type TemplateId = 'ppl' | 'upper_lower' | 'full_body';
export const TEMPLATE_IDS: TemplateId[] = ['ppl', 'upper_lower', 'full_body'];

/** Prescription defaults come from the catalog's guideline ranges. */
export function defaultPrescription(exerciseId: string): Omit<ProgramExercise, 'exercise_id'> {
  const ex = CATALOG_BY_ID.get(exerciseId);
  if (!ex) return { sets: 3, reps_min: 8, reps_max: 12, rest_seconds: 90 };
  const p = ex.prescription;
  return { sets: p.sets[0], reps_min: p.reps[0], reps_max: p.reps[1], rest_seconds: p.rest[0] };
}

const ex = (id: string): ProgramExercise => ({ exercise_id: `builtin:${id}`, ...defaultPrescription(`builtin:${id}`) });

interface TemplateDay {
  key: string;
  weekdays: number[];
  exercises: string[];
}

/** Templates are starting points; every value can be edited after creation. Weekdays assume a Mon-start week. */
export const TEMPLATES: Record<TemplateId, TemplateDay[]> = {
  ppl: [
    { key: 'push', weekdays: [1, 4], exercises: ['bench_press', 'incline_db_press', 'db_press', 'lateral_raise', 'triceps_pushdown', 'overhead_triceps_extension'] },
    { key: 'pull', weekdays: [2, 5], exercises: ['pull_up', 'barbell_row', 'seated_cable_row', 'face_pull', 'bicep_curl', 'hammer_curl'] },
    { key: 'legs', weekdays: [3, 6], exercises: ['back_squat', 'deadlift', 'leg_press', 'lying_leg_curl', 'calf_raise', 'plank'] },
  ],
  upper_lower: [
    { key: 'upper', weekdays: [1, 4], exercises: ['bench_press', 'barbell_row', 'db_press', 'lat_pulldown', 'bicep_curl', 'triceps_pushdown'] },
    { key: 'lower', weekdays: [2, 5], exercises: ['back_squat', 'deadlift', 'bulgarian_split_squat', 'lying_leg_curl', 'calf_raise', 'hanging_knee_raise'] },
  ],
  full_body: [
    { key: 'full_a', weekdays: [1, 5], exercises: ['back_squat', 'bench_press', 'barbell_row', 'db_press', 'plank'] },
    { key: 'full_b', weekdays: [3], exercises: ['deadlift', 'incline_db_press', 'lat_pulldown', 'lunge', 'calf_raise'] },
  ],
};

export function buildTemplate(id: TemplateId, nameOf: (key: string) => string, newId: () => string): ProgramDay[] {
  return TEMPLATES[id].map((d) => ({ id: newId(), name: nameOf(d.key), weekdays: [...d.weekdays], exercises: d.exercises.map(ex) }));
}

/** weekday → day name, for code that only needs to know "training or rest" and a label. */
export function scheduleFromDays(days: ProgramDay[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of days) for (const w of d.weekdays) if (!(String(w) in out)) out[String(w)] = d.name;
  return out;
}

export function dayForWeekday(days: ProgramDay[] | null | undefined, weekday: number): ProgramDay | null {
  return days?.find((d) => d.weekdays.includes(weekday)) ?? null;
}

export function moveExercise(day: ProgramDay, index: number, delta: -1 | 1): ProgramDay {
  const j = index + delta;
  if (index < 0 || j < 0 || index >= day.exercises.length || j >= day.exercises.length) return day;
  const list = [...day.exercises];
  [list[index], list[j]] = [list[j], list[index]];
  return { ...day, exercises: list };
}

export function removeExercise(day: ProgramDay, index: number): ProgramDay {
  return { ...day, exercises: day.exercises.filter((_, i) => i !== index) };
}

export function addExercise(day: ProgramDay, exerciseId: string): ProgramDay {
  return { ...day, exercises: [...day.exercises, { exercise_id: exerciseId, ...defaultPrescription(exerciseId) }] };
}

export function updateExercise(day: ProgramDay, index: number, patch: Partial<Omit<ProgramExercise, 'exercise_id'>>): ProgramDay {
  return { ...day, exercises: day.exercises.map((e, i) => (i === index ? normalizePrescription({ ...e, ...patch }) : e)) };
}

export function normalizePrescription(e: ProgramExercise): ProgramExercise {
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(n) ? n : lo)));
  const sets = clamp(e.sets, 1, 20);
  const reps_min = clamp(e.reps_min, 1, 300);
  const reps_max = clamp(Math.max(e.reps_max, reps_min), reps_min, 300);
  return { ...e, sets, reps_min, reps_max, rest_seconds: clamp(e.rest_seconds, 0, 900) };
}

/** A weekday may belong to only one day; assigning it moves it. */
export function toggleWeekday(days: ProgramDay[], dayId: string, weekday: number): ProgramDay[] {
  const target = days.find((d) => d.id === dayId);
  if (!target) return days;
  const on = !target.weekdays.includes(weekday);
  return days.map((d) =>
    d.id === dayId
      ? { ...d, weekdays: on ? [...d.weekdays, weekday].sort((a, b) => a - b) : d.weekdays.filter((w) => w !== weekday) }
      : on
        ? { ...d, weekdays: d.weekdays.filter((w) => w !== weekday) }
        : d,
  );
}

export function isValidDays(x: unknown): x is ProgramDay[] {
  return (
    Array.isArray(x) &&
    x.every(
      (d) =>
        d && typeof d.id === 'string' && typeof d.name === 'string' && Array.isArray(d.weekdays) && d.weekdays.every((w: unknown) => Number.isInteger(w) && (w as number) >= 0 && (w as number) <= 6) &&
        Array.isArray(d.exercises) && d.exercises.every((e: ProgramExercise) => e && typeof e.exercise_id === 'string' && e.sets >= 1 && e.reps_min >= 1 && e.reps_max >= e.reps_min && e.rest_seconds >= 0),
    )
  );
}
