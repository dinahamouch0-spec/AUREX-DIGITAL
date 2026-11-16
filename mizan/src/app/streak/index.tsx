import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { addDays, addMonths, startOfMonth, weekdayOf } from '@/domain/dates';
import { DayStatus, evaluateDay, liveStatus, monthDays, monthSummaries } from '@/domain/perfectDays';
import { addDayExemption, removeDayExemption, streakSummary } from '@/data/usecases';
import { listAll, store, useApp, useStoreVersion } from '@/state/AppContext';
import { radius, spacing } from '@/theme/tokens';
import { BarChart } from '@/ui/BarChart';
import { SelectSheet } from '@/ui/overlays';
import { criterionLabel, STATUS_TONE } from '@/ui/PerfectDayCard';
import { Badge, Button, Card, EmptyState, Icon, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { usePalette } from '@/ui/theme';

export default function StreakScreen() {
  const { t, fmt, today, settings, rtl, showToast } = useApp();
  const p = usePalette();
  useStoreVersion();
  const [month, setMonth] = useState(startOfMonth(today));
  const [exemptFor, setExemptFor] = useState<string | null>(null);
  const tz = settings.timezone;
  const defs = store.list('perfect_day_definitions');
  if (defs.length === 0)
    return (
      <Screen title={t('pd.title')} testID="screen-streak">
        <EmptyState icon="flame-outline" title={t('pd.title')} body={t('pd.setupPrompt')} actionLabel={t('pd.define')} onAction={() => router.push('/streak/definition')} />
      </Screen>
    );

  const now = new Date();
  const s = streakSummary(store, now, tz);
  const ev = evaluateDay(listAll as never, today, tz);
  const results = store.list('perfect_day_results');
  const byDate = new Map(results.map((r) => [r.local_date, r.status as DayStatus]));
  const statusOn = (d: string): DayStatus => byDate.get(d) ?? (d <= today && d >= addDays(today, -1) ? liveStatus(listAll as never, d, tz, now) : 'not_tracked');
  const days = monthDays(month);
  const monthPerfect = days.filter((d) => statusOn(d) === 'perfect').length;
  const months = monthSummaries(results, today, 6);
  const exemptions = store.list('day_exemptions').filter((e) => e.local_date >= today).sort((a, b) => a.local_date.localeCompare(b.local_date));
  const history = [...results].filter((r) => r.status === 'perfect').sort((a, b) => b.local_date.localeCompare(a.local_date)).slice(0, 30);

  const cellStyle = (st: DayStatus) => {
    switch (st) {
      case 'perfect':
        return { backgroundColor: p.accent, borderColor: p.accent };
      case 'pending':
        return { borderColor: p.accent, borderStyle: 'dashed' as const, backgroundColor: 'transparent' };
      case 'incomplete':
        return { borderColor: p.border, backgroundColor: p.surface };
      case 'rest':
      case 'exempt':
        return { borderColor: p.border, backgroundColor: p.surfaceElevated };
      default:
        return { borderColor: 'transparent', backgroundColor: 'transparent' };
    }
  };

  return (
    <Screen title={t('pd.title')} actions={<IconButton icon="options-outline" label={t('pd.define')} onPress={() => router.push('/streak/definition')} testID="streak-define" />} testID="screen-streak">
      <Card style={{ borderColor: p.accent, backgroundColor: p.surfaceElevated, alignItems: 'center' }}>
        <Txt variant="display" align="center" style={{ fontSize: 48, lineHeight: 58 }}>
          🔥
        </Txt>
        <Txt variant="display" color="accent" align="center" style={{ fontSize: 44, lineHeight: 52 }} testID="streak-current">
          {fmt.number(s.current)}
        </Txt>
        <Txt color="textSecondary" align="center">
          {t('pd.daysInARow')}
        </Txt>
        {s.currentStart ? (
          <Txt variant="caption" color="textMuted" align="center" testID="streak-start">
            {t('pd.since', { date: fmt.localDate(s.currentStart, 'long') })}
          </Txt>
        ) : null}
        <Row style={{ marginTop: spacing.sm }} wrap>
          <Badge label={`${t('pd.best')}: ${fmt.number(s.longest)}`} tone="accent" icon="trophy-outline" />
          <Badge label={`${t('pd.total')}: ${fmt.number(s.totalPerfect)}`} />
        </Row>
        {s.longest > 0 && s.longestStart && s.longestEnd ? (
          <Txt variant="caption" color="textMuted" align="center">
            {t('pd.bestRange', { from: fmt.localDate(s.longestStart), to: fmt.localDate(s.longestEnd) })}
          </Txt>
        ) : null}
      </Card>

      <SectionHeader title={t('pd.today')} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt color="textSecondary">{ev.applicable ? t('pd.todayProgress', { met: ev.met, total: ev.applicable }) : t(ev.exempt ? 'pd.todayExempt' : 'pd.todayRest')}</Txt>
        <Badge label={t(`pd.status.${s.todayStatus}`)} tone={STATUS_TONE[s.todayStatus]} />
      </Row>
      {ev.results.map((r, i) => (
        <ListItem
          key={i}
          testID={`streak-crit-${i}`}
          title={criterionLabel(r.criterion, t)}
          subtitle={!r.applicable ? t('pd.notApplicable') : r.progress ? `${fmt.number(r.progress.done)}/${fmt.number(r.progress.total)}` : r.met ? t('pd.met') : t('pd.notYet')}
          left={<Icon name={!r.applicable ? 'remove-circle-outline' : r.met ? 'checkmark-circle' : 'ellipse-outline'} color={r.applicable && r.met ? 'accent' : 'textMuted'} />}
        />
      ))}
      <Notice text={t('pd.rules')} />
      <Row wrap>
        {s.todayStatus !== 'perfect' && s.todayStatus !== 'exempt' ? (
          <Button small variant="secondary" icon="bed-outline" label={t('pd.markRestToday')} onPress={() => setExemptFor(today)} testID="streak-exempt-today" />
        ) : null}
        <Button small variant="ghost" icon="calendar-outline" label={t('pd.planRestTomorrow')} onPress={() => setExemptFor(addDays(today, 1))} />
      </Row>
      {exemptions.map((e) => (
        <ListItem
          key={e.id}
          title={`${t(`opt.exempt.${e.reason}`)} · ${fmt.localDate(e.local_date, 'weekday')}`}
          right={<Button small variant="ghost" label={t('common.delete')} onPress={() => { removeDayExemption(store, e.id, new Date(), tz); showToast({ message: t('toast.deleted') }); }} />}
        />
      ))}

      <SectionHeader title={t('pd.calendar')} />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={rtl ? 'chevron-forward' : 'chevron-back'} label={t('common.prev')} onPress={() => setMonth(addMonths(month, -1))} testID="streak-month-prev" />
        <Txt variant="bodyStrong">
          {new Intl.DateTimeFormat(settings.locale === 'ar' ? 'ar-LB' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}T12:00:00Z`))}
        </Txt>
        <IconButton icon={rtl ? 'chevron-back' : 'chevron-forward'} label={t('common.next')} onPress={() => setMonth(addMonths(month, 1))} />
      </Row>
      <Txt variant="caption" color="textSecondary" testID="streak-month-count">
        {t('pd.perfectThisMonth', { n: monthPerfect })}
      </Txt>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 7 }, (_, i) => (settings.weekStart + i) % 7).map((wd) => (
          <Txt key={wd} variant="caption" color="textMuted" align="center" style={{ flex: 1 }}>
            {t(`weekday.${wd}`)}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: (weekdayOf(days[0]) - settings.weekStart + 7) % 7 }).map((_, i) => (
          <View key={`pad${i}`} style={{ width: `${100 / 7}%` }} />
        ))}
        {days.map((d) => {
          const st = statusOn(d);
          return (
            <View key={d} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }} accessible accessibilityLabel={`${fmt.localDate(d, 'long')}: ${t(`pd.status.${st}`)}`} testID={`streak-day-${d}`}>
              <View style={[{ flex: 1, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, cellStyle(st)]}>
                <Txt variant="caption" style={{ color: st === 'perfect' ? p.onAccent : d === today ? p.accent : st === 'not_tracked' ? p.textMuted : p.text, fontWeight: d === today ? '700' : '400' }}>
                  {fmt.number(Number(d.slice(8)))}
                </Txt>
                {st === 'rest' || st === 'exempt' ? <Icon name="bed-outline" size={10} color="textMuted" /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <Row wrap>
        {(['perfect', 'pending', 'incomplete', 'rest'] as const).map((k) => (
          <Row key={k} gap={4}>
            <View style={[{ width: 14, height: 14, borderRadius: 4, borderWidth: 1 }, cellStyle(k)]} />
            <Txt variant="caption" color="textSecondary">
              {t(`pd.status.${k}`)}
            </Txt>
          </Row>
        ))}
      </Row>

      <SectionHeader title={t('pd.monthCompare')} />
      <BarChart title={t('pd.perfectPerMonth')} data={months.map((m) => ({ label: new Intl.DateTimeFormat(settings.locale === 'ar' ? 'ar-LB' : 'en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(`${m.month}T12:00:00Z`)), value: m.perfect, date: m.month }))} />

      <SectionHeader title={t('pd.history')} />
      {history.length === 0 ? (
        <Txt color="textMuted">{t('pd.noHistory')}</Txt>
      ) : (
        history.map((r) => <ListItem key={r.id} title={fmt.localDate(r.local_date, 'weekday')} subtitle={t('pd.todayProgress', { met: r.met, total: r.applicable })} left={<Txt>🔥</Txt>} />)
      )}

      <SelectSheet
        visible={exemptFor != null}
        title={t('pd.exemptTitle')}
        value={null}
        options={(['rest', 'holiday', 'sick', 'travel', 'other'] as const).map((r) => ({ value: r, label: t(`opt.exempt.${r}`) }))}
        onClose={() => setExemptFor(null)}
        onSelect={(v) => {
          const d = exemptFor;
          setExemptFor(null);
          if (!d || !v) return;
          try {
            addDayExemption(store, d, v as 'rest', new Date(), tz);
            showToast({ message: t('toast.saved') });
          } catch {
            showToast({ message: t('pd.exemptPast'), tone: 'error' });
          }
        }}
      />
    </Screen>
  );
}
