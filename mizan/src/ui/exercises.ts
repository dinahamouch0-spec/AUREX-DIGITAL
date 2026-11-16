import { EXERCISE_CATALOG } from '../domain/exerciseCatalog';
import type { Exercise } from '../domain/types';

export interface ExerciseInfo {
  id: string;
  name: string;
  primary_muscles: string;
  builtin: boolean;
}

export function allExercises(user: Exercise[], locale: 'ar' | 'en'): ExerciseInfo[] {
  return [
    ...EXERCISE_CATALOG.map((e) => ({ id: e.id, name: locale === 'ar' ? e.name_ar : e.name, primary_muscles: e.primary_muscles, builtin: true })),
    ...user.map((e) => ({ id: e.id, name: e.name, primary_muscles: e.primary_muscles, builtin: false })),
  ];
}

export function exerciseMap(user: Exercise[], locale: 'ar' | 'en') {
  return new Map(allExercises(user, locale).map((e) => [e.id, e]));
}
