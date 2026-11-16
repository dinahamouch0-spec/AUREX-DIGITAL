import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Badge, Button, Card, EmptyState, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { RecordList } from '@/ui/records';

export default function NotificationsCenter() {
  const { t, fmt, permission, requestNotificationPermission } = useApp();
  const items = useCollection('notifications')
    .filter((n) => !n.dismissed_at && (!n.snoozed_until || n.snoozed_until <= new Date().toISOString()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const nowIso = () => new Date().toISOString();
  return (
    <Screen title={t('notif.title')} testID="screen-notifications">
      <Notice tone={permission === 'granted' ? 'success' : permission === 'denied' ? 'warning' : 'info'} text={t(`notif.permission.${permission}`)} />
      {permission === 'undetermined' ? <Button label={t('notif.request')} onPress={requestNotificationPermission} icon="notifications-outline" /> : null}
      {items.length > 0 ? (
        <Button
          variant="ghost"
          label={t('notif.markAllRead')}
          onPress={() => items.filter((n) => !n.read_at).forEach((n) => store.update('notifications', n.id, { read_at: nowIso() }))}
        />
      ) : null}
      {items.length === 0 ? (
        <EmptyState icon="notifications-off-outline" body={t('notif.empty')} />
      ) : (
        items.map((n) => (
          <Card key={n.id} testID={`notif-${n.id}`}>
            <Row style={{ justifyContent: 'space-between' }} wrap>
              <Badge label={t(`domain.${n.domain}`)} tone={n.read_at ? 'neutral' : 'accent'} />
              <Txt variant="caption" color="textMuted">
                {fmt.dateTime(n.created_at)}
              </Txt>
            </Row>
            <Txt variant="bodyStrong">{n.title}</Txt>
            {n.body ? <Txt color="textSecondary">{n.body}</Txt> : null}
            <Row wrap>
              {!n.read_at ? <Button small variant="secondary" label={t('notif.markRead')} onPress={() => store.update('notifications', n.id, { read_at: nowIso() })} /> : null}
              <Button small variant="secondary" label={t('notif.snooze')} onPress={() => store.update('notifications', n.id, { snoozed_until: new Date(Date.now() + 3600000).toISOString() })} />
              <Button small variant="ghost" label={t('notif.dismiss')} onPress={() => store.update('notifications', n.id, { dismissed_at: nowIso() })} />
            </Row>
          </Card>
        ))
      )}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('notif.reminders')} action={t('common.seeAll')} onAction={() => router.push('/records/reminders')} />
        <RecordList collection="reminders" filter={(r) => r.status === 'active'} limit={5} />
        <Txt variant="caption" color="textMuted">
          {t('notif.limitations')}
        </Txt>
      </View>
    </Screen>
  );
}
