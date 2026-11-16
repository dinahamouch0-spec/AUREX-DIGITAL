/**
 * Astronomical prayer-time calculation.
 *
 * Algorithm: the widely used PrayTimes.org formulation (Hamid Zarrabi-Zadeh),
 * re-implemented here. Default parameters follow its "Jafari" preset
 * (Fajr 16°, Maghrib 4° below horizon, Isha 14°, Jafari midnight).
 *
 * IMPORTANT: these are calculated estimates. Lebanese communities and
 * marjaʿ offices publish calendars that may differ by several minutes.
 * Every parameter and a per-prayer minute adjustment are user-configurable,
 * and the UI must show the calculation source. Verify against the user's
 * chosen authority before relying on it (blueprint 05 §3, 10 §8).
 */

import { LocalDate, parseLocalDate } from './dates';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerType = (typeof PRAYERS)[number];

export interface PrayerCalcSettings {
  latitude: number;
  longitude: number;
  elevationM: number;
  locationLabel: string;
  fajrAngle: number;
  ishaAngle: number;
  /** Maghrib as degrees below horizon (Jafari) — null means at sunset. */
  maghribAngle: number | null;
  /** Shadow factor for Asr: 1 = standard (majority incl. Jaʿfari tables), 2 = Hanafi. */
  asrFactor: 1 | 2;
  /** Per-time manual adjustments in minutes. */
  adjustments: Partial<Record<PrayerTimeKey, number>>;
}

export type PrayerTimeKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'sunset' | 'maghrib' | 'isha' | 'midnight';

export const DEFAULT_PRAYER_SETTINGS: PrayerCalcSettings = {
  latitude: 33.8938,
  longitude: 35.5018,
  elevationM: 0,
  locationLabel: 'Beirut, Lebanon',
  fajrAngle: 16,
  ishaAngle: 14,
  maghribAngle: 4,
  asrFactor: 1,
  adjustments: {},
};

export const CALCULATION_SOURCE =
  'PrayTimes.org algorithm, Jaʿfari parameters (Fajr 16°, Maghrib 4°, Isha 14°), computed on device';

// ---- trigonometry in degrees ----
const dtr = (d: number) => (d * Math.PI) / 180;
const rtd = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(dtr(d));
const cos = (d: number) => Math.cos(dtr(d));
const tan = (d: number) => Math.tan(dtr(d));
const arcsin = (x: number) => rtd(Math.asin(x));
const arccos = (x: number) => rtd(Math.acos(x));
const arctan2 = (y: number, x: number) => rtd(Math.atan2(y, x));
const arccot = (x: number) => rtd(Math.atan(1 / x));
const fix = (a: number, b: number) => {
  const r = a - b * Math.floor(a / b);
  return r < 0 ? r + b : r;
};
const fixAngle = (a: number) => fix(a, 360);
const fixHour = (a: number) => fix(a, 24);

function julian(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixHour(arctan2(cos(e) * sin(L), cos(L)) / 15);
  return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - RA };
}

export interface PrayerTimesResult {
  date: LocalDate;
  /** UTC instants as ISO strings; null if not computable (extreme latitudes). */
  times: Record<PrayerTimeKey, string | null>;
  source: string;
}

/**
 * Compute prayer times for a local date. Times are returned as UTC instants,
 * so display only needs the user's timezone (DST handled by Intl).
 */
export function computePrayerTimes(date: LocalDate, s: PrayerCalcSettings): PrayerTimesResult {
  const { y, m, d } = parseLocalDate(date);
  const lat = s.latitude;
  const lng = s.longitude;
  const jDate = julian(y, m, d) - lng / (15 * 24);

  const midDay = (t: number) => fixHour(12 - sunPosition(jDate + t).equation);
  const sunAngleTime = (angle: number, t: number, ccw: boolean) => {
    const decl = sunPosition(jDate + t).declination;
    const noon = midDay(t);
    const v = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    if (v < -1 || v > 1) return NaN;
    const diff = arccos(v) / 15;
    return noon + (ccw ? -diff : diff);
  };
  const asrTime = (factor: number, t: number) => {
    const decl = sunPosition(jDate + t).declination;
    const angle = -arccot(factor + tan(Math.abs(lat - decl)));
    return sunAngleTime(angle, t, false);
  };
  const riseSet = 0.833 + 0.0347 * Math.sqrt(Math.max(0, s.elevationM));

  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    const p = {
      fajr: t.fajr / 24,
      sunrise: t.sunrise / 24,
      dhuhr: t.dhuhr / 24,
      asr: t.asr / 24,
      sunset: t.sunset / 24,
      maghrib: t.maghrib / 24,
      isha: t.isha / 24,
    };
    t = {
      fajr: sunAngleTime(s.fajrAngle, p.fajr, true),
      sunrise: sunAngleTime(riseSet, p.sunrise, true),
      dhuhr: midDay(p.dhuhr),
      asr: asrTime(s.asrFactor, p.asr),
      sunset: sunAngleTime(riseSet, p.sunset, false),
      maghrib: s.maghribAngle == null ? NaN : sunAngleTime(s.maghribAngle, p.maghrib, false),
      isha: sunAngleTime(s.ishaAngle, p.isha, false),
    };
    if (s.maghribAngle == null) t.maghrib = t.sunset;
  }

  // Night-middle fallback for high latitudes where an angle is never reached.
  const night = 24 - (t.sunset - t.sunrise);
  if (Number.isNaN(t.fajr)) t.fajr = t.sunrise - night / 2;
  if (Number.isNaN(t.isha)) t.isha = t.sunset + night / 2;
  if (Number.isNaN(t.maghrib)) t.maghrib = t.sunset;

  // Jaʿfari midnight: halfway between sunset and (next) Fajr.
  const midnight = t.sunset + fixHour(t.fajr - t.sunset) / 2;

  // Convert local-solar hours to UTC hours.
  const toUtcHours = (h: number) => h - lng / 15;
  const base = Date.UTC(y, m - 1, d);
  const iso = (key: PrayerTimeKey, h: number): string | null => {
    if (!Number.isFinite(h)) return null;
    const adj = s.adjustments[key] ?? 0;
    const ms = base + toUtcHours(h) * 3600000 + adj * 60000;
    // Round to the nearest minute.
    return new Date(Math.round(ms / 60000) * 60000).toISOString();
  };

  return {
    date,
    source: CALCULATION_SOURCE,
    times: {
      fajr: iso('fajr', t.fajr),
      sunrise: iso('sunrise', t.sunrise),
      dhuhr: iso('dhuhr', t.dhuhr),
      asr: iso('asr', t.asr),
      sunset: iso('sunset', t.sunset),
      maghrib: iso('maghrib', t.maghrib),
      isha: iso('isha', t.isha),
      midnight: iso('midnight', midnight),
    },
  };
}

/**
 * Alert groups. The user combines Dhuhr+Asr and Maghrib+Isha, so alerts are
 * grouped — but each prayer keeps its own record (see deen.ts).
 */
export const PRAYER_ALERT_GROUPS: { id: 'fajr' | 'dhuhr_asr' | 'maghrib_isha'; prayers: PrayerType[]; at: PrayerType }[] = [
  { id: 'fajr', prayers: ['fajr'], at: 'fajr' },
  { id: 'dhuhr_asr', prayers: ['dhuhr', 'asr'], at: 'dhuhr' },
  { id: 'maghrib_isha', prayers: ['maghrib', 'isha'], at: 'maghrib' },
];
