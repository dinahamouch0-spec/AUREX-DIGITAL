import { DEFAULT_TIMEZONE } from '../domain/dates';
import { DEFAULT_PRAYER_SETTINGS, PrayerCalcSettings } from '../domain/prayerTimes';
import { NO_TARGETS, NutritionTargets } from '../domain/nutrition';
import type { Domain } from '../domain/types';
import type { Locale, Numerals } from '../i18n';

/**
 * Device-local preferences (stored in the local meta table).
 * Decision: preferences are per-device in v1; records sync, preferences do not.
 */
export interface Settings {
  onboarded: boolean;
  displayName: string;
  locale: Locale;
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  weekStart: number;
  numerals: Numerals;
  prayer: PrayerCalcSettings & { confirmed: boolean };
  notifications: {
    enabled: boolean;
    prayerAlerts: boolean;
    prayerFollowUpMinutes: number | null;
    quietStart: string | null;
    quietEnd: string | null;
    channels: Record<Domain | 'system', boolean>;
    dailyReview: boolean;
    weeklyReview: boolean;
    monthlyReview: boolean;
    reviewTime: string;
  };
  ai: { enabled: boolean; domains: Record<Domain, boolean> };
  /** optional daily nutrition targets set by the user (none by default) */
  nutrition: NutritionTargets;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  displayName: '',
  locale: 'ar',
  theme: 'dark',
  timezone: DEFAULT_TIMEZONE,
  weekStart: 1,
  numerals: 'latn',
  prayer: { ...DEFAULT_PRAYER_SETTINGS, confirmed: false },
  notifications: {
    enabled: false,
    prayerAlerts: true,
    prayerFollowUpMinutes: null,
    quietStart: '23:00',
    quietEnd: '06:30',
    channels: { deen: true, fitness: true, academics: true, business: true, habits: true, general: true, system: true },
    dailyReview: false,
    weeklyReview: false,
    monthlyReview: false,
    reviewTime: '20:30',
  },
  ai: { enabled: true, domains: { deen: false, fitness: true, academics: true, business: true, habits: true, general: true } },
  nutrition: NO_TARGETS,
};

export function mergeSettings(stored: Partial<Settings> | null): Settings {
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    prayer: { ...DEFAULT_SETTINGS.prayer, ...(stored.prayer ?? {}) },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(stored.notifications ?? {}),
      channels: { ...DEFAULT_SETTINGS.notifications.channels, ...(stored.notifications?.channels ?? {}) },
    },
    ai: { ...DEFAULT_SETTINGS.ai, ...(stored.ai ?? {}), domains: { ...DEFAULT_SETTINGS.ai.domains, ...(stored.ai?.domains ?? {}) } },
    nutrition: { ...NO_TARGETS, ...(stored.nutrition ?? {}) },
  };
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
