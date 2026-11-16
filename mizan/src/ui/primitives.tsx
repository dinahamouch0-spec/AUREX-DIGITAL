/**
 * Shared components (blueprint 04 §6). All components:
 * - read colours from semantic tokens (usePalette),
 * - respect RTL via the app-level `direction` plus explicit text alignment,
 * - expose accessibility roles/labels and ≥44pt touch targets.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../state/AppContext';
import { DOMAIN_COLORS, MAX_CONTENT_WIDTH, MIN_TOUCH, Palette, radius, spacing, type } from '../theme/tokens';
import { usePalette } from './theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------- text
type Variant = keyof typeof type;
export function Txt({
  children,
  variant = 'body',
  color,
  align,
  style,
  numberOfLines,
  accessibilityRole,
  testID,
}: {
  children: React.ReactNode;
  variant?: Variant;
  color?: keyof Palette;
  align?: 'start' | 'center' | 'end';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text' | 'link';
  testID?: string;
}) {
  const p = usePalette();
  const { rtl } = useApp();
  const textAlign = align === 'center' ? 'center' : (align === 'end') !== rtl ? 'right' : 'left';
  return (
    <Text
      testID={testID}
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      style={[type[variant], { color: p[color ?? 'text'], textAlign, writingDirection: rtl ? 'rtl' : 'ltr' }, style]}>
      {children}
    </Text>
  );
}

export function Icon({ name, size = 20, color, style }: { name: IconName; size?: number; color?: keyof Palette | string; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  const c = color ? ((p as unknown as Record<string, string>)[color] ?? color) : p.text;
  return <Ionicons name={name} size={size} color={c} style={style} accessibilityElementsHidden importantForAccessibility="no" />;
}

/** Direction-aware chevron (points "forward" in reading direction). */
export function ChevronForward({ color = 'textMuted' }: { color?: keyof Palette }) {
  const { rtl } = useApp();
  return <Icon name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={color} />;
}

// ---------------------------------------------------------------- layout
export function Row({ children, gap = spacing.sm, style, wrap }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Card({ children, style, onPress, accessibilityLabel, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string; testID?: string }) {
  const p = usePalette();
  const base: ViewStyle = { backgroundColor: p.surface, borderRadius: radius.md, borderWidth: 1, borderColor: p.border, padding: spacing.lg, gap: spacing.sm };
  if (!onPress) return <View style={[base, style]} testID={testID}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.8 }, style]}>
      {children}
    </Pressable>
  );
}

export function Divider() {
  const p = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.divider, marginVertical: spacing.xs }} />;
}

export function SectionHeader({ title, action, onAction, testID }: { title: string; action?: string; onAction?: () => void; testID?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm }}>
      <Txt variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </Txt>
      {action && onAction ? <LinkButton label={action} onPress={onAction} testID={testID} /> : null}
    </Row>
  );
}

// ---------------------------------------------------------------- buttons
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  testID,
  accessibilityLabel,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const p = usePalette();
  const bg = variant === 'primary' ? p.accent : variant === 'danger' ? p.danger : variant === 'secondary' ? p.surfaceElevated : 'transparent';
  const fg = variant === 'primary' ? p.onAccent : variant === 'danger' ? '#fff' : variant === 'ghost' ? p.accent : p.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 36 : MIN_TOUCH,
          paddingHorizontal: small ? spacing.md : spacing.lg,
          borderRadius: radius.sm,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[type.label, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const p = usePalette();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} hitSlop={10} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
      <Text style={[type.label, { color: p.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color, testID, badge }: { icon: IconName; onPress: () => void; label: string; color?: keyof Palette; testID?: string; badge?: number }) {
  const p = usePalette();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Icon name={icon} size={22} color={color ?? 'text'} />
      {badge ? (
        <View style={{ position: 'absolute', top: 6, end: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: p.onAccent, fontSize: 11, fontWeight: '700' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID, icon, color }: { label: string; selected?: boolean; onPress?: () => void; testID?: string; icon?: IconName; color?: string }) {
  const p = usePalette();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? p.accent : p.border,
        backgroundColor: selected ? p.accentMuted : p.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      {selected ? <Icon name="checkmark" size={14} color="accent" /> : icon ? <Icon name={icon} size={14} color={color ?? 'textSecondary'} /> : null}
      <Text style={[type.label, { color: selected ? p.text : p.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function FilterChips<T extends string>({ options, value, onChange, labelOf, testIDPrefix }: { options: readonly T[]; value: T | T[]; onChange: (v: T) => void; labelOf: (v: T) => string; testIDPrefix?: string }) {
  const sel = Array.isArray(value) ? value : [value];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
      {options.map((o) => (
        <Chip key={o} label={labelOf(o)} selected={sel.includes(o)} onPress={() => onChange(o)} testID={testIDPrefix ? `${testIDPrefix}-${o}` : undefined} />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- status
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'; icon?: IconName }) {
  const p = usePalette();
  const c = tone === 'neutral' ? p.textSecondary : tone === 'accent' ? p.accent : p[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: c, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      {icon ? <Icon name={icon} size={12} color={c} /> : null}
      <Text style={[type.caption, { color: c, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

export function DomainDot({ domain }: { domain: keyof typeof DOMAIN_COLORS }) {
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: DOMAIN_COLORS[domain] }} />;
}

export function ProgressBar({ ratio, label, testID }: { ratio: number | null; label: string; testID?: string }) {
  const p = usePalette();
  const r = ratio == null ? 0 : Math.max(0, Math.min(1, ratio));
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={ratio == null ? undefined : { min: 0, max: 100, now: Math.round(r * 100) }}
      style={{ height: 8, borderRadius: 4, backgroundColor: p.surfaceElevated, overflow: 'hidden' }}>
      <View style={{ width: `${r * 100}%`, height: '100%', backgroundColor: p.accent }} />
    </View>
  );
}

export function MetricCard({ label, value, hint, onPress, testID, tone }: { label: string; value: string; hint?: string; onPress?: () => void; testID?: string; tone?: keyof Palette }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minWidth: 150 }} testID={testID}>
      <Txt variant="caption" color="textSecondary">
        {label}
      </Txt>
      <Txt variant="title" color={tone}>
        {value}
      </Txt>
      {hint ? (
        <Txt variant="caption" color="textMuted">
          {hint}
        </Txt>
      ) : null}
    </Card>
  );
}

export function ListItem({
  title,
  subtitle,
  right,
  left,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: pressed ? p.surfaceElevated : p.surface,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: p.border,
      })}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronForward /> : null)}
    </Pressable>
  );
}

// ---------------------------------------------------------------- states
export function EmptyState({ title, body, actionLabel, onAction, icon = 'leaf-outline', testID }: { title?: string; body: string; actionLabel?: string; onAction?: () => void; icon?: IconName; testID?: string }) {
  const { t } = useApp();
  return (
    <View testID={testID} style={{ alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
      <Icon name={icon} size={32} color="textMuted" />
      <Txt variant="bodyStrong" align="center">
        {title ?? t('state.emptyTitle')}
      </Txt>
      <Txt color="textSecondary" align="center">
        {body}
      </Txt>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} icon="add" style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useApp();
  return (
    <View style={{ alignItems: 'center', padding: spacing.xl, gap: spacing.sm }} accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={32} color="danger" />
      <Txt variant="bodyStrong" align="center">
        {t('state.errorTitle')}
      </Txt>
      <Txt color="textSecondary" align="center">
        {message ?? t('state.errorBody')}
      </Txt>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function LoadingState() {
  const p = usePalette();
  const { t } = useApp();
  return (
    <View style={{ padding: spacing.xl, gap: spacing.md }} accessibilityLabel={t('common.loading')}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 56, borderRadius: radius.sm, backgroundColor: p.surface }} />
      ))}
      <ActivityIndicator color={p.accent} />
    </View>
  );
}

export function Notice({ text, tone = 'info', icon }: { text: string; tone?: 'info' | 'warning' | 'danger' | 'success'; icon?: IconName }) {
  const p = usePalette();
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: p[tone], backgroundColor: p.surface }}>
      <Icon name={icon ?? (tone === 'info' ? 'information-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'warning-outline')} size={18} color={tone} />
      <Txt variant="caption" color="textSecondary" style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

// ---------------------------------------------------------------- screen
export function Screen({
  title,
  subtitle,
  children,
  back = true,
  actions,
  scroll = true,
  testID,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
  actions?: React.ReactNode;
  scroll?: boolean;
  testID?: string;
  footer?: React.ReactNode;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { t, rtl } = useApp();
  const content = (
    <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md }}>
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.background }} testID={testID}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.divider }}>
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH + spacing.lg, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', minHeight: 52 }}>
          {back ? (
            <IconButton
              icon={rtl ? 'arrow-forward' : 'arrow-back'}
              label={t('nav.back')}
              testID="nav-back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          ) : (
            <View style={{ width: spacing.sm }} />
          )}
          <View style={{ flex: 1, paddingHorizontal: spacing.xs }}>
            <Txt variant="title" accessibilityRole="header" numberOfLines={1}>
              {title}
            </Txt>
            {subtitle ? (
              <Txt variant="caption" color="textSecondary" numberOfLines={1}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
          <Row gap={0}>{actions}</Row>
        </View>
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingTop: spacing.lg }} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: spacing.lg }}>{content}</View>
      )}
      {footer}
    </View>
  );
}

export const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
