/**
 * Nutrition calculator: per-100 g reference values → logged amounts, recipes,
 * daily/weekly summaries and remaining targets. Pure functions, no storage.
 */
import { addDays, localDateOf } from './dates';
import type { CatalogFood } from './foodCatalog';
import type { FoodItem, Meal, MealItem } from './types';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

const r1 = (n: number) => Math.round(n * 10) / 10;

export function roundMacros(m: Macros): Macros {
  return { kcal: Math.round(m.kcal), protein: r1(m.protein), carbs: r1(m.carbs), fat: r1(m.fat) };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return { kcal: m.kcal * factor, protein: m.protein * factor, carbs: m.carbs * factor, fat: m.fat * factor };
}

/** Values for `grams` of a catalog food (catalog values are per 100 g). */
export function macrosForGrams(food: Pick<CatalogFood, 'kcal' | 'protein' | 'carbs' | 'fat'>, grams: number): Macros {
  if (!(grams > 0)) return { ...ZERO };
  return roundMacros(scaleMacros({ kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat }, grams / 100));
}

/** Values for `servings` of a user food (user foods are stored per serving). Missing values count as 0. */
export function macrosForServings(food: Pick<FoodItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>, servings: number): Macros {
  if (!(servings > 0)) return { ...ZERO };
  return roundMacros(scaleMacros({ kcal: food.calories ?? 0, protein: food.protein_g ?? 0, carbs: food.carbs_g ?? 0, fat: food.fat_g ?? 0 }, servings));
}

export function macrosOfItem(i: Pick<MealItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>): Macros {
  return { kcal: i.calories ?? 0, protein: i.protein_g ?? 0, carbs: i.carbs_g ?? 0, fat: i.fat_g ?? 0 };
}

export function sumItems(items: Pick<MealItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'deleted_at'>[]): Macros {
  return roundMacros(items.filter((i) => !i.deleted_at).reduce((a, i) => addMacros(a, macrosOfItem(i)), { ...ZERO }));
}

/** Share of calories from each macro (Atwater 4/4/9), for the macro bar. */
export function macroCalorieSplit(m: Macros): { protein: number; carbs: number; fat: number } {
  const p = m.protein * 4;
  const c = m.carbs * 4;
  const f = m.fat * 9;
  const total = p + c + f;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return { protein: p / total, carbs: c / total, fat: f / total };
}

// ------------------------------------------------------------------ recipes
export interface RecipeIngredient {
  /** "food:<id>" catalog food, or a user food_items id */
  ref: string;
  name: string;
  /** grams for catalog foods, servings for user foods */
  amount: number;
  unit: 'g' | 'serving';
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function recipeTotals(ingredients: RecipeIngredient[]): Macros {
  return roundMacros(ingredients.reduce((a, i) => addMacros(a, i), { ...ZERO }));
}

export function recipePerServing(ingredients: RecipeIngredient[], servings: number): Macros {
  if (!(servings > 0)) return { ...ZERO };
  return roundMacros(scaleMacros(recipeTotals(ingredients), 1 / servings));
}

// ------------------------------------------------------------------ targets & summaries
export interface NutritionTargets {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export const NO_TARGETS: NutritionTargets = { kcal: null, protein: null, carbs: null, fat: null };

export function hasTargets(t: NutritionTargets): boolean {
  return [t.kcal, t.protein, t.carbs, t.fat].some((v) => v != null && v > 0);
}

/** Remaining amount per macro; negative when over target; null when no target set. */
export function remaining(targets: NutritionTargets, eaten: Macros): Record<keyof Macros, number | null> {
  const rem = (t: number | null, v: number) => (t != null && t > 0 ? r1(t - v) : null);
  return { kcal: targets.kcal ? Math.round(targets.kcal - eaten.kcal) : null, protein: rem(targets.protein, eaten.protein), carbs: rem(targets.carbs, eaten.carbs), fat: rem(targets.fat, eaten.fat) };
}

export function itemsForDate(meals: Meal[], items: MealItem[], date: string, timeZone: string): { meals: Meal[]; items: MealItem[] } {
  const ms = meals.filter((m) => !m.deleted_at && localDateOf(m.logged_at, timeZone) === date);
  const ids = new Set(ms.map((m) => m.id));
  return { meals: ms, items: items.filter((i) => !i.deleted_at && ids.has(i.meal_id)) };
}

export interface DaySummary {
  date: string;
  totals: Macros;
  items: number;
}

/** Totals for each of the 7 days ending on `endDate` (oldest first). */
export function weekSummary(meals: Meal[], items: MealItem[], endDate: string, timeZone: string): DaySummary[] {
  const out: DaySummary[] = [];
  for (let k = 6; k >= 0; k--) {
    const date = addDays(endDate, -k);
    const day = itemsForDate(meals, items, date, timeZone);
    out.push({ date, totals: sumItems(day.items), items: day.items.length });
  }
  return out;
}

/** Average over days that have at least one logged item (unlogged days are not counted as zero). */
export function averageOfLoggedDays(days: DaySummary[]): Macros | null {
  const logged = days.filter((d) => d.items > 0);
  if (!logged.length) return null;
  return roundMacros(scaleMacros(logged.reduce((a, d) => addMacros(a, d.totals), { ...ZERO }), 1 / logged.length));
}

/** Most recently logged catalog foods (unique), for quick re-adding. */
export function recentCatalogFoods(items: MealItem[], limit = 8): { id: string; grams: number }[] {
  const seen = new Set<string>();
  const out: { id: string; grams: number }[] = [];
  for (const i of [...items].filter((x) => !x.deleted_at && x.catalog_food_id).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const id = i.catalog_food_id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, grams: i.grams ?? 100 });
    if (out.length >= limit) break;
  }
  return out;
}
