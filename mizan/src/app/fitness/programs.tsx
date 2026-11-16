import { router } from 'expo-router';
import React from 'react';

import { store, useApp, useCollection } from '@/state/AppContext';
import { Input } from '@/ui/fields';
import { BooleanField } from '@/ui/fields';
import { Button, Card, EmptyState, Row, Screen, Txt } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';

/** Editable fixed weekly schedule; an empty day is a rest day. */
export default function Programs() {
  const { t, settings } = useApp();
  const programs = useCollection('workout_programs');
  const days = Array.from({ length: 7 }, (_, i) => (settings.weekStart + i) % 7);
  const setDay = (id: string, day: number, label: string) => {
    const p = store.get('workout_programs', id);
    if (!p) return;
    const schedule = { ...(p.schedule_json ?? {}) };
    if (label.trim()) schedule[String(day)] = label.trim();
    else delete schedule[String(day)];
    store.update('workout_programs', id, { schedule_json: schedule });
  };
  const activate = (id: string, v: boolean) => {
    for (const p of programs) if (p.is_active && p.id !== id && v) store.update('workout_programs', p.id, { is_active: false });
    store.update('workout_programs', id, { is_active: v });
  };
  return (
    <Screen title={t('fit.programs')} testID="screen-programs">
      <Button label={t('common.new')} icon="add" onPress={() => router.push(newRecordHref('workout_programs') as never)} testID="program-add" />
      {programs.length === 0 ? <EmptyState body={t('fit.noPrograms')} icon="calendar-outline" /> : null}
      {programs.map((p) => (
        <Card key={p.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="heading" style={{ flex: 1 }}>
              {p.name}
            </Txt>
            <Button small variant="ghost" label={t('common.edit')} onPress={() => router.push(`/records/workout_programs/${p.id}`)} />
          </Row>
          <BooleanField label={t('field.is_active')} value={p.is_active} onChange={(v) => activate(p.id, v)} />
          <Txt variant="label" color="textSecondary">
            {t('fit.programSchedule')}
          </Txt>
          {days.map((d) => (
            <Row key={d}>
              <Txt style={{ width: 70 }}>{t(`weekday.${d}`)}</Txt>
              <Input
                style={{ flex: 1 }}
                defaultValue={p.schedule_json?.[String(d)] ?? ''}
                placeholder={t('fit.restDayLabel')}
                accessibilityLabel={`${p.name} ${t(`weekday.${d}`)}`}
                onEndEditing={(e) => setDay(p.id, d, e.nativeEvent.text)}
                onBlur={(e) => setDay(p.id, d, (e.nativeEvent as unknown as { text?: string }).text ?? (e.target as unknown as { value?: string }).value ?? '')}
                testID={`program-${p.id}-day-${d}`}
              />
            </Row>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
