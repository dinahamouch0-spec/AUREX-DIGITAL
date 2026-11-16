import React from 'react';
import { View } from 'react-native';

import { useApp } from '../state/AppContext';
import { radius, spacing } from '../theme/tokens';
import { Card, Txt } from './primitives';
import { usePalette } from './theme';

/**
 * Minimal accessible bar chart (ChartCard). Values are labelled under each
 * bar and the whole chart has a text summary for screen readers.
 */
export function BarChart({ title, data, max }: { title: string; data: { label: string; value: number; date?: string }[]; max?: number }) {
  const p = usePalette();
  const { fmt } = useApp();
  const top = Math.max(max ?? 0, ...data.map((d) => d.value), 1);
  const summary = `${title}: ${data.map((d) => `${d.label} ${fmt.number(d.value)}`).join(', ')}`;
  return (
    <Card>
      <Txt variant="label" color="textSecondary">
        {title}
      </Txt>
      <View accessible accessibilityLabel={summary} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 120, paddingTop: spacing.sm }}>
        {data.map((d, i) => (
          <View key={d.date ?? i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Txt variant="caption" color="textSecondary">
              {fmt.number(d.value)}
            </Txt>
            <View style={{ width: '70%', height: Math.max(2, (d.value / top) * 80), backgroundColor: d.value > 0 ? p.accent : p.border, borderRadius: radius.sm / 2 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {data.map((d, i) => (
          <Txt key={d.date ?? i} variant="caption" color="textMuted" align="center" style={{ flex: 1, fontSize: 11 }} numberOfLines={1}>
            {d.label}
          </Txt>
        ))}
      </View>
    </Card>
  );
}
