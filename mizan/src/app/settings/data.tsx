import { router } from 'expo-router';
import Constants from 'expo-constants';
import React, { useState } from 'react';

import { buildExport } from '@/domain/aggregate';
import { deleteAccount } from '@/data/account';
import { saveTextFile } from '@/data/exportFile';
import { store, useApp, listAll } from '@/state/AppContext';
import { Button, Card, Notice, Screen, SectionHeader, Txt } from '@/ui/primitives';

export default function DataScreen() {
  const { t, settings, today, confirm, showToast, session, backendConfigured, updateSettings } = useApp();
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setBusy(true);
    try {
      const data = buildExport(listAll as never, {
        timeZone: settings.timezone,
        locale: settings.locale,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
        exportedAt: new Date().toISOString(),
      });
      await saveTextFile(`mizan-export-${today}.json`, JSON.stringify(data, null, 2));
      store.setMeta('export:last', new Date().toISOString());
      showToast({ message: t('data.exported') });
    } catch {
      showToast({ message: t('toast.error'), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const wipeLocal = async () => {
    const ok = await confirm({ title: t('data.deleteLocal'), body: t('data.deleteLocalBody'), destructive: true, requireText: 'DELETE', confirmLabel: t('common.delete') });
    if (!ok) return;
    await store.wipe();
    updateSettings({ onboarded: false });
    showToast({ message: t('data.deleted') });
    router.replace('/onboarding');
  };

  const removeAccount = async () => {
    const ok = await confirm({ title: t('data.deleteAccount'), body: t('data.deleteAccountBody'), destructive: true, requireText: 'DELETE', confirmLabel: t('common.delete') });
    if (!ok) return;
    try {
      await deleteAccount();
      router.replace('/onboarding');
    } catch {
      showToast({ message: t('toast.error'), tone: 'error' });
    }
  };

  const last = store.getMeta('export:last');
  return (
    <Screen title={t('set.data')} testID="screen-data">
      <Card>
        <Txt variant="heading">{t('data.export')}</Txt>
        <Txt color="textSecondary">{t('data.exportBody')}</Txt>
        {last ? <Txt variant="caption" color="textMuted">{t('data.lastExport', { time: last.slice(0, 16).replace('T', ' ') })}</Txt> : null}
        <Button label={t('data.export')} icon="download-outline" onPress={exportData} loading={busy} testID="data-export" />
      </Card>
      <SectionHeader title={t('data.backup')} />
      <Notice text={t('data.backupBody')} />
      <SectionHeader title={t('common.delete')} />
      <Card>
        <Txt color="textSecondary">{t('data.deleteLocalBody')}</Txt>
        <Button label={t('data.deleteLocal')} variant="danger" icon="trash-outline" onPress={wipeLocal} testID="data-wipe" />
      </Card>
      {backendConfigured && session ? (
        <Card>
          <Txt color="textSecondary">{t('data.deleteAccountBody')}</Txt>
          <Button label={t('data.deleteAccount')} variant="danger" icon="person-remove-outline" onPress={removeAccount} />
        </Card>
      ) : null}
    </Screen>
  );
}
