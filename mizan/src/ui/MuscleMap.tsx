/**
 * Front/back anatomical sketch that highlights the muscles an exercise targets.
 * Drawn from simple shapes so it always matches the data (no stock photos).
 * Primary muscles: full accent colour. Secondary: translucent accent.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Muscle, MuscleGroup } from '../domain/exerciseCatalog';
import { usePalette } from './theme';

type Shape = { t: 'e'; cx: number; cy: number; rx: number; ry: number } | { t: 'r'; x: number; y: number; w: number; h: number; r?: number } | { t: 'p'; d: string };

const mirror = (cx: number, center: number) => 2 * center - cx;
const pair = (center: number, cx: number, cy: number, rx: number, ry: number): Shape[] => [
  { t: 'e', cx, cy, rx, ry },
  { t: 'e', cx: mirror(cx, center), cy, rx, ry },
];

const F = 50; // front figure centre
const B = 150; // back figure centre

const REGIONS: Record<Exclude<Muscle, 'heart'>, Shape[]> = {
  traps: [...pair(F, 44, 28, 5, 2.5), { t: 'p', d: `M${B - 12} 30 L${B} 24 L${B + 12} 30 L${B} 50 Z` }],
  front_delts: pair(F, 28, 36, 6, 7),
  side_delts: [...pair(F, 23.5, 39, 3, 6), ...pair(B, 123.5, 39, 3, 6)],
  rear_delts: pair(B, 128, 37, 6, 6.5),
  upper_chest: pair(F, 41, 40, 8.5, 3.5),
  chest: pair(F, 41, 47, 9, 7),
  biceps: pair(F, 22, 55, 4.5, 10),
  triceps: pair(B, 122, 55, 4.5, 10),
  forearms: [...pair(F, 19, 82, 4, 12), ...pair(B, 119, 82, 4, 12)],
  abs: [{ t: 'r', x: 43, y: 56, w: 14, h: 32, r: 4 }],
  obliques: pair(F, 37, 72, 3.5, 12),
  lats: pair(B, 139, 62, 7.5, 15),
  upper_back: [{ t: 'e', cx: B, cy: 52, rx: 7, ry: 7 }],
  lower_back: [{ t: 'r', x: B - 6, y: 74, w: 12, h: 18, r: 3 }],
  glutes: pair(B, 142, 104, 8, 8),
  quads: pair(F, 41, 123, 7, 20),
  adductors: pair(F, 47.6, 112, 2.4, 10),
  hamstrings: pair(B, 141, 131, 7, 17),
  calves: [...pair(F, 40.5, 172, 4, 13), ...pair(B, 140, 170, 5, 14)],
};

function silhouette(cx: number): string {
  // head is drawn separately; this is torso + arms + legs as one outline
  const L = (x: number) => cx - 50 + x;
  return [
    `M${L(44)} 24 L${L(56)} 24 L${L(57)} 29 L${L(72)} 31 Q${L(80)} 34 ${L(81)} 44 L${L(85)} 72 L${L(88)} 104 L${L(82)} 106 L${L(76)} 76 L${L(71)} 56`,
    `L${L(66)} 94 L${L(66)} 104 L${L(63)} 150 L${L(62)} 196 L${L(54)} 196 L${L(52)} 152 L${L(50)} 112`,
    `L${L(48)} 152 L${L(46)} 196 L${L(38)} 196 L${L(37)} 150 L${L(34)} 104 L${L(34)} 94 L${L(29)} 56 L${L(24)} 76 L${L(18)} 106 L${L(12)} 104`,
    `L${L(15)} 72 L${L(19)} 44 Q${L(20)} 34 ${L(28)} 31 L${L(43)} 29 Z`,
  ].join(' ');
}

function ShapeEl({ s, fill, opacity }: { s: Shape; fill: string; opacity: number }) {
  if (s.t === 'e') return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} opacity={opacity} />;
  if (s.t === 'r') return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} fill={fill} opacity={opacity} />;
  return <Path d={s.d} fill={fill} opacity={opacity} />;
}

export function MuscleMap({
  primary,
  secondary = [],
  size = 180,
  color,
  accessibilityLabel,
}: {
  primary: Muscle[];
  secondary?: Muscle[];
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  const accent = color ?? p.accent;
  const status = (m: Muscle) => (primary.includes(m) ? 1 : secondary.includes(m) ? 0.45 : 0);
  const muscles = Object.keys(REGIONS) as Exclude<Muscle, 'heart'>[];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ alignItems: 'center' }}>
      <Svg width={size * 1.05} height={size} viewBox="0 0 200 200">
        {[F, B].map((cx) => (
          <G key={cx}>
            <Circle cx={cx} cy={13} r={9.5} fill={p.surfaceElevated} stroke={p.border} strokeWidth={1} />
            <Path d={silhouette(cx)} fill={p.surfaceElevated} stroke={p.border} strokeWidth={1} />
          </G>
        ))}
        {muscles.map((m) =>
          REGIONS[m].map((s, i) => {
            const st = status(m);
            return <ShapeEl key={`${m}-${i}`} s={s} fill={st ? accent : p.border} opacity={st ? st : 0.55} />;
          }),
        )}
        {primary.includes('heart') || secondary.includes('heart') ? (
          <Path d="M45 44 c-3 -4 -9 -1 -6 4 l6 6 l6 -6 c3 -5 -3 -8 -6 -4 z" fill={p.danger} opacity={primary.includes('heart') ? 1 : 0.5} />
        ) : null}
      </Svg>
    </View>
  );
}

export const GROUP_MUSCLES: Record<MuscleGroup, Muscle[]> = {
  chest: ['chest', 'upper_chest'],
  back: ['lats', 'upper_back', 'traps', 'lower_back'],
  shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  legs: ['quads', 'hamstrings', 'glutes', 'adductors'],
  abs: ['abs', 'obliques'],
  calves: ['calves'],
  forearms: ['forearms'],
  cardio: ['heart'],
};
