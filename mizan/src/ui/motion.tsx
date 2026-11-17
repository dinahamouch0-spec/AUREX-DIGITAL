/**
 * Motion rules (MIZAN):
 * - Motion explains change (something appeared, filled, moved); never loops in the background.
 * - Short: 180–450 ms. Springs are critically-damped-ish (no wobble) except tiny press feedback.
 * - Respects iOS "Reduce Motion": entering animations and count-ups are skipped.
 * - Runs on the UI thread (Reanimated) so it does not block JS.
 * - Deen uses the calm curve only (no bounce, no particles).
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, LinearTransition, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { Txt } from './primitives';
import type { Palette } from '../theme/tokens';

export const DUR = { fast: 180, base: 280, slow: 450, calm: 700 } as const;
export const EASE_OUT = Easing.out(Easing.cubic);

/** Staggered entrance for list/grid children (index-based, capped so long lists don't wait). */
export const enter = (index = 0) =>
  FadeInDown.duration(DUR.base)
    .delay(Math.min(index, 6) * 45)
    .easing(EASE_OUT)
    .reduceMotion(ReduceMotion.System);

export const enterCalm = (index = 0) => FadeIn.duration(DUR.calm).delay(Math.min(index, 6) * 80).reduceMotion(ReduceMotion.System);

/** Smoothly re-flows siblings when an item expands/collapses. */
export const layout = LinearTransition.duration(DUR.base).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export const AView = Animated.View;

/**
 * Number that counts up to its value when it first appears or changes.
 * Uses a short rAF loop (≤600 ms), then stops — no idle timers. Instant under Reduce Motion.
 */
export function CountUp({
  value,
  format,
  style,
  variant = 'title',
  color,
  testID,
}: {
  value: number;
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
  variant?: React.ComponentProps<typeof Txt>['variant'];
  color?: keyof Palette;
  testID?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const start = from.current;
    const t0 = Date.now();
    const dur = 600;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  const isInt = Number.isInteger(value);
  const current = reduced ? value : shown;
  return (
    <Txt variant={variant} color={color} style={style} testID={testID} accessibilityRole="text">
      {format(isInt ? Math.round(current) : Math.round(current * 10) / 10)}
    </Txt>
  );
}
