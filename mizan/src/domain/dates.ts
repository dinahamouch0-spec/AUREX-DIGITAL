/**
 * Date/time utilities.
 *
 * Conventions (see docs/DECISIONS.md):
 * - Instants are ISO-8601 UTC strings (e.g. "2026-11-16T09:30:00.000Z").
 * - Calendar days are local-date strings "YYYY-MM-DD" in the user's timezone.
 * - The user's timezone is an IANA identifier, default "Asia/Beirut".
 */

export const DEFAULT_TIMEZONE = 'Asia/Beirut';

export type LocalDate = string; // YYYY-MM-DD

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string') return false;
  const m = LOCAL_DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isTimeOfDay(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function parseLocalDate(d: LocalDate): { y: number; m: number; d: number } {
  const m = LOCAL_DATE_RE.exec(d);
  if (!m) throw new Error(`Invalid local date: ${d}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

export function toLocalDateString(y: number, m: number, d: number): LocalDate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatterCache.set(timeZone, f);
  }
  return f;
}

export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (Beirut summer = +180). */
export function timezoneOffsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const truncated = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - truncated) / 60000);
}

/** The local calendar date of an instant in a timezone. */
export function localDateOf(instant: Date | string, timeZone: string): LocalDate {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  const p = zonedParts(d, timeZone);
  return toLocalDateString(p.year, p.month, p.day);
}

/** Local "HH:mm" of an instant in a timezone. */
export function localTimeOf(instant: Date | string, timeZone: string): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  const p = zonedParts(d, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Convert a wall-clock local date + time in `timeZone` into a UTC instant.
 * Handles DST: for a non-existent local time (spring-forward gap) the result
 * is shifted forward by the gap; for an ambiguous time the earlier instant wins.
 */
export function zonedToUtc(date: LocalDate, time: string, timeZone: string): Date {
  const { y, m, d } = parseLocalDate(date);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const o1 = timezoneOffsetMinutes(new Date(guess), timeZone);
  const c1 = guess - o1 * 60000;
  const o2 = timezoneOffsetMinutes(new Date(c1), timeZone);
  const c2 = guess - o2 * 60000;
  const o3 = timezoneOffsetMinutes(new Date(guess - 86400000), timeZone);
  const o4 = timezoneOffsetMinutes(new Date(guess + 86400000), timeZone);
  const candidates = [...new Set([c1, c2, guess - o3 * 60000, guess - o4 * 60000])];
  const label = `${date} ${time}`;
  const matching = candidates.filter(
    (c) => `${localDateOf(new Date(c), timeZone)} ${localTimeOf(new Date(c), timeZone)}` === label,
  );
  if (matching.length > 0) return new Date(Math.min(...matching)); // ambiguous -> earlier
  return new Date(Math.max(...candidates)); // DST gap -> shifted forward
}

export function todayLocal(timeZone: string, now: Date = new Date()): LocalDate {
  return localDateOf(now, timeZone);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const { y, m, d } = parseLocalDate(date);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return toLocalDateString(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: LocalDate): number {
  const { y, m, d } = parseLocalDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive list of dates from `from` to `to`. */
export function dateRange(from: LocalDate, to: LocalDate): LocalDate[] {
  const n = daysBetween(from, to);
  const out: LocalDate[] = [];
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

/** Start of the week containing `date`; weekStart 0=Sunday, 1=Monday, 6=Saturday. */
export function startOfWeek(date: LocalDate, weekStart: number): LocalDate {
  const diff = (weekdayOf(date) - weekStart + 7) % 7;
  return addDays(date, -diff);
}

export function startOfMonth(date: LocalDate): LocalDate {
  const { y, m } = parseLocalDate(date);
  return toLocalDateString(y, m, 1);
}

export function endOfMonth(date: LocalDate): LocalDate {
  const { y, m } = parseLocalDate(date);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return toLocalDateString(y, m, last);
}

export function addMonths(date: LocalDate, months: number): LocalDate {
  const { y, m, d } = parseLocalDate(date);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const ny = first.getUTCFullYear();
  const nm = first.getUTCMonth() + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return toLocalDateString(ny, nm, Math.min(d, last));
}

/** UTC instant range [start, end) covering a local date in a timezone. */
export function localDayBounds(date: LocalDate, timeZone: string): { start: Date; end: Date } {
  return { start: zonedToUtc(date, '00:00', timeZone), end: zonedToUtc(addDays(date, 1), '00:00', timeZone) };
}

export function isInstantOnLocalDate(instant: string | null | undefined, date: LocalDate, timeZone: string): boolean {
  if (!instant) return false;
  return localDateOf(instant, timeZone) === date;
}

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}
