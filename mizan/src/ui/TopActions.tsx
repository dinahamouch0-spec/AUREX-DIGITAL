import { router } from 'expo-router';
import React from 'react';

import { useApp, useCollection } from '../state/AppContext';
import { IconButton } from './primitives';

/** Global actions shown on top-level screens: search, notifications, assistant, settings. */
export function TopActions({ tint }: { tint?: string } = {}) {
  const { t } = useApp();
  const notifications = useCollection('notifications');
  const unread = notifications.filter((n) => !n.read_at && !n.dismissed_at).length;
  return (
    <>
      <IconButton icon="search-outline" label={t('nav.search')} color={tint} onPress={() => router.push('/search')} testID="open-search" />
      <IconButton icon="notifications-outline" label={t('nav.notifications')} color={tint} onPress={() => router.push('/notifications')} badge={unread} testID="open-notifications" />
      <IconButton icon="sparkles-outline" label={t('nav.assistant')} color={tint} onPress={() => router.push('/assistant')} testID="open-assistant" />
      <IconButton icon="settings-outline" label={t('nav.settings')} color={tint} onPress={() => router.push('/settings')} testID="open-settings" />
    </>
  );
}
