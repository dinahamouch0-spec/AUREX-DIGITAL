import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  dateRange,
  isLocalDate,
  localDateOf,
  localTimeOf,
  startOfWeek,
  timezoneOffsetMinutes,
  zonedToUtc,
} from '../src/domain/dates';
import { MoneyError, convert, formatMoney, minorToDecimalString, parseMoney, sumByCurrency } from '../src/domain/money';
import { DEFAULT_PRAYER_SETTINGS, computePrayerTimes } from '../src/domain/prayerTimes';
import { dayPrayerSummary, prayerStatusFor } from '../src/domain/deen';
import { averageGrades, gradeTrend, isAssignmentOverdue, workloadByDay } from '../src/domain/academics';
import { financialSummary, invoiceBalance, pipelineSummary, winRate } from '../src/domain/business';
import { completedThisWeek, habitDayStatus, habitSummary } from '../src/domain/habits';
import { lbToKg, nutritionTotals, overloadSuggestion, personalRecords, trainingVolumeKg } from '../src/domain/fitness';
import { goalProgress } from '../src/domain/goals';
import type { Assignment, Deal, Goal, Grade, Habit, HabitLog, Invoice, InvoicePayment, PrayerLog, Transaction, WorkoutSet } from '../src/domain/types';

const base = { created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const TZ = 'Asia/Beirut';

describe('dates', () => {
  it('validates local dates', () => {
    expect(isLocalDate('2026-02-28')).toBe(true);
    expect(isLocalDate('2026-02-30')).toBe(false);
    expect(isLocalDate('2026-2-3')).toBe(false);
  });

  it('maps instants to Beirut local dates across midnight', () => {
    // 22:30 UTC in winter is 00:30 next day in Beirut (UTC+2)
    expect(localDateOf('2026-01-10T22:30:00Z', TZ)).toBe('2026-01-11');
    expect(localTimeOf('2026-01-10T22:30:00Z', TZ)).toBe('00:30');
  });

  it('knows Beirut offsets in winter and summer', () => {
    expect(timezoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), TZ)).toBe(120);
    expect(timezoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), TZ)).toBe(180);
  });

  it('round-trips wall-clock time through zonedToUtc', () => {
    const d = zonedToUtc('2026-07-15', '09:15', TZ);
    expect(d.toISOString()).toBe('2026-07-15T06:15:00.000Z');
    expect(localTimeOf(d, TZ)).toBe('09:15');
  });

  it('handles the DST gap and overlap without throwing', () => {
    // Lebanon springs forward at 00:00 on the last Sunday of March (2026-03-29).
    const gap = zonedToUtc('2026-03-29', '00:30', TZ);
    expect(localDateOf(gap, TZ)).toBe('2026-03-29');
    expect(localTimeOf(gap, TZ)).toBe('01:30');
    // Falls back at 00:00 on the last Sunday of October (2026-10-25): 23:30 on the 24th happens twice.
    const amb = zonedToUtc('2026-10-24', '23:30', TZ);
    expect(localTimeOf(amb, TZ)).toBe('23:30');
    expect(amb.toISOString()).toBe('2026-10-24T20:30:00.000Z');
  });

  it('does calendar arithmetic', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(dateRange('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(startOfWeek('2026-11-18', 1)).toBe('2026-11-16'); // Wednesday -> Monday
    expect(startOfWeek('2026-11-18', 0)).toBe('2026-11-15'); // -> Sunday
  });
});

describe('money', () => {
  it('parses decimals into minor units without float errors', () => {
    expect(parseMoney('0.1', 'USD') + parseMoney('0.2', 'USD')).toBe(30);
    expect(parseMoney('1,234.56', 'USD')).toBe(123456);
    expect(parseMoney('١٢٣', 'USD')).toBe(12300);
    expect(parseMoney('90000', 'LBP')).toBe(90000);
  });
  it('rejects ambiguous input instead of rounding', () => {
    expect(() => parseMoney('1.234', 'USD')).toThrow(MoneyError);
    expect(() => parseMoney('10.5', 'LBP')).toThrow(MoneyError);
    expect(() => parseMoney('-5', 'USD')).toThrow(MoneyError);
    expect(() => parseMoney('abc', 'USD')).toThrow(MoneyError);
  });
  it('formats and keeps currencies separate', () => {
    expect(minorToDecimalString(5, 'USD')).toBe('0.05');
    expect(minorToDecimalString(-12345, 'USD')).toBe('-123.45');
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56');
    const totals = sumByCurrency(
      [
        { c: 'USD' as const, m: 100 },
        { c: 'LBP' as const, m: 900000 },
        { c: 'USD' as const, m: 50 },
      ],
      (x) => ({ currency: x.c, minor: x.m }),
    );
    expect(totals).toEqual({ USD: 150, LBP: 900000 });
  });
  it('converts only with an explicit rate', () => {
    expect(() => convert(100, 'USD', 'LBP', { value: 0, asOf: '' })).toThrow();
    expect(convert(150, 'USD', 'LBP', { value: 89500, asOf: '2026-11-16' }).minor).toBe(134250);
  });
});

describe('prayer times (Jaʿfari defaults, Beirut)', () => {
  const r = computePrayerTimes('2026-11-16', DEFAULT_PRAYER_SETTINGS);
  const t = (k: keyof typeof r.times) => new Date(r.times[k] as string).getTime();
  it('produces all times in chronological order', () => {
    for (const k of Object.keys(r.times)) expect(r.times[k as keyof typeof r.times]).not.toBeNull();
    expect(t('fajr')).toBeLessThan(t('sunrise'));
    expect(t('sunrise')).toBeLessThan(t('dhuhr'));
    expect(t('dhuhr')).toBeLessThan(t('asr'));
    expect(t('asr')).toBeLessThan(t('sunset'));
    expect(t('sunset')).toBeLessThan(t('maghrib'));
    expect(t('maghrib')).toBeLessThan(t('isha'));
  });
  it('is astronomically plausible for Beirut in mid-November', () => {
    // Solar noon in Beirut mid-Nov is ≈ 11:24 local (09:24 UTC).
    const noon = localTimeOf(r.times.dhuhr as string, TZ);
    expect(noon >= '11:15' && noon <= '11:35').toBe(true);
    const sunrise = localTimeOf(r.times.sunrise as string, TZ);
    expect(sunrise >= '06:10' && sunrise <= '06:30').toBe(true);
    // Jaʿfari maghrib (4°) comes ~15–20 min after sunset.
    const gap = (t('maghrib') - t('sunset')) / 60000;
    expect(gap).toBeGreaterThan(10);
    expect(gap).toBeLessThan(25);
  });
  it('applies manual adjustments', () => {
    const adj = computePrayerTimes('2026-11-16', { ...DEFAULT_PRAYER_SETTINGS, adjustments: { fajr: 5 } });
    expect((new Date(adj.times.fajr as string).getTime() - t('fajr')) / 60000).toBe(5);
  });
});

describe('deen', () => {
  const logs: PrayerLog[] = [
    { ...base, id: '1', prayer_type: 'fajr', local_date: '2026-11-16', status: 'performed' },
    { ...base, id: '2', prayer_type: 'dhuhr', local_date: '2026-11-16', status: 'missed' },
  ];
  it('treats absent logs as not recorded, never missed', () => {
    expect(prayerStatusFor(logs, '2026-11-16', 'asr')).toBe('not_recorded');
    const s = dayPrayerSummary(logs, '2026-11-16');
    expect(s).toMatchObject({ performed: 1, missed: 1, notRecorded: 3 });
  });
  it('keeps each prayer independent', () => {
    expect(prayerStatusFor(logs, '2026-11-16', 'dhuhr')).toBe('missed');
    expect(prayerStatusFor(logs, '2026-11-16', 'asr')).toBe('not_recorded');
  });
  it('ignores tombstoned logs (correction = delete)', () => {
    const corrected = [{ ...logs[0], deleted_at: '2026-11-16T10:00:00Z' }];
    expect(prayerStatusFor(corrected, '2026-11-16', 'fajr')).toBe('not_recorded');
  });
});

describe('academics', () => {
  const g = (score: number, max: number, weight?: number, at = '2026-10-01'): Grade => ({
    ...base,
    id: `${score}-${at}`,
    subject_id: 's',
    title: 't',
    score,
    max_score: max,
    weight: weight ?? null,
    recorded_at: at,
  });
  it('uses a weighted mean when all weights are known', () => {
    const r = averageGrades([g(80, 100, 1), g(18, 20, 3)]);
    expect(r?.method).toBe('weighted');
    expect(r?.percent).toBeCloseTo((80 + 90 * 3) / 4);
  });
  it('falls back to a labelled simple mean when weights are incomplete', () => {
    const r = averageGrades([g(80, 100, 2), g(18, 20)]);
    expect(r?.method).toBe('simple_weights_incomplete');
    expect(r?.percent).toBeCloseTo(85);
  });
  it('returns null with no grades and withholds trends below 3 grades', () => {
    expect(averageGrades([])).toBeNull();
    expect(gradeTrend([g(1, 2), g(2, 2)])).toBeNull();
    expect(gradeTrend([g(50, 100, undefined, '1'), g(60, 100, undefined, '2'), g(70, 100, undefined, '3')])?.direction).toBe('up');
  });
  it('detects overdue open assignments only', () => {
    const a: Assignment = { ...base, id: 'a', subject_id: 's', title: 'x', due_at: '2026-11-15T10:00:00Z', status: 'in_progress', priority: 'medium' };
    expect(isAssignmentOverdue(a, new Date('2026-11-16T00:00:00Z'))).toBe(true);
    expect(isAssignmentOverdue({ ...a, status: 'completed' }, new Date('2026-11-16T00:00:00Z'))).toBe(false);
    const w = workloadByDay([{ ...a, due_at: '2026-11-17T08:00:00Z', estimate_minutes: 45 }], '2026-11-16', 3, TZ);
    expect(w[1]).toMatchObject({ date: '2026-11-17', count: 1, minutes: 45 });
  });
});

describe('business finance', () => {
  const today = '2026-11-16';
  const inv: Invoice = { ...base, id: 'i1', invoice_number: 'A-1', amount_minor: 100000, currency: 'USD', issued_on: '2026-11-01', due_on: '2026-11-10', status: 'sent' };
  const pay = (amt: number, id = 'p' + amt): InvoicePayment => ({ ...base, id, invoice_id: 'i1', amount_minor: amt, paid_on: '2026-11-05' });

  it('tracks partial payments and overdue status', () => {
    expect(invoiceBalance(inv, [pay(40000)], today)).toMatchObject({ paid: 40000, outstanding: 60000, status: 'overdue' });
    expect(invoiceBalance({ ...inv, due_on: '2026-12-01' }, [pay(40000)], today).status).toBe('partially_paid');
    expect(invoiceBalance(inv, [pay(40000), pay(60000, 'x')], today)).toMatchObject({ outstanding: 0, status: 'paid' });
    expect(invoiceBalance(inv, [pay(120000)], today).status).toBe('overpaid');
    expect(invoiceBalance({ ...inv, status: 'void' }, [], today).outstanding).toBe(0);
  });

  it('summarises per currency and never mixes USD with LBP', () => {
    const tx = (p: Partial<Transaction>): Transaction => ({ ...base, id: Math.random().toString(), direction: 'income', amount_minor: 0, currency: 'USD', occurred_on: '2026-11-02', status: 'cleared', ...p });
    const s = financialSummary(
      {
        transactions: [
          tx({ amount_minor: 5000 }),
          tx({ amount_minor: 2000000, currency: 'LBP' }),
          tx({ direction: 'expense', amount_minor: 1500 }),
          tx({ direction: 'refund_issued', amount_minor: 500 }),
          tx({ direction: 'refund_received', amount_minor: 200 }),
          tx({ direction: 'expense', amount_minor: 999, status: 'pending' }),
          tx({ amount_minor: 7777, status: 'planned' }),
          tx({ amount_minor: 1, occurred_on: '2025-01-01' }), // out of range
        ],
        invoices: [inv],
        payments: [pay(40000)],
      },
      { from: '2026-11-01', to: '2026-11-30', today },
    );
    expect(s.cashReceived).toEqual({ USD: 5000 - 500 + 40000, LBP: 2000000 });
    expect(s.expensesPaid).toEqual({ USD: 1500 - 200 });
    expect(s.netCash).toEqual({ USD: 44500 - 1300, LBP: 2000000 });
    expect(s.receivables).toEqual({ USD: 60000 });
    expect(s.unpaidLiabilities).toEqual({ USD: 999 });
    expect(s.plannedIncome).toEqual({ USD: 7777 });
  });

  it('weights pipeline only where probability is set', () => {
    const d = (p: Partial<Deal>): Deal => ({ ...base, id: Math.random().toString(), title: 'd', stage: 'proposal', value_minor: 10000, currency: 'USD', ...p });
    const s = pipelineSummary([d({ probability: 50 }), d({}), d({ stage: 'won' }), d({ stage: 'lost' })]);
    expect(s.weighted).toEqual({ USD: 5000 });
    expect(s.unweightedOpenCount).toBe(1);
    expect(s.wonValue).toEqual({ USD: 10000 });
    expect(winRate([d({ stage: 'won' })])).toBeNull();
  });
});

describe('habits', () => {
  const habit: Habit = { ...base, id: 'h', name: 'Read', schedule_type: 'weekdays', schedule_days: [1, 3], status: 'active', sort_order: 0 };
  const log = (date: string, status: HabitLog['status']): HabitLog => ({ ...base, id: date, habit_id: 'h', local_date: date, status, logged_at: base.created_at });
  it('distinguishes not scheduled, not recorded and logged', () => {
    expect(habitDayStatus(habit, [], '2026-11-17')).toBe('not_scheduled'); // Tuesday
    expect(habitDayStatus(habit, [], '2026-11-16')).toBe('not_recorded'); // Monday
    expect(habitDayStatus(habit, [log('2026-11-16', 'partial')], '2026-11-16')).toBe('partial');
  });
  it('summarises without counting unrecorded days as failures', () => {
    const s = habitSummary(habit, [log('2026-11-16', 'completed')], '2026-11-16', '2026-11-22');
    expect(s.scheduledDays).toBe(2);
    expect(s.counts).toMatchObject({ completed: 1, not_recorded: 1 });
    expect(s.completionOfRecorded).toBe(1);
  });
  it('counts weekly targets', () => {
    const tpw: Habit = { ...habit, schedule_type: 'times_per_week', times_per_week: 2 };
    const logs = [log('2026-11-16', 'completed'), log('2026-11-18', 'completed')];
    expect(completedThisWeek(tpw, logs, '2026-11-19')).toBe(2);
    expect(habitSummary(tpw, logs, '2026-11-16', '2026-11-22').weeksOnTarget).toEqual({ reached: 1, weeks: 1 });
  });
});

describe('fitness', () => {
  const set = (p: Partial<WorkoutSet>): WorkoutSet => ({ ...base, id: Math.random().toString(), workout_id: 'w', exercise_id: 'bench', set_number: 1, reps: 8, load_value: 50, load_unit: 'kg', ...p });
  it('computes volume with unit conversion', () => {
    expect(lbToKg(100)).toBeCloseTo(45.359, 3);
    expect(trainingVolumeKg([set({}), set({ load_value: 100, load_unit: 'lb', reps: 1 })])).toBeCloseTo(400 + 45.359, 2);
  });
  it('tracks personal records', () => {
    const pr = personalRecords([set({ load_value: 60, reps: 5 }), set({ load_value: 50, reps: 12 })]).get('bench');
    expect(pr?.heaviestKg).toBe(60);
    expect(pr?.mostReps).toBe(12);
  });
  it('labels estimated / missing nutrition', () => {
    const t = nutritionTotals([
      { ...base, id: '1', meal_id: 'm', quantity: 1, calories: 200, source: 'estimate' },
      { ...base, id: '2', meal_id: 'm', quantity: 1, calories: null, source: 'package_label' },
    ]);
    expect(t).toMatchObject({ calories: 200, itemsMissingData: 1, estimatedItems: 1, items: 2 });
  });
  it('withholds overload suggestions without enough history', () => {
    expect(overloadSuggestion([[set({})]], 8)).toBeNull();
    expect(overloadSuggestion([[set({})], [set({ reps: 10 })]], 8)?.suggestIncrease).toBe(true);
  });
});

describe('goals', () => {
  const goal: Goal = { ...base, id: 'g', domain: 'academics', title: 'x', status: 'in_progress' };
  it('measures by metric, milestones, or not at all', () => {
    expect(goalProgress({ ...goal, metric_current: 30, metric_target: 60 }, []).ratio).toBe(0.5);
    expect(goalProgress(goal, [{ ...base, id: 'm', goal_id: 'g', title: 'a', status: 'completed', sort_order: 0 }, { ...base, id: 'n', goal_id: 'g', title: 'b', status: 'not_started', sort_order: 1 }])).toMatchObject({ ratio: 0.5, basis: 'milestones' });
    expect(goalProgress(goal, []).ratio).toBeNull();
  });
});
