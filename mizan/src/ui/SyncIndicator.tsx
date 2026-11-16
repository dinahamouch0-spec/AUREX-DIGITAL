import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { store, useApp, useStoreVersion } from '../state/AppContext';
import { Badge } from './primitives';

/** OfflineSyncIndicator (blueprint 04 §6): local-only / pending / failed / synced. */
export function SyncIndicator() {
  const { t, session, backendConfigured, syncing } = useApp();
  useStoreVersion();
  const items = store.pendingOutbox();
  const failed = items.filter((i) => i.status === 'failed').length;
  const conflicts = store.listConflicts().length;
  let badge: React.ReactNode;
  if (!backendConfigured || !session) badge = <Badge label={t('sync.status.local')} icon="phone-portrait-outline" />;
  else if (conflicts > 0) badge = <Badge label={t('sync.conflicts')} tone="warning" icon="git-compare-outline" />;
  else if (failed > 0) badge = <Badge label={t('sync.status.failed')} tone="danger" icon="cloud-offline-outline" />;
  else if (items.length > 0 || syncing) badge = <Badge label={t('sync.status.pending')} tone="warning" icon="cloud-upload-outline" />;
  else badge = <Badge label={t('sync.status.synced')} tone="success" icon="cloud-done-outline" />;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/settings/sync')} testID="sync-indicator" hitSlop={8}>
      {badge}
    </Pressable>
  );
}
