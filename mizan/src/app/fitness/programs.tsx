import * as Crypto from 'expo-crypto';
import { fw } from '@/theme/typography';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { weekdayOf } from '@/domain/dates';
import { TEMPLATE_IDS, TemplateId, dayForWeekday } from '@/domain/programs';
import { createProgramFromTemplate } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { BooleanField, TextField } from '@/ui/fields';
import { GlassCard, Hero, IconBadge, Segmented, useDomainTheme } from '@/ui/kit';
import { Badge, Button, EmptyState, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';

type Choice = TemplateId | 'custom';
const CHOICES: Choice[] = [...TEMPLATE_IDS, 'custom'];

/** Program list + creation from a template (Push/Pull/Legs, Upper/Lower, Full Body) or from scratch. */
export default function Programs() {
  const { t, today, settings, showToast } = useApp();
  const th = useDomainTheme('fitness');
  const programs = useCollection('workout_programs');
  const [choice, setChoice] = useState<Choice>('ppl');
  const [name, setName] = useState('');
  const [activate, setActivate] = useState(programs.every((p) => !p.is_active));
  const days = Array.from({ length: 7 }, (_, i) => (settings.weekStart + i) % 7);

  const create = () => {
    const title = name.trim() || t(`fit.tpl.${choice}`);
    const p =
      choice === 'custom'
        ? (() => {
            if (activate) for (const x of store.list('workout_programs')) if (x.is_active) store.update('workout_programs', x.id, { is_active: false });
            return store.insert('workout_programs', { name: title, is_active: activate, days_json: [{ id: Crypto.randomUUID(), name: t('fit.dayN', { n: 1 }), weekdays: [], exercises: [] }], schedule_json: {} });
          })()
        : createProgramFromTemplate(store, choice, title, (k) => t(`fit.day.${k}`), () => Crypto.randomUUID(), activate);
    setName('');
    showToast({ message: t('fit.programCreated') });
    router.push(`/fitness/program/${p.id}`);
  };

  const setActive = (id: string, v: boolean) => {
    for (const p of programs) if (p.is_active && p.id !== id && v) store.update('workout_programs', p.id, { is_active: false });
    store.update('workout_programs', id, { is_active: v });
  };

  return (
    <Screen title={t('fit.programs')} testID="screen-programs">
      <Hero domain="fitness" eyebrow={t('fit.title')} title={t('fit.programs')} subtitle={t('fit.programsSub')} />

      <SectionHeader title={t('fit.newProgram')} />
      <GlassCard accent={th.accent}>
        <Segmented options={CHOICES} value={choice} onChange={setChoice} labelOf={(c) => t(`fit.tplShort.${c}`)} testIDPrefix="tpl" />
        <Txt variant="caption" color="textSecondary">
          {t(`fit.tplDesc.${choice}`)}
        </Txt>
        <TextField label={t('field.name')} value={name} onChange={setName} placeholder={t(`fit.tpl.${choice}`)} testID="program-name" />
        <BooleanField label={t('fit.makeActive')} value={activate} onChange={setActivate} testID="program-activate" />
        <Button label={t('fit.createProgram')} icon="add" onPress={create} testID="program-create" />
      </GlassCard>

      <SectionHeader title={t('fit.myPrograms')} />
      {programs.length === 0 ? <EmptyState body={t('fit.noPrograms')} icon="calendar-outline" /> : null}
      {programs.map((p) => {
        const today_ = dayForWeekday(p.days_json, weekdayOf(today));
        const nExercises = (p.days_json ?? []).reduce((a, d) => a + d.exercises.length, 0);
        return (
          <GlassCard key={p.id} accent={p.is_active ? th.accent : undefined} onPress={() => router.push(`/fitness/program/${p.id}`)} testID={`program-${p.id}`} accessibilityLabel={p.name}>
            <Row>
              <IconBadge icon="calendar" color={th.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="heading">{p.name}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {p.days_json ? `${t('fit.daysCount', { n: p.days_json.length })} · ${t('fit.exercisesCount', { n: nExercises })}` : t('fit.legacyProgram')}
                </Txt>
              </View>
              {p.is_active ? <Badge label={t('fit.active')} tone="accent" icon="flash" /> : null}
            </Row>
            <Row gap={6}>
              {days.map((d) => {
                const label = p.schedule_json?.[String(d)];
                return (
                  <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: label ? th.accent : 'transparent', borderWidth: 1, borderColor: label ? th.accent : '#3a3a3a', opacity: label ? 1 : 0.6 }}>
                    <Txt variant="caption" style={{ fontSize: 11, ...fw('700'), color: label ? '#14110A' : undefined }}>
                      {t(`weekday.${d}`)}
                    </Txt>
                  </View>
                );
              })}
            </Row>
            {p.is_active ? (
              <Txt variant="caption" color="textSecondary">
                {t('fit.today')}: {today_ ? today_.name : (p.schedule_json?.[String(weekdayOf(today))] ?? t('home.restDay'))}
              </Txt>
            ) : null}
            <BooleanField label={t('field.is_active')} value={p.is_active} onChange={(v) => setActive(p.id, v)} testID={`program-active-${p.id}`} />
          </GlassCard>
        );
      })}
      <Txt variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
        {t('fit.templateNote')}
      </Txt>
    </Screen>
  );
}
