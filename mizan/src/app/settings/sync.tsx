import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { signOutAndWipe } from '@/data/account';
import { store, useApp, useStoreVersion } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Button, Card, EmptyState, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { recordTitle } from '@/ui/records';

export default function SyncScreen() {
  const { t, fmt, backendConfigured, session, syncNow, syncing, lastSync, confirm, showToast } = useApp();
  useStoreVersion();
  const outbox = store.pendingOutbox();
  const failed = outbox.filter((o) => o.status === 'failed');
  const pending = outbox.filter((o) => o.status === 'pending');
  const conflicts = store.listConflicts();

  const signOut = async () => {
    const ok = await confirm({
      title: t('sync.signOut'),
      body: outbox.length ? t('sync.signOutWarn', { n: outbox.length }) : t('sync.signOutBody'),
      destructive: true,
      confirmLabel: t('sync.signOut'),
    });
    if (!ok) return;
    await signOutAndWipe();
    router.replace('/onboarding');
  };

  return (
    <Screen title={t('sync.title')} testID="screen-sync">
      {!backendConfigured ? (
        <>
          <Card>
            <Txt variant="heading">{t('sync.localOnly')}</Txt>
            <Txt color="textSecondary">{t('sync.localOnlyBody')}</Txt>
          </Card>
          <Notice text={t('sync.pendingSetup')} />
          <Button label={t('data.export')} icon="download-outline" variant="secondary" onPress={() => router.push('/settings/data')} />
        </>
      ) : !session ? (
        <>
          <Notice text={t('sync.localOnlyBody')} />
          <Button label={t('sync.signIn')} onPress={() => router.push('/auth')} icon="log-in-outline" testID="sync-signin" />
        </>
      ) : (
        <>
          <Card>
            <Txt>{t('sync.signedInAs', { email: session.user.email ?? '' })}</Txt>
            <Txt variant="caption" color="textSecondary">
              {pending.length ? t('sync.pending', { n: pending.length }) : t('sync.upToDate')}
            </Txt>
            {failed.length ? <Txt variant="caption" color="danger">{t('sync.failed', { n: failed.length })}</Txt> : null}
            {lastSync ? <Txt variant="caption" color="textMuted">{t('sync.last', { time: fmt.dateTime(lastSync.finishedAt) })}{lastSync.errorCode ? ` · ${lastSync.errorCode}` : ''}</Txt> : null}
          </Card>
          <Row>
            <Button label={t('sync.now')} onPress={() => syncNow(true)} loading={syncing} icon="sync" style={{ flex: 1 }} />
            <Button label={t('sync.signOut')} variant="secondary" onPress={signOut} />
          </Row>
        </>
      )}

      <SectionHeader title={t('sync.conflicts')} />
      {conflicts.length === 0 ? (
        <EmptyState icon="git-compare-outline" body={t('sync.noConflicts')} />
      ) : (
        conflicts.map((c) => (
          <Card key={c.key}>
            <Txt variant="bodyStrong">
              {t(`col.${c.collection}`)} · {recordTitle(c.collection, c.local, t, fmt)}
            </Txt>
            <Txt variant="caption" color="textSecondary">
              {t('sync.conflictBody')}
            </Txt>
            <View style={{ gap: spacing.xs }}>
              <Txt variant="caption">
                {t('sync.mine')}: {fmt.dateTime(c.local.updated_at)}
              </Txt>
              <Txt variant="caption">
                {t('sync.server')}: {fmt.dateTime(c.remote.updated_at)}
              </Txt>
            </View>
            <Row wrap>
              <Button small label={t('sync.keepMine')} onPress={() => { store.resolveConflict(c.key, 'local'); showToast({ message: t('toast.saved') }); }} />
              <Button small variant="secondary" label={t('sync.keepServer')} onPress={() => { store.resolveConflict(c.key, 'remote'); showToast({ message: t('toast.saved') }); }} />
            </Row>
          </Card>
        ))
      )}
      {failed.length ? (
        <Button
          variant="secondary"
          label={t('common.retry')}
          onPress={() => {
            for (const f of failed) store.updateOutbox({ ...f, status: 'pending', attempts: 0, next_attempt_at: new Date().toISOString() });
            void syncNow(true);
          }}
        />
      ) : null}
    </Screen>
  );
}
