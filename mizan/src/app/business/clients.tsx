import { router } from 'expo-router';
import React, { useState } from 'react';

import { useApp } from '@/state/AppContext';
import { Input } from '@/ui/fields';
import { Button, Screen } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';

export default function Clients() {
  const { t } = useApp();
  const [q, setQ] = useState('');
  return (
    <Screen title={t('bus.clients')} testID="screen-clients">
      <Input value={q} onChangeText={setQ} placeholder={t('common.search')} accessibilityLabel={t('common.search')} />
      <Button label={t('common.new')} icon="person-add-outline" onPress={() => router.push(newRecordHref('clients') as never)} />
      <RecordList collection="clients" filter={(c) => !q || `${c.name} ${c.organization ?? ''}`.toLocaleLowerCase().includes(q.toLocaleLowerCase())} onPressItem={(id) => router.push(`/business/client/${id}`)} />
    </Screen>
  );
}
