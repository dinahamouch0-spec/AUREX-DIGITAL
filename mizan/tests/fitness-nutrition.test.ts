import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { CATALOG_BY_ID, EQUIPMENT, EXERCISE_CATALOG, MUSCLES, MUSCLE_GROUPS, filterCatalog, normalizeSearch } from '../src/domain/exerciseCatalog';
import { estimatedOneRepMax, exerciseHistory, newRecords, weeklyTraining } from '../src/domain/fitness';
import { FOOD_BY_ID, FOOD_CATALOG } from '../src/domain/foodCatalog';
import { averageOfLoggedDays, macroCalorieSplit, macrosForGrams, macrosForServings, recentCatalogFoods, recipePerServing, recipeTotals, remaining, sumItems, weekSummary } from '../src/domain/nutrition';
import { TEMPLATES, TEMPLATE_IDS, addExercise, buildTemplate, dayForWeekday, isValidDays, moveExercise, normalizePrescription, removeExercise, scheduleFromDays, toggleWeekday, updateExercise } from '../src/domain/programs';
import type { WorkoutSet } from '../src/domain/types';
import { Store } from '../src/data/store';
import { MemoryDriver } from '../src/data/drivers/memory';
import { addCatalogFoodToMeal, addRecipeToMeal, createProgramFromTemplate, ingredientFromCatalog, mealFor, saveMealAsRecipe, saveProgramDays } from '../src/data/usecases';

const LEGACY_IDS = ['push_up', 'squat', 'goblet_squat', 'lunge', 'plank', 'pull_up', 'inverted_row', 'db_row', 'bench_press', 'db_press', 'deadlift', 'glute_bridge', 'bicep_curl', 'triceps_dip', 'calf_raise', 'jump_rope', 'running'];

describe('exercise library', () => {
  it('keeps every id that existing workout logs may reference', () => {
    for (const id of LEGACY_IDS) expect(CATALOG_BY_ID.has(`builtin:${id}`), id).toBe(true);
  });
  it('has unique ids and covers all ten muscle groups with several exercises each', () => {
    expect(new Set(EXERCISE_CATALOG.map((e) => e.id)).size).toBe(EXERCISE_CATALOG.length);
    expect(EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(75);
    for (const g of MUSCLE_GROUPS) expect(EXERCISE_CATALOG.filter((e) => e.group === g).length, g).toBeGreaterThanOrEqual(4);
  });
  it('every exercise is complete and bilingual, with sane guideline ranges', () => {
    for (const e of EXERCISE_CATALOG) {
      expect(e.name.trim() && e.name_ar.trim(), e.id).toBeTruthy();
      expect(e.primary.length, e.id).toBeGreaterThan(0);
      for (const m of [...e.primary, ...e.secondary]) expect(MUSCLES).toContain(m);
      for (const q of e.equipment) expect(EQUIPMENT).toContain(q);
      expect(e.steps.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.steps_ar.length, e.id).toBe(e.steps.length);
      expect(e.mistakes.length, e.id).toBeGreaterThanOrEqual(1);
      expect(e.mistakes_ar.length, e.id).toBe(e.mistakes.length);
      expect(/[؀-ۿ]/.test(e.name_ar + e.steps_ar.join('')), e.id).toBe(true);
      const p = e.prescription;
      expect(p.sets[0] <= p.sets[1] && p.reps[0] <= p.reps[1] && p.rest[0] <= p.rest[1], e.id).toBe(true);
    }
  });
  it('alternatives point to real, different exercises', () => {
    for (const e of EXERCISE_CATALOG) {
      expect(e.alternatives.length, e.id).toBeGreaterThan(0);
      for (const a of e.alternatives) {
        expect(CATALOG_BY_ID.has(a), `${e.id} → ${a}`).toBe(true);
        expect(a).not.toBe(e.id);
      }
    }
  });
  it('filters by muscle group, equipment and bilingual search (diacritics-insensitive)', () => {
    expect(filterCatalog(EXERCISE_CATALOG, { group: 'chest' }).every((e) => e.group === 'chest')).toBe(true);
    expect(filterCatalog(EXERCISE_CATALOG, { equipment: 'cable' }).every((e) => e.equipment.includes('cable'))).toBe(true);
    expect(filterCatalog(EXERCISE_CATALOG, { query: 'bench' }).map((e) => e.id)).toContain('builtin:bench_press');
    expect(filterCatalog(EXERCISE_CATALOG, { query: 'عقلة' }).map((e) => e.id)).toContain('builtin:pull_up');
    expect(normalizeSearch('أَرْنولد')).toBe('ارنولد');
    expect(filterCatalog(EXERCISE_CATALOG, { group: 'calves', equipment: 'machine' }).length).toBeGreaterThan(0);
  });
});

describe('food table', () => {
  it('has unique ids, bilingual names and a 100 g serving first', () => {
    expect(new Set(FOOD_CATALOG.map((f) => f.id)).size).toBe(FOOD_CATALOG.length);
    expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(90);
    for (const f of FOOD_CATALOG) {
      expect(f.name && /[؀-ۿ]/.test(f.name_ar), f.id).toBeTruthy();
      expect(f.servings[0].grams).toBe(100);
      for (const s of f.servings) expect(s.grams > 0 && s.label && s.label_ar, f.id).toBeTruthy();
    }
  });
  it('energy agrees with macros (Atwater 4/4/9) — catches typos in the data', () => {
    for (const f of FOOD_CATALOG) {
      const atwater = 4 * f.protein + 4 * f.carbs + 9 * f.fat;
      expect(Math.abs(atwater - f.kcal), `${f.id}: ${f.kcal} vs ${atwater.toFixed(0)}`).toBeLessThanOrEqual(Math.max(12, f.kcal * 0.15));
      expect(f.protein + f.carbs + f.fat).toBeLessThanOrEqual(100.5);
    }
  });
});

describe('nutrition calculator', () => {
  const chicken = FOOD_BY_ID.get('food:chicken_breast_cooked')!;
  it('scales per-100 g values to the logged weight', () => {
    expect(macrosForGrams(chicken, 150)).toEqual({ kcal: 248, protein: 46.5, carbs: 0, fat: 5.4 });
    expect(macrosForGrams(chicken, 0)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
  it('scales user foods per serving and treats missing values as 0', () => {
    expect(macrosForServings({ calories: 200, protein_g: 10, carbs_g: null, fat_g: 5 }, 1.5)).toEqual({ kcal: 300, protein: 15, carbs: 0, fat: 7.5 });
  });
  it('sums items, ignoring deleted ones, and splits calories by macro', () => {
    const t = sumItems([
      { calories: 100, protein_g: 10, carbs_g: 10, fat_g: 2, deleted_at: null },
      { calories: 999, protein_g: 99, carbs_g: 99, fat_g: 99, deleted_at: '2026-01-01T00:00:00Z' },
    ]);
    expect(t).toEqual({ kcal: 100, protein: 10, carbs: 10, fat: 2 });
    const split = macroCalorieSplit(t);
    expect(split.protein + split.carbs + split.fat).toBeCloseTo(1);
  });
  it('computes recipe totals and per-serving values', () => {
    const rice = FOOD_BY_ID.get('food:rice_white_cooked')!;
    const ing = [ingredientFromCatalog(chicken, 300, 'Chicken'), ingredientFromCatalog(rice, 400, 'Rice')];
    expect(recipeTotals(ing)).toEqual({ kcal: 1015, protein: 103.8, carbs: 112.8, fat: 12 });
    expect(recipePerServing(ing, 4)).toEqual({ kcal: 254, protein: 26, carbs: 28.2, fat: 3 });
  });
  it('reports remaining targets (negative when over, null when no target)', () => {
    expect(remaining({ kcal: 2000, protein: 150, carbs: null, fat: 70 }, { kcal: 2100, protein: 120.5, carbs: 50, fat: 70 })).toEqual({ kcal: -100, protein: 29.5, carbs: null, fat: 0 });
  });
  it('builds a 7-day summary and averages only logged days', () => {
    const meals = [
      { id: 'm1', created_at: '', updated_at: '', logged_at: '2026-11-16T09:00:00Z', meal_type: 'breakfast' as const },
      { id: 'm2', created_at: '', updated_at: '', logged_at: '2026-11-14T09:00:00Z', meal_type: 'lunch' as const },
    ];
    const items = [
      { id: 'i1', created_at: '', updated_at: '', meal_id: 'm1', quantity: 1, calories: 500, protein_g: 30, carbs_g: 50, fat_g: 10, source: 'estimate' as const },
      { id: 'i2', created_at: '', updated_at: '', meal_id: 'm2', quantity: 1, calories: 700, protein_g: 40, carbs_g: 60, fat_g: 20, source: 'estimate' as const },
    ];
    const week = weekSummary(meals, items, '2026-11-16', 'Asia/Beirut');
    expect(week.map((d) => d.date)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16']);
    expect(week[6].totals.kcal).toBe(500);
    expect(averageOfLoggedDays(week)).toEqual({ kcal: 600, protein: 35, carbs: 55, fat: 15 });
  });
});

describe('programs', () => {
  let n = 0;
  const id = () => `d${++n}`;
  it('templates only use real exercises and never share a weekday', () => {
    for (const t of TEMPLATE_IDS) {
      const seen = new Set<number>();
      for (const d of TEMPLATES[t]) {
        for (const e of d.exercises) expect(CATALOG_BY_ID.has(`builtin:${e}`), e).toBe(true);
        for (const w of d.weekdays) {
          expect(seen.has(w), `${t} weekday ${w}`).toBe(false);
          seen.add(w);
        }
      }
    }
  });
  it('builds days with catalog prescriptions and a compatible weekday schedule', () => {
    const days = buildTemplate('ppl', (k) => k.toUpperCase(), id);
    expect(isValidDays(days)).toBe(true);
    expect(scheduleFromDays(days)).toEqual({ '1': 'PUSH', '4': 'PUSH', '2': 'PULL', '5': 'PULL', '3': 'LEGS', '6': 'LEGS' });
    expect(dayForWeekday(days, 0)).toBeNull();
    expect(days[0].exercises[0]).toEqual({ exercise_id: 'builtin:bench_press', sets: 3, reps_min: 5, reps_max: 8, rest_seconds: 120 });
  });
  it('edits days: add, remove, reorder, update with clamping, move weekdays', () => {
    const [push, pull] = buildTemplate('ppl', (k) => k, id);
    const moved = moveExercise(push, 0, 1);
    expect(moved.exercises[1].exercise_id).toBe(push.exercises[0].exercise_id);
    expect(moveExercise(push, 0, -1)).toBe(push);
    expect(removeExercise(push, 0).exercises.length).toBe(push.exercises.length - 1);
    expect(addExercise(push, 'builtin:shrug').exercises.at(-1)?.exercise_id).toBe('builtin:shrug');
    const upd = updateExercise(push, 0, { reps_min: 12, reps_max: 6, sets: 0 });
    expect(upd.exercises[0]).toMatchObject({ sets: 1, reps_min: 12, reps_max: 12 });
    expect(normalizePrescription({ exercise_id: 'x', sets: NaN, reps_min: 3, reps_max: 5, rest_seconds: 5000 }).rest_seconds).toBe(900);
    const days = toggleWeekday([push, pull], pull.id, 1);
    expect(days[0].weekdays).not.toContain(1);
    expect(days[1].weekdays).toContain(1);
  });
});

describe('strength analytics', () => {
  const set = (id: string, workout_id: string, reps: number, load: number | null, unit: 'kg' | 'lb' = 'kg'): WorkoutSet => ({ id, created_at: '', updated_at: '', workout_id, exercise_id: 'builtin:bench_press', set_number: 1, reps, load_value: load, load_unit: unit });
  it('estimates 1RM with Epley only for 1–12 reps', () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(100, 5)).toBe(116.7);
    expect(estimatedOneRepMax(100, 15)).toBeNull();
    expect(estimatedOneRepMax(0, 5)).toBeNull();
  });
  it('detects weight, rep and e1RM records against earlier sets (lb converted)', () => {
    const prev = [set('a', 'w1', 5, 80), set('b', 'w1', 8, 70)];
    expect(newRecords({ reps: 5, load_value: 85, load_unit: 'kg' }, prev)).toEqual(['weight', 'e1rm']);
    expect(newRecords({ reps: 6, load_value: 80, load_unit: 'kg' }, prev)).toEqual(['reps', 'e1rm']);
    expect(newRecords({ reps: 3, load_value: 60, load_unit: 'kg' }, prev)).toEqual([]);
    expect(newRecords({ reps: 5, load_value: 200, load_unit: 'lb' }, prev)).toEqual(['weight', 'e1rm']); // 90.7 kg
    expect(newRecords({ reps: 5, load_value: 80, load_unit: 'kg' }, [])).toEqual([]);
  });
  it('builds per-exercise history and weekly stats from completed workouts only', () => {
    const workouts = [
      { id: 'w1', started_at: '2026-11-09T08:00:00Z', status: 'completed' },
      { id: 'w2', started_at: '2026-11-16T08:00:00Z', status: 'completed' },
      { id: 'w3', started_at: '2026-11-16T18:00:00Z', status: 'in_progress' },
    ];
    const sets = [set('a', 'w1', 5, 80), set('b', 'w2', 5, 85), set('c', 'w2', 5, 85), set('d', 'w3', 5, 200)];
    const hist = exerciseHistory('builtin:bench_press', workouts, sets, (iso) => iso.slice(0, 10));
    expect(hist.map((h) => [h.date, h.topKg, h.volumeKg])).toEqual([['2026-11-09', 80, 400], ['2026-11-16', 85, 850]]);
    const weeks = weeklyTraining(workouts, sets, ['2026-11-09', '2026-11-16'], (iso) => (iso < '2026-11-16' ? '2026-11-09' : '2026-11-16'));
    expect(weeks).toEqual([
      { weekStart: '2026-11-09', sessions: 1, volumeKg: 400, sets: 1 },
      { weekStart: '2026-11-16', sessions: 1, volumeKg: 850, sets: 2 },
    ]);
  });
});

describe('fitness & nutrition use cases (real store)', () => {
  const now = new Date('2026-11-16T10:00:00Z');
  const mkStore = () => {
    const st = new Store(new MemoryDriver(), { uuid: randomUUID, now: () => now });
    st.load();
    return st;
  };
  it('logs a catalog food by grams with computed values, then re-adds from recents', () => {
    const store = mkStore();
    const meal = mealFor(store, 'lunch', '2026-11-16', now, 'Asia/Beirut');
    expect(mealFor(store, 'lunch', '2026-11-16', now, 'Asia/Beirut').id).toBe(meal.id);
    const item = addCatalogFoodToMeal(store, meal.id, FOOD_BY_ID.get('food:chicken_breast_cooked')!, 150, 'Chicken breast');
    expect(item).toMatchObject({ grams: 150, quantity: 1.5, calories: 248, protein_g: 46.5, catalog_food_id: 'food:chicken_breast_cooked', source: 'estimate' });
    expect(() => addCatalogFoodToMeal(store, meal.id, FOOD_BY_ID.get('food:banana')!, 0, 'x')).toThrow('invalid_amount');
    expect(recentCatalogFoods(store.list('meal_items'))).toEqual([{ id: 'food:chicken_breast_cooked', grams: 150 }]);
  });
  it('saves a meal as a recipe and logs portions of it', () => {
    const store = mkStore();
    const meal = mealFor(store, 'dinner', '2026-11-16', now, 'Asia/Beirut');
    addCatalogFoodToMeal(store, meal.id, FOOD_BY_ID.get('food:rice_white_cooked')!, 200, 'Rice');
    addCatalogFoodToMeal(store, meal.id, FOOD_BY_ID.get('food:chicken_breast_cooked')!, 100, 'Chicken');
    const recipe = saveMealAsRecipe(store, meal.id, ' Rice & chicken ');
    expect(recipe.name).toBe('Rice & chicken');
    expect(recipe.ingredients_json).toHaveLength(2);
    const next = mealFor(store, 'lunch', '2026-11-17', new Date('2026-11-17T10:00:00Z'), 'Asia/Beirut');
    const it2 = addRecipeToMeal(store, next.id, recipe, 0.5);
    expect(it2.calories).toBe(213); // (260 + 165) / 2 rounded
  });
  it('creates a program from a template, keeps one program active and syncs the weekday schedule', () => {
    const store = mkStore();
    const old = store.insert('workout_programs', { name: 'Old', is_active: true, schedule_json: { '1': 'Legs' } });
    let k = 0;
    const p = createProgramFromTemplate(store, 'upper_lower', 'UL', (x) => x, () => `id${++k}`, true);
    expect(store.get('workout_programs', old.id)?.is_active).toBe(false);
    expect(p.schedule_json).toEqual({ '1': 'upper', '4': 'upper', '2': 'lower', '5': 'lower' });
    const days = p.days_json!.map((d) => (d.name === 'lower' ? { ...d, weekdays: [6] } : d));
    expect(saveProgramDays(store, p.id, days).schedule_json).toEqual({ '1': 'upper', '4': 'upper', '6': 'lower' });
  });
});
