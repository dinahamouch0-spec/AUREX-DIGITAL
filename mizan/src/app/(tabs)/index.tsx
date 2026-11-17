import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { agendaForDay, generateInsights } from '@/domain/aggregate';
import { isAssignmentOpen } from '@/domain/academics';
import { financialSummary } from '@/domain/business';
import { addDays, localDateOf, weekdayOf } from '@/domain/dates';
import { dayPrayerSummary } from '@/domain/deen';
import { weeklyTraining } from '@/domain/fitness';
import { goalProgress } from '@/domain/goals';
import { habitDayStatus, isScheduledOn } from '@/domain/habits';
import { CurrencyCode } from '@/domain/money';
import { itemsForDate, sumItems, weekSummary } from '@/domain/nutrition';
import { dayForWeekday } from '@/domain/programs';
import { DOMAINS, Domain } from '@/domain/types';
import { store, useApp, useCollection, useStoreVersion, listAll } from '@/state/AppContext';
import { DOMAIN_COLORS, DomainThemeKey, spacing } from '@/theme/tokens';
import { TimelineList } from '@/ui/agenda';
import { InsightCard } from '@/ui/InsightCard';
import { Bars, FadeIn, GlassCard, Hero, IconBadge, ProgressRing, QuickAction, Segmented, useDomainTheme } from '@/ui/kit';
import { PerfectDayCard } from '@/ui/PerfectDayCard';
import { Button, DomainDot, IconName, ListItem, ProgressBar, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { SyncIndicator } from '@/ui/SyncIndicator';
import { TopActions } from '@/ui/TopActions';

type WeekMetric = 'prayers' | 'workouts' | 'kcal' | 'habits';

/**
 * Command center. Each domain keeps its own progress measure: prayers, training,
 * nutrition, study and habits are shown side by side and never merged into one score.
 */
export default function Home() {
  const { t, fmt, settings, today, showToast } = useApp();
  const version = useStoreVersion();
  const [metric, setMetric] = useState<WeekMetric>('prayers');
  const now = new Date();
  const tz = settings.timezone;
  const prayerLogs = useCollection('prayer_logs');
  const habits = useCollection('habits');
  const habitLogs = useCollection('habit_logs');
  const tasks = useCollection('tasks');
  const assignments = useCollection('assignments');
  const goals = useCollection('goals');
  const milestones = useCollection('milestones');
  const meals = useCollection('meals');
  const mealItems = useCollection('meal_items');
  const workouts = useCollection('workouts');
  const sets = useCollection('workout_sets');
  const studySessions = useCollection('study_sessions');
  const themes = {
    deen: useDomainTheme('deen'),
    fitness: useDomainTheme('fitness'),
    nutrition: useDomainTheme('nutrition'),
    academics: useDomainTheme('academics'),
    business: useDomainTheme('business'),
    habits: useDomainTheme('habits'),
  } satisfies Partial<Record<DomainThemeKey, ReturnType<typeof useDomainTheme>>>;

  const list = listAll as never;
  void version; // re-render on any store change
  const agenda = agendaForDay(list, today, { timeZone: tz, prayer: settings.prayer });
  const insights = settings.ai.enabled
    ? generateInsights(list, { today, now, timeZone: tz, weekStart: settings.weekStart, allowedDomains: DOMAINS.filter((d) => settings.ai.domains[d]) })
    : [];

  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now));
  const greeting = t(hour < 12 ? 'home.greeting.morning' : hour < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening');

  // ---- per-domain "today" measures (kept separate)
  const prayers = dayPrayerSummary(prayerLogs, today);
  const prayersRecorded = prayers.performed + prayers.missed + prayers.excused;
  const activeHabits = habits.filter((h) => isScheduledOn(h, today) && h.schedule_type !== 'times_per_week');
  const habitsDone = activeHabits.filter((h) => habitDayStatus(h, habitLogs, today) === 'completed').length;
  const program = store.list('workout_programs').find((p) => p.is_active);
  const planDay = dayForWeekday(program?.days_json, weekdayOf(today));
  const planLabel = planDay?.name ?? program?.schedule_json?.[String(weekdayOf(today))];
  const trainedToday = workouts.some((w) => w.status === 'completed' && localDateOf(w.started_at, tz) === today);
  const nutritionToday = sumItems(itemsForDate(meals, mealItems, today, tz).items);
  const dueToday = assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) === today);
  const studyToday = studySessions.filter((s) => s.planned_date === today);
  const studyDone = studyToday.filter((s) => s.status === 'completed').length;
  const openTasks = tasks.filter((x) => x.status !== 'completed' && x.status !== 'archived' && x.status !== 'skipped');
  const fin = financialSummary({ transactions: store.list('transactions'), invoices: store.list('invoices'), payments: store.list('invoice_payments') }, { today });
  const receivables = Object.entries(fin.receivables) as [CurrencyCode, number][];

  const rings: { key: string; label: string; value: string; ratio: number | null; color: string; href: string }[] = [
    { key: 'deen', label: t('domain.deen'), value: `${fmt.number(prayersRecorded)}/${fmt.number(5)}`, ratio: prayersRecorded / 5, color: themes.deen.accent, href: '/deen' },
    { key: 'fitness', label: t('domain.fitness'), value: trainedToday ? '✓' : planLabel ? '•' : '—', ratio: trainedToday ? 1 : 0, color: themes.fitness.accent, href: '/fitness' },
    { key: 'nutrition', label: t('fit.nutrition'), value: fmt.number(nutritionToday.kcal), ratio: settings.nutrition.kcal ? nutritionToday.kcal / settings.nutrition.kcal : nutritionToday.kcal > 0 ? 1 : 0, color: themes.nutrition.accent, href: '/fitness/nutrition' },
    { key: 'habits', label: t('domain.habits'), value: activeHabits.length ? `${fmt.number(habitsDone)}/${fmt.number(activeHabits.length)}` : '—', ratio: activeHabits.length ? habitsDone / activeHabits.length : null, color: themes.habits.accent, href: '/habits' },
    { key: 'academics', label: t('domain.academics'), value: studyToday.length ? `${fmt.number(studyDone)}/${fmt.number(studyToday.length)}` : fmt.number(dueToday.length), ratio: studyToday.length ? studyDone / studyToday.length : null, color: themes.academics.accent, href: '/academics' },
  ];

  // ---- weekly overview, one domain at a time
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const nutWeek = weekSummary(meals, mealItems, today, tz);
  const trainWeek = weeklyTraining(workouts, sets, days, (iso) => localDateOf(iso, tz));
  const weekData = days.map((d, i) => {
    const label = fmt.localDate(d, 'weekday').slice(0, 3);
    if (metric === 'prayers') {
      const s = dayPrayerSummary(prayerLogs, d);
      return { label, value: s.performed + s.missed + s.excused };
    }
    if (metric === 'workouts') return { label, value: trainWeek[i].sessions };
    if (metric === 'kcal') return { label, value: nutWeek[i].totals.kcal };
    return { label, value: habits.filter((h) => isScheduledOn(h, d) && habitDayStatus(h, habitLogs, d) === 'completed').length };
  });
  const metricColor = { prayers: themes.deen.accent, workouts: themes.fitness.accent, kcal: themes.nutrition.accent, habits: themes.habits.accent }[metric];

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

  const domainCards: { domain: Domain; theme: keyof typeof themes; icon: IconName; line: string; sub?: string; href: string }[] = [
    { domain: 'deen', theme: 'deen', icon: 'moon', line: t('home.prayersRecorded', { n: prayersRecorded }), href: '/deen' },
    {
      domain: 'fitness',
      theme: 'fitness',
      icon: 'barbell',
      line: trainedToday ? t('home.trainedToday') : program ? (planLabel ? t('home.workoutToday', { label: planLabel }) : t('home.restDay')) : t('home.noProgram'),
      sub: `${t('fit.nutritionToday')}: ${fmt.number(nutritionToday.kcal)} kcal · P ${fmt.number(nutritionToday.protein)} g`,
      href: '/fitness',
    },
    { domain: 'academics', theme: 'academics', icon: 'school', line: t('home.dueToday', { n: dueToday.length }), sub: studyToday.length ? t('home.studyToday', { done: studyDone, total: studyToday.length }) : undefined, href: '/academics' },
    {
      domain: 'business',
      theme: 'business',
      icon: 'briefcase',
      line: receivables.length ? `${t('home.receivables')}: ${receivables.map(([c, v]) => fmt.money(v, c)).join(' · ')}` : t('home.openTasks', { n: openTasks.filter((x) => x.domain === 'business').length }),
      href: '/business',
    },
    { domain: 'habits', theme: 'habits', icon: 'repeat', line: activeHabits.length ? t('home.habitsToday', { done: habitsDone, total: activeHabits.length }) : t('home.noHabits'), href: '/habits' },
  ];

  return (
    <Screen title={t('app.name')} back={false} actions={<TopActions />} testID="screen-home">
      <Hero domain="general" eyebrow={fmt.localDate(today, 'long')} title={`${greeting}${settings.displayName ? `${settings.locale === 'ar' ? '،' : ','} ${settings.displayName}` : ''}`} right={<SyncIndicator />} titleTestID="home-greeting">
        <Txt variant="caption" color="textSecondary">
          {t('home.subtitle')}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          {rings.map((r) => (
            <View key={r.key} style={{ alignItems: 'center', gap: 4, width: 74 }}>
              <ProgressRing ratio={r.ratio} size={64} stroke={7} color={r.color} label={`${r.label}: ${r.value}`} testID={`home-ring-${r.key}`}>
                <Txt variant="caption" style={{ fontWeight: '800' }} align="center">
                  {r.value}
                </Txt>
              </ProgressRing>
              <Txt variant="caption" color="textSecondary" align="center" numberOfLines={1} style={{ fontSize: 11 }}>
                {r.label}
              </Txt>
            </View>
          ))}
        </ScrollView>
        <Txt variant="caption" color="textMuted">
          {t('home.separateNote')}
        </Txt>
      </Hero>

      <FadeIn delay={80}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
          <QuickAction icon="moon-outline" label={t('qa.logPrayer')} color={themes.deen.accent} onPress={() => router.push('/deen')} testID="qa-prayer" />
          <QuickAction icon="water-outline" label={t('qa.water')} color="#5EA4F2" onPress={addWater} testID="qa-water" />
          <QuickAction icon="nutrition-outline" label={t('nut.addFood')} color={themes.nutrition.accent} onPress={() => router.push(`/fitness/food?date=${today}` as never)} testID="qa-food" />
          <QuickAction icon="barbell-outline" label={t('qa.startWorkout')} color={themes.fitness.accent} onPress={() => router.push('/fitness/workout/active')} testID="qa-workout" />
          <QuickAction icon="add-circle-outline" label={t('qa.addTask')} onPress={() => router.push(newRecordHref('tasks') as never)} testID="qa-task" />
          <QuickAction icon="book-outline" label={t('qa.addHomework')} color={themes.academics.accent} onPress={() => router.push(newRecordHref('assignments') as never)} />
          <QuickAction icon="cash-outline" label={t('qa.addTransaction')} color={themes.business.accent} onPress={() => router.push(newRecordHref('transactions', { occurred_on: today }) as never)} />
          <QuickAction icon="calendar-outline" label={t('qa.addEvent')} onPress={() => router.push(newRecordHref('calendar_events') as never)} />
        </ScrollView>
      </FadeIn>

      <PerfectDayCard />

      <SectionHeader title={t('home.today')} />
      <View style={{ gap: spacing.sm }}>
        {domainCards.map((c, i) => (
          <FadeIn key={c.domain} delay={60 * i}>
            <GlassCard accent={themes[c.theme].accent} onPress={() => router.push(c.href as never)} accessibilityLabel={`${t(`domain.${c.domain}`)}: ${c.line}`} testID={`home-card-${c.domain}`}>
              <Row>
                <IconBadge icon={c.icon} color={themes[c.theme].accent} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{t(`domain.${c.domain}`)}</Txt>
                  <Txt color="textSecondary">{c.line}</Txt>
                  {c.sub ? (
                    <Txt variant="caption" color="textMuted">
                      {c.sub}
                    </Txt>
                  ) : null}
                </View>
              </Row>
            </GlassCard>
          </FadeIn>
        ))}
        <Txt variant="caption" color="textMuted">
          {t('home.countsNote')}
        </Txt>
      </View>

      <SectionHeader title={t('home.weekly')} />
      <GlassCard>
        <Segmented options={['prayers', 'workouts', 'kcal', 'habits'] as WeekMetric[]} value={metric} onChange={setMetric} labelOf={(m) => t(`home.week.${m}`)} testIDPrefix="home-week" />
        <Bars data={weekData} highlight={6} color={metricColor} />
      </GlassCard>

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
              <GlassCard key={g.id} onPress={() => router.push(`/goals/${g.id}`)} accent={DOMAIN_COLORS[g.domain]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    {g.title}
                  </Txt>
                  {pr.ratio != null ? <Txt variant="label" color="accent">{fmt.percent(pr.ratio)}</Txt> : null}
                </Row>
                {pr.ratio != null ? <ProgressBar ratio={pr.ratio} label={`${g.title} ${fmt.percent(pr.ratio)}`} /> : <Txt variant="caption" color="textMuted">{t('goals.noMeasure')}</Txt>}
              </GlassCard>
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
