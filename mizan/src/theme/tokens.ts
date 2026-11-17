/**
 * Semantic design tokens (blueprint 04 §2). Components never hardcode
 * colours: they read from the active palette.
 * Gold is an accent for emphasis and focus, not a background for body text.
 * Contrast targets: text/textSecondary on background/surface ≥ 4.5:1.
 */
export interface Palette {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  border: string;
  divider: string;
  focus: string;
  overlay: string;
  /** metallic gold ramp, for gradients and highlights */
  goldLight: string;
  goldDeep: string;
  /** soft glow behind hero elements */
  glow: string;
  /** card gradient (top → bottom) */
  cardFrom: string;
  cardTo: string;
}

export const dark: Palette = {
  background: '#08080A',
  surface: '#131316',
  surfaceElevated: '#1E1E22',
  text: '#F5F3EE',
  textSecondary: '#C9C5BC',
  textMuted: '#9A968E',
  accent: '#D4AF37',
  accentMuted: '#3A3220',
  onAccent: '#14110A',
  success: '#5FC48A',
  warning: '#E6B450',
  danger: '#F07167',
  info: '#6CB4EE',
  border: '#2C2922',
  divider: '#211F1A',
  focus: '#E9C863',
  overlay: 'rgba(0,0,0,0.6)',
  goldLight: '#F4DC8E',
  goldDeep: '#9C7A1C',
  glow: 'rgba(212,175,55,0.22)',
  cardFrom: '#18181C',
  cardTo: '#111114',
};

export const light: Palette = {
  background: '#FAF8F3',
  surface: '#FFFFFF',
  surfaceElevated: '#F2EEE4',
  text: '#16140F',
  textSecondary: '#4A463D',
  textMuted: '#6B665B',
  accent: '#8C6A12',
  accentMuted: '#F1E6C6',
  onAccent: '#FFFFFF',
  success: '#1E7A46',
  warning: '#8A5A00',
  danger: '#B3261E',
  info: '#1F5F99',
  border: '#E2DCCD',
  divider: '#ECE7DB',
  focus: '#8C6A12',
  overlay: 'rgba(0,0,0,0.35)',
  goldLight: '#C9A43C',
  goldDeep: '#6E520C',
  glow: 'rgba(140,106,18,0.14)',
  cardFrom: '#FFFFFF',
  cardTo: '#FBF8F1',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

/** Type scale; sizes scale with the OS font size (allowFontScaling). */
export const type = {
  hero: { fontSize: 40, lineHeight: 46, fontWeight: '800' as const, letterSpacing: -0.5 },
  display: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
};

export const MIN_TOUCH = 44;
export const MAX_CONTENT_WIDTH = 760;

export const DOMAIN_COLORS = {
  deen: '#5FC48A',
  fitness: '#F07167',
  academics: '#6CB4EE',
  business: '#D4AF37',
  habits: '#B18CF0',
  general: '#9A968E',
} as const;

export const NAMED_COLORS: Record<string, string> = {
  gold: '#D4AF37',
  blue: '#6CB4EE',
  green: '#5FC48A',
  red: '#F07167',
  purple: '#B18CF0',
  gray: '#9A968E',
};

/**
 * Each life domain has its own visual character: an accent and a hero gradient.
 * Colours are not used to rank domains, and progress is never merged into one score.
 */
export const DOMAIN_THEME = {
  deen: { accent: '#4CC38A', from: '#1B5E40', to: '#0A1A13', icon: 'moon' },
  fitness: { accent: '#FF7A45', from: '#7A2E12', to: '#1A0B06', icon: 'barbell' },
  nutrition: { accent: '#F2B441', from: '#6B4A0E', to: '#191106', icon: 'nutrition' },
  academics: { accent: '#5EA4F2', from: '#173F73', to: '#08121F', icon: 'school' },
  business: { accent: '#D4AF37', from: '#5C4710', to: '#141006', icon: 'briefcase' },
  habits: { accent: '#A98BF5', from: '#3E2A78', to: '#100A1F', icon: 'repeat' },
  general: { accent: '#D4AF37', from: '#3A2E0B', to: '#0E0C06', icon: 'sparkles' },
} as const;
export type DomainThemeKey = keyof typeof DOMAIN_THEME;
