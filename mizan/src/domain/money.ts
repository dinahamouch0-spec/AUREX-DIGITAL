/**
 * Decimal-safe money. Amounts are stored as integer minor units with an
 * explicit ISO currency code. Unlike currencies are never added together.
 *
 * Decision (docs/DECISIONS.md): USD uses 2 minor digits (cents). LBP is
 * recorded in whole pounds (0 minor digits) because sub-pound amounts are not
 * used in practice.
 */

export type CurrencyCode = 'USD' | 'LBP';

export const CURRENCIES: Record<CurrencyCode, { exponent: number; symbol: string }> = {
  USD: { exponent: 2, symbol: '$' },
  LBP: { exponent: 0, symbol: 'ل.ل' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in CURRENCIES;
}

export class MoneyError extends Error {}

/**
 * Parse a user-entered decimal string into integer minor units.
 * Accepts "1,234.56", "1234.5", "  12 ". Rejects more decimals than the
 * currency allows (no silent rounding), negatives, and unsafe magnitudes.
 */
export function parseMoney(input: string, currency: CurrencyCode): number {
  const { exponent } = CURRENCIES[currency];
  const cleaned = input.replace(/[,\s_]/g, '').replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  if (!/^\d+(\.\d+)?$/.test(cleaned)) throw new MoneyError('invalid_amount');
  const [whole, frac = ''] = cleaned.split('.');
  if (frac.length > exponent) throw new MoneyError('too_many_decimals');
  const minorStr = whole + frac.padEnd(exponent, '0');
  const minor = Number(minorStr.replace(/^0+(?=\d)/, ''));
  if (!Number.isSafeInteger(minor)) throw new MoneyError('amount_too_large');
  return minor;
}

/** Plain decimal string for an amount, e.g. 123456 USD -> "1234.56". */
export function minorToDecimalString(minor: number, currency: CurrencyCode): string {
  const { exponent } = CURRENCIES[currency];
  const neg = minor < 0;
  const abs = Math.abs(minor);
  if (exponent === 0) return `${neg ? '-' : ''}${abs}`;
  const s = String(abs).padStart(exponent + 1, '0');
  return `${neg ? '-' : ''}${s.slice(0, -exponent)}.${s.slice(-exponent)}`;
}

export function formatMoney(minor: number, currency: CurrencyCode, locale = 'en'): string {
  const { exponent } = CURRENCIES[currency];
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LB' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(minor / 10 ** exponent);
  } catch {
    return `${minorToDecimalString(minor, currency)} ${currency}`;
  }
}

export type CurrencyTotals = Partial<Record<CurrencyCode, number>>;

export function addToTotals(totals: CurrencyTotals, currency: CurrencyCode, minor: number): CurrencyTotals {
  const next = (totals[currency] ?? 0) + minor;
  if (!Number.isSafeInteger(next)) throw new MoneyError('amount_too_large');
  totals[currency] = next;
  return totals;
}

export function sumByCurrency<T>(items: T[], get: (item: T) => { currency: CurrencyCode; minor: number }): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const item of items) {
    const { currency, minor } = get(item);
    addToTotals(totals, currency, minor);
  }
  return totals;
}

/**
 * Convert between currencies only with an explicitly supplied, timestamped
 * rate (units of `to` per 1 unit of `from`). Rounds half away from zero.
 */
export function convert(
  minor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rate: { value: number; asOf: string },
): { minor: number; rate: number; asOf: string } {
  if (!(rate.value > 0) || !rate.asOf) throw new MoneyError('rate_required');
  const major = minor / 10 ** CURRENCIES[from].exponent;
  const converted = major * rate.value * 10 ** CURRENCIES[to].exponent;
  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return { minor: rounded, rate: rate.value, asOf: rate.asOf };
}
