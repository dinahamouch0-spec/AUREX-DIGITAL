import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { completedThisWeek, habitDayStatus, isScheduledOn } from '@/domain/habits';
import type { HabitLogStatus } from '@/domain/types';
import { logHabit, toggleHabitDone } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { MIN_TOUCH, NAMED_COLORS, radius, spacing } from '@/theme/tokens';
import { SelectSheet } from '@/ui/overlays';
import { Button, EmptyState, Icon, IconButton, ListItem, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { Hero, ProgressRing, useDomainTheme } from '@/ui/kit';
import { usePalette } from '@/ui/theme';

const STATUSES: HabitLogStatus[] = ['completed', 'partial', 'skipped', 'deferred', 'paused'];

export default function Habits() {
  const { t, fmt, today, settings, showToast } = useApp();
  const p = usePalette();
  const habits = useCollection('habits').filter((h) => h.status !== 'archived').sort((a, b) => a.sort_order - b.sort_order);
  const logs = useCollection('habit_logs');
  const routines = useCollection('routines').filter((r) => r.status !== 'archived');
  const categories = useCollection('habit_categories');
  const [sheet, setSheetState] = useState<string | null>(null);
  const [sheetTarget, setSheetTarget] = useState<string | null>(null);
  const setSheet = (id: string | null) => {
    if (id) setSheetTarget(id);
    setSheetState(id);
  };
  const targetHabit = habits.find((h) => h.id === sheetTarget);
  const todays = habits.filter((h) => isScheduledOn(h, today) || h.status === 'paused');
  const habTheme = useDomainTheme('habits');
  const scheduledToday = habits.filter((h) => isScheduledOn(h, today) && h.schedule_type !== 'times_per_week');
  const doneToday = scheduledToday.filter((h) => habitDayStatus(h, logs, today) === 'completed').length;
  return (
    <Screen title={t('hab.title')} actions={<IconButton icon="add" label={t('common.new')} onPress={() => router.push(newRecordHref('habits') as never)} testID="habit-add" />} testID="screen-habits">
      <Hero domain="habits" eyebrow={fmt.localDate(today, 'weekday')} title={t('home.habitsToday', { done: doneToday, total: scheduledToday.length })} subtitle={t('hab.heroSub')} right={<ProgressRing ratio={scheduledToday.length ? doneToday / scheduledToday.length : null} size={72} stroke={8} color={habTheme.accent} label={t('home.habitsToday', { done: doneToday, total: scheduledToday.length })}><Txt variant="bodyStrong">{scheduledToday.length ? fmt.percent(doneToday / scheduledToday.length) : '—'}</Txt></ProgressRing>} />
      <SectionHeader title={`${t('hab.today')} · ${fmt.localDate(today, 'weekday')}`} />
      <Txt variant="caption" color="textMuted">
        {t('hab.tapHint')}
      </Txt>
      {todays.length === 0 ? (
        <EmptyState icon="repeat-outline" body={t('hab.empty')} actionLabel={t('common.new')} onAction={() => router.push(newRecordHref('habits') as never)} />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {todays.map((h) => {
            const st = habitDayStatus(h, logs, today);
            const done = st === 'completed';
            const cat = categories.find((c) => c.id === h.category_id);
            const sub =
              h.schedule_type === 'times_per_week'
                ? t('hab.weekProgress', { done: completedThisWeek(h, logs, today, settings.weekStart), target: h.times_per_week ?? 0 })
                : t(`opt.hlog.${st}`);
            return (
              <Pressable
                key={h.id}
                testID={`habit-${h.id}`}
                disabled={h.status === 'paused'}
                onPress={() => toggleHabitDone(store, h, today, new Date())}
                onLongPress={() => setSheet(h.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done, disabled: h.status === 'paused' }}
                accessibilityLabel={`${h.name}, ${sub}`}
                style={({ pressed }) => ({
                  minHeight: MIN_TOUCH + 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: done ? p.success : p.border,
                  borderStartWidth: cat?.color ? 3 : 1,
                  borderStartColor: cat?.color ? NAMED_COLORS[cat.color] : done ? p.success : p.border,
                  backgroundColor: pressed ? p.surfaceElevated : p.surface,
                  opacity: h.status === 'paused' ? 0.6 : 1,
                })}>
                <Icon name={done ? 'checkmark-circle' : st === 'partial' ? 'contrast-outline' : 'ellipse-outline'} size={26} color={done ? 'success' : 'textMuted'} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{h.name}</Txt>
                  <Txt variant="caption" color="textSecondary">
                    {h.status === 'paused' ? t('opt.hstatus.paused') : sub}
                  </Txt>
                </View>
                <IconButton icon="stats-chart-outline" label={t('common.details')} onPress={() => router.push(`/habits/${h.id}`)} testID={`habit-open-${h.id}`} />
              </Pressable>
            );
          })}
        </View>
      )}
      <Txt variant="caption" color="textMuted">
        {t('hab.noShame')}
      </Txt>

      <SectionHeader title={t('hab.routines')} action={t('common.new')} onAction={() => router.push(newRecordHref('routines') as never)} testID="routine-add" />
      {routines.length === 0 ? (
        <Txt color="textMuted">{t('hab.noRoutines')}</Txt>
      ) : (
        routines.map((r) => <ListItem key={r.id} title={r.name} subtitle={t(`opt.routine.${r.kind}`)} onPress={() => router.push(`/habits/routine/${r.id}`)} testID={`routine-${r.id}`} />)
      )}
      <Row wrap>
        <Button small variant="ghost" label={t('hab.categories')} onPress={() => router.push('/records/habit_categories')} />
        <Button small variant="ghost" label={t('col.habits')} onPress={() => router.push('/records/habits')} />
      </Row>

      <SelectSheet
        visible={sheet != null}
        title={targetHabit?.name ?? ''}
        value={targetHabit ? (habitDayStatus(targetHabit, logs, today) as string) : null}
        options={[...STATUSES.map((s) => ({ value: s, label: t(`opt.hlog.${s}`) })), { value: 'clear', label: t('opt.hlog.not_recorded') }, { value: 'detail', label: t('hab.logDetail') }]}
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          const h = habits.find((x) => x.id === sheet);
          setSheet(null);
          if (!h || !v) return;
          if (v === 'detail') return router.push(newRecordHref('habit_logs', { habit_id: h.id, local_date: today }) as never);
          logHabit(store, h, today, v === 'clear' ? null : (v as HabitLogStatus), new Date());
          showToast({ message: `${h.name}: ${t(`opt.hlog.${v === 'clear' ? 'not_recorded' : v}`)}` });
        }}
      />
    </Screen>
  );
}
