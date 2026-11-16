import { LocalDate, parseLocalDate } from '../domain/dates';
import { CurrencyCode, formatMoney } from '../domain/money';
import { ar } from './ar';
import { en, TranslationKey } from './en';

export type Locale = 'ar' | 'en';
export type Numerals = 'latn' | 'arab';
export type { TranslationKey };

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, ar };

export type TParams = Record<string, string | number>;

export function translate(locale: Locale, key: TranslationKey | string, params?: TParams, numerals: Numerals = 'latn'): string {
  const dict = dictionaries[locale] as Record<string, string>;
  let s = dict[key] ?? (en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      const value = typeof v === 'number' ? formatNumber(v, locale, numerals) : v;
      s = s.split(`{${k}}`).join(value);
    }
  }
  return s;
}

export function isRTL(locale: Locale) {
  return locale === 'ar';
}

function intlLocale(locale: Locale, numerals: Numerals) {
  return `${locale === 'ar' ? 'ar-LB' : 'en-GB'}-u-nu-${numerals}`;
}

export function formatNumber(n: number, locale: Locale, numerals: Numerals, opts: Intl.NumberFormatOptions = {}) {
  try {
    return new Intl.NumberFormat(intlLocale(locale, numerals), { maximumFractionDigits: 1, ...opts }).format(n);
  } catch {
    return String(Math.round(n * 10) / 10);
  }
}

export interface Formatters {
  locale: Locale;
  number: (n: number, opts?: Intl.NumberFormatOptions) => string;
  percent: (ratio: number) => string;
  /** instant → localized date */
  date: (iso: string, style?: 'short' | 'medium' | 'long') => string;
  /** LocalDate (YYYY-MM-DD) → localized date */
  localDate: (d: LocalDate, style?: 'short' | 'medium' | 'long' | 'weekday') => string;
  time: (iso: string) => string;
  dateTime: (iso: string) => string;
  money: (minor: number, currency: CurrencyCode) => string;
  weekdayShort: (d: LocalDate) => string;
}

export function makeFormatters(locale: Locale, numerals: Numerals, timeZone: string): Formatters {
  const loc = intlLocale(locale, numerals);
  const safe = (fn: () => string, fallback: string) => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  const dateOpts = (style: 'short' | 'medium' | 'long'): Intl.DateTimeFormatOptions =>
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'medium'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fromLocal = (d: LocalDate) => {
    const { y, m, d: dd } = parseLocalDate(d);
    return new Date(Date.UTC(y, m - 1, dd, 12));
  };
  return {
    locale,
    number: (n, opts) => formatNumber(n, locale, numerals, opts),
    percent: (r) => formatNumber(r * 100, locale, numerals, { maximumFractionDigits: 0 }) + '%',
    date: (iso, style = 'medium') =>
      safe(() => new Intl.DateTimeFormat(loc, { ...dateOpts(style), timeZone }).format(new Date(iso)), iso.slice(0, 10)),
    localDate: (d, style = 'medium') =>
      safe(
        () =>
          new Intl.DateTimeFormat(
            loc,
            style === 'weekday' ? { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' } : { ...dateOpts(style), timeZone: 'UTC' },
          ).format(fromLocal(d)),
        d,
      ),
    time: (iso) => safe(() => new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso)), iso.slice(11, 16)),
    dateTime: (iso) =>
      safe(
        () => new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso)),
        iso,
      ),
    money: (minor, currency) => formatMoney(minor, currency, locale === 'ar' ? 'ar' : 'en'),
    weekdayShort: (d) => safe(() => new Intl.DateTimeFormat(loc, { weekday: 'short', timeZone: 'UTC' }).format(fromLocal(d)), d),
  };
}
