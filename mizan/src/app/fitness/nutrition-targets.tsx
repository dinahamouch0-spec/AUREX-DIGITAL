import { router } from 'expo-router';
import React, { useState } from 'react';

import { parseNumberInput } from '@/domain/formValues';
import { NO_TARGETS, NutritionTargets } from '@/domain/nutrition';
import { useApp } from '@/state/AppContext';
import { TextField } from '@/ui/fields';
import { GlassCard, Hero } from '@/ui/kit';
import { Button, Notice, Screen, Txt } from '@/ui/primitives';

const FIELDS: [keyof NutritionTargets, string, number][] = [
  ['kcal', 'nut.targetKcal', 10000],
  ['protein', 'nut.targetProtein', 1000],
  ['carbs', 'nut.targetCarbs', 2000],
  ['fat', 'nut.targetFat', 1000],
];

/** Optional daily targets the user sets; nothing is imposed. Stored on this device. */
export default function NutritionTargetsScreen() {
  const { t, settings, updateSettings, showToast, fmt } = useApp();
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map(([k]) => [k, settings.nutrition[k] != null ? String(settings.nutrition[k]) : ''])));
  const parsed = Object.fromEntries(FIELDS.map(([k, , max]) => {
    const v = parseNumberInput(vals[k] ?? '');
    return [k, v == null ? { ok: true, n: null } : typeof v === 'number' && v > 0 && v <= max ? { ok: true, n: Math.round(v) } : { ok: false, n: null }];
  })) as Record<keyof NutritionTargets, { ok: boolean; n: number | null }>;
  const valid = Object.values(parsed).every((x) => x.ok);
  const macroKcal = (parsed.protein.n ?? 0) * 4 + (parsed.carbs.n ?? 0) * 4 + (parsed.fat.n ?? 0) * 9;
  return (
    <Screen title={t('nut.targets')} testID="screen-nutrition-targets">
      <Hero domain="nutrition" eyebrow={t('fit.nutrition')} title={t('nut.targets')} subtitle={t('nut.targetsSub')} />
      <GlassCard>
        {FIELDS.map(([k, label]) => (
          <TextField key={k} label={t(label)} value={vals[k] ?? ''} onChange={(v) => setVals({ ...vals, [k]: v })} keyboardType="number-pad" error={parsed[k].ok ? undefined : 'invalid_number'} testID={`target-${k}`} />
        ))}
        {macroKcal > 0 ? (
          <Txt variant="caption" color="textSecondary">
            {t('nut.macroKcal', { n: fmt.number(macroKcal) })}
          </Txt>
        ) : null}
      </GlassCard>
      <Notice text={t('nut.targetsNote')} />
      <Button
        label={t('common.save')}
        icon="checkmark"
        disabled={!valid}
        testID="targets-save"
        onPress={() => {
          updateSettings({ nutrition: { kcal: parsed.kcal.n, protein: parsed.protein.n, carbs: parsed.carbs.n, fat: parsed.fat.n } });
          showToast({ message: t('common.saved') });
          router.back();
        }}
      />
      <Button variant="ghost" label={t('nut.clearTargets')} onPress={() => { updateSettings({ nutrition: NO_TARGETS }); setVals({}); }} />
    </Screen>
  );
}
