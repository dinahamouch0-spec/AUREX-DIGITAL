/**
 * Living sky behind the Home header. The gradient and the sun/moon position come from
 * the user's real prayer times (dawn, day, dusk, night). It is static between renders
 * — Home re-renders once a minute — so there is no continuous animation cost.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import type { SkyPhase } from '../domain/today';
import { useIsDark, usePalette } from './theme';

const SKY: Record<SkyPhase, [string, string]> = {
  night: ['#0B1230', '#0A0B14'],
  dawn: ['#3B2556', '#1A1222'],
  morning: ['#173A5E', '#0E1A2A'],
  afternoon: ['#4A3A10', '#171206'],
  dusk: ['#5E2A1E', '#1E0F18'],
};

// fixed pseudo-random star field (deterministic → no layout jitter)
const STARS = Array.from({ length: 26 }, (_, i) => ({ x: (i * 73) % 100, y: (i * 37) % 30, r: i % 5 === 0 ? 1.3 : 0.8, o: 0.35 + ((i * 13) % 50) / 100 }));

export function Sky({ phase, arc, isDay, rtl, children, height = 300, inset = 0 }: { phase: SkyPhase; arc: number; isDay: boolean; rtl: boolean; children: React.ReactNode; height?: number; /** safe-area top, so the sky runs under the status bar */ inset?: number }) {
  const p = usePalette();
  const dark = useIsDark();
  const [a, b] = SKY[phase];
  // arc from left horizon to right horizon (mirrored in RTL so time flows in reading direction)
  const t = rtl ? 1 - arc : arc;
  // draw in a viewBox that matches the real aspect ratio, so circles stay round and nothing is cropped
  const [w, setW] = useState(360);
  const svgH = height * 0.42;
  const W = 100;
  const H = (W * svgH) / w;
  const base = H * 0.92;
  const peak = H * 0.22;
  const cx = 6 + t * (W - 12);
  const cy = base - Math.sin(Math.PI * arc) * (base - peak);
  const body = isDay ? (phase === 'afternoon' ? '#F4DC8E' : '#FFE7A8') : '#E8E6F4';
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width || 360)} style={{ height: height + inset, marginHorizontal: -16, marginTop: -(16 + inset), overflow: 'hidden', borderBottomLeftRadius: dark ? 0 : 28, borderBottomRightRadius: dark ? 0 : 28 }}>
      {/* dark theme: the sky dissolves into the page; light theme: a self-contained night/day panel */}
      <LinearGradient colors={dark ? [a, b, p.background] : [a, b, b]} locations={[0, 0.62, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Svg width="100%" height={svgH} viewBox={`0 0 ${W} ${H.toFixed(2)}`} style={{ position: 'absolute', top: inset + 52 }}>
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={body} stopOpacity={0.55} />
            <Stop offset="1" stopColor={body} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {!isDay ? STARS.map((s, i) => <Circle key={i} cx={s.x} cy={(s.y / 30) * base * 0.8} r={s.r * 0.35} fill="#FFFFFF" opacity={s.o} />) : null}
         <Path d={`M6 ${base.toFixed(2)} Q50 ${(2 * peak - base).toFixed(2)} 94 ${base.toFixed(2)}`} stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={0.4} strokeDasharray="1.2 1.6" fill="none" />
        <Circle cx={cx} cy={cy} r={Math.min(9, cy - 0.5)} fill="url(#halo)" />
        <Circle cx={cx} cy={cy} r={2.6} fill={body} />
        {!isDay ? <Circle cx={cx + (rtl ? -1.1 : 1.1)} cy={cy - 0.8} r={2.3} fill={a} /> : null}
      </Svg>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: inset + 4, paddingBottom: 12 }}>{children}</View>
    </View>
  );
}
