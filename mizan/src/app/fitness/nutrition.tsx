import { router } from 'expo-router';
import React from 'react';

import { localDateOf } from '@/domain/dates';
import { nutritionTotals } from '@/domain/fitness';
import { store, useApp, useCollection } from '@/state/AppContext';
import { Button, Card, EmptyState, ListItem, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { FitnessNav } from '@/ui/FitnessNav';

export default function Nutrition() {
  const { t, fmt, today, settings } = useApp();
  const meals = useCollection('meals')
    .filter((m) => localDateOf(m.logged_at, settings.timezone) === today)
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  const items = useCollection('meal_items');
  const ids = new Set(meals.map((m) => m.id));
  const totals = nutritionTotals(items.filter((i) => ids.has(i.meal_id)));
  const recent = store
    .list('meals')
    .filter((m) => !ids.has(m.id))
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
    .slice(0, 5);
  const newMeal = () => {
    const m = store.insert('meals', { meal_type: guessMeal(), logged_at: new Date().toISOString() });
    router.push(`/fitness/meal/${m.id}`);
  };
  return (
    <Screen title={t('fit.nutrition')} testID="screen-nutrition">
      <FitnessNav />
      <Card>
        <Txt variant="label" color="textSecondary">
          {t('fit.nutritionToday')}
        </Txt>
        <Txt variant="title">{totals.items ? `~${fmt.number(Math.round(totals.calories))} kcal` : '—'}</Txt>
        {totals.items ? (
          <Txt color="textSecondary">
            {t('field.protein_g')} {fmt.number(totals.protein_g)} · {t('field.carbs_g')} {fmt.number(totals.carbs_g)} · {t('field.fat_g')} {fmt.number(totals.fat_g)}
          </Txt>
        ) : null}
        {totals.estimatedItems ? <Txt variant="caption" color="textMuted">{t('fit.estimatesNote', { n: totals.estimatedItems, total: totals.items })}</Txt> : null}
        {totals.itemsMissingData ? <Txt variant="caption" color="warning">{t('fit.missingData', { n: totals.itemsMissingData })}</Txt> : null}
      </Card>
      <Notice text={t('fit.nutritionNote')} />
      <Button label={t('fit.addMeal')} icon="add" onPress={newMeal} testID="meal-add" />
      {meals.length === 0 ? (
        <EmptyState icon="restaurant-outline" body={t('fit.noMeals')} />
      ) : (
        meals.map((m) => {
          const its = items.filter((i) => i.meal_id === m.id);
          const tot = nutritionTotals(its);
          return <ListItem key={m.id} testID={`meal-${m.id}`} title={t(`opt.meal.${m.meal_type}`)} subtitle={`${fmt.time(m.logged_at)} · ${t('common.items', { n: its.length })}${tot.items ? ` · ~${fmt.number(Math.round(tot.calories))} kcal` : ''}`} onPress={() => router.push(`/fitness/meal/${m.id}`)} />;
        })
      )}
      {recent.length ? (
        <>
          <SectionHeader title={t('fit.recentMeals')} />
          {recent.map((m) => (
            <ListItem key={m.id} title={t(`opt.meal.${m.meal_type}`)} subtitle={fmt.dateTime(m.logged_at)} onPress={() => router.push(`/fitness/meal/${m.id}`)} />
          ))}
        </>
      ) : null}
      <Row>
        <Button variant="secondary" label={t('col.food_items')} icon="nutrition-outline" onPress={() => router.push('/records/food_items')} style={{ flex: 1 }} />
      </Row>
    </Screen>
  );
}

function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
}
