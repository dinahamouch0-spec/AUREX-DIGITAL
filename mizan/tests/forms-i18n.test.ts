import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { formToRecord, parseNumberInput, recordToForm } from '../src/domain/formValues';
import { inQuietHours, planNotifications } from '../src/domain/notificationPlan';
import { DEFAULT_PRAYER_SETTINGS } from '../src/domain/prayerTimes';
import { agendaForDay, buildExport, generateInsights, searchRecords } from '../src/domain/aggregate';
import { COLLECTION_DOMAIN, CollectionName } from '../src/domain/types';
import { ar } from '../src/i18n/ar';
import { en } from '../src/i18n/en';
import { translate } from '../src/i18n';

const ctx = { timeZone: 'Asia/Beirut' };

describe('form conversion', () => {
  it('parses Arabic-Indic digits and comma decimals', () => {
    expect(parseNumberInput('٧٢٫٥')).toBe(72.5);
    expect(parseNumberInput('72,5')).toBe(72.5);
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('abc')).toBe('invalid');
  });

  it('converts money using the record currency and rejects ambiguity', () => {
    const ok = formToRecord('transactions', { direction: 'income', status: 'cleared', currency: 'USD', amount_minor: '12.50', occurred_on: '2026-11-16' }, ctx);
    expect(ok.errors).toEqual({});
    expect(ok.values.amount_minor).toBe(1250);
    const lbp = formToRecord('transactions', { direction: 'income', status: 'cleared', currency: 'LBP', amount_minor: '12.50', occurred_on: '2026-11-16' }, ctx);
    expect(lbp.errors.amount_minor).toBe('too_many_decimals');
  });

  it('interprets date-times in the user timezone and round-trips', () => {
    const r = formToRecord('calendar_events', { title: 'Meeting', domain: 'business', starts_at: '2026-07-01 10:00', ends_at: '2026-07-01 09:00', all_day: false }, ctx);
    expect(r.values.starts_at).toBe('2026-07-01T07:00:00.000Z');
    expect(r.errors.ends_at).toBe('before_start');
    const back = recordToForm('calendar_events', { ...r.values, ends_at: null }, ctx);
    expect(back.starts_at).toBe('2026-07-01 10:00');
  });

  it('reports required fields', () => {
    const r = formToRecord('tasks', { title: '  ', domain: 'general', status: 'not_started', priority: 'low' }, ctx);
    expect(r.errors.title).toBe('required');
  });
});

describe('notification planning', () => {
  const base = {
    now: new Date('2026-11-16T00:00:00Z'),
    today: '2026-11-16',
    timeZone: 'Asia/Beirut',
    days: 1,
    prayer: DEFAULT_PRAYER_SETTINGS,
    prayerFollowUpMinutes: null,
    prayerLogs: [],
    reminders: [],
    quietStart: '23:00',
    quietEnd: '06:30',
    channels: {},
    reviews: { daily: false, weekly: false, monthly: false, time: '20:30' },
    max: 60,
  };
  it('schedules three grouped prayer alerts per day with combined wording', () => {
    const plan = planNotifications(base);
    expect(plan.map((p) => p.titleKey)).toEqual(['notif.prayerFajr', 'notif.prayerDhuhrAsr', 'notif.prayerMaghribIsha']);
  });
  it('adds follow-ups only for groups not fully recorded', () => {
    const logs = [
      { id: '1', created_at: '', updated_at: '', prayer_type: 'dhuhr' as const, local_date: '2026-11-16', status: 'performed' as const },
      { id: '2', created_at: '', updated_at: '', prayer_type: 'asr' as const, local_date: '2026-11-16', status: 'performed' as const },
    ];
    const plan = planNotifications({ ...base, prayerFollowUpMinutes: 30, prayerLogs: logs });
    const fu = plan.filter((p) => p.id.startsWith('prayer-followup')).map((p) => p.id);
    expect(fu).toEqual(['prayer-followup:2026-11-16:fajr', 'prayer-followup:2026-11-16:maghrib_isha']);
  });
  it('respects quiet hours for ordinary reminders, including across midnight', () => {
    expect(inQuietHours('2026-11-16T22:30:00Z', 'Asia/Beirut', '23:00', '06:30')).toBe(true); // 00:30 local
    expect(inQuietHours('2026-11-16T10:00:00Z', 'Asia/Beirut', '23:00', '06:30')).toBe(false);
    const plan = planNotifications({
      ...base,
      prayer: null,
      reminders: [
        { id: 'r1', created_at: '', updated_at: '', domain: 'general', title: 'night', scheduled_at: '2026-11-16T22:30:00Z', recurrence: 'none', status: 'active' },
        { id: 'r2', created_at: '', updated_at: '', domain: 'general', title: 'day', scheduled_at: '2026-11-16T10:00:00Z', recurrence: 'none', status: 'active' },
      ],
    });
    expect(plan.map((p) => p.title)).toEqual(['day']);
  });
});

describe('aggregates', () => {
  const data: Partial<Record<CollectionName, unknown[]>> = {
    tasks: [{ id: 't1', created_at: '', updated_at: '', domain: 'general', title: 'Buy notebook', status: 'not_started', priority: 'low', due_at: '2026-11-16T08:00:00Z' }],
    calendar_events: [
      { id: 'e1', created_at: '', updated_at: '', domain: 'business', title: 'A', starts_at: '2026-11-16T08:00:00Z', ends_at: '2026-11-16T09:00:00Z', all_day: false },
      { id: 'e2', created_at: '', updated_at: '', domain: 'general', title: 'B', starts_at: '2026-11-16T08:30:00Z', ends_at: '2026-11-16T09:30:00Z', all_day: false },
    ],
    clients: [{ id: 'c1', created_at: '', updated_at: '', name: 'Nour Co', status: 'lead', follow_up_on: '2026-11-15', phone: '+961' }],
  };
  const list = ((c: CollectionName) => (data[c] ?? []) as never[]) as never;
  it('builds a day agenda from source records with conflicts flagged', () => {
    const items = agendaForDay(list, '2026-11-16', { timeZone: 'Asia/Beirut', prayer: DEFAULT_PRAYER_SETTINGS });
    expect(items.filter((i) => i.prayer)).toHaveLength(5);
    expect(items.find((i) => i.key === 'event:e1')?.conflict).toBe(true);
    expect(items.find((i) => i.key === 'task:t1')?.source).toEqual({ collection: 'tasks', id: 't1' });
  });
  it('generates insights only for allowed domains', () => {
    const c = { today: '2026-11-16', now: new Date('2026-11-16T10:00:00Z'), timeZone: 'Asia/Beirut', weekStart: 1 };
    expect(generateInsights(list, { ...c, allowedDomains: ['business'] }).map((i) => i.id)).toEqual(['followups']);
    expect(generateInsights(list, { ...c, allowedDomains: [] })).toEqual([]);
  });
  it('searches text fields across domains', () => {
    expect(searchRecords(list, 'nour', (c) => COLLECTION_DOMAIN[c]).map((r) => r.id)).toEqual(['c1']);
    expect(searchRecords(list, 'nour', (c) => COLLECTION_DOMAIN[c], ['deen'])).toEqual([]);
  });
  it('exports with conventions and without local-only fields', () => {
    const exp = buildExport(list, { timeZone: 'Asia/Beirut', locale: 'ar', appVersion: '1.0.0', exportedAt: '2026-11-16T00:00:00Z' });
    expect(exp.schema_version).toBe(1);
    expect(exp.timezone).toBe('Asia/Beirut');
    expect(exp.records.tasks).toHaveLength(1);
  });
});

describe('i18n', () => {
  it('Arabic and English have identical keys', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });
  it('interpolates and localises numerals', () => {
    expect(translate('en', 'home.prayersRecorded', { n: 3 })).toBe('3 of 5 prayers recorded');
    expect(translate('ar', 'home.prayersRecorded', { n: 3 }, 'arab')).toContain('٣');
  });
  it('every t("…") key used in the source exists', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|ts)$/.test(f)) files.push(p);
      }
    };
    walk(join(__dirname, '..', 'src'));
    const missing = new Set<string>();
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) if (!(m[1] in en)) missing.add(`${m[1]} (${f.split('src')[1]})`);
    }
    expect([...missing]).toEqual([]);
  });
});

describe('numerals', () => {
  it('normalises digits inside templates to the chosen numeral system', () => {
    expect(translate('ar', 'deen.recordedCount', { n: 2 }, 'latn')).toBe('2/5 مسجّلة');
    expect(translate('ar', 'deen.recordedCount', { n: 2 }, 'arab')).toBe('٢/٥ مسجّلة');
  });
});
