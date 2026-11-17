import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { addDays, localDateOf } from '@/domain/dates';
import { dayPrayerSummary } from '@/domain/deen';
import { PRAYERS, PrayerType, computePrayerTimes } from '@/domain/prayerTimes';
import type { AdhkarCategory, PrayerStatus } from '@/domain/types';
import { setPrayerStatus } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { SelectSheet } from '@/ui/overlays';
import { Badge, Button, Card, Chip, Icon, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { Hero, ProgressRing, useDomainTheme } from '@/ui/kit';
import { usePalette } from '@/ui/theme';

const STATUS_ICON = { performed: 'checkmark-circle', missed: 'remove-circle-outline', excused: 'ellipse-outline', not_recorded: 'ellipse-outline' } as const;

export default function Deen() {
  const { t, fmt, today, settings, showToast, rtl } = useApp();
  const p = usePalette();
  const [date, setDate] = useState(today);
  const [sheet, setSheetState] = useState<PrayerType | null>(null);
  const [sheetTarget, setSheetTarget] = useState<PrayerType>('fajr');
  const setSheet = (p: PrayerType | null) => {
    if (p) setSheetTarget(p);
    setSheetState(p);
  };
  const logs = useCollection('prayer_logs');
  const quran = useCollection('quran_logs');
  const adhkar = useCollection('adhkar_logs');
  const deeds = useCollection('good_deed_logs');
  const summary = dayPrayerSummary(logs, date);
  const times = useMemo(() => computePrayerTimes(date, settings.prayer), [date, settings.prayer]);
  const recorded = summary.performed + summary.missed + summary.excused;
  const deenTheme = useDomainTheme('deen');
  const nowIso = new Date().toISOString();
  const nextPrayer = date === today ? (PRAYERS.map((pr) => [pr, times.times[pr]] as const).find(([, at]) => at != null && at > nowIso) as readonly [PrayerType, string] | undefined) : undefined;

  const set = (prayer: PrayerType, status: PrayerStatus | null) => {
    const undo = setPrayerStatus(store, date, prayer, status, new Date(), settings.timezone);
    showToast({ message: `${t(`opt.prayer.${prayer}`)}: ${t(`opt.pstatus.${status ?? 'not_recorded'}`)}`, actionLabel: t('common.undo'), onAction: undo });
  };
  const tap = (prayer: PrayerType) => (summary.statuses[prayer] === 'not_recorded' ? set(prayer, 'performed') : setSheet(prayer));
  const lastQuran = [...quran].sort((a, b) => b.read_at.localeCompare(a.read_at))[0];
  const todayAdhkar = adhkar.filter((a) => localDateOf(a.completed_at, settings.timezone) === today);
  const quickAdhkar = (category: AdhkarCategory) => {
    const row = store.insert('adhkar_logs', { category, completed_at: new Date().toISOString() });
    showToast({ message: t(`opt.adhkar.${category}`), actionLabel: t('common.undo'), onAction: () => store.remove('adhkar_logs', row.id) });
  };

  return (
    <Screen title={t('deen.title')} subtitle={t('deen.disclaimer')} actions={<IconButton icon="time-outline" label={t('deen.history')} onPress={() => router.push('/deen/history')} testID="deen-history" />} testID="screen-deen">
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={rtl ? 'chevron-forward' : 'chevron-back'} label={t('common.prev')} onPress={() => setDate(addDays(date, -1))} testID="deen-prev" />
        <Pressable onPress={() => setDate(today)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={t('common.today')}>
          <Txt variant="bodyStrong" align="center">
            {date === today ? t('common.today') : fmt.localDate(date, 'weekday')}
          </Txt>
        </Pressable>
        <IconButton icon={rtl ? 'chevron-back' : 'chevron-forward'} label={t('common.next')} onPress={() => date < today && setDate(addDays(date, 1))} testID="deen-next" />
      </Row>
      <Hero domain="deen" eyebrow={date === today ? t('common.today') : fmt.localDate(date, 'weekday')} title={t('deen.recordedCount', { n: recorded })} subtitle={nextPrayer ? t('deen.nextPrayer', { name: t(`opt.prayer.${nextPrayer[0]}`), time: fmt.time(nextPrayer[1]) }) : undefined} right={<ProgressRing ratio={recorded / 5} size={72} stroke={8} color={deenTheme.accent} label={t('deen.recordedCount', { n: recorded })}><Txt variant="bodyStrong">{fmt.number(summary.performed)}</Txt></ProgressRing>} />

      <SectionHeader title={t('deen.todayPrayers')} />
      <Txt variant="caption" color="textSecondary" testID="deen-count">
        {t('deen.recordedCount', { n: recorded })}
      </Txt>
      <View style={{ gap: spacing.sm }}>
        {PRAYERS.map((prayer) => {
          const st = summary.statuses[prayer];
          const at = times.times[prayer];
          return (
            <Pressable
              key={prayer}
              testID={`prayer-${prayer}`}
              onPress={() => tap(prayer)}
              onLongPress={() => setSheet(prayer)}
              accessibilityRole="button"
              accessibilityLabel={`${t(`opt.prayer.${prayer}`)}, ${t(`opt.pstatus.${st}`)}`}
              accessibilityHint={t('deen.markPrayed', { prayer: t(`opt.prayer.${prayer}`) })}
              style={({ pressed }) => ({
                minHeight: MIN_TOUCH + 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: st === 'performed' ? p.success : p.border,
                backgroundColor: pressed ? p.surfaceElevated : p.surface,
              })}>
              <Icon name={STATUS_ICON[st]} size={26} color={st === 'performed' ? 'success' : st === 'missed' ? 'warning' : 'textMuted'} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{t(`opt.prayer.${prayer}`)}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {t(`opt.pstatus.${st}`)}
                </Txt>
              </View>
              <Txt color="textSecondary">{at ? fmt.time(at) : '—'}</Txt>
              <IconButton icon="ellipsis-horizontal" label={t('deen.chooseStatus', { prayer: t(`opt.prayer.${prayer}`) })} onPress={() => setSheet(prayer)} testID={`prayer-more-${prayer}`} />
            </Pressable>
          );
        })}
      </View>
      <Txt variant="caption" color="textMuted">
        {t('deen.combinedNote')}
      </Txt>

      <SectionHeader title={t('deen.times')} action={t('deen.verifyTimes')} onAction={() => router.push('/settings/prayer')} />
      <Card>
        {(['fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha', 'midnight'] as const).map((k) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <Txt color={['sunrise', 'sunset', 'midnight'].includes(k) ? 'textSecondary' : 'text'}>{['sunrise', 'sunset', 'midnight'].includes(k) ? t(`deen.${k}`) : t(`opt.prayer.${k}`)}</Txt>
            <Txt variant="bodyStrong">{times.times[k] ? fmt.time(times.times[k] as string) : '—'}</Txt>
          </Row>
        ))}
        <Txt variant="caption" color="textMuted">
          {settings.prayer.locationLabel} · {t('deen.timesSource', { source: t('deen.sourceShort') })}
        </Txt>
      </Card>
      {!settings.prayer.confirmed ? <Notice tone="warning" text={t('deen.timesUnconfirmed')} /> : null}

      <SectionHeader title={t('deen.quran')} action={t('deen.logQuran')} onAction={() => router.push(newRecordHref('quran_logs') as never)} testID="quran-add" />
      <Txt color="textSecondary">{lastQuran ? t('deen.lastQuran', { date: fmt.dateTime(lastQuran.read_at) }) : t('deen.noQuran')}</Txt>
      {quran.length ? <Button small variant="ghost" label={t('common.history')} onPress={() => router.push('/records/quran_logs')} /> : null}

      <SectionHeader title={t('deen.adhkar')} action={t('common.history')} onAction={() => router.push('/records/adhkar_logs')} />
      <Row wrap>
        {(['morning', 'evening', 'after_prayer', 'supplication'] as const).map((c) => (
          <Chip key={c} label={t(`opt.adhkar.${c}`)} selected={todayAdhkar.some((a) => a.category === c)} onPress={() => quickAdhkar(c)} testID={`adhkar-${c}`} />
        ))}
      </Row>
      <ListItem title={t('deen.tasbih')} left={<Icon name="radio-button-on-outline" />} onPress={() => router.push('/deen/tasbih')} testID="open-tasbih" />

      <SectionHeader title={t('deen.goodDeeds')} action={t('deen.logDeed')} onAction={() => router.push(newRecordHref('good_deed_logs') as never)} />
      {deeds.slice(-3).reverse().map((d) => (
        <ListItem key={d.id} title={t(`opt.deed.${d.category}`)} subtitle={fmt.dateTime(d.occurred_at)} onPress={() => router.push(`/records/good_deed_logs/${d.id}`)} />
      ))}
      {deeds.length ? <Button small variant="ghost" label={t('common.history')} onPress={() => router.push('/records/good_deed_logs')} /> : null}

      <SelectSheet
        visible={sheet != null}
        title={t('deen.chooseStatus', { prayer: t(`opt.prayer.${sheetTarget}`) })}
        value={summary.statuses[sheetTarget]}
        options={[
          { value: 'performed', label: t('opt.pstatus.performed') },
          { value: 'excused', label: t('opt.pstatus.excused') },
          { value: 'missed', label: t('opt.pstatus.missed') },
          { value: 'not_recorded', label: t('deen.clearRecord') },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          if (sheet) set(sheet, v === 'not_recorded' || v == null ? null : (v as PrayerStatus));
          setSheet(null);
        }}
      />
      {summary.missed > 0 ? <Badge label={t('opt.pstatus.missed')} tone="warning" /> : null}
    </Screen>
  );
}
