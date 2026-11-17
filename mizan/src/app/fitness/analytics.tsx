import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { CATALOG_BY_ID } from '@/domain/exerciseCatalog';
import { addDays, localDateOf, startOfWeek } from '@/domain/dates';
import { exerciseHistory, personalRecords, trainingVolumeKg, weeklyTraining } from '@/domain/fitness';
import { useApp, useCollection } from '@/state/AppContext';
import { exerciseName } from '@/ui/exercises';
import { Bars, GlassCard, Hero, LineChart, Segmented, StatTile, useDomainTheme } from '@/ui/kit';
import { SelectSheet } from '@/ui/overlays';
import { EmptyState, ListItem, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';

type Metric = 'sessions' | 'volume' | 'sets';

export default function FitnessAnalytics() {
  const { t, fmt, today, settings, locale } = useApp();
  const th = useDomainTheme('fitness');
  const allWorkouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const userEx = useCollection('exercises');
  const [metric, setMetric] = useState<Metric>('volume');
  const [picking, setPicking] = useState(false);
  const tz = settings.timezone;
  const workouts = allWorkouts.filter((w) => w.status === 'completed');
  const doneIds = new Set(workouts.map((w) => w.id));
  const doneSets = sets.filter((s) => doneIds.has(s.workout_id));
  const weekStarts = Array.from({ length: 8 }, (_, i) => startOfWeek(addDays(today, -7 * (7 - i)), settings.weekStart));
  const weeks = weeklyTraining(workouts, sets, weekStarts, (iso) => startOfWeek(localDateOf(iso, tz), settings.weekStart));
  const thisWeek = weeks.at(-1)!;
  const trained = [...new Set(doneSets.map((s) => s.exercise_id))];
  const lastUsed = [...doneSets].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.exercise_id ?? null;
  const [exercise, setExercise] = useState<string | null>(null);
  const ex = exercise ?? lastUsed;
  const hist = ex ? exerciseHistory(ex, workouts, sets, (iso) => localDateOf(iso, tz)) : [];
  const prs = [...personalRecords(doneSets).values()].sort((a, b) => (b.heaviestKg ?? 0) - (a.heaviestKg ?? 0));
  const groups = new Map<string, number>();
  for (const s of doneSets) {
    const g = CATALOG_BY_ID.get(s.exercise_id)?.group;
    if (g) groups.set(g, (groups.get(g) ?? 0) + 1);
  }
  const groupBars = [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);

  if (!workouts.length)
    return (
      <Screen title={t('fit.analytics')} testID="screen-fitness-analytics">
        <Hero domain="fitness" eyebrow={t('fit.title')} title={t('fit.analytics')} />
        <EmptyState icon="stats-chart-outline" body={t('fit.analyticsEmpty')} actionLabel={t('fit.startWorkout')} onAction={() => router.push('/fitness/workout/active')} />
      </Screen>
    );

  return (
    <Screen title={t('fit.analytics')} testID="screen-fitness-analytics">
      <Hero domain="fitness" eyebrow={t('fit.thisWeek')} title={t('fit.sessionsN', { n: thisWeek.sessions })} subtitle={`${t('fit.volume', { n: fmt.number(thisWeek.volumeKg) })} · ${t('fit.setsCount', { n: thisWeek.sets })}`} />
      <View style={styles.grid}>
        <StatTile icon="calendar-outline" label={t('an.fitness.workouts')} value={fmt.number(workouts.length)} color={th.accent} />
        <StatTile icon="barbell-outline" label={t('an.fitness.volume')} value={`${fmt.number(Math.round(trainingVolumeKg(doneSets)))} kg`} color={th.accent} />
        <StatTile icon="trophy-outline" label={t('fit.prs')} value={fmt.number(prs.length)} color={th.accent} />
      </View>

      <SectionHeader title={t('fit.weeklyTraining')} />
      <GlassCard>
        <Segmented options={['sessions', 'volume', 'sets'] as Metric[]} value={metric} onChange={setMetric} labelOf={(m) => t(`fit.metric.${m}`)} testIDPrefix="fa-metric" />
        <Bars
          data={weeks.map((w) => ({ label: fmt.localDate(w.weekStart, 'short'), value: metric === 'sessions' ? w.sessions : metric === 'sets' ? w.sets : w.volumeKg }))}
          highlight={weeks.length - 1}
          color={th.accent}
        />
      </GlassCard>

      <SectionHeader title={t('fit.strengthTrend')} action={t('common.change')} onAction={() => setPicking(true)} testID="fa-pick" />
      {ex ? (
        <GlassCard accent={th.accent}>
          <Txt variant="heading">{exerciseName(ex, userEx, locale)}</Txt>
          {hist.filter((h) => h.bestE1rm != null).length > 1 ? (
            <>
              <Txt variant="caption" color="textSecondary">
                {t('fit.e1rmTrend')}
              </Txt>
              <LineChart data={hist.slice(-12).map((h) => ({ label: h.date, value: h.bestE1rm }))} color={th.accent} testID="fa-e1rm" />
            </>
          ) : hist.length > 1 ? (
            <>
              <Txt variant="caption" color="textSecondary">
                {t('fit.repsTrend')}
              </Txt>
              <LineChart data={hist.slice(-12).map((h) => ({ label: h.date, value: h.totalReps }))} color={th.accent} />
            </>
          ) : (
            <Txt color="textMuted">{t('fit.needTwoSessions')}</Txt>
          )}
          <Row wrap>
            {hist.at(-1)?.topKg != null ? <Txt color="textSecondary">{t('fit.heaviest', { n: fmt.number(Math.max(...hist.map((h) => h.topKg ?? 0))) })}</Txt> : null}
            <Txt color="textSecondary">{t('fit.sessionsN', { n: hist.length })}</Txt>
          </Row>
        </GlassCard>
      ) : null}

      {groupBars.length ? (
        <>
          <SectionHeader title={t('fit.muscleSplit')} />
          <GlassCard>
            <Bars data={groupBars.map(([g, n]) => ({ label: t(`mg.${g}`), value: n }))} color={th.accent} />
          </GlassCard>
        </>
      ) : null}

      <SectionHeader title={t('fit.prs')} />
      {prs.slice(0, 12).map((p) => (
        <ListItem
          key={p.exercise_id}
          title={exerciseName(p.exercise_id, userEx, locale)}
          subtitle={[p.heaviestKg != null ? t('fit.heaviest', { n: fmt.number(Math.round(p.heaviestKg * 10) / 10) }) : null, t('fit.mostReps', { n: fmt.number(p.mostReps) })].filter(Boolean).join(' · ')}
          onPress={() => setExercise(p.exercise_id)}
        />
      ))}
      <SelectSheet
        visible={picking}
        title={t('fit.strengthTrend')}
        options={trained.map((id) => ({ value: id, label: exerciseName(id, userEx, locale) }))}
        value={ex}
        onClose={() => setPicking(false)}
        onSelect={(v) => {
          setPicking(false);
          if (v) setExercise(v);
        }}
      />
    </Screen>
  );
}
