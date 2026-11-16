/**
 * Converts between user-entered form strings and typed record values.
 * Money is parsed with the record's own currency (never guessed); dates and
 * times are interpreted in the user's timezone.
 */
import { isLocalDate, isTimeOfDay, localDateOf, localTimeOf, zonedToUtc } from './dates';
import { CurrencyCode, MoneyError, isCurrency, minorToDecimalString, parseMoney } from './money';
import { FieldErrors, FieldSpec, SCHEMAS, defaultsFor, validateRecord } from './schema';
import type { CollectionName } from './types';

export type FormRaw = string | boolean | number[] | null | Record<string, unknown>;
export type FormState = Record<string, FormRaw>;

const ARABIC_DIGITS = /[٠-٩]/g;
const toLatinDigits = (s: string) => s.replace(ARABIC_DIGITS, (c) => String(c.charCodeAt(0) - 0x0660));

export function parseNumberInput(s: string): number | null | 'invalid' {
  const cleaned = toLatinDigits(s.trim()).replace(/٫/g, '.').replace(/,/g, '.');
  if (cleaned === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return 'invalid';
  return Number(cleaned);
}

export interface FormContext {
  timeZone: string;
  /** resolves currency for money fields whose currencyField starts with '@' */
  currencyFor?: (field: FieldSpec, values: FormState) => CurrencyCode | null;
}

function currencyOf(field: FieldSpec, state: FormState, ctx: FormContext): CurrencyCode | null {
  if (!field.currencyField) return null;
  if (field.currencyField.startsWith('@')) return ctx.currencyFor?.(field, state) ?? null;
  const c = state[field.currencyField];
  return isCurrency(c) ? c : null;
}

export function recordToForm(collection: CollectionName, record: Record<string, unknown> | null, ctx: FormContext): FormState {
  const src = record ?? defaultsFor(collection);
  const out: FormState = {};
  for (const f of SCHEMAS[collection].fields) {
    const v = src[f.name];
    switch (f.type) {
      case 'text':
      case 'multiline':
      case 'date':
        out[f.name] = v == null ? '' : String(v);
        break;
      case 'number':
      case 'integer':
        out[f.name] = v == null ? '' : String(v);
        break;
      case 'rating':
        out[f.name] = v == null ? null : String(v);
        break;
      case 'money': {
        const cur = currencyOf(f, src as FormState, ctx);
        out[f.name] = v == null || !cur ? (v == null ? '' : String(v)) : minorToDecimalString(v as number, cur);
        break;
      }
      case 'datetime':
        out[f.name] = typeof v === 'string' && v ? `${localDateOf(v, ctx.timeZone)} ${localTimeOf(v, ctx.timeZone)}` : '';
        break;
      case 'boolean':
        out[f.name] = Boolean(v);
        break;
      case 'weekdays':
        out[f.name] = Array.isArray(v) ? (v as number[]) : [];
        break;
      case 'select':
      case 'ref':
        out[f.name] = v == null ? null : String(v);
        break;
      case 'json':
        out[f.name] = (v as Record<string, unknown>) ?? {};
        break;
    }
  }
  return out;
}

export function formToRecord(
  collection: CollectionName,
  state: FormState,
  ctx: FormContext,
): { values: Record<string, unknown>; errors: FieldErrors } {
  const values: Record<string, unknown> = {};
  const errors: FieldErrors = {};
  for (const f of SCHEMAS[collection].fields) {
    const raw = state[f.name];
    switch (f.type) {
      case 'text':
      case 'multiline': {
        const s = typeof raw === 'string' ? raw.trim() : '';
        values[f.name] = s === '' ? null : s;
        break;
      }
      case 'date': {
        const s = typeof raw === 'string' ? toLatinDigits(raw.trim()) : '';
        values[f.name] = s === '' ? null : s;
        break;
      }
      case 'number':
      case 'integer':
      case 'rating': {
        const n = typeof raw === 'string' ? parseNumberInput(raw) : raw == null ? null : 'invalid';
        if (n === 'invalid') errors[f.name] = 'invalid_number';
        else values[f.name] = n;
        break;
      }
      case 'money': {
        const s = typeof raw === 'string' ? raw.trim() : '';
        if (s === '') {
          values[f.name] = null;
          break;
        }
        const cur = currencyOf(f, state, ctx);
        if (!cur) {
          errors[f.name] = 'invalid_amount';
          break;
        }
        try {
          values[f.name] = parseMoney(s, cur);
        } catch (e) {
          errors[f.name] = e instanceof MoneyError ? e.message : 'invalid_amount';
        }
        break;
      }
      case 'datetime': {
        const s = typeof raw === 'string' ? toLatinDigits(raw.trim()) : '';
        if (s === '') {
          values[f.name] = null;
          break;
        }
        const [d, tm = ''] = s.split(/\s+/);
        if (!isLocalDate(d) || !isTimeOfDay(tm)) errors[f.name] = 'invalid_date';
        else values[f.name] = zonedToUtc(d, tm, ctx.timeZone).toISOString();
        break;
      }
      case 'boolean':
        values[f.name] = Boolean(raw);
        break;
      case 'weekdays':
        values[f.name] = Array.isArray(raw) && raw.length > 0 ? raw : null;
        break;
      case 'select':
      case 'ref':
        values[f.name] = raw == null || raw === '' ? null : raw;
        break;
      case 'json':
        values[f.name] = raw ?? {};
        break;
    }
  }
  const schemaErrors = validateRecord(collection, values);
  for (const [k, v] of Object.entries(schemaErrors)) if (!errors[k]) errors[k] = v;
  return { values, errors };
}
