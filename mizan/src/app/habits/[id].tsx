import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { addDays, dateRange } from '@/domain/dates';
import { habitDayStatus, habitSummary } from '@/domain/habits';
import { useApp, useCollection, useRecord } from '@/state/AppContext';
import { BarChart } from '@/ui/BarChart';
import { Card, EmptyState, IconButton, Notice, Screen, Txt } from '@/ui/primitives';
import { RecordList, editRecordHref } from '@/ui/records';

export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today, settings } = useApp();
  const habit = useRecord('habits', id);
  const logs = useCollection('habit_logs');
  if (!habit)
    return (
      <Screen title={t('hab.title')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const from = addDays(today, -29);
  const s = habitSummary(habit, logs, from, today, settings.weekStart);
  const last14 = dateRange(addDays(today, -13), today).map((d) => ({ label: fmt.localDate(d, 'short').split(' ')[0], value: habitDayStatus(habit, logs, d) === 'completed' ? 1 : 0, date: d }));
  return (
    <Screen title={habit.name} subtitle={t(`opt.schedule.${habit.schedule_type}`)} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('habits', habit.id) as never)} testID="habit-edit" />} testID="screen-habit">
      <Card>
        <Txt variant="label" color="textSecondary">
          {t('hab.summary')}
        </Txt>
        <Txt testID="habit-summary">
          {t('hab.summaryLine', { completed: s.counts.completed, partial: s.counts.partial, skipped: s.counts.skipped, notRecorded: s.counts.not_recorded })}
        </Txt>
        {s.completionOfRecorded != null ? <Txt color="textSecondary">{t('hab.doneOfRecorded', { n: Math.round(s.completionOfRecorded * 100) })}</Txt> : null}
        {s.weeksOnTarget ? <Txt color="textSecondary">{t('hab.weeksOnTarget', { reached: s.weeksOnTarget.reached, weeks: s.weeksOnTarget.weeks })}</Txt> : null}
      </Card>
      <BarChart title={t('opt.hlog.completed')} data={last14} max={1} />
      <Notice text={t('hab.noShame')} />
      <RecordList collection="habit_logs" title={t('common.history')} prefill={{ habit_id: habit.id, local_date: today }} filter={(l) => l.habit_id === habit.id} subtitle={(l) => [t(`opt.hlog.${l.status}`), l.quantity != null ? `${fmt.number(l.quantity as number)} ${habit.target_unit ?? ''}` : null, l.duration_minutes != null ? t('common.minutes', { n: l.duration_minutes as number }) : null].filter(Boolean).join(' · ')} />
    </Screen>
  );
}
