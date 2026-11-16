import { router } from 'expo-router';
import React, { useState } from 'react';

import { EXERCISE_CATALOG } from '@/domain/exerciseCatalog';
import { useApp, useCollection } from '@/state/AppContext';
import { Input } from '@/ui/fields';
import { Badge, Button, Card, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';

export default function Exercises() {
  const { t, locale } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useCollection('exercises');
  const match = (s: string) => s.toLocaleLowerCase().includes(q.toLocaleLowerCase());
  const catalog = EXERCISE_CATALOG.filter((e) => !q || match(e.name) || match(e.name_ar) || match(e.primary_muscles));
  return (
    <Screen title={t('fit.exerciseLibrary')} testID="screen-exercises">
      <Input value={q} onChangeText={setQ} placeholder={t('common.search')} accessibilityLabel={t('common.search')} />
      <Button label={t('fit.customExercise')} icon="add" variant="secondary" onPress={() => router.push(newRecordHref('exercises') as never)} />
      <RecordList collection="exercises" title={t('col.exercises')} hideAdd filter={(r) => !q || match(String(r.name))} emptyBody={t('fit.noCustomExercises')} />
      <SectionHeader title={t('fit.builtin')} />
      <Txt variant="caption" color="textMuted">
        {t('fit.catalogNote')}
      </Txt>
      {catalog.map((e) => (
        <Card key={e.id} onPress={() => setOpen(open === e.id ? null : e.id)} accessibilityLabel={locale === 'ar' ? e.name_ar : e.name}>
          <Row style={{ justifyContent: 'space-between' }} wrap>
            <Txt variant="bodyStrong">{locale === 'ar' ? e.name_ar : e.name}</Txt>
            <Badge label={t(`opt.difficulty.${e.difficulty}`)} />
          </Row>
          <Txt variant="caption" color="textSecondary">
            {e.primary_muscles}
            {e.secondary_muscles ? ` · ${e.secondary_muscles}` : ''} · {e.equipment}
          </Txt>
          {open === e.id ? (
            <>
              <Txt>{e.instructions}</Txt>
              <Txt variant="caption" color="warning">
                {t('field.common_mistakes')}: {e.common_mistakes}
              </Txt>
            </>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
