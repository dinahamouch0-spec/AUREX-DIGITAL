import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';

import { useApp } from '@/state/AppContext';
import { Badge, Card, Icon, ListItem, Screen, SectionHeader, Txt } from '@/ui/primitives';

/** In-app summary of docs/LIMITATIONS.md so limits are visible to the user, not hidden. */
const ITEMS: { key: string; status: 'external' | 'device' | 'decision' }[] = [
  { key: 'lim.sync', status: 'external' },
  { key: 'lim.notifications', status: 'device' },
  { key: 'lim.adhan', status: 'device' },
  { key: 'lim.prayer', status: 'decision' },
  { key: 'lim.health', status: 'external' },
  { key: 'lim.ai', status: 'decision' },
  { key: 'lim.photos', status: 'device' },
  { key: 'lim.food', status: 'external' },
  { key: 'lim.prefs', status: 'decision' },
];

export default function About() {
  const { t } = useApp();
  return (
    <Screen title={t('about.title')} testID="screen-about">
      <Card>
        <Txt variant="title" color="accent">
          ميزان · MIZAN
        </Txt>
        <Txt color="textSecondary">{t('about.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}</Txt>
        <Txt color="textSecondary">{t('app.tagline')}</Txt>
      </Card>
      <ListItem title={t('int.title')} left={<Icon name="link-outline" />} onPress={() => router.push('/settings/integrations')} testID="about-integrations" />
      <SectionHeader title={t('about.limitations')} />
      {ITEMS.map((i) => (
        <Card key={i.key}>
          <Badge label={t(`lim.status.${i.status}`)} tone={i.status === 'device' ? 'warning' : 'info'} />
          <Txt>{t(i.key)}</Txt>
        </Card>
      ))}
    </Screen>
  );
}
