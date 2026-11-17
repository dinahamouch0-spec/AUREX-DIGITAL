import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CATALOG_BY_ID } from '@/domain/exerciseCatalog';
import { minutesBetween, weekdayOf } from '@/domain/dates';
import { PRKind, newRecords, overloadSuggestion, trainingVolumeKg } from '@/domain/fitness';
import { parseNumberInput } from '@/domain/formValues';
import { ProgramExercise, dayForWeekday, defaultPrescription } from '@/domain/programs';
import type { Workout, WorkoutSet } from '@/domain/types';
import { activeWorkout, addSet, finishWorkout, startWorkout } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { radius } from '@/theme/tokens';
import { exerciseName, exerciseOptions } from '@/ui/exercises';
import { FitnessNav } from '@/ui/FitnessNav';
import { Input, TextField } from '@/ui/fields';
import { GlassCard, Hero, IconBadge, ProgressRing, StatTile, ltr, tap, useDomainTheme } from '@/ui/kit';
import { SelectSheet } from '@/ui/overlays';
import { Badge, Button, Chip, EmptyState, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { editRecordHref } from '@/ui/records';
import { usePalette } from '@/ui/theme';

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const ss = String(Math.max(0, Math.floor(s % 60))).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** /fitness/workout/active = start or continue live logging; /fitness/workout/<id> = a past session. */
export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useCollection('workouts');
  useCollection('workout_sets');
  const workout = id === 'active' ? activeWorkout(store) : workouts.find((w) => w.id === id);
  if (!workout) return id === 'active' ? <StartWorkout /> : <NotFound />;
  return workout.status === 'in_progress' ? <LiveWorkout workout={workout} /> : <WorkoutSummary workout={workout} />;
}

function NotFound() {
  const { t } = useApp();
  return (
    <Screen title={t('col.workouts')} testID="screen-not-found">
      <EmptyState body={t('state.notFound')} />
    </Screen>
  );
}

// ---------------------------------------------------------------- start
function StartWorkout() {
  const { t, fmt, today } = useApp();
  const th = useDomainTheme('fitness');
  const workouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const programs = useCollection('workout_programs');
  const program = programs.find((p) => p.is_active);
  const plannedDay = dayForWeekday(program?.days_json, weekdayOf(today));
  const legacyLabel = program?.schedule_json?.[String(weekdayOf(today))] ?? '';
  const [title, setTitle] = useState('');
  const recent = [...workouts].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 10);
  const start = (name: string, programId?: string | null) => {
    startWorkout(store, name, new Date(), programId);
    tap('medium');
  };
  return (
    <Screen title={t('fit.workout')} testID="screen-workout-start">
      <FitnessNav />
      <Hero domain="fitness" eyebrow={t('fit.todayPlan')} title={plannedDay?.name ?? (legacyLabel || (program ? t('home.restDay') : t('home.noProgram')))} subtitle={plannedDay ? t('fit.exercisesCount', { n: plannedDay.exercises.length }) : undefined}>
        {plannedDay ? (
          <>
            {plannedDay.exercises.slice(0, 6).map((e, i) => (
              <Txt key={i} color="textSecondary">
                {fmt.number(i + 1)}. <ExName id={e.exercise_id} /> · {ltr(`${fmt.number(e.sets)}×${fmt.number(e.reps_min)}–${fmt.number(e.reps_max)}`)}
              </Txt>
            ))}
            <Button label={t('fit.startNamed', { name: plannedDay.name })} icon="play" onPress={() => start(plannedDay.name, program?.id)} testID="workout-start-planned" />
          </>
        ) : null}
      </Hero>
      {program?.days_json?.filter((d) => d.id !== plannedDay?.id && d.exercises.length).length ? (
        <>
          <SectionHeader title={t('fit.otherDays')} />
          {program.days_json
            .filter((d) => d.id !== plannedDay?.id && d.exercises.length)
            .map((d) => (
              <ListItem key={d.id} left={<IconBadge icon="barbell-outline" color={th.accent} size={36} />} title={d.name} subtitle={t('fit.exercisesCount', { n: d.exercises.length })} onPress={() => start(d.name, program.id)} testID={`start-day-${d.id}`} />
            ))}
        </>
      ) : null}
      <SectionHeader title={t('fit.freeWorkout')} />
      <TextField label={t('field.title')} value={title || (plannedDay ? '' : legacyLabel)} onChange={setTitle} placeholder={t('fit.workout')} testID="workout-title" />
      <Button variant={plannedDay ? 'secondary' : 'primary'} label={t('fit.startWorkout')} icon="play" onPress={() => start(title || (plannedDay ? '' : legacyLabel) || t('fit.workout'), plannedDay ? null : program?.id)} testID="workout-start" />
      {!program ? <Button variant="ghost" icon="calendar-outline" label={t('fit.createProgram')} onPress={() => router.push('/fitness/programs')} /> : null}
      <SectionHeader title={t('common.history')} />
      {recent.length === 0 ? (
        <Txt color="textMuted">{t('state.emptyBody')}</Txt>
      ) : (
        recent.map((w) => {
          const ws = sets.filter((s) => s.workout_id === w.id);
          return <ListItem key={w.id} title={w.title} subtitle={`${fmt.dateTime(w.started_at)} · ${t(`opt.wstatus.${w.status}`)} · ${t('fit.volume', { n: fmt.number(Math.round(trainingVolumeKg(ws))) })}`} onPress={() => router.push(`/fitness/workout/${w.id}`)} />;
        })
      )}
    </Screen>
  );
}

function ExName({ id }: { id: string }) {
  const { locale } = useApp();
  const user = useCollection('exercises');
  return <>{exerciseName(id, user, locale)}</>;
}

// ---------------------------------------------------------------- live
interface Block {
  exercise_id: string;
  plan: ProgramExercise | null;
  sets: WorkoutSet[];
}

function LiveWorkout({ workout }: { workout: Workout }) {
  const { t, fmt, locale, confirm, showToast } = useApp();
  const th = useDomainTheme('fitness');
  const pal = usePalette();
  const workouts = useCollection('workouts');
  const allSets = useCollection('workout_sets');
  const userEx = useCollection('exercises');
  const program = useCollection('workout_programs').find((p) => p.id === workout.program_id);
  const planDay = program?.days_json?.find((d) => d.name === workout.title) ?? null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const h = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(h);
  }, []);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - nowMs) / 1000)) : 0;
  const [restDoneFor, setRestDoneFor] = useState<number | null>(null);
  if (restEnd && restLeft === 0 && restDoneFor !== restEnd) {
    // derived-state: fire once when the countdown reaches zero
    setRestDoneFor(restEnd);
    tap('success');
  }

  const wSets = allSets.filter((s) => s.workout_id === workout.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const blocks: Block[] = useMemo(() => {
    const out: Block[] = (planDay?.exercises ?? []).map((p) => ({ exercise_id: p.exercise_id, plan: p, sets: [] }));
    for (const s of wSets) {
      let b = out.find((x) => x.exercise_id === s.exercise_id);
      if (!b) {
        b = { exercise_id: s.exercise_id, plan: null, sets: [] };
        out.push(b);
      }
      b.sets.push(s);
    }
    if (focus && !out.some((b) => b.exercise_id === focus)) out.push({ exercise_id: focus, plan: null, sets: [] });
    return out;
  }, [planDay, wSets, focus]);
  const current = blocks.find((b) => b.exercise_id === focus) ?? blocks.find((b) => b.plan && b.sets.length < b.plan.sets) ?? blocks[0] ?? null;

  const completedIds = new Set(workouts.filter((w) => w.status === 'completed' && w.id !== workout.id).map((w) => w.id));
  const history = (exId: string) => allSets.filter((s) => s.exercise_id === exId && completedIds.has(s.workout_id));
  const prSets = new Map<string, PRKind[]>();
  for (const b of blocks) {
    const prior = history(b.exercise_id);
    b.sets.forEach((s, i) => {
      const r = newRecords(s, [...prior, ...b.sets.slice(0, i)]);
      if (r.length) prSets.set(s.id, r);
    });
  }
  const elapsed = Math.floor((nowMs - new Date(workout.started_at).getTime()) / 1000);
  const volume = trainingVolumeKg(wSets);
  const plannedSets = (planDay?.exercises ?? []).reduce((a, e) => a + e.sets, 0);

  const logSet = (exId: string, reps: number, load: number | null, unit: 'kg' | 'lb', rest: number) => {
    const block = blocks.find((b) => b.exercise_id === exId);
    const records = newRecords({ reps, load_value: load, load_unit: unit }, [...history(exId), ...(block?.sets ?? [])]);
    const row = addSet(store, workout.id, exId, reps, load, unit);
    if (rest > 0) {
      setRestEnd(Date.now() + rest * 1000);
      setRestTotal(rest);
    }
    tap(records.length ? 'success' : 'light');
    showToast({
      message: records.length ? t('fit.newPr', { kinds: records.map((k) => t(`fit.pr.${k}`)).join(' · ') }) : t('fit.setLogged'),
      actionLabel: t('common.undo'),
      onAction: () => store.remove('workout_sets', row.id),
    });
  };

  return (
    <Screen title={workout.title} subtitle={fmt.dateTime(workout.started_at)} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('workouts', workout.id) as never)} />} testID="screen-workout">
      <Hero domain="fitness" eyebrow={t('fit.activeWorkout')} title={clock(elapsed)} testID="workout-clock">
        <Row wrap>
          <Badge label={t('fit.setsDone', { n: wSets.length, total: plannedSets || wSets.length })} tone="accent" />
          <Badge label={t('fit.volume', { n: fmt.number(Math.round(volume)) })} />
          {prSets.size ? <Badge icon="trophy" label={t('fit.prsCount', { n: prSets.size })} tone="success" /> : null}
        </Row>
      </Hero>

      {restEnd && restLeft > 0 ? (
        <GlassCard accent={th.accent} testID="rest-timer">
          <Row style={{ justifyContent: 'center' }}>
            <ProgressRing ratio={restTotal ? restLeft / restTotal : 0} size={120} stroke={10} color={th.accent} label={`${t('fit.restTimer')} ${clock(restLeft)}`}>
              <Txt variant="title" align="center">
                {clock(restLeft)}
              </Txt>
              <Txt variant="caption" color="textSecondary" align="center">
                {t('fit.restTimer')}
              </Txt>
            </ProgressRing>
          </Row>
          <Row style={{ justifyContent: 'center' }}>
            <Chip icon="add" label="15s" onPress={() => { setRestEnd((restEnd ?? Date.now()) + 15000); setRestTotal(restTotal + 15); }} testID="rest-plus" />
            <Chip icon="play-skip-forward" label={t('fit.skipRest')} onPress={() => setRestEnd(null)} testID="rest-skip" />
          </Row>
        </GlassCard>
      ) : null}

      {current ? (
        <SetLogger
          key={`${current.exercise_id}:${current.sets.length}`}
          block={current}
          priorSessions={workouts
            .filter((w) => completedIds.has(w.id))
            .sort((a, b) => a.started_at.localeCompare(b.started_at))
            .map((w) => allSets.filter((s) => s.workout_id === w.id && s.exercise_id === current.exercise_id))
            .filter((x) => x.length)}
          onLog={(reps, load, unit) => logSet(current.exercise_id, reps, load, unit, current.plan?.rest_seconds ?? defaultPrescription(current.exercise_id).rest_seconds)}
        />
      ) : (
        <EmptyState icon="barbell-outline" body={t('fit.pickFirstExercise')} />
      )}

      <SectionHeader title={t('fit.exercises')} />
      {blocks.map((b, bi) => {
        const on = current?.exercise_id === b.exercise_id;
        const done = b.plan ? b.sets.length >= b.plan.sets : false;
        return (
          <GlassCard key={b.exercise_id} accent={on ? th.accent : undefined} onPress={() => setFocus(b.exercise_id)} testID={`block-${bi}`} accessibilityLabel={exerciseName(b.exercise_id, userEx, locale)}>
            <Row>
              <IconBadge icon={done ? 'checkmark-circle' : on ? 'flash' : 'ellipse-outline'} color={done ? pal.success : th.accent} size={34} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{exerciseName(b.exercise_id, userEx, locale)}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {b.plan ? `${t('fit.setOf', { n: b.sets.length, total: b.plan.sets })} · ${ltr(`${fmt.number(b.plan.reps_min)}–${fmt.number(b.plan.reps_max)}`)} ${t('fit.unit.reps')}` : t('fit.setsCount', { n: b.sets.length })}
                </Txt>
              </View>
              {CATALOG_BY_ID.has(b.exercise_id) ? <IconButton icon="information-circle-outline" label={t('fit.howTo')} onPress={() => router.push(`/fitness/exercise/${encodeURIComponent(b.exercise_id)}`)} /> : null}
            </Row>
            {b.sets.length ? (
              <Row wrap gap={6}>
                {b.sets.map((s) => (
                  <Pressable
                    key={s.id}
                    testID={`set-${s.id}`}
                    accessibilityRole="button"
                    onPress={() => router.push(editRecordHref('workout_sets', s.id) as never)}
                    onLongPress={() => {
                      const undo = store.remove('workout_sets', s.id);
                      showToast({ message: t('common.deleted'), actionLabel: t('common.undo'), onAction: undo });
                    }}
                    style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: prSets.has(s.id) ? pal.success : pal.border, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Txt variant="caption" style={{ fontWeight: '700' }}>
                      {fmt.number(s.reps)} × {s.load_value != null ? `${fmt.number(s.load_value)} ${t(`opt.unit.${s.load_unit}`)}` : t('fit.bw')}
                    </Txt>
                    {prSets.has(s.id) ? <Txt variant="caption">🏆</Txt> : null}
                  </Pressable>
                ))}
              </Row>
            ) : null}
          </GlassCard>
        );
      })}
      <Txt variant="caption" color="textMuted">
        {t('fit.setHint')}
      </Txt>
      <Button variant="secondary" icon="add" label={t('fit.addExercise')} onPress={() => setPicking(true)} testID="workout-exercise" />
      <Button
        label={t('fit.finishWorkout')}
        icon="flag-outline"
        testID="workout-finish"
        onPress={async () => {
          if (wSets.length === 0 && !(await confirm({ title: t('fit.finishWorkout'), body: t('fit.noSets') }))) return;
          finishWorkout(store, workout.id, new Date());
          tap('success');
          router.replace(`/fitness/workout/${workout.id}`);
        }}
      />
      <SelectSheet
        visible={picking}
        title={t('fit.addExercise')}
        options={exerciseOptions(userEx, locale, t)}
        value={null}
        onClose={() => setPicking(false)}
        onSelect={(v) => {
          setPicking(false);
          if (v) setFocus(v);
        }}
      />
    </Screen>
  );
}

function SetLogger({ block, priorSessions, onLog }: { block: Block; priorSessions: WorkoutSet[][]; onLog: (reps: number, load: number | null, unit: 'kg' | 'lb') => void }) {
  const { t, fmt, locale } = useApp();
  const th = useDomainTheme('fitness');
  const userEx = useCollection('exercises');
  const lastSession = priorSessions.at(-1);
  const prevThis = block.sets.at(-1);
  const ref = prevThis ?? lastSession?.[Math.min(block.sets.length, (lastSession?.length ?? 1) - 1)];
  const unitKind = CATALOG_BY_ID.get(block.exercise_id)?.prescription.unit ?? 'reps';
  const [reps, setReps] = useState(String(ref?.reps ?? block.plan?.reps_min ?? defaultPrescription(block.exercise_id).reps_min));
  const [load, setLoad] = useState(ref?.load_value != null ? String(ref.load_value) : '');
  const [unit, setUnit] = useState<'kg' | 'lb'>(ref?.load_unit ?? 'kg');
  const repsN = parseNumberInput(reps);
  const loadN = parseNumberInput(load);
  const repsErr = repsN === 'invalid' || repsN == null || !Number.isInteger(repsN) || repsN < 0 || repsN > 1000 ? 'invalid_number' : undefined;
  const loadErr = load && (loadN === 'invalid' || (typeof loadN === 'number' && (loadN < 0 || loadN > 1000))) ? 'invalid_number' : undefined;
  const suggestion = overloadSuggestion(priorSessions, block.plan?.reps_max ?? 8);
  const bump = (v: string, d: number) => {
    const n = parseNumberInput(v);
    return String(Math.max(0, Math.round(((typeof n === 'number' ? n : 0) + d) * 10) / 10));
  };
  return (
    <GlassCard accent={th.accent} testID="set-logger">
      <Txt variant="caption" style={{ color: th.accent, fontWeight: '700', letterSpacing: 1 }}>
        {t('fit.now')}
      </Txt>
      <Txt variant="title">{exerciseName(block.exercise_id, userEx, locale)}</Txt>
      <Txt color="textSecondary">
        {block.plan ? t('fit.setOf', { n: block.sets.length + 1, total: block.plan.sets }) : t('fit.setN', { n: block.sets.length + 1 })}
        {block.plan ? ` · ${t('fit.target')} ${ltr(`${fmt.number(block.plan.reps_min)}–${fmt.number(block.plan.reps_max)}`)} ${t(`fit.unit.${unitKind}`)}` : ''}
      </Txt>
      {lastSession ? <Txt variant="caption" color="textSecondary">{t('fit.lastTime', { summary: lastSession.map((s) => `${fmt.number(s.reps)}×${s.load_value != null ? fmt.number(s.load_value) : '—'}`).join(', ') })}</Txt> : null}
      {suggestion?.suggestIncrease ? <Notice text={t('fit.overloadSuggest')} tone="success" /> : null}
      {(
        [
          ['load', `${t('field.load_value')} (${t(`opt.unit.${unit}`)})`, load, setLoad, unit === 'kg' ? 2.5 : 5, 'set-load', 'decimal-pad', loadErr],
          ['reps', t(`fit.unit.${unitKind}`), reps, setReps, 1, 'set-reps', 'number-pad', repsErr],
        ] as const
      ).map(([k, label, val, set, step, id, kb, err]) => (
        <Row key={k} gap={4}>
          <Txt variant="label" color="textSecondary" style={{ width: 92 }} numberOfLines={2}>
            {label}
          </Txt>
          <IconButton icon="remove-circle-outline" label={`${label} −`} onPress={() => set(bump(val, -step))} testID={`${id}-dec`} />
          <Input style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700' }} value={val} onChangeText={set} keyboardType={kb} placeholder={k === 'load' ? t('fit.bw') : undefined} accessibilityLabel={label} invalid={!!err} testID={id} />
          <IconButton icon="add-circle-outline" label={`${label} +`} onPress={() => set(bump(val, step))} testID={`${id}-inc`} />
        </Row>
      ))}
      <Row>
        <Chip label="kg" selected={unit === 'kg'} onPress={() => setUnit('kg')} />
        <Chip label="lb" selected={unit === 'lb'} onPress={() => setUnit('lb')} />
      </Row>
      <Button label={t('fit.logSet')} icon="checkmark" disabled={!!repsErr || !!loadErr} testID="set-add" onPress={() => onLog(repsN as number, typeof loadN === 'number' ? loadN : null, unit)} />
    </GlassCard>
  );
}

// ---------------------------------------------------------------- summary
function WorkoutSummary({ workout }: { workout: Workout }) {
  const { t, fmt, locale } = useApp();
  const th = useDomainTheme('fitness');
  const workouts = useCollection('workouts');
  const allSets = useCollection('workout_sets');
  const userEx = useCollection('exercises');
  const wSets = allSets.filter((s) => s.workout_id === workout.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const earlier = new Set(workouts.filter((w) => w.status === 'completed' && w.started_at < workout.started_at).map((w) => w.id));
  const byEx = new Map<string, WorkoutSet[]>();
  for (const s of wSets) byEx.set(s.exercise_id, [...(byEx.get(s.exercise_id) ?? []), s]);
  let prs = 0;
  const prIds = new Set<string>();
  for (const [ex, list] of byEx) {
    const prior = allSets.filter((s) => s.exercise_id === ex && earlier.has(s.workout_id));
    list.forEach((s, i) => {
      if (newRecords(s, [...prior, ...list.slice(0, i)]).length) {
        prs++;
        prIds.add(s.id);
      }
    });
  }
  return (
    <Screen title={workout.title} subtitle={fmt.dateTime(workout.started_at)} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('workouts', workout.id) as never)} />} testID="screen-workout">
      <Hero domain="fitness" eyebrow={t(`opt.wstatus.${workout.status}`)} title={workout.title} subtitle={workout.ended_at ? t('fit.duration', { n: minutesBetween(workout.started_at, workout.ended_at) }) : undefined} />
      <View style={styles.grid}>
        <StatTile icon="layers-outline" label={t('fit.sets')} value={fmt.number(wSets.length)} color={th.accent} />
        <StatTile icon="barbell-outline" label={t('fit.volumeLabel')} value={`${fmt.number(Math.round(trainingVolumeKg(wSets)))} kg`} color={th.accent} />
        <StatTile icon="trophy-outline" label={t('fit.prs')} value={fmt.number(prs)} color={th.accent} />
      </View>
      {[...byEx.entries()].map(([ex, list]) => (
        <GlassCard key={ex}>
          <Txt variant="bodyStrong">{exerciseName(ex, userEx, locale)}</Txt>
          {list.map((s, i) => (
            <ListItem
              key={s.id}
              testID={`set-${s.id}`}
              title={`${t('fit.setN', { n: i + 1 })}: ${fmt.number(s.reps)} × ${s.load_value != null ? `${fmt.number(s.load_value)} ${t(`opt.unit.${s.load_unit}`)}` : t('fit.bw')}`}
              right={prIds.has(s.id) ? <Badge icon="trophy" label={t('fit.pr')} tone="success" /> : undefined}
              onPress={() => router.push(editRecordHref('workout_sets', s.id) as never)}
            />
          ))}
        </GlassCard>
      ))}
      {byEx.size === 0 ? <Txt color="textMuted">{t('fit.noSets')}</Txt> : null}
      <Button variant="secondary" icon="stats-chart-outline" label={t('fit.analytics')} onPress={() => router.push('/fitness/analytics')} />
    </Screen>
  );
}
