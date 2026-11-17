import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { parseNumberInput } from '@/domain/formValues';
import { recipePerServing, recipeTotals } from '@/domain/nutrition';
import type { MealType } from '@/domain/types';
import { addRecipeToMeal, mealFor } from '@/data/usecases';
import { store, useApp, useRecord } from '@/state/AppContext';
import { Input } from '@/ui/fields';
import { GlassCard, Hero, MACRO_COLORS, StatTile, tap, useDomainTheme } from '@/ui/kit';
import { Button, Chip, EmptyState, IconButton, ListItem, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function RecipeEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today, settings, confirm, showToast } = useApp();
  const th = useDomainTheme('nutrition');
  const recipe = useRecord('recipes', id);
  const [meal, setMeal] = useState<MealType>('lunch');
  const [portions, setPortions] = useState('1');
  if (!recipe)
    return (
      <Screen title={t('nut.recipes')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const ing = recipe.ingredients_json ?? [];
  const tot = recipeTotals(ing);
  const per = recipePerServing(ing, recipe.servings);
  const p = parseNumberInput(portions);
  const pOk = typeof p === 'number' && p > 0 && p <= 100;
  const setServings = (n: number) => store.update('recipes', recipe.id, { servings: Math.min(100, Math.max(0.5, Math.round(n * 2) / 2)) });
  return (
    <Screen title={recipe.name} testID="screen-recipe">
      <Hero domain="nutrition" eyebrow={t('nut.recipe')} title={recipe.name} subtitle={t('nut.ingredientsN', { n: ing.length })} />
      <Input defaultValue={recipe.name} accessibilityLabel={t('nut.recipeName')} onEndEditing={(e) => e.nativeEvent.text.trim() && store.update('recipes', recipe.id, { name: e.nativeEvent.text.trim() })} />
      <GlassCard>
        <Row>
          <Txt style={{ flex: 1 }}>{t('nut.servingsMakes')}</Txt>
          <IconButton icon="remove-circle-outline" label="−" onPress={() => setServings(recipe.servings - 1)} testID="recipe-serv-dec" />
          <Txt variant="heading" testID="recipe-servings">
            {fmt.number(recipe.servings)}
          </Txt>
          <IconButton icon="add-circle-outline" label="+" onPress={() => setServings(recipe.servings + 1)} testID="recipe-serv-inc" />
        </Row>
      </GlassCard>
      <View style={styles.grid}>
        <StatTile icon="flame-outline" label={t('nut.perServing')} value={`${fmt.number(per.kcal)} kcal`} color={th.accent} testID="recipe-per" />
        <StatTile icon="fish-outline" label={t('nut.protein')} value={`${fmt.number(per.protein)} g`} color={MACRO_COLORS.protein} />
        <StatTile icon="leaf-outline" label={t('nut.carbs')} value={`${fmt.number(per.carbs)} g`} color={MACRO_COLORS.carbs} />
        <StatTile icon="water-outline" label={t('nut.fat')} value={`${fmt.number(per.fat)} g`} color={MACRO_COLORS.fat} />
      </View>
      <Txt variant="caption" color="textSecondary">
        {t('nut.recipeTotal', { kcal: fmt.number(tot.kcal), p: fmt.number(tot.protein), c: fmt.number(tot.carbs), f: fmt.number(tot.fat) })}
      </Txt>

      <SectionHeader title={t('nut.ingredients')} action={t('nut.addIngredient')} onAction={() => router.push(`/fitness/food?recipe=${recipe.id}` as never)} testID="recipe-add-ing" />
      {ing.length === 0 ? <Txt color="textMuted">{t('nut.noIngredients')}</Txt> : null}
      {ing.map((x, i) => (
        <ListItem
          key={`${x.ref}-${i}`}
          title={x.name}
          subtitle={`${fmt.number(x.amount)} ${x.unit === 'g' ? 'g' : t('nut.servingShort')} · ${fmt.number(x.kcal)} kcal · P ${fmt.number(x.protein)}`}
          right={<IconButton icon="close" label={t('common.delete')} onPress={() => store.update('recipes', recipe.id, { ingredients_json: ing.filter((_, k) => k !== i) })} />}
        />
      ))}

      <SectionHeader title={t('nut.logRecipe')} />
      <GlassCard>
        <Row wrap>
          {MEALS.map((m) => (
            <Chip key={m} label={t(`opt.meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
          ))}
        </Row>
        <Row>
          <Txt style={{ flex: 1 }}>{t('nut.portions')}</Txt>
          <Input style={{ width: 90, textAlign: 'center' }} value={portions} onChangeText={setPortions} keyboardType="decimal-pad" accessibilityLabel={t('nut.portions')} invalid={!pOk} testID="recipe-portions" />
        </Row>
        <Button
          label={t('nut.addTo', { target: t(`opt.meal.${meal}`) })}
          icon="add"
          disabled={!pOk || ing.length === 0}
          testID="recipe-log"
          onPress={() => {
            const m = mealFor(store, meal, today, new Date(), settings.timezone);
            addRecipeToMeal(store, m.id, recipe, p as number);
            tap('success');
            showToast({ message: t('nut.addedTo', { meal: t(`opt.meal.${meal}`) }) });
          }}
        />
      </GlassCard>
      <Button
        variant="ghost"
        icon="trash-outline"
        label={t('common.delete')}
        onPress={async () => {
          if (!(await confirm({ title: t('common.delete'), body: recipe.name, destructive: true }))) return;
          const undo = store.remove('recipes', recipe.id);
          showToast({ message: t('common.deleted'), actionLabel: t('common.undo'), onAction: undo });
          router.back();
        }}
      />
    </Screen>
  );
}
