import { router } from 'expo-router';
import React from 'react';

import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { deletePhotoFile, photosSupported, pickPhoto } from '@/data/photos';
import { store, useApp, useCollection } from '@/state/AppContext';
import { radius, spacing } from '@/theme/tokens';
import { BarChart } from '@/ui/BarChart';
import { Button, Notice, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';
import { FitnessNav } from '@/ui/FitnessNav';

export default function Body() {
  const { t, fmt, showToast, confirm } = useApp();
  const photos = useCollection('body_photos').sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  const addPhoto = async () => {
    const r = await pickPhoto();
    if ('uri' in r) {
      store.insert('body_photos', { local_uri: r.uri, captured_at: new Date().toISOString() });
      showToast({ message: t('toast.saved') });
    } else if (r.error === 'denied') showToast({ message: t('fit.photoDenied'), tone: 'error' });
    else if (r.error === 'failed') showToast({ message: t('toast.error'), tone: 'error' });
  };
  const removePhoto = async (id: string, uri: string) => {
    if (!(await confirm({ title: t('confirm.deleteTitle'), body: t('fit.photoDeleteBody'), destructive: true, confirmLabel: t('common.delete') }))) return;
    store.remove('body_photos', id);
    deletePhotoFile(uri);
  };
  const ms = useCollection('body_measurements')
    .filter((m) => m.weight_kg != null)
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-8);
  return (
    <Screen title={t('fit.body')} testID="screen-fitness-body">
      <FitnessNav />
      <Button label={t('fit.weeklyCheckin')} icon="add" onPress={() => router.push(newRecordHref('body_measurements') as never)} testID="body-add" />
      {ms.length >= 2 ? <BarChart title={`${t('fit.weightTrend')} (kg)`} data={ms.map((m) => ({ label: fmt.date(m.measured_at, 'short'), value: m.weight_kg as number, date: m.id }))} /> : null}
      <RecordList collection="body_measurements" title={t('col.body_measurements')} emptyBody={t('fit.noMeasurement')} subtitle={(r) => [r.weight_kg != null ? `${fmt.number(r.weight_kg as number)} kg` : null, r.waist_cm != null ? `${t('field.waist_cm')} ${fmt.number(r.waist_cm as number)}` : null].filter(Boolean).join(' · ')} />
      <SectionHeader title={t('fit.photos')} action={photosSupported ? t('fit.addPhoto') : undefined} onAction={addPhoto} />
      <Notice text={photosSupported ? t('fit.photosPrivate') : t('fit.photosWeb')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {photos.map((ph) => (
          <Pressable key={ph.id} onLongPress={() => removePhoto(ph.id, ph.local_uri)} accessibilityRole="imagebutton" accessibilityLabel={`${t('fit.photos')} ${fmt.date(ph.captured_at)}`} style={{ width: 104, gap: 4 }}>
            <Image source={{ uri: ph.local_uri }} style={{ width: 104, height: 138, borderRadius: radius.sm }} contentFit="cover" />
            <Txt variant="caption" color="textMuted">{fmt.date(ph.captured_at, 'short')}</Txt>
          </Pressable>
        ))}
      </View>
      <SectionHeader title={t('fit.phases')} />
      <Notice text={t('fit.phasesNote')} />
      <RecordList collection="fitness_phases" hideAdd={false} title={t('col.fitness_phases')} />
    </Screen>
  );
}
