import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { goalProgress } from '@/domain/goals';
import { store, useApp, useCollection, useRecord } from '@/state/AppContext';
import { Badge, Button, Card, EmptyState, IconButton, ListItem, ProgressBar, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref, newRecordHref } from '@/ui/records';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt } = useApp();
  const goal = useRecord('goals', id);
  const milestones = useCollection('milestones').filter((m) => m.goal_id === id).sort((a, b) => a.sort_order - b.sort_order);
  if (!goal)
    return (
      <Screen title={t('goals.title')}>
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const pr = goalProgress(goal, milestones);
  const toggle = (mid: string, done: boolean) => store.update('milestones', mid, { status: done ? 'not_started' : 'completed' });
  return (
    <Screen
      title={goal.title}
      subtitle={t(`domain.${goal.domain}`)}
      actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('goals', goal.id) as never)} testID="goal-edit" />}
      testID="screen-goal">
      <Card>
        <Row wrap>
          <Badge label={t(`opt.status.${goal.status}`)} />
          {goal.target_date ? <Badge label={`${t('field.target_date')}: ${fmt.localDate(goal.target_date)}`} /> : null}
        </Row>
        {goal.description ? <Txt color="textSecondary">{goal.description}</Txt> : null}
        {pr.ratio != null ? (
          <>
            <ProgressBar ratio={pr.ratio} label={`${t('goals.progress')} ${fmt.percent(pr.ratio)}`} />
            <Txt variant="caption" color="textMuted">
              {fmt.percent(pr.ratio)} ·{' '}
              {pr.basis === 'milestones' ? t('goals.basis.milestones', { done: pr.done ?? 0, total: pr.total ?? 0 }) : t(`goals.basis.${pr.basis}`)}
              {pr.basis === 'metric' ? ` (${fmt.number(goal.metric_current ?? 0)} / ${fmt.number(goal.metric_target ?? 0)} ${goal.metric_unit ?? ''})` : ''}
            </Txt>
          </>
        ) : (
          <Txt variant="caption" color="textMuted">
            {t('goals.noMeasure')}
          </Txt>
        )}
      </Card>
      <SectionHeader title={t('goals.milestones')} action={t('goals.addMilestone')} onAction={() => router.push(newRecordHref('milestones', { goal_id: goal.id, sort_order: milestones.length }) as never)} testID="add-milestone" />
      {milestones.length === 0 ? (
        <Txt color="textMuted">{t('goals.noMeasure')}</Txt>
      ) : (
        milestones.map((m) => {
          const done = m.status === 'completed';
          return (
            <ListItem
              key={m.id}
              testID={`milestone-${m.id}`}
              title={m.title}
              subtitle={[t(`opt.status.${m.status}`), m.due_date ? fmt.localDate(m.due_date) : ''].filter(Boolean).join(' · ')}
              onPress={() => router.push(editRecordHref('milestones', m.id) as never)}
              left={<IconButton icon={done ? 'checkmark-circle' : 'ellipse-outline'} color={done ? 'success' : 'textMuted'} label={t('common.done')} onPress={() => toggle(m.id, done)} />}
            />
          );
        })
      )}
      <Button label={t('goals.addMilestone')} variant="secondary" icon="add" onPress={() => router.push(newRecordHref('milestones', { goal_id: goal.id, sort_order: milestones.length }) as never)} />
    </Screen>
  );
}
