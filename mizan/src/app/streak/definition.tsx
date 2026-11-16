import { router } from 'expo-router';
import React, { useState } from 'react';

import { criterionKey, definitionFor, validateDefinition } from '@/domain/perfectDays';
import type { PerfectCriterion } from '@/domain/types';
import { savePerfectDayDefinition } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { BooleanField } from '@/ui/fields';
import { Button, Notice, Screen, SectionHeader, Txt } from '@/ui/primitives';

/** The editable definition of a perfect day (owner spec §1, §5). */
export default function PerfectDayDefinition() {
  const { t, today, settings, showToast } = useApp();
  const habits = useCollection('habits').filter((h) => h.status === 'active');
  const routines = useCollection('routines').filter((r) => r.status === 'active');
  const current = definitionFor(store.list('perfect_day_definitions'), today);
  const [selected, setSelected] = useState<PerfectCriterion[]>(current?.criteria ?? []);
  const [error, setError] = useState<string | null>(null);
  const has = (c: PerfectCriterion) => selected.some((x) => criterionKey(x) === criterionKey(c));
  const toggle = (c: PerfectCriterion, on: boolean) => {
    setError(null);
    setSelected((s) => (on ? [...s, c] : s.filter((x) => criterionKey(x) !== criterionKey(c))));
  };
  const save = () => {
    const err = validateDefinition(selected);
    if (err) return setError(t(`pd.err.${err}`));
    savePerfectDayDefinition(store, selected, new Date(), settings.timezone);
    showToast({ message: t('toast.saved') });
    router.replace('/streak');
  };
  const itemProps = { has, toggle };
  return (
    <Screen title={t('pd.defineTitle')} testID="screen-streak-definition">
      <Notice text={t('pd.defineIntro')} />
      <SectionHeader title={t('col.habits')} />
      {habits.length === 0 ? <Txt color="textMuted">{t('pd.noHabits')}</Txt> : null}
      {habits.map((h) => (
        <Item {...itemProps} key={h.id} c={{ type: 'habit', ref_id: h.id }} label={h.name} hint={h.schedule_type === 'times_per_week' ? t('pd.weeklyHint') : undefined} />
      ))}
      {routines.length ? <SectionHeader title={t('hab.routines')} /> : null}
      {routines.map((r) => (
        <Item {...itemProps} key={r.id} c={{ type: 'routine', ref_id: r.id }} label={r.name} />
      ))}
      <SectionHeader title={t('pd.otherCriteria')} />
      <Item {...itemProps} c={{ type: 'planned_workout' }} label={t('pd.crit.planned_workout')} hint={t('pd.hint.planned_workout')} />
      <Item {...itemProps} c={{ type: 'planned_study' }} label={t('pd.crit.planned_study')} hint={t('pd.hint.planned_study')} />
      <Item {...itemProps} c={{ type: 'tasks_due' }} label={t('pd.crit.tasks_due')} hint={t('pd.hint.tasks_due')} />
      <Item {...itemProps} c={{ type: 'prayers' }} label={t('pd.crit.prayers')} hint={t('pd.hint.prayers')} />
      {error ? <Notice tone="danger" text={error} /> : null}
      <Notice text={t('pd.effectiveToday')} />
      <Button label={t('common.save')} icon="checkmark" onPress={save} testID="pd-save" />
    </Screen>
  );
}

function Item({ c, label, hint, has, toggle }: { c: PerfectCriterion; label: string; hint?: string; has: (c: PerfectCriterion) => boolean; toggle: (c: PerfectCriterion, on: boolean) => void }) {
  return (
    <>
      <BooleanField label={label} value={has(c)} onChange={(v) => toggle(c, v)} testID={`pd-crit-${criterionKey(c)}`} />
      {hint ? (
        <Txt variant="caption" color="textMuted">
          {hint}
        </Txt>
      ) : null}
    </>
  );
}
