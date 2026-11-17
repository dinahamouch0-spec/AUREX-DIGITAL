import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';

import { localDateOf } from '@/domain/dates';
import { nutritionTotals } from '@/domain/fitness';
import { parseNumberInput } from '@/domain/formValues';
import { addFoodToMeal, repeatMeal, saveMealAsRecipe } from '@/data/usecases';
import { store, useApp, useCollection, useRecord } from '@/state/AppContext';
import { SelectField, TextField } from '@/ui/fields';
import { Badge, Button, Card, EmptyState, IconButton, ListItem, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref, newRecordHref } from '@/ui/records';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, showToast, settings } = useApp();
  const meal = useRecord('meals', id);
  const items = useCollection('meal_items').filter((i) => i.meal_id === id);
  const foods = useCollection('food_items');
  const [food, setFood] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  if (!meal)
    return (
      <Screen title={t('col.meals')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const tot = nutritionTotals(items);
  const q = parseNumberInput(qty);
  const qtyErr = q === 'invalid' || q == null || q <= 0 || q > 100 ? 'invalid_number' : undefined;
  const add = () => {
    const f = foods.find((x) => x.id === food);
    if (!f || qtyErr) return;
    addFoodToMeal(store, meal.id, f, q as number);
    setFood(null);
    setQty('1');
  };
  return (
    <Screen title={`${t(`opt.meal.${meal.meal_type}`)} · ${fmt.time(meal.logged_at)}`} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('meals', meal.id) as never)} />} testID="screen-meal">
      <Card>
        <Txt variant="title">{tot.items ? `~${fmt.number(Math.round(tot.calories))} kcal` : '—'}</Txt>
        <Txt color="textSecondary">
          {t('field.protein_g')} {fmt.number(tot.protein_g)} · {t('field.carbs_g')} {fmt.number(tot.carbs_g)} · {t('field.fat_g')} {fmt.number(tot.fat_g)}
        </Txt>
        {tot.itemsMissingData ? <Txt variant="caption" color="warning">{t('fit.missingData', { n: tot.itemsMissingData })}</Txt> : null}
      </Card>
      {items.map((i) => (
        <ListItem
          key={i.id}
          title={i.custom_name ?? t('common.untitled')}
          subtitle={`${i.grams != null ? `${fmt.number(i.grams)} g` : `× ${fmt.number(i.quantity)}`}${i.calories != null ? ` · ${fmt.number(i.calories)} kcal` : ''}`}
          right={<Badge label={t(`opt.nsource.${i.source}`)} tone={i.source === 'package_label' ? 'info' : 'neutral'} />}
          onPress={() => router.push(editRecordHref('meal_items', i.id) as never)}
        />
      ))}
      <SectionHeader title={t('fit.fromLibrary')} />
      {foods.length === 0 ? (
        <Txt color="textMuted">{t('fit.emptyLibrary')}</Txt>
      ) : (
        <>
          <SelectField label={t('fit.addFood')} value={food} onChange={setFood} options={foods.map((f) => ({ value: f.id, label: f.name, subtitle: `${f.serving_label}${f.calories != null ? ` · ${f.calories} kcal` : ''}` }))} inlineMax={0} testID="meal-food" />
          <TextField label={t('field.quantity')} value={qty} onChange={setQty} keyboardType="decimal-pad" error={qtyErr} />
          <Button label={t('common.add')} icon="add" onPress={add} disabled={!food || !!qtyErr} testID="meal-add-food" />
        </>
      )}
      <Row wrap>
        <Button variant="secondary" label={t('fit.customFood')} icon="create-outline" onPress={() => router.push(newRecordHref('meal_items', { meal_id: meal.id, source: 'user_entered' }) as never)} testID="meal-custom" />
        <Button variant="secondary" label={t('fit.saveToLibrary')} icon="bookmark-outline" onPress={() => router.push(newRecordHref('food_items') as never)} />
        <Button variant="secondary" label={t('nut.searchAdd')} icon="search-outline" onPress={() => router.push(`/fitness/food?meal=${meal.meal_type}&date=${localDateOf(meal.logged_at, settings.timezone)}` as never)} testID="meal-search" />
        {items.length ? (
          <Button
            variant="ghost"
            label={t('nut.saveAsRecipe')}
            icon="book-outline"
            onPress={() => {
              const r = saveMealAsRecipe(store, meal.id, `${t(`opt.meal.${meal.meal_type}`)} · ${fmt.localDate(localDateOf(meal.logged_at, settings.timezone), 'short')}`);
              showToast({ message: t('nut.recipeSaved') });
              router.push(`/fitness/recipe/${r.id}`);
            }}
          />
        ) : null}
        <Button
          variant="ghost"
          label={t('fit.repeatMeal')}
          icon="copy-outline"
          onPress={() => {
            const copy = repeatMeal(store, meal.id, new Date());
            showToast({ message: t('fit.mealRepeated') });
            router.replace(`/fitness/meal/${copy.id}`);
          }}
        />
      </Row>
    </Screen>
  );
}
