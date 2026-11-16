import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { todayLocal } from '../domain/dates';
import { planNotifications } from '../domain/notificationPlan';
import { CollectionMap, CollectionName, COLLECTION_DOMAIN } from '../domain/types';
import { createPlatformDriver } from '../data/drivers/platform';
import * as notif from '../data/notifications';
import { Store } from '../data/store';
import { getSupabase, isBackendConfigured, SupabaseRemote } from '../data/supabase';
import { SyncEngine, SyncResult } from '../data/sync';
import { Formatters, Locale, TParams, makeFormatters, translate } from '../i18n';
import { DEFAULT_SETTINGS, Settings, mergeSettings } from './settings';

// One store per app process.
export const store = new Store(createPlatformDriver(), { uuid: () => Crypto.randomUUID() });

export interface ToastSpec {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
}

export interface ConfirmSpec {
  title: string;
  body?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** user must type this exact text to enable confirm */
  requireText?: string;
}

interface AppContextValue {
  ready: boolean;
  loadError: string | null;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  t: (key: string, params?: TParams) => string;
  fmt: Formatters;
  locale: Locale;
  rtl: boolean;
  today: string;
  now: () => Date;
  // backend / sync
  backendConfigured: boolean;
  session: Session | null;
  syncing: boolean;
  lastSync: SyncResult | null;
  syncNow: (force?: boolean) => Promise<void>;
  // notifications
  permission: notif.PermissionState;
  requestNotificationPermission: () => Promise<void>;
  rescheduleNotifications: () => Promise<number>;
  // UI feedback
  toast: ToastSpec | null;
  showToast: (t: ToastSpec) => void;
  hideToast: () => void;
  confirmSpec: ConfirmSpec | null;
  confirm: (spec: ConfirmSpec) => Promise<boolean>;
  resolveConfirm: (ok: boolean) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [permission, setPermission] = useState<notif.PermissionState>('undetermined');
  const [toast, setToast] = useState<ToastSpec | null>(null);
  const [confirmSpec, setConfirmSpec] = useState<ConfirmSpec | null>(null);
  const confirmResolver = useRef<((ok: boolean) => void) | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clock, setClock] = useState(() => Date.now());

  // Load local data
  useEffect(() => {
    store
      .load()
      .then(() => {
        setSettings(mergeSettings(store.getMetaJSON<Partial<Settings> | null>('settings', null)));
        setLastSync(store.getMetaJSON<SyncResult | null>('sync:last_result', null));
        setReady(true);
      })
      .catch((e) => setLoadError(String(e?.message ?? e)));
    notif.initNotificationHandler();
    notif.getPermission().then(setPermission);
  }, []);

  // Keep "today" fresh across midnight / app resume.
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 60000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setClock(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      store.setMetaJSON('settings', next);
      return next;
    });
  }, []);

  const locale = settings.locale;
  const rtl = locale === 'ar';
  const t = useCallback((key: string, params?: TParams) => translate(locale, key, params, settings.numerals), [locale, settings.numerals]);
  const fmt = useMemo(() => makeFormatters(locale, settings.numerals, settings.timezone), [locale, settings.numerals, settings.timezone]);
  const today = useMemo(() => todayLocal(settings.timezone, new Date(clock)), [settings.timezone, clock]);

  // Web: document direction and language for screen readers.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
  }, [rtl, locale]);

  // Auth session (only when a backend is configured)
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const engine = useMemo(() => {
    const sb = getSupabase();
    if (!sb || !session) return null;
    return new SyncEngine(store, new SupabaseRemote(sb), session.user.id);
  }, [session]);

  const syncNow = useCallback(
    async (force = false) => {
      if (!engine || engine.isRunning) return;
      setSyncing(true);
      try {
        setLastSync(await engine.syncNow({ force }));
      } finally {
        setSyncing(false);
      }
    },
    [engine],
  );

  // Auto-sync: on sign-in, on resume, and shortly after local changes.
  const version = useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  useEffect(() => {
    if (!engine) return;
    const id = setTimeout(() => {
      if (store.pendingOutbox().some((o) => o.status === 'pending')) void syncNow();
    }, 3000);
    return () => clearTimeout(id);
  }, [engine, version, syncNow]);
  useEffect(() => {
    if (!engine) return;
    void syncNow();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncNow();
    });
    return () => sub.remove();
  }, [engine, syncNow]);

  const rescheduleNotifications = useCallback(async () => {
    if (!notif.notificationsSupported) return 0;
    const n = settings.notifications;
    if (!n.enabled || permission !== 'granted') return notif.applyPlan([], (k) => translate(locale, k));
    const plan = planNotifications({
      now: new Date(),
      today,
      timeZone: settings.timezone,
      days: 7,
      prayer: n.prayerAlerts ? settings.prayer : null,
      prayerFollowUpMinutes: n.prayerFollowUpMinutes,
      prayerLogs: store.list('prayer_logs'),
      reminders: store.list('reminders'),
      quietStart: n.quietStart,
      quietEnd: n.quietEnd,
      channels: n.channels,
      reviews: { daily: n.dailyReview, weekly: n.weeklyReview, monthly: n.monthlyReview, time: n.reviewTime },
      max: 60, // iOS keeps at most 64 pending local notifications
    });
    return notif.applyPlan(plan, (k) => translate(locale, k));
  }, [settings, permission, today, locale]);

  // Re-plan when prayer logs/reminders/settings change (debounced).
  const prayerLogs = useSyncExternalStore(store.subscribe, () => store.list('prayer_logs'));
  const reminders = useSyncExternalStore(store.subscribe, () => store.list('reminders'));
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => void rescheduleNotifications().catch(() => undefined), 1500);
    return () => clearTimeout(id);
  }, [ready, rescheduleNotifications, prayerLogs, reminders]);

  const requestNotificationPermission = useCallback(async () => {
    setPermission(await notif.requestPermission());
  }, []);

  // In-app notification centre: create a notification when a reminder comes due.
  useEffect(() => {
    if (!ready) return;
    const nowIso = new Date(clock).toISOString();
    for (const r of store.list('reminders')) {
      if (r.status !== 'active' || r.scheduled_at > nowIso) continue;
      const dedupe = `reminder:${r.id}:${r.scheduled_at}`;
      if (store.list('notifications').some((n) => n.dedupe_key === dedupe)) continue;
      store.insert('notifications', { domain: r.domain, title: r.title, priority: 'medium', dedupe_key: dedupe }, { skipValidation: true });
      if (r.recurrence === 'none') store.update('reminders', r.id, { status: 'done' });
      else {
        const step = r.recurrence === 'daily' ? 86400000 : 7 * 86400000;
        let next = new Date(r.scheduled_at).getTime();
        while (new Date(next).toISOString() <= nowIso) next += step;
        store.update('reminders', r.id, { scheduled_at: new Date(next).toISOString() });
      }
    }
  }, [ready, clock, reminders]);

  const showToast = useCallback((spec: ToastSpec) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(spec);
    toastTimer.current = setTimeout(() => setToast(null), spec.onAction ? 6000 : 3000);
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  const confirm = useCallback((spec: ConfirmSpec) => {
    setConfirmSpec(spec);
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);
  const resolveConfirm = useCallback((ok: boolean) => {
    confirmResolver.current?.(ok);
    confirmResolver.current = null;
    setConfirmSpec(null);
  }, []);

  const value: AppContextValue = {
    ready,
    loadError,
    settings,
    updateSettings,
    t,
    fmt,
    locale,
    rtl,
    today,
    now: () => new Date(),
    backendConfigured: isBackendConfigured,
    session,
    syncing,
    lastSync,
    syncNow,
    permission,
    requestNotificationPermission,
    rescheduleNotifications,
    toast,
    showToast,
    hideToast,
    confirmSpec,
    confirm,
    resolveConfirm,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

/** Live, non-deleted records of a collection. */
export function useCollection<C extends CollectionName>(c: C): CollectionMap[C][] {
  return useSyncExternalStore(
    store.subscribe,
    () => store.list(c),
    () => store.list(c),
  );
}

export function useRecord<C extends CollectionName>(c: C, id: string | null | undefined): CollectionMap[C] | undefined {
  const list = useCollection(c);
  return useMemo(() => (id ? list.find((r) => r.id === id) : undefined), [list, id]);
}

/** Re-render on any store change (outbox, conflicts, meta). */
export function useStoreVersion(): number {
  return useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
}

export const domainOf = (c: CollectionName) => COLLECTION_DOMAIN[c];
