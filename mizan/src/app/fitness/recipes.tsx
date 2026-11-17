import { router } from 'expo-router';
import React, { useState } from 'react';

import { recipePerServing, recipeTotals } from '@/domain/nutrition';
import { store, useApp, useCollection } from '@/state/AppContext';
import { TextField } from '@/ui/fields';
import { GlassCard, Hero, IconBadge, useDomainTheme } from '@/ui/kit';
import { Button, EmptyState, ListItem, Screen, SectionHeader } from '@/ui/primitives';

export default function Recipes() {
  const { t, fmt } = useApp();
  const th = useDomainTheme('nutrition');
  const recipes = useCollection('recipes');
  const [name, setName] = useState('');
  return (
    <Screen title={t('nut.recipes')} testID="screen-recipes">
      <Hero domain="nutrition" eyebrow={t('fit.nutrition')} title={t('nut.recipes')} subtitle={t('nut.recipesSub')} />
      <GlassCard>
        <TextField label={t('nut.recipeName')} value={name} onChange={setName} testID="recipe-name" />
        <Button
          label={t('nut.newRecipe')}
          icon="add"
          disabled={!name.trim()}
          testID="recipe-create"
          onPress={() => {
            const r = store.insert('recipes', { name: name.trim(), servings: 1, ingredients_json: [] });
            setName('');
            router.push(`/fitness/recipe/${r.id}`);
          }}
        />
      </GlassCard>
      <SectionHeader title={t('nut.myRecipes')} />
      {recipes.length === 0 ? <EmptyState icon="book-outline" body={t('nut.noRecipes')} /> : null}
      {recipes.map((r) => {
        const per = recipePerServing(r.ingredients_json ?? [], r.servings);
        const tot = recipeTotals(r.ingredients_json ?? []);
        return (
          <ListItem
            key={r.id}
            left={<IconBadge icon="book" color={th.accent} size={36} />}
            title={r.name}
            subtitle={`${t('nut.ingredientsN', { n: (r.ingredients_json ?? []).length })} · ${fmt.number(tot.kcal)} kcal · ${t('nut.perServing')} ${fmt.number(per.kcal)}`}
            onPress={() => router.push(`/fitness/recipe/${r.id}`)}
            testID={`recipe-${r.id}`}
          />
        );
      })}
    </Screen>
  );
}
