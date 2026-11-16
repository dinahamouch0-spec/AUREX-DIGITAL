import { router } from 'expo-router';
import React from 'react';

import { averageGrades, isAssignmentOpen, isAssignmentOverdue, workloadByDay } from '@/domain/academics';
import { addDays, localDateOf } from '@/domain/dates';
import { useApp, useCollection } from '@/state/AppContext';
import { NAMED_COLORS } from '@/theme/tokens';
import { BarChart } from '@/ui/BarChart';
import { Badge, Button, Card, EmptyState, ListItem, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';

export default function Academics() {
  const { t, fmt, today, settings } = useApp();
  const tz = settings.timezone;
  const subjects = useCollection('subjects');
  const assignments = useCollection('assignments');
  const exams = useCollection('exams');
  const grades = useCollection('grades');
  const now = new Date();
  const subjectName = (id: string | null | undefined) => subjects.find((s) => s.id === id)?.name ?? '';
  const overdue = assignments.filter((a) => isAssignmentOverdue(a, now));
  const upcoming = [
    ...assignments.filter((a) => isAssignmentOpen(a) && !isAssignmentOverdue(a, now) && localDateOf(a.due_at, tz) <= addDays(today, 14)).map((a) => ({ id: a.id, title: a.title, sub: subjectName(a.subject_id), at: a.due_at, href: `/records/assignments/${a.id}`, kind: 'col.assignments' })),
    ...exams.filter((e) => localDateOf(e.exam_at, tz) >= today && localDateOf(e.exam_at, tz) <= addDays(today, 30)).map((e) => ({ id: e.id, title: e.title, sub: subjectName(e.subject_id), at: e.exam_at, href: `/records/exams/${e.id}`, kind: 'col.exams' })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const workload = workloadByDay(assignments, today, 7, tz);
  return (
    <Screen title={t('ac.title')} testID="screen-academics">
      <Row wrap>
        <Button small label={t('qa.addHomework')} icon="add" onPress={() => router.push(newRecordHref('assignments') as never)} testID="ac-add-hw" />
        <Button small variant="secondary" label={t('col.exams')} icon="add" onPress={() => router.push(newRecordHref('exams') as never)} />
        <Button small variant="secondary" label={t('col.grades')} icon="add" onPress={() => router.push(newRecordHref('grades') as never)} />
        <Button small variant="secondary" label={t('ac.planner')} icon="calendar-outline" onPress={() => router.push('/academics/planner')} testID="ac-planner" />
      </Row>
      {overdue.length ? (
        <>
          <SectionHeader title={t('ac.overdue')} />
          {overdue.map((a) => (
            <ListItem key={a.id} title={a.title} subtitle={`${subjectName(a.subject_id)} · ${fmt.dateTime(a.due_at)}`} right={<Badge label={t('ac.overdue')} tone="warning" />} onPress={() => router.push(`/records/assignments/${a.id}`)} />
          ))}
        </>
      ) : null}
      <SectionHeader title={t('ac.upcoming')} />
      {upcoming.length === 0 ? <Txt color="textMuted">{t('home.noUpcoming')}</Txt> : upcoming.map((u) => <ListItem key={u.id} title={u.title} subtitle={`${t(u.kind)} · ${u.sub} · ${fmt.dateTime(u.at)}`} onPress={() => router.push(u.href as never)} />)}
      <BarChart title={t('ac.workload')} data={workload.map((w) => ({ label: fmt.weekdayShort(w.date), value: w.minutes, date: w.date }))} />
      {workload.some((w) => w.unestimated) ? <Txt variant="caption" color="textMuted">{t('ac.workloadUnestimated', { n: workload.reduce((a, w) => a + w.unestimated, 0) })}</Txt> : null}
      <SectionHeader title={t('ac.subjects')} action={t('common.add')} onAction={() => router.push(newRecordHref('subjects') as never)} testID="ac-add-subject" />
      {subjects.length === 0 ? (
        <EmptyState icon="school-outline" body={t('ac.noSubjects')} actionLabel={t('common.add')} onAction={() => router.push(newRecordHref('subjects') as never)} />
      ) : (
        subjects.map((s) => {
          const avg = averageGrades(grades.filter((g) => g.subject_id === s.id));
          return (
            <Card key={s.id} onPress={() => router.push(`/academics/subject/${s.id}`)} testID={`subject-${s.id}`} accessibilityLabel={s.name} style={s.color ? { borderStartWidth: 3, borderStartColor: NAMED_COLORS[s.color] } : undefined}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="bodyStrong">{s.name}</Txt>
                <Txt variant="bodyStrong">{avg ? `${fmt.number(avg.percent)}%` : '—'}</Txt>
              </Row>
              <Txt variant="caption" color="textSecondary">
                {[s.teacher, avg ? t(`ac.method.${avg.method}`) : t('ac.noGrades'), s.target_grade != null ? t('ac.target', { n: s.target_grade }) : null].filter(Boolean).join(' · ')}
              </Txt>
            </Card>
          );
        })
      )}
      <Row wrap>
        <Button small variant="ghost" label={t('ac.terms')} onPress={() => router.push('/records/academic_terms')} />
        <Button small variant="ghost" label={t('col.assignments')} onPress={() => router.push('/records/assignments')} />
        <Button small variant="ghost" label={t('col.exams')} onPress={() => router.push('/records/exams')} />
      </Row>
    </Screen>
  );
}
