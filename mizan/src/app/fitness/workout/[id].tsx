import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { minutesBetween, weekdayOf } from '@/domain/dates';
import { overloadSuggestion, personalRecords, trainingVolumeKg } from '@/domain/fitness';
import { parseNumberInput } from '@/domain/formValues';
import { activeWorkout, addSet, finishWorkout, startWorkout } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { exerciseMap, allExercises } from '@/ui/exercises';
import { SelectField, TextField } from '@/ui/fields';
import { Badge, Button, Card, Chip, EmptyState, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref } from '@/ui/records';
import { FitnessNav } from '@/ui/FitnessNav';

/** /fitness/workout/active = live logging; /fitness/workout/<id> = a past session. */
export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today, locale, confirm } = useApp();
  const workouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const userExercises = useCollection('exercises');
  const programs = useCollection('workout_programs');
  const exMap = useMemo(() => exerciseMap(userExercises, locale), [userExercises, locale]);
  const workout = id === 'active' ? activeWorkout(store) : workouts.find((w) => w.id === id);
  const [exercise, setExercise] = useState<string | null>(null);
  const [reps, setReps] = useState('');
  const [load, setLoad] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [title, setTitle] = useState('');

  if (!workout) {
    if (id !== 'active')
      return (
        <Screen title={t('col.workouts')} testID="screen-not-found">
          <EmptyState body={t('state.notFound')} />
        </Screen>
      );
    const program = programs.find((p) => p.is_active);
    const plan = program?.schedule_json?.[String(weekdayOf(today))] ?? '';
    const recent = [...workouts].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 10);
    return (
      <Screen title={t('fit.workout')} testID="screen-workout-start">
        <FitnessNav />
        <TextField label={t('field.title')} value={title || plan} onChange={setTitle} placeholder={t('fit.workout')} testID="workout-title" />
        <Button label={t('fit.startWorkout')} icon="play" onPress={() => startWorkout(store, title || plan || t('fit.workout'), new Date(), program?.id)} testID="workout-start" />
        <SectionHeader title={t('common.history')} />
        {recent.length === 0 ? (
          <Txt color="textMuted">{t('state.emptyBody')}</Txt>
        ) : (
          recent.map((w) => {
            const ws = sets.filter((s) => s.workout_id === w.id);
            return <ListItem key={w.id} title={w.title} subtitle={`${fmt.dateTime(w.started_at)} · ${t(`opt.wstatus.${w.status}`)} · ${t('fit.volume', { n: Math.round(trainingVolumeKg(ws)) })}`} onPress={() => router.push(`/fitness/workout/${w.id}`)} />;
          })
        )}
      </Screen>
    );
  }

  const wSets = sets.filter((s) => s.workout_id === workout.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const byExercise = new Map<string, typeof wSets>();
  for (const s of wSets) byExercise.set(s.exercise_id, [...(byExercise.get(s.exercise_id) ?? []), s]);
  const live = workout.status === 'in_progress';
  const repsN = parseNumberInput(reps);
  const loadN = parseNumberInput(load);
  const repsErr = reps && (repsN === 'invalid' || (typeof repsN === 'number' && (repsN < 0 || repsN > 1000 || !Number.isInteger(repsN)))) ? 'invalid_number' : undefined;
  const loadErr = load && (loadN === 'invalid' || (typeof loadN === 'number' && (loadN < 0 || loadN > 1000))) ? 'invalid_number' : undefined;
  const canAdd = !!exercise && typeof repsN === 'number' && !repsErr && !loadErr;

  // previous sessions for the selected exercise (for "last time" + overload suggestion)
  const prevSessions = (exId: string) =>
    workouts
      .filter((w) => w.id !== workout.id && w.status === 'completed')
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
      .map((w) => sets.filter((s) => s.workout_id === w.id && s.exercise_id === exId))
      .filter((s) => s.length > 0);
  const last = exercise ? prevSessions(exercise).slice(-1)[0] : undefined;
  const suggestion = exercise ? overloadSuggestion(prevSessions(exercise), 8) : null;
  const prs = personalRecords(sets.filter((s) => workouts.find((w) => w.id === s.workout_id)?.status === 'completed'));

  return (
    <Screen
      title={workout.title}
      subtitle={`${fmt.dateTime(workout.started_at)}${workout.ended_at ? ' · ' + t('fit.duration', { n: minutesBetween(workout.started_at, workout.ended_at) }) : ''}`}
      actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('workouts', workout.id) as never)} />}
      testID="screen-workout">
      {id === 'active' ? <FitnessNav /> : null}
      <Row wrap>
        <Badge label={t(`opt.wstatus.${workout.status}`)} tone={live ? 'accent' : 'neutral'} />
        <Badge label={t('fit.volume', { n: Math.round(trainingVolumeKg(wSets)) })} />
      </Row>
      {[...byExercise.entries()].map(([exId, list]) => {
        const pr = prs.get(exId);
        return (
          <Card key={exId}>
            <Txt variant="bodyStrong">{exMap.get(exId)?.name ?? exId}</Txt>
            {list.map((s) => (
              <ListItem key={s.id} title={`${t('field.set_number')} ${fmt.number(s.set_number)}: ${fmt.number(s.reps)} × ${s.load_value != null ? `${fmt.number(s.load_value)} ${t(`opt.unit.${s.load_unit}`)}` : '—'}`} onPress={() => router.push(editRecordHref('workout_sets', s.id) as never)} testID={`set-${s.id}`} />
            ))}
            {pr?.heaviestKg ? <Txt variant="caption" color="textMuted">{t('fit.prs')}: {t('fit.heaviest', { n: Math.round(pr.heaviestKg * 10) / 10 })}</Txt> : null}
          </Card>
        );
      })}
      {byExercise.size === 0 ? <Txt color="textMuted">{t('fit.noSets')}</Txt> : null}

      <SectionHeader title={t('fit.addSet')} />
      <SelectField label={t('fit.addExercise')} value={exercise} onChange={setExercise} options={allExercises(userExercises, locale).map((e) => ({ value: e.id, label: e.name, subtitle: e.primary_muscles }))} inlineMax={0} testID="workout-exercise" />
      {last ? <Txt variant="caption" color="textSecondary">{t('fit.lastTime', { summary: last.map((s) => `${s.reps}×${s.load_value ?? '-'}`).join(', ') })}</Txt> : null}
      {suggestion?.suggestIncrease ? <Notice text={t('fit.overloadSuggest')} tone="success" /> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField label={t('field.reps')} value={reps} onChange={setReps} keyboardType="number-pad" error={repsErr} testID="set-reps" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label={t('field.load_value')} value={load} onChange={setLoad} keyboardType="decimal-pad" error={loadErr} testID="set-load" />
        </View>
      </View>
      <Row>
        <Chip label="kg" selected={unit === 'kg'} onPress={() => setUnit('kg')} />
        <Chip label="lb" selected={unit === 'lb'} onPress={() => setUnit('lb')} />
      </Row>
      <Button
        label={t('fit.addSet')}
        icon="add"
        disabled={!canAdd}
        testID="set-add"
        onPress={() => {
          addSet(store, workout.id, exercise as string, repsN as number, typeof loadN === 'number' ? loadN : null, unit);
          setReps('');
        }}
      />
      {live ? (
        <Button
          variant="secondary"
          label={t('fit.finishWorkout')}
          icon="flag-outline"
          testID="workout-finish"
          onPress={async () => {
            if (wSets.length === 0 && !(await confirm({ title: t('fit.finishWorkout'), body: t('fit.noSets') }))) return;
            finishWorkout(store, workout.id, new Date());
            router.replace(`/fitness/workout/${workout.id}`);
          }}
        />
      ) : null}
    </Screen>
  );
}
