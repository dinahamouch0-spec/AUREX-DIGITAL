import { router } from 'expo-router';
import React, { useState } from 'react';

import { isValidTimezone } from '@/state/settings';
import { useApp } from '@/state/AppContext';
import { FieldShell, Input, SelectField } from '@/ui/fields';
import { Chip, IconName, ListItem, Icon, Row, Screen, SectionHeader } from '@/ui/primitives';

export default function SettingsScreen() {
  const { t, settings, updateSettings } = useApp();
  const [tz, setTz] = useState(settings.timezone);
  const [name, setName] = useState(settings.displayName);
  const tzError = tz && !isValidTimezone(tz) ? 'invalid' : undefined;
  const links: [string, string, IconName][] = [
    ['set.prayer', '/settings/prayer', 'moon-outline'],
    ['set.notifications', '/settings/notifications', 'notifications-outline'],
    ['set.ai', '/settings/ai', 'sparkles-outline'],
    ['set.sync', '/settings/sync', 'cloud-outline'],
    ['set.data', '/settings/data', 'download-outline'],
    ['set.diagnostics', '/settings/diagnostics', 'construct-outline'],
    ['set.about', '/settings/about', 'information-circle-outline'],
  ];
  return (
    <Screen title={t('set.title')} testID="screen-settings">
      <SectionHeader title={t('set.profile')} />
      <FieldShell label={t('set.displayName')}>
        <Input value={name} onChangeText={setName} onBlur={() => updateSettings({ displayName: name.trim() })} accessibilityLabel={t('set.displayName')} testID="set-name" />
      </FieldShell>
      <FieldShell label={t('set.language')}>
        <Row wrap>
          <Chip label="العربية" selected={settings.locale === 'ar'} onPress={() => updateSettings({ locale: 'ar' })} testID="set-lang-ar" />
          <Chip label="English" selected={settings.locale === 'en'} onPress={() => updateSettings({ locale: 'en' })} testID="set-lang-en" />
        </Row>
      </FieldShell>
      <FieldShell label={t('set.theme')}>
        <Row wrap>
          {(['dark', 'light', 'system'] as const).map((m) => (
            <Chip key={m} label={t(`set.theme.${m}`)} selected={settings.theme === m} onPress={() => updateSettings({ theme: m })} testID={`set-theme-${m}`} />
          ))}
        </Row>
      </FieldShell>
      <FieldShell label={t('set.numerals')}>
        <Row wrap>
          {(['latn', 'arab'] as const).map((m) => (
            <Chip key={m} label={t(`set.numerals.${m}`)} selected={settings.numerals === m} onPress={() => updateSettings({ numerals: m })} />
          ))}
        </Row>
      </FieldShell>
      <FieldShell label={t('set.timezone')} error={tzError ? 'invalid' : undefined} hint={tzError ? t('set.timezoneInvalid') : 'Asia/Beirut'}>
        <Input value={tz} onChangeText={setTz} autoCapitalize="none" onBlur={() => isValidTimezone(tz) && updateSettings({ timezone: tz })} accessibilityLabel={t('set.timezone')} invalid={!!tzError} />
      </FieldShell>
      <SelectField
        label={t('set.weekStart')}
        value={String(settings.weekStart)}
        required
        options={[6, 0, 1].map((d) => ({ value: String(d), label: t(`weekday.${d}`) }))}
        onChange={(v) => v != null && updateSettings({ weekStart: Number(v) })}
      />
      <SectionHeader title={t('set.privacy')} />
      {links.map(([k, href, icon]) => (
        <ListItem key={href} title={t(k)} left={<Icon name={icon} />} onPress={() => router.push(href as never)} testID={`set-link-${href.split('/').pop()}`} />
      ))}
    </Screen>
  );
}
