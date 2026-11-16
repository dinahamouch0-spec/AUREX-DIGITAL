import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import type { AgendaItem } from '../domain/aggregate';
import type { CollectionName } from '../domain/types';
import { useApp } from '../state/AppContext';
import { DOMAIN_COLORS, spacing } from '../theme/tokens';
import { Badge, Icon, ListItem, Txt } from './primitives';
import { editRecordHref } from './records';

export function agendaLabel(item: AgendaItem, t: (k: string, p?: Record<string, string | number>) => string): string {
  if (item.title) return item.title;
  if (!item.labelKey) return '';
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(item.labelParams ?? {})) params[k] = v.startsWith('opt.') ? t(v) : v;
  return t(item.labelKey, params);
}

/** Where tapping an agenda item goes — always to the source record (no duplicate edits). */
export function agendaRoute(item: AgendaItem): string | null {
  if (item.prayer) return '/deen';
  if (!item.source) return null;
  const { collection, id } = item.source;
  const special: Partial<Record<CollectionName, string>> = {
    habits: `/habits/${id}`,
    workouts: `/fitness/workout/${id}`,
    workout_programs: '/fitness/programs',
    clients: `/business/client/${id}`,
    invoices: `/business/invoice/${id}`,
    goals: `/goals/${id}`,
  };
  return special[collection] ?? editRecordHref(collection, id);
}

export function TimelineItem({ item, testID }: { item: AgendaItem; testID?: string }) {
  const { t, fmt } = useApp();
  const route = agendaRoute(item);
  return (
    <ListItem
      testID={testID}
      title={agendaLabel(item, t)}
      subtitle={item.start ? fmt.time(item.start) + (item.end ? ` – ${fmt.time(item.end)}` : '') : t('cal.allDay')}
      onPress={route ? () => router.push(route as never) : undefined}
      left={
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: DOMAIN_COLORS[item.domain] }} accessibilityLabel={t(`domain.${item.domain}`)} />
      }
      right={
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          {item.done ? <Icon name="checkmark-circle" color="success" /> : null}
          {item.conflict ? <Badge label={t('cal.conflict')} tone="warning" icon="warning-outline" /> : null}
        </View>
      }
    />
  );
}

export function TimelineList({ items, emptyText }: { items: AgendaItem[]; emptyText: string }) {
  if (items.length === 0)
    return (
      <Txt color="textMuted" style={{ paddingVertical: spacing.md }}>
        {emptyText}
      </Txt>
    );
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((i) => (
        <TimelineItem key={i.key} item={i} testID={`agenda-${i.key}`} />
      ))}
    </View>
  );
}
