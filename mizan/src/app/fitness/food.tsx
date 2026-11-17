import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeSearch } from '@/domain/exerciseCatalog';
import { FOOD_BY_ID, FOOD_CATALOG, FOOD_CATEGORIES, FOOD_SOURCE, FoodCategory, CatalogFood } from '@/domain/foodCatalog';
import { parseNumberInput } from '@/domain/formValues';
import { macrosForGrams, macrosForServings, recentCatalogFoods, recipePerServing, scaleMacros, roundMacros } from '@/domain/nutrition';
import type { FoodItem, MealType, Recipe } from '@/domain/types';
import { addCatalogFoodToMeal, addFoodToMeal, addRecipeToMeal, ingredientFromCatalog, mealFor } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { radius, spacing } from '@/theme/tokens';
import { Input } from '@/ui/fields';
import { GlassCard, MACRO_COLORS, Segmented, tap } from '@/ui/kit';
import { Badge, Button, Chip, EmptyState, ListItem, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { usePalette } from '@/ui/theme';

type Tab = 'foods' | 'mine' | 'recipes';
type Picked = { kind: 'catalog'; food: CatalogFood } | { kind: 'mine'; food: FoodItem } | { kind: 'recipe'; recipe: Recipe };
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Search foods and add them to a meal (or to a recipe when ?recipe=<id>).
 * Built-in foods are per 100 g (USDA); the user picks a serving or types grams and
 * the app computes calories and macros.
 */
export default function FoodSearch() {
  const params = useLocalSearchParams<{ meal?: string; date?: string; recipe?: string }>();
  const { t, fmt, locale, today, settings, showToast } = useApp();
  const ar = locale === 'ar';
  const recipeId = params.recipe ? String(params.recipe) : null;
  const date = params.date ? String(params.date) : today;
  const [meal, setMeal] = useState<MealType>((MEALS as string[]).includes(String(params.meal)) ? (params.meal as MealType) : 'snack');
  const [tab, setTab] = useState<Tab>('foods');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FoodCategory | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const myFoods = useCollection('food_items');
  const recipes = useCollection('recipes');
  const items = useCollection('meal_items');
  const nq = normalizeSearch(q);
  const nameOf = (f: CatalogFood) => (ar ? f.name_ar : f.name);
  const foods = FOOD_CATALOG.filter((f) => (!cat || f.category === cat) && (!nq || normalizeSearch(`${f.name} ${f.name_ar}`).includes(nq)));
  const recents = recentCatalogFoods(items).map((r) => FOOD_BY_ID.get(r.id)).filter((f): f is CatalogFood => !!f);
  const recipe = recipeId ? store.get('recipes', recipeId) : null;

  const done = (msg: string) => {
    tap('success');
    showToast({ message: msg });
    setPicked(null);
  };

  return (
    <Screen title={recipe ? t('nut.addIngredient') : t('nut.addFood')} subtitle={recipe ? recipe.name : fmt.localDate(date, 'weekday')} testID="screen-food">
      {!recipe ? (
        <Row wrap>
          {MEALS.map((m) => (
            <Chip key={m} label={t(`opt.meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} testID={`food-meal-${m}`} />
          ))}
        </Row>
      ) : null}
      <Segmented options={(recipe ? ['foods', 'mine'] : ['foods', 'mine', 'recipes']) as Tab[]} value={tab} onChange={setTab} labelOf={(v) => t(`nut.tab.${v}`)} testIDPrefix="food-tab" />
      <Input value={q} onChangeText={setQ} placeholder={t('nut.searchFoods')} accessibilityLabel={t('common.search')} testID="food-search" />

      {tab === 'foods' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Chip label={t('common.all')} selected={!cat} onPress={() => setCat(null)} />
            {FOOD_CATEGORIES.map((c) => (
              <Chip key={c} label={t(`fc.${c}`)} selected={cat === c} onPress={() => setCat(cat === c ? null : c)} testID={`food-cat-${c}`} />
            ))}
          </ScrollView>
          {!q && !cat && recents.length ? (
            <>
              <SectionHeader title={t('nut.recent')} />
              {recents.map((f) => (
                <FoodRow key={`r-${f.id}`} food={f} name={nameOf(f)} onPress={() => setPicked({ kind: 'catalog', food: f })} />
              ))}
              <SectionHeader title={t('nut.allFoods')} />
            </>
          ) : null}
          {foods.length === 0 ? <EmptyState icon="search-outline" body={t('nut.noFoodMatch')} actionLabel={t('nut.createFood')} onAction={() => router.push(newRecordHref('food_items', { name: q }) as never)} /> : null}
          {foods.map((f) => (
            <FoodRow key={f.id} food={f} name={nameOf(f)} onPress={() => setPicked({ kind: 'catalog', food: f })} />
          ))}
          <Txt variant="caption" color="textMuted">
            {t('nut.sourceLine', { source: FOOD_SOURCE })}
          </Txt>
        </>
      ) : tab === 'mine' ? (
        <>
          <Button variant="secondary" icon="add" label={t('nut.createFood')} onPress={() => router.push(newRecordHref('food_items', { name: q }) as never)} testID="food-create" />
          {myFoods.filter((f) => !nq || normalizeSearch(f.name).includes(nq)).map((f) => (
            <ListItem key={f.id} title={f.name} subtitle={`${f.serving_label}${f.calories != null ? ` · ${fmt.number(f.calories)} kcal` : ''}`} right={<Badge label={t(`opt.nsource.${f.source}`)} />} onPress={() => setPicked({ kind: 'mine', food: f })} testID={`food-mine-${f.id}`} />
          ))}
          {myFoods.length === 0 ? <Txt color="textMuted">{t('fit.emptyLibrary')}</Txt> : null}
        </>
      ) : (
        <>
          <Button variant="secondary" icon="add" label={t('nut.newRecipe')} onPress={() => router.push('/fitness/recipes')} />
          {recipes.filter((r) => !nq || normalizeSearch(r.name).includes(nq)).map((r) => {
            const per = recipePerServing(r.ingredients_json ?? [], r.servings);
            return <ListItem key={r.id} title={r.name} subtitle={`${t('nut.perServing')}: ${fmt.number(per.kcal)} kcal · P ${fmt.number(per.protein)}`} onPress={() => setPicked({ kind: 'recipe', recipe: r })} testID={`food-recipe-${r.id}`} />;
          })}
          {recipes.length === 0 ? <Txt color="textMuted">{t('nut.noRecipes')}</Txt> : null}
        </>
      )}

      {picked ? (
        <AmountSheet
          key={picked.kind === 'recipe' ? picked.recipe.id : picked.food.id}
          picked={picked}
          target={recipe ? recipe.name : t(`opt.meal.${meal}`)}
          onClose={() => setPicked(null)}
          onAdd={(grams, servings) => {
            if (recipe) {
              const cur = store.get('recipes', recipe.id);
              if (!cur) return;
              const ing =
                picked.kind === 'catalog'
                  ? ingredientFromCatalog(picked.food, grams!, nameOf(picked.food))
                  : picked.kind === 'mine'
                    ? (() => {
                        const m = macrosForServings(picked.food, servings!);
                        return { ref: picked.food.id, name: picked.food.name, amount: servings!, unit: 'serving' as const, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat };
                      })()
                    : null;
              if (!ing) return;
              store.update('recipes', recipe.id, { ingredients_json: [...(cur.ingredients_json ?? []), ing] });
              done(t('nut.ingredientAdded'));
              return;
            }
            const m = mealFor(store, meal, date, new Date(), settings.timezone);
            if (picked.kind === 'catalog') addCatalogFoodToMeal(store, m.id, picked.food, grams!, nameOf(picked.food));
            else if (picked.kind === 'mine') addFoodToMeal(store, m.id, picked.food, servings!);
            else addRecipeToMeal(store, m.id, picked.recipe, servings!);
            done(t('nut.addedTo', { meal: t(`opt.meal.${meal}`) }));
          }}
        />
      ) : null}
    </Screen>
  );
}

function FoodRow({ food, name, onPress }: { food: CatalogFood; name: string; onPress: () => void }) {
  const { t, fmt } = useApp();
  return (
    <ListItem
      testID={`food-${food.id}`}
      title={name}
      subtitle={`${fmt.number(food.kcal)} kcal · P ${fmt.number(food.protein)} · C ${fmt.number(food.carbs)} · F ${fmt.number(food.fat)} ${t('nut.per100')}`}
      right={<Txt variant="caption" color="accent">+</Txt>}
      onPress={onPress}
    />
  );
}

function AmountSheet({ picked, target, onClose, onAdd }: { picked: Picked; target: string; onClose: () => void; onAdd: (grams: number | null, servings: number | null) => void }) {
  const { t, fmt, locale } = useApp();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const ar = locale === 'ar';
  const catalog = picked.kind === 'catalog' ? picked.food : null;
  const firstReal = catalog?.servings[1] ?? catalog?.servings[0];
  const [serving, setServing] = useState(firstReal ? catalog!.servings.indexOf(firstReal) : 0);
  const [qty, setQty] = useState('1');
  const [grams, setGrams] = useState(firstReal ? String(firstReal.grams) : '100');
  const q = parseNumberInput(qty);
  const g = parseNumberInput(grams);
  const name = picked.kind === 'catalog' ? (ar ? picked.food.name_ar : picked.food.name) : picked.kind === 'mine' ? picked.food.name : picked.recipe.name;
  let preview = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  let valid = false;
  if (catalog) {
    valid = typeof g === 'number' && g > 0 && g <= 5000;
    if (valid) preview = macrosForGrams(catalog, g as number);
  } else {
    valid = typeof q === 'number' && q > 0 && q <= 100;
    if (valid) preview = picked.kind === 'mine' ? macrosForServings(picked.food, q as number) : picked.kind === 'recipe' ? roundMacros(scaleMacros(recipePerServing(picked.recipe.ingredients_json ?? [], picked.recipe.servings), q as number)) : preview;
  }
  const pickServing = (i: number, n: string) => {
    setServing(i);
    const nn = parseNumberInput(n);
    setGrams(String(Math.round(catalog!.servings[i].grams * (typeof nn === 'number' && nn > 0 ? nn : 1) * 10) / 10));
  };
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: p.overlay }} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View accessibilityViewIsModal testID="amount-sheet" style={{ backgroundColor: p.surfaceElevated, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}>
        <Txt variant="heading">{name}</Txt>
        {catalog ? (
          <>
            <Row wrap>
              {catalog.servings.map((s, i) => (
                <Chip key={i} label={`${ar ? s.label_ar : s.label}${s.grams !== 100 || i ? ` (${fmt.number(s.grams)} g)` : ''}`} selected={serving === i} onPress={() => pickServing(i, qty)} testID={`amount-serving-${i}`} />
              ))}
            </Row>
            <Row>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="label" color="textSecondary">
                  {t('nut.servings')}
                </Txt>
                <Input value={qty} keyboardType="decimal-pad" onChangeText={(v) => { setQty(v); pickServing(serving, v); }} accessibilityLabel={t('nut.servings')} testID="amount-qty" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="label" color="textSecondary">
                  {t('nut.grams')}
                </Txt>
                <Input value={grams} keyboardType="decimal-pad" onChangeText={setGrams} accessibilityLabel={t('nut.grams')} invalid={!valid} testID="amount-grams" />
              </View>
            </Row>
          </>
        ) : (
          <View style={{ gap: 4 }}>
            <Txt variant="label" color="textSecondary">
              {picked.kind === 'mine' ? t('nut.servingsOf', { label: picked.food.serving_label }) : t('nut.portions')}
            </Txt>
            <Input value={qty} keyboardType="decimal-pad" onChangeText={setQty} accessibilityLabel={t('nut.servings')} invalid={!valid} testID="amount-qty" />
          </View>
        )}
        <GlassCard style={{ padding: spacing.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title" testID="amount-kcal">
              {fmt.number(preview.kcal)} kcal
            </Txt>
            <Badge label={t('common.estimate')} />
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            {(
              [
                ['protein', preview.protein],
                ['carbs', preview.carbs],
                ['fat', preview.fat],
              ] as const
            ).map(([k, v]) => (
              <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                <Txt variant="bodyStrong" style={{ color: MACRO_COLORS[k] }}>
                  {fmt.number(v)} g
                </Txt>
                <Txt variant="caption" color="textSecondary">
                  {t(`nut.${k}`)}
                </Txt>
              </View>
            ))}
          </Row>
        </GlassCard>
        <Button label={t('nut.addTo', { target })} icon="add" disabled={!valid} onPress={() => onAdd(catalog ? (g as number) : null, catalog ? null : (q as number))} testID="amount-add" />
      </View>
    </Modal>
  );
}
