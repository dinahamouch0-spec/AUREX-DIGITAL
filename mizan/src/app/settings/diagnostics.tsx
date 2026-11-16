import Constants from 'expo-constants';
import React from 'react';
import { Platform } from 'react-native';

import { saveTextFile } from '@/data/exportFile';
import { COLLECTIONS } from '@/domain/types';
import { store, useApp, useStoreVersion } from '@/state/AppContext';
import { Button, Card, Notice, Row, Screen, Txt } from '@/ui/primitives';

/** Sanitised technical info only: counts and codes, never record contents. */
export default function Diagnostics() {
  const { t, backendConfigured, session, lastSync, permission, settings } = useApp();
  useStoreVersion();
  const outbox = store.pendingOutbox();
  const info = {
    app_version: Constants.expoConfig?.version ?? 'unknown',
    platform: `${Platform.OS} ${String(Platform.Version)}`,
    backend_configured: backendConfigured,
    signed_in: !!session,
    locale: settings.locale,
    timezone: settings.timezone,
    notification_permission: permission,
    outbox: { pending: outbox.filter((o) => o.status === 'pending').length, failed: outbox.filter((o) => o.status === 'failed').length, conflict: store.listConflicts().length },
    last_sync: lastSync ? { finished_at: lastSync.finishedAt, pushed: lastSync.pushed, pulled: lastSync.pulled, failed: lastSync.failed, error_code: lastSync.errorCode ?? null } : null,
    last_errors: [...new Set(outbox.map((o) => o.last_error).filter(Boolean))],
    record_counts: Object.fromEntries(COLLECTIONS.map((c) => [c, store.list(c).length])),
  };
  return (
    <Screen title={t('diag.title')} testID="screen-diagnostics">
      <Notice text={t('diag.body')} />
      <Card>
        {Object.entries(info)
          .filter(([k]) => k !== 'record_counts')
          .map(([k, v]) => (
            <Row key={k} style={{ justifyContent: 'space-between' }} wrap>
              <Txt variant="caption" color="textSecondary">
                {k}
              </Txt>
              <Txt variant="caption">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Txt>
            </Row>
          ))}
      </Card>
      <Button label={t('diag.copy')} icon="download-outline" variant="secondary" onPress={() => saveTextFile('mizan-diagnostics.json', JSON.stringify(info, null, 2))} />
    </Screen>
  );
}
