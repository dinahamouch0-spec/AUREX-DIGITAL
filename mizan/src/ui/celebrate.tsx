/**
 * Celebrations for real milestones only. Two styles:
 * - "burst": short particle burst (≈1.2 s, 16 particles, UI thread) — fitness, habits, perfect day.
 * - "calm": a soft glow and a quiet line of text — Deen. No particles, no bounce.
 * Under Reduce Motion both become a simple fade of the message.
 * The overlay never blocks touches and unmounts itself (no idle work).
 *
 * Automatic milestones are checked against stored data and celebrated at most once
 * per day each (remembered in local meta), so reopening the app does not repeat them.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { dayPrayerSummary } from '../domain/deen';
import { habitDayStatus, isScheduledOn } from '../domain/habits';
import { evaluateDay } from '../domain/perfectDays';
import { listAll, store, useApp, useStoreVersion } from '../state/AppContext';
import { DOMAIN_THEME, radius, spacing } from '../theme/tokens';
import { tap } from './kit';
import { Icon, IconName, Txt } from './primitives';
import { usePalette } from './theme';

export interface CelebrationSpec {
  style: 'burst' | 'calm';
  title: string;
  subtitle?: string;
  icon?: IconName;
  color?: string;
}

type Listener = (c: CelebrationSpec) => void;
const listeners = new Set<Listener>();

/** Show a celebration (call only after a real, user-completed event). */
export function celebrate(c: CelebrationSpec) {
  for (const l of listeners) l(c);
}

export function CelebrationHost() {
  const [current, setCurrent] = useState<(CelebrationSpec & { key: number }) | null>(null);
  useEffect(() => {
    const l: Listener = (c) => {
      setCurrent({ ...c, key: Date.now() });
      tap('success');
      AccessibilityInfo.announceForAccessibility(c.subtitle ? `${c.title}. ${c.subtitle}` : c.title);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  useEffect(() => {
    if (!current) return;
    const h = setTimeout(() => setCurrent(null), current.style === 'calm' ? 2400 : 2000);
    return () => clearTimeout(h);
  }, [current]);
  return (
    <>
      <MilestoneWatcher />
      {current ? <Overlay key={current.key} spec={current} /> : null}
    </>
  );
}

function Overlay({ spec }: { spec: CelebrationSpec }) {
  const p = usePalette();
  const reduced = useReducedMotion();
  const color = spec.color ?? p.accent;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} testID="celebration">
      {spec.style === 'calm' || reduced ? <Glow color={color} calm={spec.style === 'calm'} /> : <Burst color={color} />}
      <Animated.View
        entering={FadeIn.duration(spec.style === 'calm' ? 600 : 250).reduceMotion(ReduceMotion.Never)}
        exiting={FadeOut.duration(400).reduceMotion(ReduceMotion.Never)}
        style={{ maxWidth: 320, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: color }}>
        <LinearGradient colors={[p.surfaceElevated, p.background]} style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.xs }}>
          <Icon name={spec.icon ?? (spec.style === 'calm' ? 'moon' : 'trophy')} size={30} color={color} />
          <Txt variant="heading" align="center">
            {spec.title}
          </Txt>
          {spec.subtitle ? (
            <Txt variant="caption" color="textSecondary" align="center">
              {spec.subtitle}
            </Txt>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function Glow({ color, calm }: { color: string; calm: boolean }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withSequence(
      withTiming(calm ? 0.16 : 0.18, { duration: 700, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never }),
      withDelay(1100, withTiming(0, { duration: 900, reduceMotion: ReduceMotion.Never })),
    );
  }, [o, calm]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: color }, st]} />;
}

const N = 16;
function Burst({ color }: { color: string }) {
  const palette = [color, '#F4DC8E', '#FFFFFF', color];
  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <Particle key={i} angle={(i / N) * Math.PI * 2} color={palette[i % palette.length]} dist={110 + (i % 3) * 30} />
      ))}
    </>
  );
}

function Particle({ angle, color, dist }: { angle: number; color: string; dist: number }) {
  const k = useSharedValue(0);
  useEffect(() => {
    k.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [k]);
  const st = useAnimatedStyle(() => ({
    opacity: 1 - k.value,
    transform: [{ translateX: Math.cos(angle) * dist * k.value }, { translateY: Math.sin(angle) * dist * k.value + 40 * k.value * k.value }, { scale: 1 - 0.5 * k.value }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: 9, height: 9, borderRadius: 3, backgroundColor: color }, st]} />;
}

/** Watches stored data for today's milestones; each fires once per day. */
function MilestoneWatcher() {
  const { t, today, settings, ready } = useApp();
  const version = useStoreVersion();
  useEffect(() => {
    if (!ready || !settings.onboarded) return;
    const once = (kind: string, fire: () => void) => {
      const key = `celebrated:${kind}`;
      if (store.getMeta(key) === today) return;
      store.setMeta(key, today);
      fire();
    };
    const prayers = dayPrayerSummary(store.list('prayer_logs'), today);
    if (prayers.missed === 0 && prayers.notRecorded === 0 && prayers.performed > 0) {
      once('prayers', () => celebrate({ style: 'calm', title: t('cel.prayersTitle'), subtitle: t('cel.prayersSub'), icon: 'moon', color: DOMAIN_THEME.deen.accent }));
    }
    const habits = store.list('habits').filter((h) => isScheduledOn(h, today) && h.schedule_type !== 'times_per_week');
    const logs = store.list('habit_logs');
    if (habits.length > 0 && habits.every((h) => habitDayStatus(h, logs, today) === 'completed')) {
      once('habits', () => celebrate({ style: 'burst', title: t('cel.habitsTitle'), subtitle: t('cel.habitsSub', { n: habits.length }), icon: 'checkmark-done', color: DOMAIN_THEME.habits.accent }));
    }
    if (store.list('perfect_day_definitions').length) {
      const ev = evaluateDay(listAll as never, today, settings.timezone);
      if (ev.applicable > 0 && ev.met === ev.applicable) {
        once('perfect', () => celebrate({ style: 'burst', title: t('cel.perfectTitle'), subtitle: t('cel.perfectSub'), icon: 'flame', color: DOMAIN_THEME.general.accent }));
      }
    }
  }, [version, today, ready, settings.onboarded, settings.timezone, t]);
  return null;
}
