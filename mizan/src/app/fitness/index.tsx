import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { localDateOf, weekdayOf } from '@/domain/dates';
import { nutritionTotals } from '@/domain/fitness';
import { activeWorkout } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Button, Card, Chip, Icon, IconName, ListItem, MetricCard, Notice, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { FitnessNav } from '@/ui/FitnessNav';

export default function FitnessDashboard() {
  const { t, fmt, today, settings, showToast } = useApp();
  const tz = settings.timezone;
  const water = useCollection('hydration_logs').filter((h) => localDateOf(h.logged_at, tz) === today);
  const meals = useCollection('meals').filter((m) => localDateOf(m.logged_at, tz) === today);
  const items = useCollection('meal_items');
  const measurements = useCollection('body_measurements');
  const programs = useCollection('workout_programs');
  useCollection('workouts');
  const latest = [...measurements].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0];
  const mealIds = new Set(meals.map((m) => m.id));
  const totals = nutritionTotals(items.filter((i) => mealIds.has(i.meal_id)));
  const program = programs.find((p) => p.is_active);
  const plan = program?.schedule_json?.[String(weekdayOf(today))];
  const active = activeWorkout(store);
  const waterMl = water.reduce((a, h) => a + h.amount_ml, 0);
  const addWater = (ml: number) => {
    const row = store.insert('hydration_logs', { amount_ml: ml, beverage_type: 'water', logged_at: new Date().toISOString() });
    showToast({ message: `+${fmt.number(ml)} ml`, actionLabel: t('common.undo'), onAction: () => store.remove('hydration_logs', row.id) });
  };
  const more: [string, string, IconName][] = [
    ['fit.exerciseLibrary', '/fitness/exercises', 'library-outline'],
    ['fit.programs', '/fitness/programs', 'calendar-outline'],
    ['fit.recovery', '/fitness/recovery', 'bed-outline'],
    ['fit.analytics', '/fitness/analytics', 'stats-chart-outline'],
    ['fit.phases', '/records/fitness_phases', 'flag-outline'],
    ['goals.title', '/goals', 'trophy-outline'],
  ];
  return (
    <Screen title={t('fit.title')} testID="screen-fitness">
      <FitnessNav />
      <Notice text={t('fit.disclaimer')} />
      <Card>
        <Txt variant="label" color="textSecondary">
          {t('fit.todayPlan')}
        </Txt>
        <Txt variant="heading">{active ? t('fit.activeWorkout') : program ? (plan ?? t('home.restDay')) : t('home.noProgram')}</Txt>
        <Button label={active ? t('common.open') : t('fit.startWorkout')} icon="barbell-outline" onPress={() => router.push('/fitness/workout/active')} testID="fit-start" />
      </Card>
      <View style={styles.grid}>
        <MetricCard label={t('fit.water')} value={`${fmt.number(waterMl)} ml`} hint={t('fit.waterNote')} testID="fit-water" />
        <MetricCard label={t('fit.nutritionToday')} value={totals.items ? `${fmt.number(Math.round(totals.calories))} kcal` : '—'} hint={totals.items ? `~ ${t('common.estimate')}` : t('fit.noMeals')} onPress={() => router.push('/fitness/nutrition')} />
      </View>
      <Row wrap>
        {[150, 250, 500].map((ml) => (
          <Chip key={ml} icon="water-outline" label={`+${fmt.number(ml)} ml`} onPress={() => addWater(ml)} testID={`water-${ml}`} />
        ))}
        <Chip icon="add" label={t('common.add')} onPress={() => router.push(newRecordHref('hydration_logs') as never)} />
      </Row>
      <SectionHeader title={t('fit.latestMeasurement')} action={t('common.add')} onAction={() => router.push(newRecordHref('body_measurements') as never)} />
      {latest ? (
        <Card onPress={() => router.push('/fitness/body')}>
          <Txt variant="caption" color="textSecondary">
            {fmt.dateTime(latest.measured_at)}
          </Txt>
          <Txt>
            {[latest.weight_kg != null ? `${fmt.number(latest.weight_kg)} kg` : null, latest.height_cm != null ? `${fmt.number(latest.height_cm)} cm` : null].filter(Boolean).join(' · ') || '—'}
          </Txt>
        </Card>
      ) : (
        <Txt color="textMuted">{t('fit.noMeasurement')}</Txt>
      )}
      <SectionHeader title={t('fit.more')} />
      <View style={{ gap: spacing.sm }}>
        {more.map(([k, href, icon]) => (
          <ListItem key={href} title={t(k)} left={<Icon name={icon} />} onPress={() => router.push(href as never)} testID={`fit-more-${href.split('/').pop()}`} />
        ))}
      </View>
    </Screen>
  );
}
