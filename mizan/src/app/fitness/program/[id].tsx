import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ProgramDay, ProgramExercise, addExercise, moveExercise, removeExercise, toggleWeekday, updateExercise } from '@/domain/programs';
import { saveProgramDays, startWorkout } from '@/data/usecases';
import { store, useApp, useCollection, useRecord } from '@/state/AppContext';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { exerciseName, exerciseOptions } from '@/ui/exercises';
import { BooleanField, CommitInput } from '@/ui/fields';
import { SelectSheet } from '@/ui/overlays';
import { GlassCard, Hero, ltr, useDomainTheme } from '@/ui/kit';
import { Button, EmptyState, Icon, IconButton, Row, Screen, Txt } from '@/ui/primitives';
import { usePalette } from '@/ui/theme';

export default function ProgramEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, settings, confirm, showToast } = useApp();
  const program = useRecord('workout_programs', id);
  const userEx = useCollection('exercises');
  const [adding, setAdding] = useState<string | null>(null);
  if (!program)
    return (
      <Screen title={t('fit.programs')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const days: ProgramDay[] = program.days_json ?? [];
  const save = (next: ProgramDay[]) => saveProgramDays(store, program.id, next);
  const setDay = (day: ProgramDay) => save(days.map((d) => (d.id === day.id ? day : d)));
  const weekdays = Array.from({ length: 7 }, (_, i) => (settings.weekStart + i) % 7);

  const convertLegacy = () => {
    const byLabel = new Map<string, number[]>();
    for (const [w, label] of Object.entries(program.schedule_json ?? {})) byLabel.set(label, [...(byLabel.get(label) ?? []), Number(w)]);
    save([...byLabel.entries()].map(([name, ws]) => ({ id: Crypto.randomUUID(), name, weekdays: ws.sort(), exercises: [] })));
  };

  return (
    <Screen title={program.name} testID="screen-program">
      <Hero domain="fitness" eyebrow={t('fit.programs')} title={program.name} subtitle={t('fit.daysCount', { n: days.length })} />
      <CommitInput value={program.name} accessibilityLabel={t('field.name')} onCommit={(v) => store.update('workout_programs', program.id, { name: v })} testID="program-rename" />
      <BooleanField
        label={t('field.is_active')}
        value={program.is_active}
        onChange={(v) => {
          if (v) for (const p of store.list('workout_programs')) if (p.is_active && p.id !== program.id) store.update('workout_programs', p.id, { is_active: false });
          store.update('workout_programs', program.id, { is_active: v });
        }}
      />

      {!program.days_json ? (
        <GlassCard>
          <Txt>{t('fit.legacyExplain')}</Txt>
          <Button label={t('fit.convertProgram')} icon="git-merge-outline" onPress={convertLegacy} testID="program-convert" />
        </GlassCard>
      ) : null}

      {days.map((day, di) => (
        <DayCard
          key={day.id}
          day={day}
          index={di}
          weekdays={weekdays}
          userEx={userEx}
          onChange={setDay}
          onToggleWeekday={(w) => save(toggleWeekday(days, day.id, w))}
          onAdd={() => setAdding(day.id)}
          onStart={() => {
            startWorkout(store, day.name, new Date(), program.id);
            router.push('/fitness/workout/active');
          }}
          onDelete={async () => {
            if (await confirm({ title: t('fit.deleteDay'), body: day.name, destructive: true })) save(days.filter((d) => d.id !== day.id));
          }}
        />
      ))}
      <Button variant="secondary" icon="add" label={t('fit.addDay')} testID="program-add-day" onPress={() => save([...days, { id: Crypto.randomUUID(), name: t('fit.dayN', { n: days.length + 1 }), weekdays: [], exercises: [] }])} />
      <Button
        variant="ghost"
        icon="trash-outline"
        label={t('fit.deleteProgram')}
        onPress={async () => {
          if (!(await confirm({ title: t('fit.deleteProgram'), body: program.name, destructive: true }))) return;
          const undo = store.remove('workout_programs', program.id);
          showToast({ message: t('common.deleted'), actionLabel: t('common.undo'), onAction: undo });
          router.back();
        }}
      />
      <SelectSheet
        visible={adding != null}
        title={t('fit.addExercise')}
        options={exerciseOptions(userEx, settings.locale, t)}
        value={null}
        onClose={() => setAdding(null)}
        onSelect={(v) => {
          const day = days.find((d) => d.id === adding);
          setAdding(null);
          if (v && day) setDay(addExercise(day, v));
        }}
      />
    </Screen>
  );
}

function DayCard({
  day,
  index,
  weekdays,
  userEx,
  onChange,
  onToggleWeekday,
  onAdd,
  onStart,
  onDelete,
}: {
  day: ProgramDay;
  index: number;
  weekdays: number[];
  userEx: Parameters<typeof exerciseName>[1];
  onChange: (d: ProgramDay) => void;
  onToggleWeekday: (w: number) => void;
  onAdd: () => void;
  onStart: () => void;
  onDelete: () => void;
}) {
  const { t, fmt, locale } = useApp();
  const p = usePalette();
  const th = useDomainTheme('fitness');
  const [open, setOpen] = useState<number | null>(null);
  return (
    <GlassCard accent={th.accent} testID={`day-${index}`}>
      <Row>
        <CommitInput style={{ flex: 1 }} value={day.name} accessibilityLabel={t('fit.dayName')} onCommit={(v) => onChange({ ...day, name: v })} testID={`day-${index}-name`} />
        <IconButton icon="trash-outline" label={t('fit.deleteDay')} onPress={onDelete} color="danger" />
      </Row>
      <Row gap={6}>
        {weekdays.map((w) => {
          const on = day.weekdays.includes(w);
          return (
            <Pressable
              key={w}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={t(`weekday.${w}`)}
              onPress={() => onToggleWeekday(w)}
              testID={`day-${index}-wd-${w}`}
              style={{ flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: on ? th.accent : p.border, backgroundColor: on ? th.accent : 'transparent' }}>
              <Txt variant="caption" style={{ fontWeight: '700', color: on ? '#14110A' : p.textSecondary }}>
                {t(`weekday.${w}`)}
              </Txt>
            </Pressable>
          );
        })}
      </Row>
      {day.exercises.length === 0 ? <Txt color="textMuted">{t('fit.noExercisesYet')}</Txt> : null}
      {day.exercises.map((e, i) => (
        <View key={`${e.exercise_id}-${i}`} style={{ borderWidth: 1, borderColor: p.border, borderRadius: radius.sm, padding: spacing.sm, gap: spacing.sm }}>
          <Row>
            <Pressable style={{ flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' }} onPress={() => setOpen(open === i ? null : i)} accessibilityRole="button" testID={`day-${index}-ex-${i}`}>
              <Txt variant="bodyStrong">
                {fmt.number(i + 1)}. {exerciseName(e.exercise_id, userEx, locale)}
              </Txt>
              <Txt variant="caption" color="textSecondary">
                {ltr(`${fmt.number(e.sets)} × ${fmt.number(e.reps_min)}${e.reps_max !== e.reps_min ? `–${fmt.number(e.reps_max)}` : ''}`)} · {t('fit.restS', { n: e.rest_seconds })}
              </Txt>
            </Pressable>
            <IconButton icon="chevron-up" label={t('fit.moveUp')} onPress={() => onChange(moveExercise(day, i, -1))} />
            <IconButton icon="chevron-down" label={t('fit.moveDown')} onPress={() => onChange(moveExercise(day, i, 1))} />
            <IconButton icon="close" label={t('common.delete')} onPress={() => onChange(removeExercise(day, i))} testID={`day-${index}-ex-${i}-remove`} />
          </Row>
          {open === i ? (
            <View style={{ gap: spacing.xs }}>
              {(
                [
                  ['sets', 'fit.sets', 1],
                  ['reps_min', 'fit.repsMin', 1],
                  ['reps_max', 'fit.repsMax', 1],
                  ['rest_seconds', 'fit.restSec', 15],
                ] as [keyof Omit<ProgramExercise, 'exercise_id'>, string, number][]
              ).map(([k, label, step]) => (
                <Stepper key={k} label={t(label)} value={e[k]} step={step} onChange={(v) => onChange(updateExercise(day, i, { [k]: v }))} testID={`day-${index}-ex-${i}-${k}`} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <Row>
        <Button style={{ flex: 1 }} variant="secondary" icon="add" label={t('fit.addExercise')} onPress={onAdd} testID={`day-${index}-add`} />
        <Button style={{ flex: 1 }} icon="play" label={t('fit.startThis')} onPress={onStart} disabled={!day.exercises.length} testID={`day-${index}-start`} />
      </Row>
    </GlassCard>
  );
}

function Stepper({ label, value, step, onChange, testID }: { label: string; value: number; step: number; onChange: (v: number) => void; testID?: string }) {
  const { fmt } = useApp();
  return (
    <Row>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      <IconButton icon="remove-circle-outline" label={`${label} −`} onPress={() => onChange(value - step)} testID={testID ? `${testID}-dec` : undefined} />
      <Txt variant="bodyStrong" style={{ minWidth: 44 }} align="center" testID={testID}>
        {fmt.number(value)}
      </Txt>
      <IconButton icon="add-circle-outline" label={`${label} +`} onPress={() => onChange(value + step)} testID={testID ? `${testID}-inc` : undefined} />
      <Icon name="ellipse" size={4} color="transparent" />
    </Row>
  );
}
