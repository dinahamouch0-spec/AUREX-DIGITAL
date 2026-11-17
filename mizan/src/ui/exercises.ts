import { CATALOG_BY_ID, EXERCISE_CATALOG, type CatalogExercise } from '../domain/exerciseCatalog';
import type { Exercise } from '../domain/types';
import type { SheetOption } from './overlays';

export interface ExerciseInfo {
  id: string;
  name: string;
  primary_muscles: string;
  builtin: boolean;
  catalog?: CatalogExercise;
}

export function allExercises(user: Exercise[], locale: 'ar' | 'en'): ExerciseInfo[] {
  return [
    ...EXERCISE_CATALOG.map((e) => ({ id: e.id, name: locale === 'ar' ? e.name_ar : e.name, primary_muscles: e.primary_muscles, builtin: true, catalog: e })),
    ...user.map((e) => ({ id: e.id, name: (locale === 'ar' && e.name_ar) || e.name, primary_muscles: e.primary_muscles, builtin: false })),
  ];
}

export function exerciseMap(user: Exercise[], locale: 'ar' | 'en') {
  return new Map(allExercises(user, locale).map((e) => [e.id, e]));
}

export function exerciseName(id: string, user: Exercise[], locale: 'ar' | 'en'): string {
  const c = CATALOG_BY_ID.get(id);
  if (c) return locale === 'ar' ? c.name_ar : c.name;
  const u = user.find((e) => e.id === id);
  return u ? (locale === 'ar' && u.name_ar) || u.name : id;
}

/** Options for the searchable exercise picker; subtitle = localised muscle group / muscles. */
export function exerciseOptions(user: Exercise[], locale: 'ar' | 'en', t: (k: string) => string): SheetOption[] {
  return allExercises(user, locale).map((e) => ({
    value: e.id,
    label: e.name,
    subtitle: e.catalog ? `${t(`mg.${e.catalog.group}`)} · ${e.catalog.equipment.map((q) => t(`eq.${q}`)).join(', ')}` : `${t('fit.custom')} · ${e.primary_muscles}`,
  }));
}
