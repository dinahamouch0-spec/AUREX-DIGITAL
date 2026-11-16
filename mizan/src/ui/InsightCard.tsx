import { router } from 'expo-router';
import React from 'react';

import type { Insight } from '../domain/aggregate';
import { useApp } from '../state/AppContext';
import { Badge, Card, Row, Txt } from './primitives';

/** InsightCard (blueprint 04 §6): text, data source and confidence label. */
export function InsightCard({ insight }: { insight: Insight }) {
  const { t, fmt } = useApp();
  const params: Record<string, string | number> = { ...insight.params };
  if (typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) params.date = fmt.localDate(params.date, 'weekday');
  return (
    <Card onPress={insight.route ? () => router.push(insight.route as never) : undefined} testID={`insight-${insight.id}`}>
      <Row style={{ justifyContent: 'space-between' }} wrap>
        <Badge label={t(`domain.${insight.domain}`)} />
        <Badge label={t(`ai.confidence.${insight.confidence}`)} tone={insight.confidence === 'high' ? 'success' : insight.confidence === 'medium' ? 'info' : 'neutral'} />
      </Row>
      <Txt>{t(insight.key, params)}</Txt>
      <Txt variant="caption" color="textMuted">
        {t('ai.basedOn', { source: t(insight.sourceKey) })}
      </Txt>
    </Card>
  );
}
