import React, { useState } from 'react';

import { isTimeOfDay } from '@/domain/dates';
import { parseNumberInput } from '@/domain/formValues';
import { useApp } from '@/state/AppContext';
import { BooleanField, TextField } from '@/ui/fields';
import { Button, Notice, Screen, SectionHeader, Txt } from '@/ui/primitives';

export default function NotificationSettings() {
  const { t, settings, updateSettings, permission, requestNotificationPermission, rescheduleNotifications, showToast } = useApp();
  const n = settings.notifications;
  const set = (patch: Partial<typeof n>) => updateSettings({ notifications: { ...n, ...patch } });
  const [followUp, setFollowUp] = useState(n.prayerFollowUpMinutes ? String(n.prayerFollowUpMinutes) : '');
  const [qs, setQs] = useState(n.quietStart ?? '');
  const [qe, setQe] = useState(n.quietEnd ?? '');
  const [rt, setRt] = useState(n.reviewTime);
  const fuParsed = parseNumberInput(followUp);
  const fuError = fuParsed === 'invalid' || (typeof fuParsed === 'number' && (fuParsed < 5 || fuParsed > 240)) ? 'invalid' : undefined;
  return (
    <Screen title={t('set.notifications')} testID="screen-notification-settings">
      <Notice tone={permission === 'granted' ? 'success' : permission === 'denied' ? 'warning' : 'info'} text={t(`notif.permission.${permission}`)} />
      {permission === 'undetermined' ? <Button label={t('notif.request')} onPress={requestNotificationPermission} icon="notifications-outline" /> : null}
      <BooleanField label={t('setn.enabled')} value={n.enabled} onChange={(v) => set({ enabled: v })} testID="setn-enabled" />
      <BooleanField label={t('setn.prayerAlerts')} value={n.prayerAlerts} onChange={(v) => set({ prayerAlerts: v })} />
      <Txt variant="caption" color="textMuted">
        {t('deen.combinedNote')}
      </Txt>
      <TextField
        label={t('setn.followUp')}
        value={followUp}
        onChange={(v) => {
          setFollowUp(v);
          const p = parseNumberInput(v);
          if (p === null) set({ prayerFollowUpMinutes: null });
          else if (typeof p === 'number' && p >= 5 && p <= 240) set({ prayerFollowUpMinutes: Math.round(p) });
        }}
        error={fuError}
        keyboardType="number-pad"
      />
      <SectionHeader title={t('setn.quiet')} />
      <TextField label={t('setn.quietStart')} value={qs} onChange={(v) => { setQs(v); if (!v || isTimeOfDay(v)) set({ quietStart: v || null }); }} error={qs && !isTimeOfDay(qs) ? 'invalid_date' : undefined} placeholder="23:00" />
      <TextField label={t('setn.quietEnd')} value={qe} onChange={(v) => { setQe(v); if (!v || isTimeOfDay(v)) set({ quietEnd: v || null }); }} error={qe && !isTimeOfDay(qe) ? 'invalid_date' : undefined} placeholder="06:30" />
      <SectionHeader title={t('setn.channels')} />
      {(['deen', 'fitness', 'academics', 'business', 'habits', 'general', 'system'] as const).map((c) => (
        <BooleanField key={c} label={t(`domain.${c}`)} value={n.channels[c]} onChange={(v) => set({ channels: { ...n.channels, [c]: v } })} />
      ))}
      <SectionHeader title={t('setn.reviews')} />
      <BooleanField label={t('setn.daily')} value={n.dailyReview} onChange={(v) => set({ dailyReview: v })} />
      <TextField label={t('setn.time')} value={rt} onChange={(v) => { setRt(v); if (isTimeOfDay(v)) set({ reviewTime: v }); }} error={!isTimeOfDay(rt) ? 'invalid_date' : undefined} />
      <Button
        variant="secondary"
        icon="refresh"
        label={t('setn.reschedule')}
        onPress={async () => {
          const count = await rescheduleNotifications();
          showToast({ message: t('setn.scheduled', { n: count }) });
        }}
      />
      <Txt variant="caption" color="textMuted">
        {t('notif.limitations')}
      </Txt>
    </Screen>
  );
}
