import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { averageGrades, isAssignmentOpen } from '@/domain/academics';
import { financialSummary } from '@/domain/business';
import { addDays, dateRange, localDateOf } from '@/domain/dates';
import { rangePrayerSummary } from '@/domain/deen';
import { trainingVolumeKg } from '@/domain/fitness';
import { habitSummary } from '@/domain/habits';
import { CurrencyCode } from '@/domain/money';
import { store, useApp, useStoreVersion } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { BarChart } from '@/ui/BarChart';
import { FilterChips, MetricCard, Notice, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { TopActions } from '@/ui/TopActions';

const RANGES = ['7', '30', '90'] as const;

export default function Analytics() {
  const { t, fmt, today, settings } = useApp();
  const version = useStoreVersion();
  const [range, setRange] = useState<(typeof RANGES)[number]>('7');
  const from = addDays(today, -(Number(range) - 1));
  const tz = settings.timezone;
  const inRange = (iso: string) => {
    const d = localDateOf(iso, tz);
    return d >= from && d <= today;
  };

  const data = useMemo(() => {
    const prayers = rangePrayerSummary(store.list('prayer_logs'), from, today);
    const quran = store.list('quran_logs').filter((q) => inRange(q.read_at)).length;
    const workouts = store.list('workouts').filter((w) => w.status === 'completed' && inRange(w.started_at));
    const wIds = new Set(workouts.map((w) => w.id));
    const volume = trainingVolumeKg(store.list('workout_sets').filter((s) => wIds.has(s.workout_id)));
    const water = store.list('hydration_logs').filter((h) => inRange(h.logged_at));
    const waterDays = new Set(water.map((h) => localDateOf(h.logged_at, tz)));
    const waterAvg = waterDays.size ? water.reduce((a, h) => a + h.amount_ml, 0) / waterDays.size : null;
    const grades = store.list('grades').filter((g) => inRange(g.recorded_at));
    const avg = averageGrades(grades);
    const openHw = store.list('assignments').filter(isAssignmentOpen).length;
    const study = store.list('study_sessions').filter((s) => s.planned_date >= from && s.planned_date <= today).reduce((a, s) => a + (s.actual_minutes ?? 0), 0);
    const fin = financialSummary({ transactions: store.list('transactions'), invoices: store.list('invoices'), payments: store.list('invoice_payments') }, { from, to: today, today });
    const habits = store.list('habits');
    const logs = store.list('habit_logs');
    let completed = 0;
    let recorded = 0;
    for (const h of habits) {
      const s = habitSummary(h, logs, from, today, settings.weekStart);
      completed += s.counts.completed;
      recorded += s.counts.completed + s.counts.partial + s.counts.skipped + s.counts.deferred + s.counts.paused;
    }
    const dailyPrayers = prayers.days.map((d) => ({ label: fmt.weekdayShort(d.date), value: d.performed, date: d.date }));
    const dailyHabits = dateRange(from, today).map((d) => ({ label: fmt.weekdayShort(d), value: logs.filter((l) => l.local_date === d && l.status === 'completed').length, date: d }));
    return { prayers, quran, workouts: workouts.length, volume, waterAvg, avg, openHw, study, fin, completed, recorded, dailyPrayers, dailyHabits };
  }, [version, range, today, tz]);

  const money = (totals: Partial<Record<CurrencyCode, number>>) => {
    const e = Object.entries(totals) as [CurrencyCode, number][];
    return e.length ? e.map(([c, v]) => fmt.money(v, c)).join(' · ') : '—';
  };

  return (
    <Screen title={t('an.title')} back={false} actions={<TopActions />} testID="screen-analytics">
      <FilterChips options={RANGES} value={range} onChange={setRange} labelOf={(r) => t(`an.range.${r}`)} testIDPrefix="an-range" />
      <Txt variant="caption" color="textMuted">
        {t('an.source', { from: fmt.localDate(from), to: fmt.localDate(today) })}
      </Txt>
      <Notice text={t('an.noLifeScore')} />

      <SectionHeader title={t('domain.deen')} />
      <View style={styles.grid}>
        <MetricCard label={t('an.deen.performed')} value={fmt.number(data.prayers.totals.performed)} hint={`/ ${fmt.number(data.prayers.slots)}`} />
        <MetricCard label={t('an.deen.notRecorded')} value={fmt.number(data.prayers.totals.notRecorded)} />
        <MetricCard label={t('an.deen.quranSessions')} value={fmt.number(data.quran)} />
      </View>
      {range === '7' ? <BarChart title={t('an.deen.performed')} data={data.dailyPrayers} max={5} /> : null}

      <SectionHeader title={t('domain.fitness')} />
      <View style={styles.grid}>
        <MetricCard label={t('an.fitness.workouts')} value={fmt.number(data.workouts)} />
        <MetricCard label={t('an.fitness.volume')} value={`${fmt.number(Math.round(data.volume))} kg`} />
        <MetricCard label={t('an.fitness.water')} value={data.waterAvg == null ? '—' : `${fmt.number(Math.round(data.waterAvg))} ml`} />
      </View>

      <SectionHeader title={t('domain.academics')} />
      <View style={styles.grid}>
        <MetricCard label={t('an.ac.average')} value={data.avg ? `${fmt.number(data.avg.percent)}%` : '—'} hint={data.avg ? t(`ac.method.${data.avg.method}`) : t('ac.noGrades')} />
        <MetricCard label={t('an.ac.openHomework')} value={fmt.number(data.openHw)} />
        <MetricCard label={t('an.ac.studyMinutes')} value={fmt.number(data.study)} />
      </View>

      <SectionHeader title={t('domain.business')} />
      <View style={styles.grid}>
        <MetricCard label={t('an.bus.cash')} value={money(data.fin.cashReceived)} />
        <MetricCard label={t('an.bus.expenses')} value={money(data.fin.expensesPaid)} />
      </View>
      <Txt variant="caption" color="textMuted">
        {t('bus.currencyNote')}
      </Txt>

      <SectionHeader title={t('domain.habits')} />
      <View style={styles.grid}>
        <MetricCard label={t('an.hab.completed')} value={fmt.number(data.completed)} />
        <MetricCard label={t('an.hab.recordedRate')} value={data.recorded ? fmt.percent(data.completed / data.recorded) : '—'} />
      </View>
      {range === '7' ? <BarChart title={t('an.hab.completed')} data={data.dailyHabits} /> : null}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
