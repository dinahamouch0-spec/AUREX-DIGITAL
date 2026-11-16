import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { COLLECTIONS, CollectionName } from '@/domain/types';
import { useApp } from '@/state/AppContext';
import { EmptyState, Screen } from '@/ui/primitives';
import { RecordForm } from '@/ui/records';

/** Create (id = "new") or edit any record via its schema. */
export default function RecordEditScreen() {
  const { collection, id, prefill } = useLocalSearchParams<{ collection: string; id: string; prefill?: string }>();
  const { t } = useApp();
  if (!COLLECTIONS.includes(collection as CollectionName)) {
    return (
      <Screen title={t('state.errorTitle')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  }
  const c = collection as CollectionName;
  const isNew = id === 'new';
  let pre: Record<string, unknown> | undefined;
  try {
    pre = prefill ? JSON.parse(prefill) : undefined;
  } catch {
    pre = undefined;
  }
  return (
    <Screen title={`${isNew ? t('common.new') : t('common.edit')} · ${t(`col.${c}`)}`} testID={`screen-edit-${c}`}>
      <RecordForm collection={c} id={isNew ? null : id} prefill={pre} />
    </Screen>
  );
}
