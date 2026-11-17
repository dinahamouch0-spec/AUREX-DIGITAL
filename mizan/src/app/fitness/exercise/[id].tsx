import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { CATALOG_BY_ID } from '@/domain/exerciseCatalog';
import { localDateOf } from '@/domain/dates';
import { exerciseHistory } from '@/domain/fitness';
import { addExercise } from '@/domain/programs';
import { saveProgramDays } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { SelectSheet } from '@/ui/overlays';
import { GlassCard, Hero, IconBadge, LineChart, StatTile, dayMonth, ltr, useDomainTheme } from '@/ui/kit';
import { MuscleMap } from '@/ui/MuscleMap';
import { Badge, Button, EmptyState, Icon, ListItem, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';

export default function ExerciseDetail() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(String(raw ?? ''));
  const { t, locale, fmt, settings, showToast } = useApp();
  const th = useDomainTheme('fitness');
  const workouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const programs = useCollection('workout_programs');
  const [picking, setPicking] = useState(false);
  const e = CATALOG_BY_ID.get(id);
  if (!e)
    return (
      <Screen title={t('fit.exerciseLibrary')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const ar = locale === 'ar';
  const name = ar ? e.name_ar : e.name;
  const p = e.prescription;
  const unitLabel = t(`fit.unit.${p.unit}`);
  const range = (a: number, b: number) => (a === b ? fmt.number(a) : ltr(`${fmt.number(a)}–${fmt.number(b)}`));
  const history = exerciseHistory(id, workouts, sets, (iso) => localDateOf(iso, settings.timezone));
  const e1 = history.filter((h) => h.bestE1rm != null);
  const heaviest = Math.max(0, ...history.map((h) => h.topKg ?? 0));
  const bestE1 = Math.max(0, ...e1.map((h) => h.bestE1rm ?? 0));
  const mostReps = Math.max(0, ...history.flatMap((h) => h.sets.map((s) => s.reps)));
  const last = history.at(-1);
  const dayOptions = programs
    .filter((pr) => pr.days_json?.length)
    .flatMap((pr) => (pr.days_json ?? []).map((d) => ({ value: `${pr.id}|${d.id}`, label: `${pr.name} · ${d.name}`, subtitle: t('fit.exercisesCount', { n: d.exercises.length }) })));

  return (
    <Screen title={name} testID="screen-exercise">
      <Hero domain="fitness" eyebrow={t(`mg.${e.group}`)} title={name} subtitle={ar ? e.name : e.name_ar}>
        <Row wrap>
          <Badge label={t(`opt.difficulty.${e.difficulty}`)} tone="accent" />
          <Badge label={t(`kind.${e.kind}`)} />
          {e.equipment.map((q) => (
            <Badge key={q} label={t(`eq.${q}`)} />
          ))}
        </Row>
      </Hero>

      <GlassCard>
        <MuscleMap primary={e.primary} secondary={e.secondary} size={210} color={th.accent} accessibilityLabel={`${t('fit.primaryMuscles')}: ${e.primary.map((m) => t(`mu.${m}`)).join(', ')}`} />
        <Row wrap style={{ justifyContent: 'center' }}>
          <Row gap={6}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: th.accent }} />
            <Txt variant="caption">{t('fit.primaryMuscles')}: {e.primary.map((m) => t(`mu.${m}`)).join('، ')}</Txt>
          </Row>
          {e.secondary.length ? (
            <Row gap={6}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: th.accent, opacity: 0.45 }} />
              <Txt variant="caption" color="textSecondary">
                {t('fit.secondaryMuscles')}: {e.secondary.map((m) => t(`mu.${m}`)).join('، ')}
              </Txt>
            </Row>
          ) : null}
        </Row>
      </GlassCard>

      <View style={styles.grid}>
        <StatTile icon="layers-outline" label={t('fit.sets')} value={range(p.sets[0], p.sets[1])} color={th.accent} />
        <StatTile icon="repeat-outline" label={unitLabel} value={range(p.reps[0], p.reps[1])} color={th.accent} />
        <StatTile icon="timer-outline" label={`${t('fit.rest')} (${t('fit.sec')})`} value={p.rest[1] ? range(p.rest[0], p.rest[1]) : '—'} color={th.accent} />
      </View>
      <Txt variant="caption" color="textMuted">
        {t('fit.guidelineNote')}
      </Txt>

      <SectionHeader title={t('fit.howTo')} />
      <GlassCard>
        {(ar ? e.steps_ar : e.steps).map((s, i) => (
          <Row key={i} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: th.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="caption" style={{ color: '#14110A', fontWeight: '800' }}>
                {fmt.number(i + 1)}
              </Txt>
            </View>
            <Txt style={{ flex: 1 }}>{s}</Txt>
          </Row>
        ))}
      </GlassCard>

      <SectionHeader title={t('field.common_mistakes')} />
      <GlassCard accent="#F07167">
        {(ar ? e.mistakes_ar : e.mistakes).map((m, i) => (
          <Row key={i} style={{ alignItems: 'flex-start' }}>
            <Icon name="close-circle" color="danger" size={18} />
            <Txt style={{ flex: 1 }}>{m}</Txt>
          </Row>
        ))}
      </GlassCard>

      <SectionHeader title={t('fit.yourProgress')} />
      {history.length === 0 ? (
        <Txt color="textMuted">{t('fit.noHistory')}</Txt>
      ) : (
        <>
          <View style={styles.grid}>
            <StatTile icon="trophy-outline" label={t('fit.prHeaviest')} value={heaviest ? `${fmt.number(Math.round(heaviest * 10) / 10)} kg` : '—'} color={th.accent} />
            <StatTile icon="flash-outline" label={t('fit.prE1rm')} value={bestE1 ? `${fmt.number(bestE1)} kg` : '—'} color={th.accent} />
            <StatTile icon="repeat-outline" label={t('fit.prReps')} value={fmt.number(mostReps)} color={th.accent} />
          </View>
          {e1.length > 1 ? (
            <GlassCard>
              <Txt variant="label" color="textSecondary">
                {t('fit.e1rmTrend')}
              </Txt>
              <LineChart data={e1.slice(-12).map((h) => ({ label: dayMonth(h.date, fmt.number), value: h.bestE1rm }))} color={th.accent} />
            </GlassCard>
          ) : null}
          {last ? (
            <ListItem
              title={t('fit.lastSession')}
              subtitle={`${fmt.localDate(last.date, 'short')} · ${last.sets.map((s) => `${fmt.number(s.reps)}×${s.load_value ?? '—'}`).join(', ')}`}
              onPress={() => router.push(`/fitness/workout/${last.workoutId}`)}
            />
          ) : null}
        </>
      )}

      <SectionHeader title={t('fit.alternatives')} />
      {e.alternatives.map((a) => {
        const alt = CATALOG_BY_ID.get(a)!;
        return (
          <ListItem
            key={a}
            left={<IconBadge icon="swap-horizontal" color={th.accent} size={36} />}
            title={ar ? alt.name_ar : alt.name}
            subtitle={alt.equipment.map((q) => t(`eq.${q}`)).join(' / ')}
            onPress={() => router.push(`/fitness/exercise/${encodeURIComponent(a)}`)}
          />
        );
      })}

      <Button
        label={t('fit.addToProgram')}
        icon="add-circle-outline"
        variant="secondary"
        style={{ marginTop: spacing.md }}
        testID="ex-add-to-program"
        onPress={() => (dayOptions.length ? setPicking(true) : router.push('/fitness/programs'))}
      />
      <SelectSheet
        visible={picking}
        title={t('fit.addToProgram')}
        options={dayOptions}
        value={null}
        onClose={() => setPicking(false)}
        onSelect={(v) => {
          setPicking(false);
          if (!v) return;
          const [pid, did] = v.split('|');
          const pr = store.get('workout_programs', pid);
          if (!pr?.days_json) return;
          saveProgramDays(store, pid, pr.days_json.map((d) => (d.id === did ? addExercise(d, id) : d)));
          showToast({ message: t('fit.addedToProgram') });
        }}
      />
    </Screen>
  );
}
