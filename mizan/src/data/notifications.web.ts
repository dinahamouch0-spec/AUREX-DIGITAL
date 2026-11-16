/** Web build: device notifications are not supported; reminders stay in-app. */
import type { PlannedNotification } from '../domain/notificationPlan';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';
export function initNotificationHandler() {}
export async function getPermission(): Promise<PermissionState> {
  return 'unsupported';
}
export async function requestPermission(): Promise<PermissionState> {
  return 'unsupported';
}
export async function applyPlan(_plan: PlannedNotification[], _t: (key: string) => string): Promise<number> {
  return 0;
}
export const notificationsSupported = false;
