import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { finishRoutine, setRoutineStep, startRoutine } from '@/data/usecases';
import { store, useApp, useCollection, useRecord } from '@/state/AppContext';
import { Badge, Button, EmptyState, IconButton, ListItem, ProgressBar, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref, newRecordHref } from '@/ui/records';

export default function RoutineRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today, showToast } = useApp();
  const routine = useRecord('routines', id);
  const steps = useCollection('routine_steps').filter((s) => s.routine_id === id).sort((a, b) => a.sort_order - b.sort_order);
  const logs = useCollection('routine_logs').filter((l) => l.routine_id === id);
  const stepLogs = useCollection('routine_step_logs');
  if (!routine)
    return (
      <Screen title={t('hab.routines')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const open = logs.find((l) => l.local_date === today && l.status === 'in_progress');
  const statusOf = (stepId: string) => (open ? stepLogs.find((s) => s.routine_log_id === open.id && s.routine_step_id === stepId)?.status : undefined);
  const done = steps.filter((s) => statusOf(s.id) === 'completed').length;
  const history = [...logs].filter((l) => l.status !== 'in_progress').sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 10);
  return (
    <Screen title={routine.name} subtitle={t(`opt.routine.${routine.kind}`)} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('routines', routine.id) as never)} />} testID="screen-routine">
      {open ? (
        <>
          <Txt testID="routine-progress">{t('hab.routineProgress', { done, total: steps.length })}</Txt>
          <ProgressBar ratio={steps.length ? done / steps.length : 0} label={t('hab.routineProgress', { done, total: steps.length })} />
        </>
      ) : (
        <Button label={t('hab.runRoutine')} icon="play" disabled={steps.length === 0} onPress={() => startRoutine(store, routine, today, new Date())} testID="routine-start" />
      )}
      <SectionHeader title={t('col.routine_steps')} action={t('hab.addStep')} onAction={() => router.push(newRecordHref('routine_steps', { routine_id: routine.id, sort_order: steps.length }) as never)} testID="routine-add-step" />
      {steps.length === 0 ? <Txt color="textMuted">{t('hab.noRoutines')}</Txt> : null}
      {steps.map((s, i) => {
        const st = statusOf(s.id);
        return (
          <ListItem
            key={s.id}
            testID={`step-${s.id}`}
            title={`${fmt.number(i + 1)}. ${s.title}`}
            subtitle={[s.estimate_minutes ? t('common.minutes', { n: s.estimate_minutes }) : null, st ? t(`opt.hlog.${st}`) : null].filter(Boolean).join(' · ')}
            onPress={open ? () => setRoutineStep(store, open.id, s.id, st === 'completed' ? null : 'completed', new Date()) : () => router.push(editRecordHref('routine_steps', s.id) as never)}
            onLongPress={open ? () => setRoutineStep(store, open.id, s.id, 'skipped', new Date()) : undefined}
            left={open ? <IconButton icon={st === 'completed' ? 'checkmark-circle' : st === 'skipped' ? 'play-skip-forward-outline' : 'ellipse-outline'} color={st === 'completed' ? 'success' : 'textMuted'} label={s.title} onPress={() => setRoutineStep(store, open.id, s.id, st === 'completed' ? null : 'completed', new Date())} /> : undefined}
          />
        );
      })}
      {open ? (
        <Row>
          <Button
            label={t('hab.finishRoutine')}
            icon="flag-outline"
            style={{ flex: 1 }}
            testID="routine-finish"
            onPress={() => {
              const r = finishRoutine(store, open.id, new Date());
              showToast({ message: t(`opt.routineStatus.${r.status}`) });
            }}
          />
        </Row>
      ) : null}
      <SectionHeader title={t('common.history')} />
      {history.map((l) => (
        <ListItem key={l.id} title={fmt.localDate(l.local_date, 'weekday')} right={<Badge label={t(`opt.routineStatus.${l.status}`)} tone={l.status === 'completed' ? 'success' : 'neutral'} />} />
      ))}
    </Screen>
  );
}
