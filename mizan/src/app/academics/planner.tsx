import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { addDays, dateRange, startOfWeek } from '@/domain/dates';
import { moveStudySession } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Badge, Button, Card, IconButton, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref, newRecordHref } from '@/ui/records';

const HEAVY_MINUTES = 180;

export default function Planner() {
  const { t, fmt, today, settings, rtl, showToast } = useApp();
  const [week, setWeek] = useState(startOfWeek(today, settings.weekStart));
  const sessions = useCollection('study_sessions');
  const subjects = useCollection('subjects');
  const days = dateRange(week, addDays(week, 6));
  return (
    <Screen title={t('ac.planner')} testID="screen-planner">
      <Notice text={t('ac.plannerNote')} />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={rtl ? 'chevron-forward' : 'chevron-back'} label={t('common.prev')} onPress={() => setWeek(addDays(week, -7))} />
        <Txt variant="bodyStrong">
          {fmt.localDate(days[0], 'short')} – {fmt.localDate(days[6], 'short')}
        </Txt>
        <IconButton icon={rtl ? 'chevron-back' : 'chevron-forward'} label={t('common.next')} onPress={() => setWeek(addDays(week, 7))} />
      </Row>
      {days.map((d) => {
        const list = sessions.filter((s) => s.planned_date === d);
        const minutes = list.filter((s) => s.status !== 'completed' && s.status !== 'skipped').reduce((a, s) => a + s.planned_minutes, 0);
        return (
          <View key={d} style={{ gap: spacing.sm }}>
            <SectionHeader title={`${fmt.localDate(d, 'weekday')}${minutes ? ` · ${t('common.minutes', { n: minutes })}` : ''}`} action={t('common.add')} onAction={() => router.push(newRecordHref('study_sessions', { planned_date: d }) as never)} testID={`planner-add-${d}`} />
            {minutes > HEAVY_MINUTES ? <Notice tone="warning" text={t('ac.heavyWarning', { n: minutes })} /> : null}
            {list.map((s) => {
              const missed = s.planned_date < today && s.status !== 'completed' && s.status !== 'skipped';
              return (
                <Card key={s.id} onPress={() => router.push(editRecordHref('study_sessions', s.id) as never)} testID={`session-${s.id}`}>
                  <Row style={{ justifyContent: 'space-between' }} wrap>
                    <Txt variant="bodyStrong">{s.title}</Txt>
                    <Badge label={t(`opt.status.${s.status}`)} tone={s.status === 'completed' ? 'success' : 'neutral'} />
                  </Row>
                  <Txt variant="caption" color="textSecondary">
                    {[subjects.find((x) => x.id === s.subject_id)?.name, t('common.minutes', { n: s.planned_minutes }), t(`opt.priority.${s.priority}`)].filter(Boolean).join(' · ')}
                  </Txt>
                  {s.status !== 'completed' ? (
                    <Row wrap>
                      <Button small label={t('ac.markDone')} onPress={() => store.update('study_sessions', s.id, { status: 'completed', actual_minutes: s.actual_minutes ?? s.planned_minutes })} testID={`session-done-${s.id}`} />
                      {missed || s.planned_date === today ? (
                        <Button
                          small
                          variant="secondary"
                          label={t('ac.moveTomorrow')}
                          onPress={() => {
                            moveStudySession(store, s.id, addDays(today, 1));
                            showToast({ message: t('toast.saved') });
                          }}
                        />
                      ) : null}
                    </Row>
                  ) : null}
                </Card>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}
