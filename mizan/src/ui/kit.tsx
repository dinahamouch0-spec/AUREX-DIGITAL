/**
 * Premium visual kit: gradients, rings, charts, animated press feedback.
 * Everything reads colours from the palette / domain themes and works in Expo Go
 * (react-native-svg, expo-linear-gradient and expo-haptics are bundled in Expo Go).
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { useApp } from '../state/AppContext';
import { DOMAIN_THEME, DomainThemeKey, radius, spacing } from '../theme/tokens';
import { Icon, IconName, Txt } from './primitives';
import { useIsDark, usePalette } from './theme';

const NATIVE = Platform.OS !== 'web';

export function tap(kind: 'light' | 'medium' | 'success' = 'light') {
  if (!NATIVE) return;
  if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  else void Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

// ---------------------------------------------------------------- motion
export function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  contentStyle,
  disabled,
  testID,
  accessibilityLabel,
  accessibilityRole = 'button',
  haptic = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** outer layout (width, flex) */
  style?: StyleProp<ViewStyle>;
  /** inner content layout (alignment, gap) */
  contentStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
  haptic?: boolean;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: NATIVE, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={style}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      onLongPress={onLongPress}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}>
      <Animated.View style={[{ flexGrow: 1 }, contentStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Fade + rise on mount; staggered with `delay`. */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [v, delay]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------- surfaces
export function useDomainTheme(domain: DomainThemeKey) {
  const dark = useIsDark();
  const p = usePalette();
  const d = DOMAIN_THEME[domain];
  return {
    accent: dark ? d.accent : shade(d.accent, -0.35),
    gradient: dark ? ([d.from, d.to] as const) : ([mix(d.accent, p.surface, 0.82), p.surface] as const),
    icon: d.icon as IconName,
  };
}

export function GoldGradient({ children, style, colors }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; colors?: readonly [string, string, ...string[]] }) {
  const p = usePalette();
  return (
    <LinearGradient colors={colors ?? [p.goldLight, p.accent, p.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

/** Large gradient header card with the domain's character. */
export function Hero({
  domain,
  eyebrow,
  title,
  subtitle,
  right,
  children,
  testID,
  titleTestID,
}: {
  domain: DomainThemeKey;
  eyebrow?: string;
  titleTestID?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  testID?: string;
}) {
  const p = usePalette();
  const th = useDomainTheme(domain);
  return (
    <FadeIn>
      <LinearGradient testID={testID} colors={th.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: p.border, gap: spacing.md }}>
        <View pointerEvents="none" style={{ position: 'absolute', end: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: th.accent, opacity: 0.12 }} />
        <View pointerEvents="none" style={{ position: 'absolute', end: 18, top: 16, opacity: 0.18 }}>
          <Icon name={th.icon} size={64} color={th.accent} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            {eyebrow ? (
              <Txt variant="caption" style={{ color: th.accent, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {eyebrow}
              </Txt>
            ) : null}
            <Txt variant="title" accessibilityRole="header" testID={titleTestID}>
              {title}
            </Txt>
            {subtitle ? <Txt color="textSecondary">{subtitle}</Txt> : null}
          </View>
          {right}
        </View>
        {children}
      </LinearGradient>
    </FadeIn>
  );
}

/** Card with a soft vertical gradient and optional accent edge. */
export function GlassCard({ children, style, outerStyle, accent, onPress, testID, accessibilityLabel }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; outerStyle?: StyleProp<ViewStyle>; accent?: string; onPress?: () => void; testID?: string; accessibilityLabel?: string }) {
  const p = usePalette();
  const body = (
    <LinearGradient colors={[p.cardFrom, p.cardTo]} style={[{ borderRadius: radius.md, borderWidth: 1, borderColor: accent ? mixAlpha(accent, 0.45) : p.border, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' }, style]}>
      {accent ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, start: 0, end: 0, height: 2, backgroundColor: accent, opacity: 0.8 }} /> : null}
      {children}
    </LinearGradient>
  );
  if (!onPress) return <View testID={testID} style={outerStyle}>{body}</View>;
  return (
    <PressableScale onPress={onPress} testID={testID} accessibilityLabel={accessibilityLabel} style={outerStyle}>
      {body}
    </PressableScale>
  );
}

// ---------------------------------------------------------------- data viz
export function ProgressRing({
  ratio,
  size = 120,
  stroke = 12,
  color,
  children,
  label,
  testID,
}: {
  ratio: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
  label: string;
  testID?: string;
}) {
  const p = usePalette();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = ratio == null ? 0 : Math.max(0, Math.min(1, ratio));
  const [anim] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setShown(value));
    Animated.timing(anim, { toValue: v, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim, v]);
  const col = color ?? p.accent;
  const gid = `ring-${col.replace('#', '')}`;
  return (
    <View testID={testID} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={ratio == null ? undefined : { min: 0, max: 100, now: Math.round(v * 100) }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={mix(col, '#FFFFFF', 0.35)} />
            <Stop offset="1" stopColor={col} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.surfaceElevated} strokeWidth={stroke} fill="none" />
        {shown > 0.001 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - shown)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

/** Line chart with a gradient area. Accessible via a text summary. */
export function LineChart({ data, height = 140, color, format, testID }: { data: { label: string; value: number | null }[]; height?: number; color?: string; format?: (n: number) => string; testID?: string }) {
  const p = usePalette();
  const { fmt } = useApp();
  const [w, setW] = useState(0);
  const col = color ?? p.accent;
  const pts = data.map((d, i) => ({ ...d, i })).filter((d) => d.value != null) as { label: string; value: number; i: number }[];
  const f = format ?? ((n: number) => fmt.number(Math.round(n * 10) / 10));
  const summary = data.map((d) => `${d.label}: ${d.value == null ? '—' : f(d.value)}`).join(', ');
  const pad = 8;
  let path = '';
  let area = '';
  let coords: { x: number; y: number }[] = [];
  if (w > 0 && pts.length) {
    const min = Math.min(...pts.map((x) => x.value));
    const max = Math.max(...pts.map((x) => x.value));
    const span = max - min || Math.max(1, Math.abs(max) * 0.1);
    const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
    coords = pts.map((x) => ({ x: pad + x.i * step, y: pad + (height - pad * 2) * (1 - (x.value - min) / span) }));
    if (coords.length === 1) coords = [{ x: pad, y: coords[0].y }, { x: w - pad, y: coords[0].y }];
    path = coords.map((c, k) => `${k ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    area = `${path} L${coords[coords.length - 1].x.toFixed(1)} ${height} L${coords[0].x.toFixed(1)} ${height} Z`;
  }
  const gid = `area-${col.replace('#', '')}`;
  return (
    <View testID={testID} accessible accessibilityLabel={summary} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <SvgGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={col} stopOpacity={0.35} />
              <Stop offset="1" stopColor={col} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          {area ? <Path d={area} fill={`url(#${gid})`} /> : null}
          {path ? <Path d={path} stroke={col} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {coords.length && pts.length > 1 ? coords.map((c, k) => <Circle key={k} cx={c.x} cy={c.y} r={3.5} fill={p.background} stroke={col} strokeWidth={2} />) : null}
        </Svg>
      ) : null}
    </View>
  );
}

/** Vertical bars with gold gradient; highlights `highlight` index. */
export function Bars({ data, height = 110, color, highlight, format }: { data: { label: string; value: number }[]; height?: number; color?: string; highlight?: number; format?: (n: number) => string }) {
  const p = usePalette();
  const { fmt } = useApp();
  const top = Math.max(1, ...data.map((d) => d.value));
  const col = color ?? p.accent;
  const f = format ?? ((n: number) => fmt.number(Math.round(n)));
  return (
    <View accessible accessibilityLabel={data.map((d) => `${d.label} ${f(d.value)}`).join(', ')} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 8 }}>
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / top) * (height - 18));
          const on = highlight === i;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              {d.value > 0 ? (
                <Txt variant="caption" color={on ? 'text' : 'textMuted'} style={{ fontSize: 10 }} numberOfLines={1}>
                  {f(d.value)}
                </Txt>
              ) : null}
              {d.value > 0 ? (
                <LinearGradient colors={on ? [p.goldLight, col] : [mix(col, p.background, 0.15), mix(col, p.background, 0.55)]} style={{ width: '62%', height: h, borderRadius: 8 }} />
              ) : (
                <View style={{ width: '62%', height: 4, borderRadius: 2, backgroundColor: p.border }} />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((d, i) => (
          <Txt key={i} variant="caption" color={highlight === i ? 'accent' : 'textMuted'} align="center" style={{ flex: 1, fontSize: 11 }} numberOfLines={1}>
            {d.label}
          </Txt>
        ))}
      </View>
    </View>
  );
}

export const MACRO_COLORS = { protein: '#FF7A6B', carbs: '#5EA4F2', fat: '#F2C14E' } as const;

/** Horizontal progress bar with a label row (used for macros and goals). */
export function MeterRow({ label, value, target, unit, color, testID }: { label: string; value: number; target?: number | null; unit: string; color: string; testID?: string }) {
  const p = usePalette();
  const { fmt } = useApp();
  const ratio = target ? Math.min(1, value / target) : null;
  const over = target != null && target > 0 && value > target;
  return (
    <View style={{ gap: 6 }} testID={testID}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="label">{label}</Txt>
        <Txt variant="label" color={over ? 'warning' : 'textSecondary'}>
          {fmt.number(Math.round(value * 10) / 10)}
          {target ? ` / ${fmt.number(target)}` : ''} {unit}
        </Txt>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: p.surfaceElevated, overflow: 'hidden' }}>
        <View style={{ width: `${(ratio ?? (value > 0 ? 1 : 0)) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color, opacity: ratio == null ? 0.5 : 1 }} />
      </View>
    </View>
  );
}

/** Stacked bar of the calorie split between protein, carbs and fat. */
export function MacroSplitBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const p = usePalette();
  const total = protein + carbs + fat;
  return (
    <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: p.surfaceElevated }}>
      {total > 0 ? (
        <>
          <View style={{ flex: protein, backgroundColor: MACRO_COLORS.protein }} />
          <View style={{ flex: carbs, backgroundColor: MACRO_COLORS.carbs }} />
          <View style={{ flex: fat, backgroundColor: MACRO_COLORS.fat }} />
        </>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- tiles & controls
export function StatTile({ icon, label, value, hint, color, onPress, testID }: { icon: IconName; label: string; value: string; hint?: string; color?: string; onPress?: () => void; testID?: string }) {
  const p = usePalette();
  const col = color ?? p.accent;
  return (
    <GlassCard onPress={onPress} testID={testID} accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minWidth: 100, padding: spacing.md }} outerStyle={{ flex: 1, minWidth: 100 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: mixAlpha(col, 0.16) }}>
        <Icon name={icon} size={18} color={col} />
      </View>
      <Txt variant="heading" numberOfLines={1}>
        {value}
      </Txt>
      <Txt variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Txt>
      {hint ? (
        <Txt variant="caption" color="textMuted" numberOfLines={2}>
          {hint}
        </Txt>
      ) : null}
    </GlassCard>
  );
}

export function QuickAction({ icon, label, onPress, color, testID }: { icon: IconName; label: string; onPress: () => void; color?: string; testID?: string }) {
  const p = usePalette();
  const col = color ?? p.accent;
  return (
    <PressableScale onPress={onPress} testID={testID} accessibilityLabel={label} style={{ width: 76 }} contentStyle={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: mixAlpha(col, 0.14), borderWidth: 1, borderColor: mixAlpha(col, 0.4) }}>
        <Icon name={icon} size={24} color={col} />
      </View>
      <Txt variant="caption" align="center" numberOfLines={2} style={{ fontSize: 12 }}>
        {label}
      </Txt>
    </PressableScale>
  );
}

export function Segmented<T extends string>({ options, value, onChange, labelOf, testIDPrefix }: { options: readonly T[]; value: T; onChange: (v: T) => void; labelOf: (v: T) => string; testIDPrefix?: string }) {
  const p = usePalette();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: p.surfaceElevated, borderRadius: radius.pill, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} testID={testIDPrefix ? `${testIDPrefix}-${o}` : undefined} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o)} style={{ flex: 1, minHeight: 36, borderRadius: radius.pill, overflow: 'hidden' }}>
            {on ? <GoldGradient style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0 }} /> : null}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
              <Txt variant="label" align="center" numberOfLines={1} style={{ color: on ? p.onAccent : p.textSecondary, fontWeight: on ? '700' : '500' }}>
                {labelOf(o)}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconBadge({ icon, color, size = 40 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3, alignItems: 'center', justifyContent: 'center', backgroundColor: mixAlpha(color, 0.15) }}>
      <Icon name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

// ---------------------------------------------------------------- colour helpers
function hex(c: string): [number, number, number] {
  const h = c.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;

/** Mix colour a towards b by t (0..1). Non-hex inputs return a unchanged. */
export function mix(a: string, b: string, t: number): string {
  if (!a.startsWith('#') || !b.startsWith('#')) return a;
  const x = hex(a);
  const y = hex(b);
  return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}
export function shade(c: string, t: number): string {
  return t < 0 ? mix(c, '#000000', -t) : mix(c, '#FFFFFF', t);
}
export function mixAlpha(c: string, alpha: number): string {
  if (!c.startsWith('#')) return c;
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Keep numeric ranges / dates left-to-right inside Arabic text (Unicode isolate). */
export const ltr = (s: string) => `\u2066${s}\u2069`;
/** Compact day/month label for chart axes, e.g. 16/11. */
export const dayMonth = (date: string, num: (n: number) => string) => ltr(`${num(Number(date.slice(8, 10)))}/${num(Number(date.slice(5, 7)))}`);
