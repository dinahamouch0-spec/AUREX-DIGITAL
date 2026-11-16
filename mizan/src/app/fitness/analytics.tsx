import React, { useMemo } from 'react';
import { View } from 'react-native';

import { addDays, localDateOf, startOfWeek } from '@/domain/dates';
import { muscleDistribution, personalRecords, trainingVolumeKg } from '@/domain/fitness';
import { useApp, useCollection } from '@/state/AppContext';
import { BarChart } from '@/ui/BarChart';
import { exerciseMap } from '@/ui/exercises';
import { Card, MetricCard, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';

export default function FitnessAnalytics() {
  const { t, fmt, today, settings, locale } = useApp();
  const workouts = useCollection('workouts').filter((w) => w.status === 'completed');
  const sets = useCollection('workout_sets');
  const userEx = useCollection('exercises');
  const exMap = useMemo(() => exerciseMap(userEx, locale), [userEx, locale]);
  const doneIds = new Set(workouts.map((w) => w.id));
  const doneSets = sets.filter((s) => doneIds.has(s.workout_id));
  const prs = [...personalRecords(doneSets).values()];
  const muscles = [...muscleDistribution(doneSets, exMap as never).entries()].sort((a, b) => b[1] - a[1]);
  const weeks = Array.from({ length: 6 }, (_, i) => startOfWeek(addDays(today, -7 * (5 - i)), settings.weekStart));
  const weekly = weeks.map((ws) => {
    const ids = new Set(workouts.filter((w) => { const d = localDateOf(w.started_at, settings.timezone); return d >= ws && d <= addDays(ws, 6); }).map((w) => w.id));
    return { label: fmt.localDate(ws, 'short'), value: Math.round(trainingVolumeKg(sets.filter((s) => ids.has(s.workout_id)))), date: ws };
  });
  return (
    <Screen title={t('fit.analytics')} testID="screen-fitness-analytics">
      <View style={styles.grid}>
        <MetricCard label={t('an.fitness.workouts')} value={fmt.number(workouts.length)} />
        <MetricCard label={t('an.fitness.volume')} value={`${fmt.number(Math.round(trainingVolumeKg(doneSets)))} kg`} />
      </View>
      {workouts.length ? <BarChart title={`${t('an.fitness.volume')} (kg / ${t('common.week')})`} data={weekly} /> : <Txt color="textMuted">{t('an.noData')}</Txt>}
      <SectionHeader title={t('fit.prs')} />
      {prs.length === 0 ? <Txt color="textMuted">{t('an.noData')}</Txt> : null}
      {prs.map((p) => (
        <Card key={p.exercise_id}>
          <Txt variant="bodyStrong">{exMap.get(p.exercise_id)?.name ?? p.exercise_id}</Txt>
          <Row wrap>
            {p.heaviestKg != null ? <Txt color="textSecondary">{t('fit.heaviest', { n: Math.round(p.heaviestKg * 10) / 10 })}</Txt> : null}
            <Txt color="textSecondary">{t('fit.mostReps', { n: p.mostReps })}</Txt>
          </Row>
        </Card>
      ))}
      <SectionHeader title={t('fit.muscleSplit')} />
      {muscles.length ? <BarChart title={t('fit.muscleSplit')} data={muscles.slice(0, 8).map(([m, n]) => ({ label: m, value: n, date: m }))} /> : <Txt color="textMuted">{t('an.noData')}</Txt>}
    </Screen>
  );
}
