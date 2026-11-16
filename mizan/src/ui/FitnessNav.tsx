import { router, usePathname } from 'expo-router';
import React from 'react';

import { useApp } from '../state/AppContext';
import { FilterChips } from './primitives';

const TABS = [
  ['dashboard', '/fitness'],
  ['body', '/fitness/body'],
  ['nutrition', '/fitness/nutrition'],
  ['workout', '/fitness/workout/active'],
] as const;

/** Section tabs (blueprint 06 §2): Dashboard, Body, Nutrition, Workout. */
export function FitnessNav() {
  const { t } = useApp();
  const path = usePathname();
  const current = TABS.find(([, href]) => href === path)?.[0] ?? 'dashboard';
  return (
    <FilterChips
      options={TABS.map(([k]) => k)}
      value={current}
      onChange={(k) => router.replace(TABS.find(([x]) => x === k)![1] as never)}
      labelOf={(k) => t(`fit.${k}`)}
      testIDPrefix="fit-tab"
    />
  );
}
