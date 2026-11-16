import { router } from 'expo-router';
import React, { useState } from 'react';

import { goalProgress } from '@/domain/goals';
import { DOMAINS, Domain } from '@/domain/types';
import { useApp, useCollection } from '@/state/AppContext';
import { Badge, Button, Card, EmptyState, FilterChips, ProgressBar, Row, Screen, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { TopActions } from '@/ui/TopActions';

export default function Goals() {
  const { t, fmt } = useApp();
  const goals = useCollection('goals');
  const milestones = useCollection('milestones');
  const [filter, setFilter] = useState<Domain | 'all'>('all');
  const shown = goals
    .filter((g) => filter === 'all' || g.domain === filter)
    .sort((a, b) => (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0) || (a.target_date ?? '9').localeCompare(b.target_date ?? '9'));
  return (
    <Screen title={t('goals.title')} back={false} actions={<TopActions />} testID="screen-goals">
      <FilterChips options={['all', ...DOMAINS, 'general'] as const} value={filter} onChange={setFilter} labelOf={(d) => (d === 'all' ? t('common.all') : t(`domain.${d}`))} />
      <Button label={t('common.new')} icon="add" onPress={() => router.push(newRecordHref('goals', filter !== 'all' ? { domain: filter } : undefined) as never)} testID="goal-add" />
      {shown.length === 0 ? (
        <EmptyState body={t('goals.empty')} icon="flag-outline" />
      ) : (
        shown.map((g) => {
          const pr = goalProgress(g, milestones);
          return (
            <Card key={g.id} onPress={() => router.push(`/goals/${g.id}`)} testID={`goal-${g.id}`} accessibilityLabel={g.title}>
              <Row style={{ justifyContent: 'space-between' }} wrap>
                <Badge label={t(`domain.${g.domain}`)} />
                <Badge label={t(`opt.status.${g.status}`)} tone={g.status === 'completed' ? 'success' : 'neutral'} />
              </Row>
              <Txt variant="bodyStrong">{g.title}</Txt>
              {g.target_date ? (
                <Txt variant="caption" color="textSecondary">
                  {t('field.target_date')}: {fmt.localDate(g.target_date)}
                </Txt>
              ) : null}
              {pr.ratio != null ? (
                <>
                  <ProgressBar ratio={pr.ratio} label={`${t('goals.progress')} ${fmt.percent(pr.ratio)}`} />
                  <Txt variant="caption" color="textMuted">
                    {fmt.percent(pr.ratio)} · {pr.basis === 'milestones' ? t('goals.basis.milestones', { done: pr.done ?? 0, total: pr.total ?? 0 }) : t(`goals.basis.${pr.basis}`)}
                  </Txt>
                </>
              ) : (
                <Txt variant="caption" color="textMuted">
                  {t('goals.noMeasure')}
                </Txt>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
