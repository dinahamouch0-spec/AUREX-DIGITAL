import { router } from 'expo-router';
import React from 'react';

import { useApp, useCollection } from '@/state/AppContext';
import { BarChart } from '@/ui/BarChart';
import { Button, Notice, Screen, SectionHeader } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';
import { FitnessNav } from '@/ui/FitnessNav';

export default function Body() {
  const { t, fmt } = useApp();
  const ms = useCollection('body_measurements')
    .filter((m) => m.weight_kg != null)
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-8);
  return (
    <Screen title={t('fit.body')} testID="screen-fitness-body">
      <FitnessNav />
      <Button label={t('fit.weeklyCheckin')} icon="add" onPress={() => router.push(newRecordHref('body_measurements') as never)} testID="body-add" />
      {ms.length >= 2 ? <BarChart title={`${t('fit.weightTrend')} (kg)`} data={ms.map((m) => ({ label: fmt.date(m.measured_at, 'short'), value: m.weight_kg as number, date: m.id }))} /> : null}
      <RecordList collection="body_measurements" title={t('col.body_measurements')} emptyBody={t('fit.noMeasurement')} subtitle={(r) => [r.weight_kg != null ? `${fmt.number(r.weight_kg as number)} kg` : null, r.waist_cm != null ? `${t('field.waist_cm')} ${fmt.number(r.waist_cm as number)}` : null].filter(Boolean).join(' · ')} />
      <SectionHeader title={t('fit.phases')} />
      <Notice text={t('fit.phasesNote')} />
      <RecordList collection="fitness_phases" hideAdd={false} title={t('col.fitness_phases')} />
    </Screen>
  );
}
