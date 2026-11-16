import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { agendaForDay } from '@/domain/aggregate';
import { addDays, addMonths, dateRange, endOfMonth, startOfMonth, startOfWeek, weekdayOf } from '@/domain/dates';
import { DOMAINS, Domain } from '@/domain/types';
import { listAll, useApp, useStoreVersion } from '@/state/AppContext';
import { DOMAIN_COLORS, radius, spacing } from '@/theme/tokens';
import { TimelineList } from '@/ui/agenda';
import { Button, FilterChips, IconButton, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { usePalette } from '@/ui/theme';
import { TopActions } from '@/ui/TopActions';

type Mode = 'day' | 'week' | 'month';

export default function CalendarScreen() {
  const { t, fmt, today, settings, rtl } = useApp();
  const p = usePalette();
  const version = useStoreVersion();
  const [mode, setMode] = useState<Mode>('day');
  const [date, setDate] = useState(today);
  const [domains, setDomains] = useState<Domain[]>(DOMAINS);
  const list = listAll as never;
  const opts = { timeZone: settings.timezone, prayer: domains.includes('deen') ? settings.prayer : null, domains };

  const days = useMemo(() => {
    if (mode === 'day') return [date];
    if (mode === 'week') {
      const s = startOfWeek(date, settings.weekStart);
      return dateRange(s, addDays(s, 6));
    }
    return dateRange(startOfMonth(date), endOfMonth(date));
  }, [mode, date, settings.weekStart]);

  void version; // re-render on any store change
  const agendas = new Map(days.map((d) => [d, agendaForDay(list, d, opts)]));

  const shift = (dir: 1 | -1) => setDate(mode === 'day' ? addDays(date, dir) : mode === 'week' ? addDays(date, 7 * dir) : addMonths(date, dir));
  const toggleDomain = (d: Domain) => setDomains((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const header =
    mode === 'month'
      ? new Intl.DateTimeFormat(settings.locale === 'ar' ? 'ar-LB' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
      : mode === 'week'
        ? `${fmt.localDate(days[0], 'short')} – ${fmt.localDate(days[6], 'short')}`
        : fmt.localDate(date, 'long');

  return (
    <Screen title={t('cal.title')} back={false} actions={<TopActions />} testID="screen-calendar">
      <FilterChips options={['day', 'week', 'month'] as const} value={mode} onChange={setMode} labelOf={(m) => t(`common.${m}`)} testIDPrefix="cal-mode" />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={rtl ? 'chevron-forward' : 'chevron-back'} label={t('common.prev')} onPress={() => shift(-1)} testID="cal-prev" />
        <Pressable onPress={() => setDate(today)} accessibilityRole="button" accessibilityLabel={t('common.today')} style={{ flex: 1 }}>
          <Txt variant="bodyStrong" align="center" testID="cal-header">
            {header}
          </Txt>
        </Pressable>
        <IconButton icon={rtl ? 'chevron-back' : 'chevron-forward'} label={t('common.next')} onPress={() => shift(1)} testID="cal-next" />
      </Row>
      <FilterChips options={DOMAINS} value={domains} onChange={toggleDomain} labelOf={(d) => t(`domain.${d}`)} testIDPrefix="cal-filter" />

      {mode === 'month' ? (
        <View>
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
              const items = (agendas.get(d) ?? []).filter((i) => !i.prayer);
              const sel = d === date;
              return (
                <Pressable
                  key={d}
                  testID={`cal-day-${d}`}
                  onPress={() => setDate(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`${fmt.localDate(d, 'long')}, ${items.length}`}
                  style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                  <View style={{ flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: sel ? p.accentMuted : 'transparent', borderWidth: d === today ? 1 : 0, borderColor: p.accent }}>
                    <Txt variant="label">{fmt.number(Number(d.slice(8)))}</Txt>
                    <Row gap={2}>
                      {[...new Set(items.map((i) => i.domain))].slice(0, 4).map((dm) => (
                        <View key={dm} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: DOMAIN_COLORS[dm] }} />
                      ))}
                    </Row>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <SectionHeader title={fmt.localDate(date, 'long')} />
          <TimelineList items={agendas.get(date) ?? agendaForDay(list, date, opts)} emptyText={t('cal.empty')} />
        </View>
      ) : (
        days.map((d) => (
          <View key={d} style={{ gap: spacing.sm }}>
            {mode === 'week' ? <SectionHeader title={fmt.localDate(d, 'weekday')} /> : null}
            <TimelineList items={agendas.get(d) ?? []} emptyText={t('cal.empty')} />
          </View>
        ))
      )}
      <Button label={t('cal.addEvent')} icon="add" variant="secondary" onPress={() => router.push(newRecordHref('calendar_events') as never)} testID="cal-add" />
    </Screen>
  );
}
