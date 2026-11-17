import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { addDays } from '@/domain/dates';
import { averageOfLoggedDays, hasTargets, itemsForDate, macroCalorieSplit, remaining, sumItems, weekSummary } from '@/domain/nutrition';
import type { MealType } from '@/domain/types';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { FitnessNav } from '@/ui/FitnessNav';
import { Bars, GlassCard, Hero, IconBadge, MACRO_COLORS, MacroSplitBar, MeterRow, ProgressRing, Segmented, StatTile, useDomainTheme } from '@/ui/kit';
import { Button, IconButton, ListItem, Notice, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { editRecordHref } from '@/ui/records';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICON = { breakfast: 'sunny-outline', lunch: 'restaurant-outline', dinner: 'moon-outline', snack: 'cafe-outline' } as const;

export default function Nutrition() {
  const { t, fmt, today, settings, showToast } = useApp();
  const th = useDomainTheme('nutrition');
  const allMeals = useCollection('meals');
  const allItems = useCollection('meal_items');
  const [date, setDate] = useState(today);
  const [view, setView] = useState<'day' | 'week'>('day');
  const tz = settings.timezone;
  const targets = settings.nutrition;
  const day = itemsForDate(allMeals, allItems, date, tz);
  const totals = sumItems(day.items);
  const rem = remaining(targets, totals);
  const split = macroCalorieSplit(totals);
  const week = weekSummary(allMeals, allItems, date, tz);
  const avg = averageOfLoggedDays(week);
  const ratio = targets.kcal ? totals.kcal / targets.kcal : null;

  const openFood = (meal: MealType) => router.push(`/fitness/food?meal=${meal}&date=${date}` as never);
  const quickMeal = () => {
    const h = new Date().getHours();
    const type: MealType = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
    const m = store.insert('meals', { meal_type: type, logged_at: new Date().toISOString() });
    router.push(`/fitness/meal/${m.id}`);
  };

  return (
    <Screen title={t('fit.nutrition')} testID="screen-nutrition">
      <FitnessNav />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" label={t('common.previous')} onPress={() => setDate(addDays(date, -1))} testID="nut-prev" />
        <Txt variant="bodyStrong" testID="nut-date">
          {date === today ? t('home.today') : fmt.localDate(date, 'weekday')}
        </Txt>
        <IconButton icon="chevron-forward" label={t('common.next')} onPress={() => setDate(addDays(date, 1))} testID="nut-next" />
      </Row>
      <Segmented options={['day', 'week'] as const} value={view} onChange={setView} labelOf={(v) => t(`nut.view.${v}`)} testIDPrefix="nut-view" />

      {view === 'day' ? (
        <>
          <Hero domain="nutrition" eyebrow={t('nut.today')} title={`${fmt.number(totals.kcal)} kcal`} subtitle={rem.kcal != null ? (rem.kcal >= 0 ? t('nut.kcalLeft', { n: fmt.number(rem.kcal) }) : t('nut.kcalOver', { n: fmt.number(-rem.kcal) })) : t('nut.noTargetHint')} testID="nut-hero">
            <Row style={{ alignItems: 'center' }} gap={spacing.lg}>
              <ProgressRing ratio={ratio ?? (totals.kcal > 0 ? 1 : 0)} size={124} stroke={12} color={th.accent} label={`${fmt.number(totals.kcal)} kcal`}>
                <Txt variant="heading" align="center">
                  {fmt.number(totals.kcal)}
                </Txt>
                <Txt variant="caption" color="textSecondary" align="center">
                  {targets.kcal ? `/ ${fmt.number(targets.kcal)}` : 'kcal'}
                </Txt>
              </ProgressRing>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <MeterRow label={t('nut.protein')} value={totals.protein} target={targets.protein} unit="g" color={MACRO_COLORS.protein} testID="nut-protein" />
                <MeterRow label={t('nut.carbs')} value={totals.carbs} target={targets.carbs} unit="g" color={MACRO_COLORS.carbs} />
                <MeterRow label={t('nut.fat')} value={totals.fat} target={targets.fat} unit="g" color={MACRO_COLORS.fat} />
              </View>
            </Row>
            {totals.kcal > 0 ? (
              <>
                <MacroSplitBar protein={split.protein} carbs={split.carbs} fat={split.fat} />
                <Txt variant="caption" color="textSecondary">
                  {t('nut.split', { p: fmt.percent(split.protein), c: fmt.percent(split.carbs), f: fmt.percent(split.fat) })}
                </Txt>
              </>
            ) : null}
          </Hero>
          {!hasTargets(targets) ? (
            <Button variant="ghost" icon="locate-outline" label={t('nut.setTargets')} onPress={() => router.push('/fitness/nutrition-targets')} testID="nut-set-targets" />
          ) : null}

          {MEALS.map((type) => {
            const meals = day.meals.filter((m) => m.meal_type === type);
            const ids = new Set(meals.map((m) => m.id));
            const items = day.items.filter((i) => ids.has(i.meal_id));
            const sum = sumItems(items);
            return (
              <GlassCard key={type} testID={`nut-meal-${type}`}>
                <Row>
                  <IconBadge icon={MEAL_ICON[type]} color={th.accent} size={36} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{t(`opt.meal.${type}`)}</Txt>
                    <Txt variant="caption" color="textSecondary">
                      {items.length ? `${fmt.number(sum.kcal)} kcal · P ${fmt.number(sum.protein)} · C ${fmt.number(sum.carbs)} · F ${fmt.number(sum.fat)}` : t('nut.nothingYet')}
                    </Txt>
                  </View>
                  <IconButton icon="add-circle" color="accent" label={`${t('nut.addFood')} · ${t(`opt.meal.${type}`)}`} onPress={() => openFood(type)} testID={`nut-add-${type}`} />
                </Row>
                {items.map((i) => (
                  <ListItem
                    key={i.id}
                    testID={`nut-item-${i.id}`}
                    title={i.custom_name ?? t('common.untitled')}
                    subtitle={`${i.grams != null ? `${fmt.number(i.grams)} g` : `× ${fmt.number(i.quantity)}`} · ${i.calories != null ? `${fmt.number(i.calories)} kcal` : '—'}`}
                    onPress={() => router.push(editRecordHref('meal_items', i.id) as never)}
                    onLongPress={() => {
                      const undo = store.remove('meal_items', i.id);
                      showToast({ message: t('common.deleted'), actionLabel: t('common.undo'), onAction: undo });
                    }}
                  />
                ))}
                {meals.length ? (
                  <Button small variant="ghost" icon="open-outline" label={t('nut.mealDetails')} onPress={() => router.push(`/fitness/meal/${meals[0].id}`)} />
                ) : null}
              </GlassCard>
            );
          })}
        </>
      ) : (
        <>
          <GlassCard>
            <Txt variant="label" color="textSecondary">
              {t('nut.kcalPerDay')}
            </Txt>
            <Bars data={week.map((d) => ({ label: fmt.localDate(d.date, 'weekday').slice(0, 3), value: d.totals.kcal }))} highlight={6} color={th.accent} />
          </GlassCard>
          {avg ? (
            <View style={styles.grid}>
              <StatTile icon="flame-outline" label={t('nut.avgKcal')} value={fmt.number(avg.kcal)} color={th.accent} hint={t('nut.loggedDays', { n: week.filter((d) => d.items).length })} />
              <StatTile icon="fish-outline" label={t('nut.avgProtein')} value={`${fmt.number(avg.protein)} g`} color={MACRO_COLORS.protein} />
              <StatTile icon="leaf-outline" label={t('nut.avgCarbs')} value={`${fmt.number(avg.carbs)} g`} color={MACRO_COLORS.carbs} />
              <StatTile icon="water-outline" label={t('nut.avgFat')} value={`${fmt.number(avg.fat)} g`} color={MACRO_COLORS.fat} />
            </View>
          ) : (
            <Txt color="textMuted">{t('nut.noWeekData')}</Txt>
          )}
          <Txt variant="caption" color="textMuted">
            {t('nut.avgNote')}
          </Txt>
        </>
      )}

      <SectionHeader title={t('fit.more')} />
      <View style={styles.grid}>
        <StatTile icon="locate-outline" label={t('nut.targets')} value={targets.kcal ? `${fmt.number(targets.kcal)} kcal` : t('nut.notSet')} onPress={() => router.push('/fitness/nutrition-targets')} color={th.accent} testID="nut-targets" />
        <StatTile icon="book-outline" label={t('nut.recipes')} value={fmt.number(store.list('recipes').length)} onPress={() => router.push('/fitness/recipes')} color={th.accent} testID="nut-recipes" />
        <StatTile icon="nutrition-outline" label={t('col.food_items')} value={fmt.number(store.list('food_items').length)} onPress={() => router.push('/records/food_items')} color={th.accent} />
      </View>
      <Button variant="secondary" label={t('fit.addMeal')} icon="add" onPress={quickMeal} testID="meal-add" />
      <Notice text={t('nut.sourceNote')} />
      <Txt variant="caption" color="textMuted">
        {t('fit.nutritionNote')}
      </Txt>
      {date === today ? null : <Txt variant="caption" color="textMuted">{t('nut.pastDayNote')}</Txt>}
    </Screen>
  );
}

