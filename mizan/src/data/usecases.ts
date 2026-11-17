/**
 * Application use cases: multi-step operations behind one-tap actions.
 * UI calls these instead of writing records ad hoc (blueprint 02 §2).
 */
import { LocalDate, addDays, localDateOf } from '../domain/dates';
import { DayStatus, StreakSummary, computeStreaks, daysToSeal, liveStatus, sealTime, validateDefinition } from '../domain/perfectDays';
import { findPrayerLog } from '../domain/deen';
import { latestLog } from '../domain/habits';
import { scaleNutrition } from '../domain/fitness';
import type { CatalogFood } from '../domain/foodCatalog';
import { Macros, RecipeIngredient, macrosForGrams, recipePerServing, roundMacros, scaleMacros } from '../domain/nutrition';
import { ProgramDay, TemplateId, buildTemplate, scheduleFromDays } from '../domain/programs';
import type { PrayerType } from '../domain/prayerTimes';
import type { DealStage, FoodItem, Habit, MealType, Recipe, WorkoutProgram, HabitLogStatus, PerfectCriterion, PrayerStatus, Routine, Workout } from '../domain/types';
import type { Store } from './store';

/** Set (or clear) one prayer's record for a day. Each prayer is independent. */
export function setPrayerStatus(store: Store, date: LocalDate, prayer: PrayerType, status: PrayerStatus | null, now: Date, timeZone: string) {
  const existing = findPrayerLog(store.list('prayer_logs'), date, prayer);
  if (status == null) {
    if (existing) return store.remove('prayer_logs', existing.id);
    return () => undefined;
  }
  const performed_at = status === 'performed' && localDateOf(now, timeZone) === date ? now.toISOString() : null;
  if (existing) {
    const prev = { status: existing.status, performed_at: existing.performed_at ?? null };
    store.update('prayer_logs', existing.id, { status, performed_at: status === 'performed' ? (existing.performed_at ?? performed_at) : null });
    return () => store.update('prayer_logs', existing.id, prev);
  }
  const row = store.insert('prayer_logs', { prayer_type: prayer, local_date: date, status, performed_at });
  return () => store.remove('prayer_logs', row.id);
}

/** Save a tasbih/istighfar count as an adhkar log. */
export function saveDhikrCount(store: Store, category: 'tasbih' | 'istighfar', count: number, now: Date) {
  if (!Number.isInteger(count) || count <= 0) throw new Error('invalid_count');
  return store.insert('adhkar_logs', { category, count, completed_at: now.toISOString() });
}

/** One-tap or detailed habit check-in. `null` clears the day's record. */
export function logHabit(store: Store, habit: Habit, date: LocalDate, status: HabitLogStatus | null, now: Date, detail: { quantity?: number | null; duration_minutes?: number | null; note?: string | null } = {}) {
  const existing = latestLog(store.list('habit_logs'), habit.id, date);
  if (status == null) {
    if (existing) store.remove('habit_logs', existing.id);
    return;
  }
  if (existing) store.update('habit_logs', existing.id, { status, ...detail });
  else store.insert('habit_logs', { habit_id: habit.id, local_date: date, status, logged_at: now.toISOString(), ...detail });
}

/** Cycle used by the one-tap button: not recorded → done → not recorded. */
export function toggleHabitDone(store: Store, habit: Habit, date: LocalDate, now: Date) {
  const existing = latestLog(store.list('habit_logs'), habit.id, date);
  logHabit(store, habit, date, existing?.status === 'completed' ? null : 'completed', now);
}

// ---------------------------------------------------------------- workouts
export function activeWorkout(store: Store): Workout | undefined {
  return store
    .list('workouts')
    .filter((w) => w.status === 'in_progress')
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
}

export function startWorkout(store: Store, title: string, now: Date, programId?: string | null): Workout {
  const existing = activeWorkout(store);
  if (existing) return existing;
  return store.insert('workouts', { title: title.trim() || 'Workout', started_at: now.toISOString(), status: 'in_progress', program_id: programId ?? null });
}

export function addSet(store: Store, workoutId: string, exerciseId: string, reps: number, load: number | null, unit: 'kg' | 'lb', rpe?: number | null) {
  const n = store.list('workout_sets').filter((s) => s.workout_id === workoutId && s.exercise_id === exerciseId).length;
  return store.insert('workout_sets', { workout_id: workoutId, exercise_id: exerciseId, set_number: n + 1, reps, load_value: load, load_unit: unit, rpe: rpe ?? null });
}

export function finishWorkout(store: Store, workoutId: string, now: Date) {
  return store.update('workouts', workoutId, { status: 'completed', ended_at: now.toISOString() });
}

// ---------------------------------------------------------------- nutrition
export function addFoodToMeal(store: Store, mealId: string, food: FoodItem, quantity: number) {
  return store.insert('meal_items', {
    meal_id: mealId,
    food_item_id: food.id,
    custom_name: food.name,
    quantity,
    calories: scaleNutrition(food.calories, quantity),
    protein_g: scaleNutrition(food.protein_g, quantity),
    carbs_g: scaleNutrition(food.carbs_g, quantity),
    fat_g: scaleNutrition(food.fat_g, quantity),
    source: food.source,
  });
}

/** Log a built-in food by weight. `servings`/`label` only describe how the user entered it. */
export function addCatalogFoodToMeal(store: Store, mealId: string, food: CatalogFood, grams: number, name: string) {
  if (!(grams > 0) || grams > 5000) throw new Error('invalid_amount');
  const m = macrosForGrams(food, grams);
  return store.insert('meal_items', {
    meal_id: mealId,
    custom_name: name,
    catalog_food_id: food.id,
    grams: Math.round(grams * 10) / 10,
    quantity: Math.max(0.01, Math.round((grams / 100) * 100) / 100),
    calories: m.kcal,
    protein_g: m.protein,
    carbs_g: m.carbs,
    fat_g: m.fat,
    source: 'estimate',
  });
}

/** Log `portions` servings of a recipe as one meal item (values = per-serving × portions). */
export function addRecipeToMeal(store: Store, mealId: string, recipe: Recipe, portions: number) {
  if (!(portions > 0) || portions > 100) throw new Error('invalid_amount');
  const m = roundMacros(scaleMacros(recipePerServing(recipe.ingredients_json ?? [], recipe.servings), portions));
  return store.insert('meal_items', { meal_id: mealId, custom_name: recipe.name, quantity: portions, calories: m.kcal, protein_g: m.protein, carbs_g: m.carbs, fat_g: m.fat, source: 'estimate' });
}

/** Find today's meal of a type or create it, so "add to Lunch" is one tap. */
export function mealFor(store: Store, type: MealType, date: LocalDate, now: Date, timeZone: string) {
  const existing = store
    .list('meals')
    .filter((m) => m.meal_type === type && localDateOf(m.logged_at, timeZone) === date)
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))[0];
  if (existing) return existing;
  const at = localDateOf(now, timeZone) === date ? now.toISOString() : new Date(`${date}T12:00:00Z`).toISOString();
  return store.insert('meals', { meal_type: type, logged_at: at });
}

/** Turn a logged meal into a reusable recipe (one serving = the whole meal). */
export function saveMealAsRecipe(store: Store, mealId: string, name: string) {
  const items = store.list('meal_items').filter((i) => i.meal_id === mealId);
  if (!items.length) throw new Error('empty');
  const ingredients: RecipeIngredient[] = items.map((i) => ({
    ref: i.catalog_food_id ?? i.food_item_id ?? 'custom',
    name: i.custom_name ?? '',
    amount: i.grams ?? i.quantity,
    unit: i.grams ? 'g' : 'serving',
    kcal: i.calories ?? 0,
    protein: i.protein_g ?? 0,
    carbs: i.carbs_g ?? 0,
    fat: i.fat_g ?? 0,
  }));
  return store.insert('recipes', { name: name.trim(), servings: 1, ingredients_json: ingredients });
}

export function ingredientFromCatalog(food: CatalogFood, grams: number, name: string): RecipeIngredient {
  const m: Macros = macrosForGrams(food, grams);
  return { ref: food.id, name, amount: grams, unit: 'g', kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat };
}

// ---------------------------------------------------------------- programs
export function createProgramFromTemplate(store: Store, template: TemplateId, name: string, nameOf: (key: string) => string, newId: () => string, activate: boolean) {
  const days = buildTemplate(template, nameOf, newId);
  if (activate) for (const p of store.list('workout_programs')) if (p.is_active) store.update('workout_programs', p.id, { is_active: false });
  return store.insert('workout_programs', { name: name.trim(), is_active: activate, days_json: days, schedule_json: scheduleFromDays(days) });
}

export function saveProgramDays(store: Store, programId: string, days: ProgramDay[]): WorkoutProgram {
  return store.update('workout_programs', programId, { days_json: days, schedule_json: scheduleFromDays(days) });
}

/** Copy a saved meal (with its items) to now. */
export function repeatMeal(store: Store, mealId: string, now: Date) {
  const meal = store.get('meals', mealId);
  if (!meal) throw new Error('not_found');
  const copy = store.insert('meals', { meal_type: meal.meal_type, logged_at: now.toISOString(), note: meal.note ?? null });
  for (const it of store.list('meal_items').filter((i) => i.meal_id === mealId)) {
    const { id: _id, created_at: _c, updated_at: _u, deleted_at: _d, _server_updated_at: _s, user_id: _uid, ...rest } = it as unknown as Record<string, unknown>;
    void _id; void _c; void _u; void _d; void _s; void _uid;
    store.insert('meal_items', { ...rest, meal_id: copy.id });
  }
  return copy;
}

// ---------------------------------------------------------------- routines
export function startRoutine(store: Store, routine: Routine, date: LocalDate, now: Date) {
  const open = store.list('routine_logs').find((l) => l.routine_id === routine.id && l.local_date === date && l.status === 'in_progress');
  if (open) return open;
  return store.insert('routine_logs', { routine_id: routine.id, local_date: date, started_at: now.toISOString(), status: 'in_progress' });
}

export function setRoutineStep(store: Store, routineLogId: string, stepId: string, status: 'completed' | 'skipped' | 'deferred' | null, now: Date) {
  const existing = store.list('routine_step_logs').find((s) => s.routine_log_id === routineLogId && s.routine_step_id === stepId);
  if (status == null) {
    if (existing) store.remove('routine_step_logs', existing.id);
    return;
  }
  const completed_at = status === 'completed' ? now.toISOString() : null;
  if (existing) store.update('routine_step_logs', existing.id, { status, completed_at });
  else store.insert('routine_step_logs', { routine_log_id: routineLogId, routine_step_id: stepId, status, completed_at });
}

export function finishRoutine(store: Store, routineLogId: string, now: Date) {
  const log = store.get('routine_logs', routineLogId);
  if (!log) throw new Error('not_found');
  const steps = store.list('routine_steps').filter((s) => s.routine_id === log.routine_id);
  const done = store.list('routine_step_logs').filter((s) => s.routine_log_id === routineLogId && s.status === 'completed').length;
  const status = steps.length > 0 && done === steps.length ? 'completed' : done > 0 ? 'partial' : 'skipped';
  return store.update('routine_logs', routineLogId, { status, completed_at: now.toISOString() });
}

// ---------------------------------------------------------------- academics / business
/** Explicit, user-initiated reschedule (never automatic). */
export function moveStudySession(store: Store, id: string, date: LocalDate) {
  return store.update('study_sessions', id, { planned_date: date, status: 'not_started' });
}

export function moveDealStage(store: Store, id: string, stage: DealStage) {
  return store.update('deals', id, { stage });
}

// ---------------------------------------------------------------- perfect days

/** New definition always takes effect today — it can't be backdated to rewrite history. */
export function savePerfectDayDefinition(store: Store, criteria: PerfectCriterion[], now: Date, timeZone: string) {
  const err = validateDefinition(criteria);
  if (err) throw new Error(err);
  return store.insert('perfect_day_definitions', { effective_from: localDateOf(now, timeZone), criteria });
}

/** Mark a rest/holiday day. Only today or a future date: no retroactive excuses. */
export function addDayExemption(store: Store, date: LocalDate, reason: 'rest' | 'holiday' | 'sick' | 'travel' | 'other', now: Date, timeZone: string) {
  if (date < localDateOf(now, timeZone)) throw new Error('past_date');
  const existing = store.list('day_exemptions').find((e) => e.local_date === date);
  if (existing) return existing;
  return store.insert('day_exemptions', { local_date: date, reason });
}

/** Remove a planned exemption; allowed only while the day hasn't started yet or is today. */
export function removeDayExemption(store: Store, id: string, now: Date, timeZone: string) {
  const e = store.get('day_exemptions', id);
  if (!e) return;
  if (e.local_date < localDateOf(now, timeZone)) throw new Error('past_date');
  store.remove('day_exemptions', id);
}

/** Append immutable results for every day whose seal time has passed. */
export function sealPerfectDays(store: Store, now: Date, timeZone: string): number {
  const list = store.list.bind(store) as never;
  const rows = daysToSeal(list, timeZone, now, 400, store.allRaw.bind(store) as never);
  for (const r of rows) store.insert('perfect_day_results', r);
  return rows.length;
}

export function streakSummary(store: Store, now: Date, timeZone: string): StreakSummary {
  const list = store.list.bind(store) as never;
  const today = localDateOf(now, timeZone);
  const live = new Map<LocalDate, DayStatus>();
  live.set(today, liveStatus(list, today, timeZone, now));
  const yesterday = addDays(today, -1);
  const sealedY = store.list('perfect_day_results').some((r) => r.local_date === yesterday);
  if (!sealedY && now < sealTime(yesterday, timeZone)) live.set(yesterday, liveStatus(list, yesterday, timeZone, now));
  return computeStreaks(store.list('perfect_day_results'), today, live);
}
