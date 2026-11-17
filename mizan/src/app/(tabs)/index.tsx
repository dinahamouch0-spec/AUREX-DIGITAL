import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { agendaForDay, generateInsights } from '@/domain/aggregate';
import { isAssignmentOpen } from '@/domain/academics';
import { addDays, localDateOf, startOfWeek, weekdayOf } from '@/domain/dates';
import { dayPrayerSummary } from '@/domain/deen';
import { weeklyTraining } from '@/domain/fitness';
import { goalProgress } from '@/domain/goals';
import { habitDayStatus, isScheduledOn } from '@/domain/habits';
import { itemsForDate, sumItems, weekSummary } from '@/domain/nutrition';
import { PRAYERS, PrayerType, computePrayerTimes } from '@/domain/prayerTimes';
import { dayForWeekday } from '@/domain/programs';
import { nextUp, skyPhase } from '@/domain/today';
import { DOMAINS } from '@/domain/types';
import { activeWorkout, setPrayerStatus, startWorkout, toggleHabitDone } from '@/data/usecases';
import { store, useApp, useCollection, useStoreVersion, listAll } from '@/state/AppContext';
import { DOMAIN_COLORS, radius, spacing } from '@/theme/tokens';
import { fw, num } from '@/theme/typography';
import { TimelineList } from '@/ui/agenda';
import { InsightCard } from '@/ui/InsightCard';
import { Bars, GlassCard, IconBadge, MACRO_COLORS, MeterRow, PressableScale, ProgressRing, QuickAction, Segmented, ltr, mixAlpha, tap, useDomainTheme } from '@/ui/kit';
import { AView, CountUp, enter, enterCalm, layout } from '@/ui/motion';
import { PerfectDayCard } from '@/ui/PerfectDayCard';
import { Button, Icon, IconName, ProgressBar, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { Sky } from '@/ui/Sky';
import { SyncIndicator } from '@/ui/SyncIndicator';
import { TopActions } from '@/ui/TopActions';
import { usePalette } from '@/ui/theme';

type WeekMetric = 'prayers' | 'workouts' | 'kcal' | 'habits';
type RingKey = 'deen' | 'fitness' | 'nutrition' | 'habits' | 'academics';
const ON_SKY = '#F5F3EE';
const ON_SKY_MUTED = 'rgba(245,243,238,0.72)';

/**
 * Home — a living command center.
 * - The sky follows the user's real prayer times; "Next up" picks one useful action now.
 * - Each domain keeps its own ring (never merged into one score); tap a ring to act inline.
 * - Evening adds a review of what was actually recorded today.
 * Re-renders once a minute (clock); no background animation.
 */
export default function Home() {
  const { t, fmt, settings, today, showToast, rtl } = useApp();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const version = useStoreVersion();
  const [now, setNow] = useState(() => new Date());
  const [metric, setMetric] = useState<WeekMetric>('prayers');
  const [open, setOpen] = useState<RingKey | null>(null);
  useEffect(() => {
    const h = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(h);
  }, []);
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
  const th = {
    deen: useDomainTheme('deen'),
    fitness: useDomainTheme('fitness'),
    nutrition: useDomainTheme('nutrition'),
    academics: useDomainTheme('academics'),
    business: useDomainTheme('business'),
    habits: useDomainTheme('habits'),
  };

  const list = listAll as never;
  void version;
  const agenda = agendaForDay(list, today, { timeZone: tz, prayer: settings.prayer });
  const insights = settings.ai.enabled ? generateInsights(list, { today, now, timeZone: tz, weekStart: settings.weekStart, allowedDomains: DOMAINS.filter((d) => settings.ai.domains[d]) }) : [];
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now));
  const greeting = t(hour < 12 ? 'home.greeting.morning' : hour < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening');
  const times = useMemo(() => computePrayerTimes(today, settings.prayer).times, [today, settings.prayer]);
  const sky = skyPhase(now, times, hour);

  // ---- real per-domain state for today
  const prayers = dayPrayerSummary(prayerLogs, today);
  const prayersRecorded = prayers.performed + prayers.missed + prayers.excused;
  const todaysHabits = habits.filter((h) => isScheduledOn(h, today) && h.schedule_type !== 'times_per_week');
  const habitsDone = todaysHabits.filter((h) => habitDayStatus(h, habitLogs, today) === 'completed').length;
  const program = store.list('workout_programs').find((x) => x.is_active);
  const planDay = dayForWeekday(program?.days_json, weekdayOf(today));
  const planLabel = planDay?.name ?? program?.schedule_json?.[String(weekdayOf(today))] ?? null;
  const trainedToday = workouts.some((w) => w.status === 'completed' && localDateOf(w.started_at, tz) === today);
  const running = activeWorkout(store);
  const food = sumItems(itemsForDate(meals, mealItems, today, tz).items);
  const openTasks = tasks.filter((x) => x.status !== 'completed' && x.status !== 'archived' && x.status !== 'skipped');
  const dueTodayItems = [
    ...assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) === today).map((a) => ({ title: a.title, at: a.due_at, href: `/records/assignments/${a.id}` })),
    ...openTasks.filter((x) => x.due_at && localDateOf(x.due_at, tz) === today).map((x) => ({ title: x.title, at: x.due_at as string, href: `/records/tasks/${x.id}` })),
  ];
  const studyToday = studySessions.filter((s) => s.planned_date === today);
  const studyDone = studyToday.filter((s) => s.status === 'completed').length;
  const weekStart = startOfWeek(today, settings.weekStart);
  const trainWeek = weeklyTraining(workouts, sets, [weekStart], (iso) => startOfWeek(localDateOf(iso, tz), settings.weekStart))[0];
  const plannedPerWeek = program?.days_json ? program.days_json.reduce((a, d) => a + d.weekdays.length, 0) : Object.keys(program?.schedule_json ?? {}).length;

  const nu = nextUp({
    now,
    localHour: hour,
    prayerTimes: times,
    prayerStatus: prayers.statuses,
    activeWorkout: !!running,
    plannedWorkout: planDay && planDay.exercises.length ? planDay.name : null,
    trainedToday,
    dueToday: dueTodayItems,
    habitsLeft: todaysHabits.length - habitsDone,
  });

  const rings: { key: RingKey; label: string; value: string; ratio: number | null; color: string }[] = [
    { key: 'deen', label: t('domain.deen'), value: `${fmt.number(prayersRecorded)}/${fmt.number(5)}`, ratio: prayersRecorded / 5, color: th.deen.accent },
    { key: 'fitness', label: t('domain.fitness'), value: plannedPerWeek ? `${fmt.number(trainWeek.sessions)}/${fmt.number(plannedPerWeek)}` : fmt.number(trainWeek.sessions), ratio: plannedPerWeek ? trainWeek.sessions / plannedPerWeek : trainedToday ? 1 : 0, color: th.fitness.accent },
    { key: 'nutrition', label: t('fit.nutrition'), value: fmt.number(food.kcal), ratio: settings.nutrition.kcal ? food.kcal / settings.nutrition.kcal : food.kcal > 0 ? 1 : 0, color: th.nutrition.accent },
    { key: 'habits', label: t('domain.habits'), value: todaysHabits.length ? `${fmt.number(habitsDone)}/${fmt.number(todaysHabits.length)}` : '—', ratio: todaysHabits.length ? habitsDone / todaysHabits.length : null, color: th.habits.accent },
    { key: 'academics', label: t('domain.academics'), value: studyToday.length ? `${fmt.number(studyDone)}/${fmt.number(studyToday.length)}` : fmt.number(dueTodayItems.length), ratio: studyToday.length ? studyDone / studyToday.length : null, color: th.academics.accent },
  ];

  // ---- deadlines (overdue first), one horizontal strip instead of two lists
  const weekEnd = addDays(today, 7);
  const deadlines = [
    ...assignments.filter((a) => isAssignmentOpen(a) && localDateOf(a.due_at, tz) <= weekEnd).map((a) => ({ key: a.id, title: a.title, at: a.due_at, domain: 'academics' as const, href: `/records/assignments/${a.id}` })),
    ...store.list('exams').filter((e) => localDateOf(e.exam_at, tz) >= today && localDateOf(e.exam_at, tz) <= weekEnd).map((e) => ({ key: e.id, title: e.title, at: e.exam_at, domain: 'academics' as const, href: `/records/exams/${e.id}` })),
    ...openTasks.filter((x) => x.due_at && localDateOf(x.due_at, tz) <= weekEnd).map((x) => ({ key: x.id, title: x.title, at: x.due_at as string, domain: x.domain, href: `/records/tasks/${x.id}` })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  // ---- weekly overview, one domain at a time
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const nutWeek = weekSummary(meals, mealItems, today, tz);
  const trainDays = weeklyTraining(workouts, sets, days, (iso) => localDateOf(iso, tz));
  const weekData = days.map((d, i) => {
    const label = fmt.localDate(d, 'weekday').slice(0, 3);
    if (metric === 'prayers') {
      const s = dayPrayerSummary(prayerLogs, d);
      return { label, value: s.performed + s.missed + s.excused };
    }
    if (metric === 'workouts') return { label, value: trainDays[i].sessions };
    if (metric === 'kcal') return { label, value: nutWeek[i].totals.kcal };
    return { label, value: habits.filter((h) => isScheduledOn(h, d) && habitDayStatus(h, habitLogs, d) === 'completed').length };
  });
  const metricColor = { prayers: th.deen.accent, workouts: th.fitness.accent, kcal: th.nutrition.accent, habits: th.habits.accent }[metric];
  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'not_started').slice(0, 6);

  const addWater = () => {
    const row = store.insert('hydration_logs', { amount_ml: 250, beverage_type: 'water', logged_at: new Date().toISOString() });
    showToast({ message: t('qa.waterAdded'), actionLabel: t('common.undo'), onAction: () => store.remove('hydration_logs', row.id) });
  };
  const recordPrayer = (pr: PrayerType) => {
    const undo = setPrayerStatus(store, today, pr, 'performed', new Date(), tz);
    showToast({ message: `${t(`opt.prayer.${pr}`)}: ${t('opt.pstatus.performed')}`, actionLabel: t('common.undo'), onAction: undo });
  };
  const hm = (m: number) => ltr(m >= 60 ? `${fmt.number(Math.floor(m / 60))}:${String(m % 60).padStart(2, '0')}` : `${fmt.number(m)} ${t('home.min')}`);

  return (
    <Screen title={t('app.name')} back={false} bare testID="screen-home">
      <Sky phase={sky.phase} arc={sky.arc} isDay={sky.isDay} rtl={rtl} inset={insets.top} height={330}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="heading" style={{ color: p.goldLight, letterSpacing: 3, ...fw('700') }}>
            {t('app.name')}
          </Txt>
          <Row gap={0}>
            <TopActions tint={ON_SKY} />
          </Row>
        </Row>
        <View style={{ flex: 1 }} />
        <AView entering={enterCalm(0)}>
          <Txt variant="caption" style={{ color: ON_SKY_MUTED, letterSpacing: 1.2, textTransform: 'uppercase', ...fw('600') }}>
            {fmt.localDate(today, 'long')} · {t(`home.sky.${sky.phase}`)}
          </Txt>
          <Txt variant="display" style={{ color: ON_SKY }} testID="home-greeting" numberOfLines={2}>
            {greeting}
            {settings.displayName ? `${settings.locale === 'ar' ? '،' : ','} ${settings.displayName}` : ''}
          </Txt>
        </AView>
        <AView entering={enter(1)} style={{ marginTop: spacing.md }}>
          <NextUpCard
            nu={nu}
            hm={hm}
            onRecordPrayer={recordPrayer}
            onStartPlanned={() => {
              startWorkout(store, planDay!.name, new Date(), program?.id);
              tap('medium');
              router.push('/fitness/workout/active');
            }}
          />
        </AView>
      </Sky>

      {/* domain rings — tap to open an inline panel */}
      <AView entering={enter(2)}>
        <Row style={{ justifyContent: 'space-between' }}>
          {rings.map((r) => {
            const on = open === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => {
                  setOpen(on ? null : r.key);
                  tap('light');
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}
                accessibilityLabel={`${r.label}: ${r.value}`}
                testID={`home-ring-${r.key}`}
                style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                <View style={{ padding: 3, borderRadius: 40, borderWidth: 1.5, borderColor: on ? r.color : 'transparent' }}>
                  <ProgressRing ratio={r.ratio} size={58} stroke={6} color={r.color} label={`${r.label}: ${r.value}`}>
                    <Txt variant="caption" style={{ ...num('700'), fontSize: 13 }} align="center">
                      {r.value}
                    </Txt>
                  </ProgressRing>
                </View>
                <Txt variant="caption" color={on ? 'text' : 'textSecondary'} align="center" numberOfLines={1} style={{ fontSize: 11 }}>
                  {r.label}
                </Txt>
              </Pressable>
            );
          })}
        </Row>
      </AView>
      {open ? (
        <AView layout={layout} entering={enter(0)} key={open}>
          <RingPanel
            ring={open}
            color={rings.find((r) => r.key === open)!.color}
            data={{ prayers, food, todaysHabits, habitLogs, planLabel, trainedToday, trainWeek: trainWeek.sessions, plannedPerWeek, dueTodayItems, studyToday, studyDone }}
            onToggleHabit={(id) => {
              const h = todaysHabits.find((x) => x.id === id);
              if (h) toggleHabitDone(store, h, today, new Date());
              tap('light');
            }}
          />
        </AView>
      ) : (
        <Txt variant="caption" color="textMuted" align="center">
          {t('home.tapRing')}
        </Txt>
      )}

      {hour >= 18 ? (
        <AView entering={enter(3)} layout={layout}>
          <GlassCard accent={p.accent} testID="home-review">
            <Row>
              <IconBadge icon="moon-outline" color={p.accent} />
              <View style={{ flex: 1 }}>
                <Txt variant="heading">{t('home.reviewTitle')}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {t('home.reviewSub')}
                </Txt>
              </View>
            </Row>
            <ReviewLine icon="moon" color={th.deen.accent} label={t('home.prayersRecorded', { n: prayersRecorded })} done={prayers.notRecorded === 0} />
            <ReviewLine icon="barbell" color={th.fitness.accent} label={trainedToday ? t('home.trainedToday') : planLabel ? t('home.notTrainedYet', { label: planLabel }) : t('home.restDay')} done={trainedToday} />
            <ReviewLine icon="nutrition" color={th.nutrition.accent} label={food.kcal ? `${fmt.number(food.kcal)} kcal · P ${fmt.number(food.protein)} g` : t('nut.nothingYet')} done={food.kcal > 0} />
            {todaysHabits.length ? <ReviewLine icon="repeat" color={th.habits.accent} label={t('home.habitsToday', { done: habitsDone, total: todaysHabits.length })} done={habitsDone === todaysHabits.length} /> : null}
          </GlassCard>
        </AView>
      ) : null}

      <AView entering={enter(3)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
          <QuickAction icon="moon-outline" label={t('qa.logPrayer')} color={th.deen.accent} onPress={() => router.push('/deen')} testID="qa-prayer" />
          <QuickAction icon="water-outline" label={t('qa.water')} color="#5EA4F2" onPress={addWater} testID="qa-water" />
          <QuickAction icon="nutrition-outline" label={t('nut.addFood')} color={th.nutrition.accent} onPress={() => router.push(`/fitness/food?date=${today}` as never)} testID="qa-food" />
          <QuickAction icon="barbell-outline" label={t('qa.startWorkout')} color={th.fitness.accent} onPress={() => router.push('/fitness/workout/active')} testID="qa-workout" />
          <QuickAction icon="add-circle-outline" label={t('qa.addTask')} onPress={() => router.push(newRecordHref('tasks') as never)} testID="qa-task" />
          <QuickAction icon="book-outline" label={t('qa.addHomework')} color={th.academics.accent} onPress={() => router.push(newRecordHref('assignments') as never)} />
          <QuickAction icon="cash-outline" label={t('qa.addTransaction')} color={th.business.accent} onPress={() => router.push(newRecordHref('transactions', { occurred_on: today }) as never)} />
          <QuickAction icon="calendar-outline" label={t('qa.addEvent')} onPress={() => router.push(newRecordHref('calendar_events') as never)} />
        </ScrollView>
      </AView>

      <AView entering={enter(4)}>
        <PerfectDayCard />
      </AView>

      <SectionHeader title={t('home.deadlines')} action={t('qa.addTask')} onAction={() => router.push(newRecordHref('tasks') as never)} />
      {deadlines.length === 0 ? (
        <Txt color="textMuted">{t('home.noUpcoming')}</Txt>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {deadlines.slice(0, 10).map((d, i) => {
            const day = localDateOf(d.at, tz);
            const tone = day < today ? p.danger : day === today ? p.warning : DOMAIN_COLORS[d.domain];
            const when = day < today ? t('home.overdue') : day === today ? `${t('home.today')} · ${fmt.time(d.at)}` : fmt.localDate(day, 'weekday');
            return (
              <AView key={d.key} entering={enter(i)}>
                <PressableScale onPress={() => router.push(d.href as never)} accessibilityLabel={`${d.title}, ${when}`} style={{ width: 200 }}>
                  <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: mixAlpha(tone, 0.5), backgroundColor: mixAlpha(tone, 0.08), padding: spacing.md, gap: 6, minHeight: 96 }}>
                    <Row gap={6}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
                      <Txt variant="caption" style={{ color: tone, ...fw('700') }} numberOfLines={1}>
                        {when}
                      </Txt>
                    </Row>
                    <Txt variant="bodyStrong" numberOfLines={2}>
                      {d.title}
                    </Txt>
                    <Txt variant="caption" color="textMuted">
                      {t(`domain.${d.domain}`)}
                    </Txt>
                  </View>
                </PressableScale>
              </AView>
            );
          })}
        </ScrollView>
      )}

      <SectionHeader title={t('home.timeline')} action={t('common.seeAll')} onAction={() => router.push('/calendar')} />
      <TimelineList items={agenda.slice(0, 8)} emptyText={t('cal.empty')} />

      <SectionHeader title={t('home.weekly')} />
      <GlassCard>
        <Segmented options={['prayers', 'workouts', 'kcal', 'habits'] as WeekMetric[]} value={metric} onChange={setMetric} labelOf={(m) => t(`home.week.${m}`)} testIDPrefix="home-week" />
        <Bars key={metric} data={weekData} highlight={6} color={metricColor} />
        <Txt variant="caption" color="textMuted">
          {t('home.tapBar')}
        </Txt>
      </GlassCard>

      {activeGoals.length > 0 ? (
        <>
          <SectionHeader title={t('home.goalsPreview')} action={t('common.seeAll')} onAction={() => router.push('/goals')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {activeGoals.map((g) => {
              const pr = goalProgress(g, milestones);
              return (
                <PressableScale key={g.id} onPress={() => router.push(`/goals/${g.id}`)} accessibilityLabel={g.title} style={{ width: 220 }}>
                  <GlassCard accent={DOMAIN_COLORS[g.domain]}>
                    <Txt variant="caption" color="textSecondary">
                      {t(`domain.${g.domain}`)}
                    </Txt>
                    <Txt variant="bodyStrong" numberOfLines={2}>
                      {g.title}
                    </Txt>
                    {pr.ratio != null ? (
                      <>
                        <CountUp value={Math.round(pr.ratio * 100)} format={(n) => `${fmt.number(n)}%`} variant="title" style={num('700')} color="accent" />
                        <ProgressBar ratio={pr.ratio} label={`${g.title} ${fmt.percent(pr.ratio)}`} />
                      </>
                    ) : (
                      <Txt variant="caption" color="textMuted">
                        {t('goals.noMeasure')}
                      </Txt>
                    )}
                  </GlassCard>
                </PressableScale>
              );
            })}
          </ScrollView>
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

      <Row style={{ justifyContent: 'space-between' }}>
        <SyncIndicator />
        <Button label={t('nav.settings')} variant="ghost" icon="settings-outline" onPress={() => router.push('/settings')} small />
      </Row>
    </Screen>
  );
}

function NextUpCard({ nu, hm, onRecordPrayer, onStartPlanned }: { nu: ReturnType<typeof nextUp>; hm: (m: number) => string; onRecordPrayer: (p: PrayerType) => void; onStartPlanned: () => void }) {
  const { t } = useApp();
  const p = usePalette();
  const deen = useDomainTheme('deen');
  const fit = useDomainTheme('fitness');
  const hab = useDomainTheme('habits');
  const ac = useDomainTheme('academics');
  let icon: IconName = 'sparkles';
  let color = p.accent;
  let title = t('home.nu.none');
  let sub = t('home.nu.noneSub');
  let action: { label: string; onPress: () => void; testID: string } | null = null;
  switch (nu.kind) {
    case 'workout-active':
      [icon, color, title, sub] = ['barbell', fit.accent, t('fit.activeWorkout'), t('home.nu.workoutActiveSub')];
      action = { label: t('fit.continueWorkout'), onPress: () => router.push('/fitness/workout/active'), testID: 'nu-workout' };
      break;
    case 'prayer-record':
      [icon, color, title, sub] = ['moon', deen.accent, t('home.nu.prayerRecord', { name: t(`opt.prayer.${nu.prayer}`) }), t('home.nu.prayerRecordSub')];
      action = { label: t('home.nu.prayed'), onPress: () => onRecordPrayer(nu.prayer!), testID: 'nu-prayed' };
      break;
    case 'deadline':
      [icon, color, title, sub] = ['alarm', ac.accent, nu.title ?? '', t('home.nu.dueIn', { t: hm(nu.minutes ?? 0) })];
      action = { label: t('common.open'), onPress: () => router.push(nu.href as never), testID: 'nu-deadline' };
      break;
    case 'workout-planned':
      [icon, color, title, sub] = ['barbell', fit.accent, t('home.workoutToday', { label: nu.title ?? '' }), t('home.nu.plannedSub')];
      action = { label: t('fit.startWorkout'), onPress: onStartPlanned, testID: 'nu-start' };
      break;
    case 'habits':
      [icon, color, title, sub] = ['repeat', hab.accent, t('home.nu.habitsLeft', { n: nu.count ?? 0 }), t('home.nu.habitsSub')];
      action = { label: t('common.open'), onPress: () => router.push('/habits'), testID: 'nu-habits' };
      break;
    case 'prayer-next':
      [icon, color, title, sub] = ['moon-outline', deen.accent, t('home.nu.prayerNext', { name: t(`opt.prayer.${nu.prayer}`), t: hm(nu.minutes ?? 0) }), t('home.nu.prayerNextSub')];
      break;
    case 'review':
      [icon, color, title, sub] = ['sparkles', p.accent, t('home.reviewTitle'), t('home.nu.reviewSub')];
      action = { label: t('common.open'), onPress: () => router.push('/analytics'), testID: 'nu-review' };
      break;
  }
  return (
    <View testID="home-next-up" style={{ borderRadius: radius.lg, padding: spacing.md, backgroundColor: 'rgba(8,8,10,0.55)', borderWidth: 1, borderColor: mixAlpha(color, 0.45), flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: mixAlpha(color, 0.18) }}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="caption" style={{ color, letterSpacing: 1, ...fw('700') }}>
          {t('home.nextUp')}
        </Txt>
        <Txt variant="bodyStrong" style={{ color: ON_SKY }} numberOfLines={2}>
          {title}
        </Txt>
        <Txt variant="caption" style={{ color: ON_SKY_MUTED }} numberOfLines={2}>
          {sub}
        </Txt>
      </View>
      {action ? (
        <PressableScale onPress={action.onPress} testID={action.testID} accessibilityLabel={action.label}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: color }}>
            <Txt variant="label" style={{ color: '#14110A', ...fw('700') }}>
              {action.label}
            </Txt>
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

function RingPanel({
  ring,
  color,
  data,
  onToggleHabit,
}: {
  ring: RingKey;
  color: string;
  data: {
    prayers: ReturnType<typeof dayPrayerSummary>;
    food: { kcal: number; protein: number; carbs: number; fat: number };
    todaysHabits: { id: string; name: string }[];
    habitLogs: Parameters<typeof habitDayStatus>[1];
    planLabel: string | null;
    trainedToday: boolean;
    trainWeek: number;
    plannedPerWeek: number;
    dueTodayItems: { title: string; at: string; href: string }[];
    studyToday: { id: string; title: string; status: string }[];
    studyDone: number;
  };
  onToggleHabit: (id: string) => void;
}) {
  const { t, fmt, today, settings, rtl } = useApp();
  const p = usePalette();
  const go = (href: string, label: string) => <Button small variant="ghost" icon={rtl ? 'arrow-back' : 'arrow-forward'} label={label} onPress={() => router.push(href as never)} />;
  return (
    <GlassCard accent={color} testID={`home-panel-${ring}`}>
      {ring === 'deen' ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            {PRAYERS.map((pr) => {
              const st = data.prayers.statuses[pr];
              const c = st === 'performed' ? color : st === 'excused' ? p.textSecondary : st === 'missed' ? p.textMuted : p.border;
              return (
                <View key={pr} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: c, backgroundColor: st === 'performed' ? mixAlpha(color, 0.2) : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {st === 'performed' ? <Icon name="checkmark" size={16} color={color} /> : null}
                  </View>
                  <Txt variant="caption" style={{ fontSize: 11 }} color="textSecondary">
                    {t(`opt.prayer.${pr}`)}
                  </Txt>
                </View>
              );
            })}
          </Row>
          {go('/deen', t('deen.title'))}
        </>
      ) : ring === 'fitness' ? (
        <>
          <Txt variant="heading">{data.trainedToday ? t('home.trainedToday') : data.planLabel ? t('home.workoutToday', { label: data.planLabel }) : t('home.restDay')}</Txt>
          <Txt color="textSecondary">{data.plannedPerWeek ? t('home.sessionsOf', { n: data.trainWeek, total: data.plannedPerWeek }) : t('fit.sessionsN', { n: data.trainWeek })}</Txt>
          {go('/fitness', t('fit.title'))}
        </>
      ) : ring === 'nutrition' ? (
        <>
          <MeterRow label="kcal" value={data.food.kcal} target={settings.nutrition.kcal} unit="" color={color} />
          <MeterRow label={t('nut.protein')} value={data.food.protein} target={settings.nutrition.protein} unit="g" color={MACRO_COLORS.protein} />
          <MeterRow label={t('nut.carbs')} value={data.food.carbs} target={settings.nutrition.carbs} unit="g" color={MACRO_COLORS.carbs} />
          <MeterRow label={t('nut.fat')} value={data.food.fat} target={settings.nutrition.fat} unit="g" color={MACRO_COLORS.fat} />
          {go(`/fitness/food?date=${today}`, t('nut.addFood'))}
        </>
      ) : ring === 'habits' ? (
        <>
          {data.todaysHabits.length === 0 ? <Txt color="textMuted">{t('home.noHabits')}</Txt> : null}
          {data.todaysHabits.map((h) => {
            const done = habitDayStatus(h as never, data.habitLogs, today) === 'completed';
            return (
              <Pressable key={h.id} onPress={() => onToggleHabit(h.id)} accessibilityRole="checkbox" accessibilityState={{ checked: done }} testID={`home-habit-${h.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: color, backgroundColor: done ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <Icon name="checkmark" size={14} color="#14110A" /> : null}
                </View>
                <Txt style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }} color={done ? 'textMuted' : 'text'}>
                  {h.name}
                </Txt>
              </Pressable>
            );
          })}
          {go('/habits', t('hab.title'))}
        </>
      ) : (
        <>
          {data.dueTodayItems.length === 0 && data.studyToday.length === 0 ? <Txt color="textMuted">{t('home.noPriorities')}</Txt> : null}
          {data.dueTodayItems.map((d) => (
            <Pressable key={d.href} onPress={() => router.push(d.href as never)} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Txt>
                {d.title} · <Txt variant="caption" color="textSecondary">{fmt.time(d.at)}</Txt>
              </Txt>
            </Pressable>
          ))}
          {data.studyToday.length ? <Txt color="textSecondary">{t('home.studyToday', { done: data.studyDone, total: data.studyToday.length })}</Txt> : null}
          {go('/academics', t('ac.title'))}
        </>
      )}
    </GlassCard>
  );
}

function ReviewLine({ icon, color, label, done }: { icon: IconName; color: string; label: string; done: boolean }) {
  return (
    <Row>
      <Icon name={icon} size={18} color={color} />
      <Txt style={{ flex: 1 }}>{label}</Txt>
      <Icon name={done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={done ? color : 'textMuted'} />
    </Row>
  );
}
