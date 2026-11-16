import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { MASTERY_STATES, averageGrades, gradePercent, gradeTrend, isAssignmentOpen, masteryDistribution, targetGap } from '@/domain/academics';
import type { MasteryStatus } from '@/domain/types';
import { store, useApp, useCollection, useRecord } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { SelectSheet } from '@/ui/overlays';
import { Badge, Button, Card, EmptyState, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { RecordList, editRecordHref, newRecordHref } from '@/ui/records';

export default function SubjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt } = useApp();
  const subject = useRecord('subjects', id);
  const grades = useCollection('grades').filter((g) => g.subject_id === id);
  const lessons = useCollection('lessons').filter((l) => l.subject_id === id);
  const units = useCollection('academic_units').filter((u) => u.subject_id === id);
  const [lessonSheet, setLessonSheet] = React.useState<string | null>(null);
  if (!subject)
    return (
      <Screen title={t('ac.subjects')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const avg = averageGrades(grades);
  const trend = gradeTrend(grades);
  const gap = targetGap(avg, subject.target_grade);
  const dist = masteryDistribution(lessons);
  return (
    <Screen title={subject.name} subtitle={subject.teacher ?? undefined} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('subjects', subject.id) as never)} />} testID="screen-subject">
      <Card>
        <Txt variant="label" color="textSecondary">
          {t('ac.average')}
        </Txt>
        <Txt variant="title" testID="subject-average">
          {avg ? `${fmt.number(avg.percent)}%` : t('ac.noGrades')}
        </Txt>
        {avg ? (
          <>
            <Txt variant="caption" color="textSecondary">
              {t(`ac.method.${avg.method}`)}
            </Txt>
            <Txt variant="caption" color="textMuted">
              {t('ac.formula', { formula: avg.formula })}
            </Txt>
          </>
        ) : null}
        <Row wrap>
          {subject.target_grade != null ? <Badge label={t('ac.target', { n: subject.target_grade })} /> : null}
          {gap != null && gap > 0 ? <Badge label={t('ac.gap', { n: Math.round(gap * 10) / 10 })} tone="info" /> : null}
          {trend ? <Badge label={t(`ac.trend.${trend.direction}`)} tone={trend.direction === 'down' ? 'warning' : 'success'} /> : null}
        </Row>
        {!trend ? <Txt variant="caption" color="textMuted">{t('ac.trendWithheld')}</Txt> : null}
      </Card>

      <SectionHeader title={t('col.grades')} action={t('common.add')} onAction={() => router.push(newRecordHref('grades', { subject_id: subject.id }) as never)} testID="subject-add-grade" />
      {grades
        .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
        .map((g) => (
          <ListItem key={g.id} title={g.title} subtitle={`${fmt.number(g.score)}/${fmt.number(g.max_score)} = ${fmt.number(gradePercent(g.score, g.max_score) ?? 0)}%${g.weight != null ? ` · ${t('field.weight')}: ${fmt.number(g.weight)}` : ''} · ${fmt.date(g.recorded_at)}`} onPress={() => router.push(editRecordHref('grades', g.id) as never)} />
        ))}

      <SectionHeader title={t('ac.mastery')} action={t('common.add')} onAction={() => router.push(newRecordHref('lessons', { subject_id: subject.id }) as never)} testID="subject-add-lesson" />
      {lessons.length ? (
        <Txt variant="caption" color="textSecondary">
          {MASTERY_STATES.map((m) => `${t(`opt.mastery.${m}`)} ${dist[m]}`).join(' · ')}
        </Txt>
      ) : null}
      {units.map((u) => (
        <Txt key={u.id} variant="label" color="textSecondary">
          {u.name}
        </Txt>
      ))}
      <View style={{ gap: spacing.sm }}>
        {lessons.map((l) => (
          <ListItem key={l.id} title={l.title} subtitle={units.find((u) => u.id === l.unit_id)?.name} right={<Badge label={t(`opt.mastery.${l.mastery_status}`)} tone={l.mastery_status === 'mastered' ? 'success' : 'neutral'} />} onPress={() => setLessonSheet(l.id)} onLongPress={() => router.push(editRecordHref('lessons', l.id) as never)} testID={`lesson-${l.id}`} />
        ))}
      </View>
      <Notice text={t('ac.masteryNote')} />
      <Row wrap>
        <Button small variant="secondary" icon="albums-outline" label={`${t('common.add')} · ${t('col.academic_units')}`} onPress={() => router.push(newRecordHref('academic_units', { subject_id: subject.id }) as never)} />
      </Row>

      <RecordList collection="assignments" title={t('col.assignments')} prefill={{ subject_id: subject.id }} filter={(a) => a.subject_id === subject.id && isAssignmentOpen(a as never)} />
      <RecordList collection="exams" title={t('col.exams')} prefill={{ subject_id: subject.id }} filter={(e) => e.subject_id === subject.id} />

      <SelectSheet
        visible={lessonSheet != null}
        title={t('field.mastery_status')}
        value={lessons.find((l) => l.id === lessonSheet)?.mastery_status ?? null}
        options={MASTERY_STATES.map((m) => ({ value: m, label: t(`opt.mastery.${m}`) }))}
        onClose={() => setLessonSheet(null)}
        onSelect={(v) => {
          if (lessonSheet && v) store.update('lessons', lessonSheet, { mastery_status: v as MasteryStatus });
          setLessonSheet(null);
        }}
      />
    </Screen>
  );
}
