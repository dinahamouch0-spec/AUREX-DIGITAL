/**
 * Device notification delivery via expo-notifications (local only).
 * Intent (reminders, settings) is stored separately; if permission is
 * denied, intents remain and the UI explains they can't be delivered.
 * NOT yet verified on a physical iPhone (see docs/LIMITATIONS.md).
 */
import * as Notifications from 'expo-notifications';

import type { PlannedNotification } from '../domain/notificationPlan';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

let handlerSet = false;
export function initNotificationHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function getPermission(): Promise<PermissionState> {
  try {
    const r = await Notifications.getPermissionsAsync();
    return r.granted ? 'granted' : r.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function requestPermission(): Promise<PermissionState> {
  try {
    const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return r.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Replace all MIZAN-scheduled notifications with `plan`. Returns count scheduled. */
export async function applyPlan(plan: PlannedNotification[], translate: (key: string) => string): Promise<number> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing.filter((n) => (n.content.data as { mizan?: boolean } | undefined)?.mizan).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  let count = 0;
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title: p.title ?? translate(p.titleKey),
        body: p.bodyKey ? translate(p.bodyKey) : undefined,
        sound: 'default',
        data: { mizan: true, domain: p.domain },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.at) },
    });
    count++;
  }
  return count;
}

export const notificationsSupported = true;
