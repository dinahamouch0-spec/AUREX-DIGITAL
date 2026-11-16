import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { evaluateDay } from '../domain/perfectDays';
import type { PerfectCriterion } from '../domain/types';
import { streakSummary } from '../data/usecases';
import { listAll, store, useApp, useStoreVersion } from '../state/AppContext';
import { radius, spacing } from '../theme/tokens';
import { Badge, Card, ProgressBar, Row, Txt } from './primitives';
import { usePalette } from './theme';

export function criterionLabel(c: PerfectCriterion, t: (k: string, p?: Record<string, string | number>) => string): string {
  if (c.type === 'habit') return store.get('habits', c.ref_id)?.name ?? t('pd.removedItem');
  if (c.type === 'routine') return store.get('routines', c.ref_id)?.name ?? t('pd.removedItem');
  return t(`pd.crit.${c.type}`);
}

export const STATUS_TONE = { perfect: 'accent', pending: 'info', incomplete: 'neutral', rest: 'neutral', exempt: 'neutral', not_tracked: 'neutral' } as const;

/** Dashboard card (owner spec §3): 🔥, current streak, best, today's progress. */
export function PerfectDayCard() {
  const { t, fmt, settings, today } = useApp();
  const p = usePalette();
  useStoreVersion();
  const hasDefinition = store.list('perfect_day_definitions').length > 0;
  if (!hasDefinition) {
    return (
      <Card onPress={() => router.push('/streak/definition')} testID="perfect-card-setup" accessibilityLabel={t('pd.title')} style={{ borderColor: p.accent }}>
        <Row>
          <Txt variant="title">🔥</Txt>
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('pd.title')}
          </Txt>
        </Row>
        <Txt color="textSecondary">{t('pd.setupPrompt')}</Txt>
      </Card>
    );
  }
  const now = new Date();
  const s = streakSummary(store, now, settings.timezone);
  const ev = evaluateDay(listAll as never, today, settings.timezone);
  const ratio = ev.applicable ? ev.met / ev.applicable : null;
  return (
    <Card
      onPress={() => router.push('/streak')}
      testID="perfect-card"
      accessibilityLabel={`${t('pd.title')}: ${t('pd.currentStreak')} ${s.current}, ${t('pd.best')} ${s.longest}`}
      style={{ borderColor: p.accent, backgroundColor: p.surfaceElevated }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Txt variant="display" style={{ fontSize: 34, lineHeight: 42 }}>
            🔥
          </Txt>
          <View>
            <Txt variant="display" color="accent" testID="perfect-current">
              {fmt.number(s.current)}
            </Txt>
            <Txt variant="caption" color="textSecondary">
              {t('pd.daysInARow')}
            </Txt>
          </View>
        </Row>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Txt variant="caption" color="textSecondary">
            {t('pd.best')}
          </Txt>
          <Txt variant="heading" testID="perfect-best">
            {fmt.number(s.longest)}
          </Txt>
        </View>
      </Row>
      <View style={{ height: 1, backgroundColor: p.divider, marginVertical: spacing.xs, borderRadius: radius.sm }} />
      <Row style={{ justifyContent: 'space-between' }} wrap>
        <Txt variant="label">{t('pd.today')}</Txt>
        <Badge label={t(`pd.status.${s.todayStatus}`)} tone={STATUS_TONE[s.todayStatus]} />
      </Row>
      {ratio != null ? (
        <>
          <ProgressBar ratio={ratio} label={t('pd.todayProgress', { met: ev.met, total: ev.applicable })} testID="perfect-progress" />
          <Txt variant="caption" color="textSecondary">
            {t('pd.todayProgress', { met: ev.met, total: ev.applicable })}
          </Txt>
        </>
      ) : (
        <Txt variant="caption" color="textSecondary">
          {t(ev.exempt ? 'pd.todayExempt' : 'pd.todayRest')}
        </Txt>
      )}
    </Card>
  );
}
