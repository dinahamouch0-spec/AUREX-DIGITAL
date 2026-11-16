import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { agendaForDay, generateInsights } from '@/domain/aggregate';
import { isAssignmentOpen } from '@/domain/academics';
import { financialSummary } from '@/domain/business';
import { addDays, localDateOf, weekdayOf } from '@/domain/dates';
import { dayPrayerSummary } from '@/domain/deen';
import { goalProgress } from '@/domain/goals';
import { habitDayStatus, isScheduledOn } from '@/domain/habits';
import { CurrencyCode } from '@/domain/money';
import { DOMAINS, Domain } from '@/domain/types';
import { store, useApp, useCollection, useStoreVersion, listAll } from '@/state/AppContext';
import { DOMAIN_COLORS, spacing } from '@/theme/tokens';
import { TimelineList } from '@/ui/agenda';
import { InsightCard } from '@/ui/InsightCard';
import { PerfectDayCard } from '@/ui/PerfectDayCard';
import { Button, Card, Chip, DomainDot, ListItem, ProgressBar, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { SyncIndicator } from '@/ui/SyncIndicator';
import { TopActions } from '@/ui/TopActions';

export default function Home() {
  const { t, fmt, settings, today, showToast } = useApp();
  const version = useStoreVersion();
  const now = new Date();
  const tz = settings.timezone;
  const prayerLogs = useCollection('prayer_logs');
  const habits = useCollection('habits');
  const habitLogs = useCollection('habit_logs');
  const tasks = useCollection('tasks');
  const assignments = useCollection('assignments');
  const goals = useCollection('goals');
  const milestones = useCollection('milestones');

  const list = listAll as never;
  void version; // re-render on any store change
  const agenda = agendaForDay(list, today, { timeZone: tz, prayer: settings.prayer });
  const insights = settings.ai.enabled
    ? generateInsights(list, { today, now, timeZone: tz, weekStart: settings.weekStart, allowedDomains: DOMAINS.filter((d) => settings.ai.domains[d]) })
    : [];

  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now));
  const greeting = t(hour < 12 ? 'home.greeting.morning' : hour < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening');

  const prayers = dayPrayerSummary(prayerLogs, today);
  const activeHabits = habits.filter((h) => isScheduledOn(h, today) && h.schedule_type !== 'times_per_week');
  const habitsDone = activeHabits.filter((h) => habitDayStatus(h, habitLogs, today) === 'completed').length;
  const program = store.list('workout_programs').find((p) => p.is_active);
  const planLabel = program ? program.schedule_json?.[String(weekdayOf(today))] : undefined;
  const dueToday = assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) === today);
  const openTasks = tasks.filter((x) => x.status !== 'completed' && x.status !== 'archived' && x.status !== 'skipped');
  const fin = financialSummary({ transactions: store.list('transactions'), invoices: store.list('invoices'), payments: store.list('invoice_payments') }, { today });
  const receivables = Object.entries(fin.receivables) as [CurrencyCode, number][];

  const prio = { high: 0, medium: 1, low: 2 } as const;
  const priorities = [
    ...openTasks.filter((x) => x.due_at && localDateOf(x.due_at, tz) <= today).map((x) => ({ key: `t${x.id}`, title: x.title, sub: t(`opt.priority.${x.priority}`), p: prio[x.priority], href: `/records/tasks/${x.id}` })),
    ...assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) <= today).map((a) => ({ key: `a${a.id}`, title: a.title, sub: `${t('domain.academics')} · ${t(`opt.priority.${a.priority}`)}`, p: prio[a.priority], href: `/records/assignments/${a.id}` })),
  ].sort((a, b) => a.p - b.p);

  const weekEnd = addDays(today, 7);
  const upcoming = [
    ...assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) > today && localDateOf(a.due_at, tz) <= weekEnd).map((a) => ({ key: a.id, title: a.title, at: a.due_at, domain: 'academics' as Domain, href: `/records/assignments/${a.id}` })),
    ...store.list('exams').filter((e) => localDateOf(e.exam_at, tz) >= today && localDateOf(e.exam_at, tz) <= weekEnd).map((e) => ({ key: e.id, title: e.title, at: e.exam_at, domain: 'academics' as Domain, href: `/records/exams/${e.id}` })),
    ...openTasks.filter((x) => x.due_at && localDateOf(x.due_at, tz) > today && localDateOf(x.due_at, tz) <= weekEnd).map((x) => ({ key: x.id, title: x.title, at: x.due_at as string, domain: x.domain, href: `/records/tasks/${x.id}` })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'not_started').slice(0, 3);

  const addWater = () => {
    const row = store.insert('hydration_logs', { amount_ml: 250, beverage_type: 'water', logged_at: new Date().toISOString() });
    showToast({ message: t('qa.waterAdded'), actionLabel: t('common.undo'), onAction: () => store.remove('hydration_logs', row.id) });
  };

  const domainCards: { domain: Domain; line: string; href: string }[] = [
    { domain: 'deen', line: t('home.prayersRecorded', { n: prayers.performed + prayers.missed + prayers.excused }), href: '/deen' },
    { domain: 'fitness', line: program ? (planLabel ? t('home.workoutToday', { label: planLabel }) : t('home.restDay')) : t('home.noProgram'), href: '/fitness' },
    { domain: 'academics', line: t('home.dueToday', { n: dueToday.length }), href: '/academics' },
    {
      domain: 'business',
      line: receivables.length ? `${t('home.receivables')}: ${receivables.map(([c, v]) => fmt.money(v, c)).join(' · ')}` : t('home.openTasks', { n: openTasks.filter((x) => x.domain === 'business').length }),
      href: '/business',
    },
    { domain: 'habits', line: activeHabits.length ? t('home.habitsToday', { done: habitsDone, total: activeHabits.length }) : t('home.noHabits'), href: '/habits' },
  ];

  return (
    <Screen title={t('app.name')} back={false} actions={<TopActions />} testID="screen-home">
      <View style={{ gap: 4 }}>
        <Txt variant="display" testID="home-greeting">
          {greeting}
          {settings.displayName ? `${settings.locale === 'ar' ? '،' : ','} ${settings.displayName}` : ''}
        </Txt>
        <Row style={{ justifyContent: 'space-between' }} wrap>
          <Txt color="textSecondary">{fmt.localDate(today, 'long')}</Txt>
          <SyncIndicator />
        </Row>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip icon="moon-outline" label={t('qa.logPrayer')} onPress={() => router.push('/deen')} testID="qa-prayer" />
        <Chip icon="water-outline" label={t('qa.water')} onPress={addWater} testID="qa-water" />
        <Chip icon="add-circle-outline" label={t('qa.addTask')} onPress={() => router.push(newRecordHref('tasks') as never)} testID="qa-task" />
        <Chip icon="barbell-outline" label={t('qa.startWorkout')} onPress={() => router.push('/fitness/workout/active')} testID="qa-workout" />
        <Chip icon="book-outline" label={t('qa.addHomework')} onPress={() => router.push(newRecordHref('assignments') as never)} />
        <Chip icon="cash-outline" label={t('qa.addTransaction')} onPress={() => router.push(newRecordHref('transactions', { occurred_on: today }) as never)} />
        <Chip icon="calendar-outline" label={t('qa.addEvent')} onPress={() => router.push(newRecordHref('calendar_events') as never)} />
      </ScrollView>

      <PerfectDayCard />

      <SectionHeader title={t('home.today')} />
      <View style={{ gap: spacing.sm }}>
        {domainCards.map((c) => (
          <Card key={c.domain} onPress={() => router.push(c.href as never)} accessibilityLabel={`${t(`domain.${c.domain}`)}: ${c.line}`} testID={`home-card-${c.domain}`} style={{ borderStartWidth: 3, borderStartColor: DOMAIN_COLORS[c.domain] }}>
            <Row>
              <DomainDot domain={c.domain} />
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {t(`domain.${c.domain}`)}
              </Txt>
            </Row>
            <Txt color="textSecondary">{c.line}</Txt>
          </Card>
        ))}
        <Txt variant="caption" color="textMuted">
          {t('home.countsNote')}
        </Txt>
      </View>

      <SectionHeader title={t('home.priorities')} action={t('qa.addTask')} onAction={() => router.push(newRecordHref('tasks') as never)} />
      {priorities.length === 0 ? (
        <Txt color="textMuted">{t('home.noPriorities')}</Txt>
      ) : (
        priorities.map((x) => <ListItem key={x.key} title={x.title} subtitle={x.sub} onPress={() => router.push(x.href as never)} />)
      )}

      <SectionHeader title={t('home.timeline')} action={t('common.seeAll')} onAction={() => router.push('/calendar')} />
      <TimelineList items={agenda.slice(0, 8)} emptyText={t('cal.empty')} />

      <SectionHeader title={t('home.upcoming')} />
      {upcoming.length === 0 ? (
        <Txt color="textMuted">{t('home.noUpcoming')}</Txt>
      ) : (
        upcoming.slice(0, 6).map((u) => <ListItem key={u.key} title={u.title} subtitle={`${t(`domain.${u.domain}`)} · ${fmt.dateTime(u.at)}`} onPress={() => router.push(u.href as never)} left={<DomainDot domain={u.domain} />} />)
      )}

      {activeGoals.length > 0 ? (
        <>
          <SectionHeader title={t('home.goalsPreview')} action={t('common.seeAll')} onAction={() => router.push('/goals')} />
          {activeGoals.map((g) => {
            const pr = goalProgress(g, milestones);
            return (
              <Card key={g.id} onPress={() => router.push(`/goals/${g.id}`)}>
                <Txt variant="bodyStrong">{g.title}</Txt>
                {pr.ratio != null ? <ProgressBar ratio={pr.ratio} label={`${g.title} ${fmt.percent(pr.ratio)}`} /> : <Txt variant="caption" color="textMuted">{t('goals.noMeasure')}</Txt>}
              </Card>
            );
          })}
        </>
      ) : null}

      {insights.length > 0 ? (
        <>
          <SectionHeader title={t('home.insights')} action={t('common.seeAll')} onAction={() => router.push('/assistant')} />
          {insights.slice(0, 3).map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </>
      ) : null}

      <Button label={t('nav.settings')} variant="ghost" icon="settings-outline" onPress={() => router.push('/settings')} />
    </Screen>
  );
}
