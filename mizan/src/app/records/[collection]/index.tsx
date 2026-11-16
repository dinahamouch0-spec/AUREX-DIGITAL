import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';

import { COLLECTIONS, CollectionName } from '@/domain/types';
import { useApp } from '@/state/AppContext';
import { Input } from '@/ui/fields';
import { Button, EmptyState, Screen } from '@/ui/primitives';
import { RecordList, newRecordHref, recordTitle } from '@/ui/records';

export default function RecordListScreen() {
  const { collection, prefill } = useLocalSearchParams<{ collection: string; prefill?: string }>();
  const { t, fmt } = useApp();
  const [q, setQ] = useState('');
  if (!COLLECTIONS.includes(collection as CollectionName)) {
    return (
      <Screen title={t('state.errorTitle')}>
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  }
  const c = collection as CollectionName;
  const pre = prefill ? (JSON.parse(prefill) as Record<string, unknown>) : undefined;
  const filterFn = (r: Record<string, unknown>) => {
    if (pre) for (const [k, v] of Object.entries(pre)) if (r[k] !== v) return false;
    if (!q) return true;
    return recordTitle(c, r, t, fmt).toLocaleLowerCase().includes(q.toLocaleLowerCase());
  };
  return (
    <Screen title={t(`col.${c}`)} testID={`screen-list-${c}`}>
      <Input value={q} onChangeText={setQ} placeholder={t('common.search')} accessibilityLabel={t('common.search')} />
      <Button label={t('common.new')} icon="add" onPress={() => router.push(newRecordHref(c, pre) as never)} testID={`new-${c}`} />
      <RecordList collection={c} filter={filterFn} prefill={pre} />
    </Screen>
  );
}
