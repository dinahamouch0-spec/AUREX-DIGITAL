/**
 * Typography: IBM Plex Sans Arabic for all text (Arabic + Latin, one voice in both
 * languages) and Sora for large display numbers. Both are SIL OFL fonts shipped with
 * the app (no network at runtime once bundled).
 *
 * Custom fonts are switched on only after they have loaded; until then (or if loading
 * fails) the system font is used with normal weights, so text is never invisible.
 */
import { type } from './tokens';

export type Weight = '400' | '500' | '600' | '700' | '800';

const PLEX: Record<Weight, string> = {
  '400': 'IBMPlexSansArabic_400Regular',
  '500': 'IBMPlexSansArabic_500Medium',
  '600': 'IBMPlexSansArabic_600SemiBold',
  '700': 'IBMPlexSansArabic_700Bold',
  '800': 'IBMPlexSansArabic_700Bold',
};
const SORA: Record<Weight, string> = {
  '400': 'Sora_600SemiBold',
  '500': 'Sora_600SemiBold',
  '600': 'Sora_600SemiBold',
  '700': 'Sora_700Bold',
  '800': 'Sora_800ExtraBold',
};

let enabled = false;

export function customFontsEnabled() {
  return enabled;
}

/** Called once by the root layout after the fonts finished loading. */
export function enableCustomFonts() {
  if (enabled) return;
  enabled = true;
  const t = type as unknown as Record<string, { fontWeight?: Weight; fontFamily?: string }>;
  for (const k of Object.keys(t)) {
    const w = (t[k].fontWeight ?? '400') as Weight;
    t[k] = { ...t[k], fontFamily: PLEX[w] };
    delete t[k].fontWeight;
  }
}

/** Text weight that works with or without the custom fonts. */
export const fw = (w: Weight) => (enabled ? { fontFamily: PLEX[w] } : { fontWeight: w });

/** Display numerals (big stats, timers). */
export const num = (w: Weight = '700') => (enabled ? { fontFamily: SORA[w], letterSpacing: -0.5 } : { fontWeight: w });
