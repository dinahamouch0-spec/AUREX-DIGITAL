import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { addDays, localDateOf, startOfWeek, weekdayOf } from '@/domain/dates';
import { weeklyTraining } from '@/domain/fitness';
import { itemsForDate, sumItems } from '@/domain/nutrition';
import { dayForWeekday } from '@/domain/programs';
import { activeWorkout, startWorkout } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { exerciseName } from '@/ui/exercises';
import { FitnessNav } from '@/ui/FitnessNav';
import { Bars, GlassCard, Hero, IconBadge, MACRO_COLORS, MeterRow, PressableScale, ProgressRing, StatTile, useDomainTheme } from '@/ui/kit';
import { Button, Chip, IconName, Notice, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';

export default function FitnessDashboard() {
  const { t, fmt, today, settings, locale, showToast } = useApp();
  const th = useDomainTheme('fitness');
  const nut = useDomainTheme('nutrition');
  const tz = settings.timezone;
  const water = useCollection('hydration_logs').filter((h) => localDateOf(h.logged_at, tz) === today);
  const meals = useCollection('meals');
  const items = useCollection('meal_items');
  const measurements = useCollection('body_measurements');
  const programs = useCollection('workout_programs');
  const workouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const userEx = useCollection('exercises');
  const latest = [...measurements].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0];
  const totals = sumItems(itemsForDate(meals, items, today, tz).items);
  const program = programs.find((p) => p.is_active);
  const day = dayForWeekday(program?.days_json, weekdayOf(today));
  const legacyPlan = program?.schedule_json?.[String(weekdayOf(today))];
  const active = activeWorkout(store);
  const waterMl = water.reduce((a, h) => a + h.amount_ml, 0);
  const weekStarts = Array.from({ length: 6 }, (_, i) => startOfWeek(addDays(today, -7 * (5 - i)), settings.weekStart));
  const weeks = weeklyTraining(workouts, sets, weekStarts, (iso) => startOfWeek(localDateOf(iso, tz), settings.weekStart));
  const thisWeek = weeks.at(-1)!;
  const plannedPerWeek = program?.days_json ? program.days_json.reduce((a, d) => a + d.weekdays.length, 0) : Object.keys(program?.schedule_json ?? {}).length;
  const addWater = (ml: number) => {
    const row = store.insert('hydration_logs', { amount_ml: ml, beverage_type: 'water', logged_at: new Date().toISOString() });
    showToast({ message: `+${fmt.number(ml)} ml`, actionLabel: t('common.undo'), onAction: () => store.remove('hydration_logs', row.id) });
  };
  const tiles: [string, string, IconName][] = [
    ['fit.exerciseLibrary', '/fitness/exercises', 'library-outline'],
    ['fit.programs', '/fitness/programs', 'calendar-outline'],
    ['fit.analytics', '/fitness/analytics', 'stats-chart-outline'],
    ['nut.recipes', '/fitness/recipes', 'book-outline'],
    ['fit.recovery', '/fitness/recovery', 'bed-outline'],
    ['fit.phases', '/records/fitness_phases', 'flag-outline'],
  ];
  const startToday = () => {
    if (active) return router.push('/fitness/workout/active');
    if (day) startWorkout(store, day.name, new Date(), program?.id);
    router.push('/fitness/workout/active');
  };
  return (
    <Screen title={t('fit.title')} testID="screen-fitness">
      <FitnessNav />
      <Hero
        domain="fitness"
        eyebrow={t('fit.todayPlan')}
        title={active ? t('fit.activeWorkout') : day ? day.name : program ? (legacyPlan ?? t('home.restDay')) : t('home.noProgram')}
        subtitle={day && !active ? t('fit.exercisesCount', { n: day.exercises.length }) : program ? program.name : t('fit.noProgramHint')}
        testID="fit-hero">
        {day && !active ? (
          <Row wrap gap={6}>
            {day.exercises.slice(0, 5).map((e, i) => (
              <Chip key={i} label={exerciseName(e.exercise_id, userEx, locale)} />
            ))}
          </Row>
        ) : null}
        <Button label={active ? t('fit.continueWorkout') : day ? t('fit.startNamed', { name: day.name }) : t('fit.startWorkout')} icon={active ? 'play-forward' : 'play'} onPress={startToday} testID="fit-start" />
        {!program ? <Button variant="secondary" icon="calendar-outline" label={t('fit.createProgram')} onPress={() => router.push('/fitness/programs')} /> : null}
      </Hero>

      <View style={styles.grid}>
        <GlassCard outerStyle={{ flex: 1, minWidth: 160 }} style={{ alignItems: 'center' }} onPress={() => router.push('/fitness/analytics')} accessibilityLabel={t('fit.thisWeek')}>
          <ProgressRing ratio={plannedPerWeek ? thisWeek.sessions / plannedPerWeek : null} size={96} stroke={9} color={th.accent} label={`${t('fit.thisWeek')}: ${thisWeek.sessions}`}>
            <Txt variant="heading" align="center">
              {fmt.number(thisWeek.sessions)}
              {plannedPerWeek ? `/${fmt.number(plannedPerWeek)}` : ''}
            </Txt>
          </ProgressRing>
          <Txt variant="caption" color="textSecondary" align="center">
            {t('fit.sessionsThisWeek')}
          </Txt>
        </GlassCard>
        <GlassCard outerStyle={{ flex: 1, minWidth: 160 }} onPress={() => router.push('/fitness/nutrition')} accessibilityLabel={t('fit.nutritionToday')} testID="fit-nutrition">
          <Txt variant="caption" color="textSecondary">
            {t('fit.nutritionToday')}
          </Txt>
          <Txt variant="title" style={{ color: nut.accent }}>
            {fmt.number(totals.kcal)} <Txt variant="caption">kcal</Txt>
          </Txt>
          <MeterRow label={t('nut.protein')} value={totals.protein} target={settings.nutrition.protein} unit="g" color={MACRO_COLORS.protein} />
        </GlassCard>
      </View>

      <GlassCard>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="label" color="textSecondary">
            {t('fit.weeklyVolume')}
          </Txt>
          <Txt variant="caption" color="textMuted">
            kg
          </Txt>
        </Row>
        <Bars data={weeks.map((w) => ({ label: fmt.localDate(w.weekStart, 'short'), value: w.volumeKg }))} highlight={weeks.length - 1} color={th.accent} />
      </GlassCard>

      <View style={styles.grid}>
        <StatTile icon="water-outline" label={t('fit.water')} value={`${fmt.number(waterMl)} ml`} hint={t('fit.waterNote')} color="#5EA4F2" testID="fit-water" />
        <StatTile
          icon="body-outline"
          label={t('fit.latestMeasurement')}
          value={latest?.weight_kg != null ? `${fmt.number(latest.weight_kg)} kg` : '—'}
          hint={latest ? fmt.dateTime(latest.measured_at) : t('fit.noMeasurement')}
          onPress={() => router.push(latest ? '/fitness/body' : (newRecordHref('body_measurements') as never))}
          color={th.accent}
        />
      </View>
      <Row wrap>
        {[150, 250, 500].map((ml) => (
          <Chip key={ml} icon="water-outline" label={`+${fmt.number(ml)} ml`} onPress={() => addWater(ml)} testID={`water-${ml}`} />
        ))}
        <Chip icon="add" label={t('common.add')} onPress={() => router.push(newRecordHref('hydration_logs') as never)} />
      </Row>

      <SectionHeader title={t('fit.more')} />
      <View style={styles.grid}>
        {tiles.map(([k, href, icon]) => (
          <PressableScale key={href} onPress={() => router.push(href as never)} testID={`fit-more-${href.split('/').pop()}`} accessibilityLabel={t(k)} style={{ flexBasis: '30%', flexGrow: 1 }}>
            <GlassCard style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <IconBadge icon={icon} color={th.accent} />
              <Txt variant="caption" align="center" numberOfLines={2}>
                {t(k)}
              </Txt>
            </GlassCard>
          </PressableScale>
        ))}
      </View>
      <Notice text={t('fit.disclaimer')} />
    </Screen>
  );
}
