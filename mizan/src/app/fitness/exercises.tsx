import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EQUIPMENT, EXERCISE_CATALOG, Equipment, MUSCLE_GROUPS, MuscleGroup, filterCatalog } from '@/domain/exerciseCatalog';
import { useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Input } from '@/ui/fields';
import { GlassCard, Hero, PressableScale, useDomainTheme } from '@/ui/kit';
import { GROUP_MUSCLES, MuscleMap } from '@/ui/MuscleMap';
import { Badge, Button, Chip, EmptyState, Icon, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';


export default function Exercises() {
  const { t, locale } = useApp();
  const th = useDomainTheme('fitness');
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  useCollection('exercises');
  const browsing = !q && !group;
  const list = filterCatalog(EXERCISE_CATALOG, { query: q, group, equipment });
  const usedEquipment = EQUIPMENT.filter((e) => EXERCISE_CATALOG.some((x) => (!group || x.group === group) && x.equipment.includes(e)));
  return (
    <Screen title={t('fit.exerciseLibrary')} testID="screen-exercises">
      <Hero domain="fitness" eyebrow={t('fit.title')} title={t('fit.exerciseLibrary')} subtitle={t('fit.libraryCount', { n: EXERCISE_CATALOG.length, g: MUSCLE_GROUPS.length })} />
      <Input value={q} onChangeText={setQ} placeholder={t('fit.searchExercises')} accessibilityLabel={t('common.search')} testID="ex-search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip label={t('common.all')} selected={!group} onPress={() => setGroup(null)} testID="ex-group-all" />
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g} label={t(`mg.${g}`)} selected={group === g} onPress={() => { setGroup(group === g ? null : g); setEquipment(null); }} testID={`ex-group-${g}`} />
        ))}
      </ScrollView>

      {browsing ? (
        <View style={styles.grid}>
          {MUSCLE_GROUPS.map((g, i) => {
            const n = EXERCISE_CATALOG.filter((e) => e.group === g).length;
            return (
              <PressableScale key={g} onPress={() => setGroup(g)} testID={`ex-tile-${g}`} accessibilityLabel={`${t(`mg.${g}`)}, ${t('fit.exercisesCount', { n })}`} style={{ flexBasis: '47%', flexGrow: 1 }}>
                <GlassCard style={{ alignItems: 'center', paddingVertical: spacing.md }} accent={i === 0 ? th.accent : undefined}>
                  <MuscleMap primary={GROUP_MUSCLES[g]} size={92} color={th.accent} />
                  <Txt variant="bodyStrong" align="center">
                    {t(`mg.${g}`)}
                  </Txt>
                  <Txt variant="caption" color="textSecondary" align="center">
                    {t('fit.exercisesCount', { n })}
                  </Txt>
                </GlassCard>
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Chip icon="construct-outline" label={t('fit.anyEquipment')} selected={!equipment} onPress={() => setEquipment(null)} />
            {usedEquipment.map((e) => (
              <Chip key={e} label={t(`eq.${e}`)} selected={equipment === e} onPress={() => setEquipment(equipment === e ? null : e)} testID={`ex-eq-${e}`} />
            ))}
          </ScrollView>
          <Txt variant="caption" color="textMuted">
            {t('fit.results', { n: list.length })}
          </Txt>
          {list.length === 0 ? <EmptyState icon="search-outline" body={t('state.noResults')} /> : null}
          {list.map((e) => (
            <GlassCard key={e.id} onPress={() => router.push(`/fitness/exercise/${encodeURIComponent(e.id)}`)} testID={`ex-${e.id}`} accessibilityLabel={locale === 'ar' ? e.name_ar : e.name}>
              <Row>
                <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                  <MuscleMap primary={e.primary} secondary={e.secondary} size={54} color={th.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{locale === 'ar' ? e.name_ar : e.name}</Txt>
                  <Txt variant="caption" color="textSecondary" numberOfLines={1}>
                    {e.primary.map((m) => t(`mu.${m}`)).join('، ')}
                  </Txt>
                  <Row wrap gap={6}>
                    <Badge label={t(`opt.difficulty.${e.difficulty}`)} />
                    <Badge label={e.equipment.map((x) => t(`eq.${x}`)).join(' / ')} tone="accent" />
                  </Row>
                </View>
                <Icon name="chevron-forward" color="textMuted" />
              </Row>
            </GlassCard>
          ))}
        </>
      )}

      <SectionHeader title={t('fit.myExercises')} />
      <Button label={t('fit.customExercise')} icon="add" variant="secondary" onPress={() => router.push(newRecordHref('exercises') as never)} />
      <RecordList collection="exercises" title={t('col.exercises')} hideAdd filter={(r) => !q || String(r.name).toLocaleLowerCase().includes(q.toLocaleLowerCase())} emptyBody={t('fit.noCustomExercises')} />
      <Txt variant="caption" color="textMuted">
        {t('fit.catalogNote')}
      </Txt>
    </Screen>
  );
}
