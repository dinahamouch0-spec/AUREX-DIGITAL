import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { pipelineSummary } from '@/domain/business';
import { CurrencyCode } from '@/domain/money';
import { DEAL_STAGES, DealStage } from '@/domain/types';
import { moveDealStage } from '@/data/usecases';
import { store, useApp, useCollection } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { SelectSheet } from '@/ui/overlays';
import { Button, Card, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { editRecordHref, newRecordHref } from '@/ui/records';

export default function Pipeline() {
  const { t, fmt, showToast } = useApp();
  const deals = useCollection('deals');
  const clients = useCollection('clients');
  const [moving, setMoving] = useState<string | null>(null);
  const sum = pipelineSummary(deals);
  return (
    <Screen title={t('bus.pipeline')} testID="screen-pipeline">
      <Button label={t('common.new')} icon="add" onPress={() => router.push(newRecordHref('deals') as never)} testID="deal-add" />
      {DEAL_STAGES.map((stage) => {
        const list = deals.filter((d) => d.stage === stage);
        const totals = Object.entries(sum.byStage[stage].value) as [CurrencyCode, number][];
        return (
          <View key={stage} style={{ gap: spacing.sm }}>
            <SectionHeader title={`${t(`opt.stage.${stage}`)} (${fmt.number(list.length)})`} />
            {totals.length ? <Txt variant="caption" color="textSecondary">{totals.map(([c, v]) => fmt.money(v, c)).join(' · ')}</Txt> : null}
            {list.map((d) => (
              <Card key={d.id} onPress={() => router.push(editRecordHref('deals', d.id) as never)} testID={`deal-${d.id}`}>
                <Txt variant="bodyStrong">{d.title}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {[clients.find((c) => c.id === d.client_id)?.name, fmt.money(d.value_minor, d.currency), d.probability != null ? `${d.probability}%` : null, d.expected_close_on ? fmt.localDate(d.expected_close_on) : null].filter(Boolean).join(' · ')}
                </Txt>
                <Row>
                  <Button small variant="secondary" label={t('bus.moveStage')} onPress={() => setMoving(d.id)} testID={`deal-move-${d.id}`} />
                </Row>
              </Card>
            ))}
          </View>
        );
      })}
      <SelectSheet
        visible={moving != null}
        title={t('bus.moveStage')}
        value={deals.find((d) => d.id === moving)?.stage ?? null}
        options={DEAL_STAGES.map((s) => ({ value: s, label: t(`opt.stage.${s}`) }))}
        onClose={() => setMoving(null)}
        onSelect={(v) => {
          if (moving && v) {
            const prev = store.get('deals', moving)?.stage;
            moveDealStage(store, moving, v as DealStage);
            const id = moving;
            showToast({ message: t(`opt.stage.${v}`), actionLabel: t('common.undo'), onAction: () => prev && moveDealStage(store, id, prev) });
            if (v === 'lost') router.push(editRecordHref('deals', id) as never);
          }
          setMoving(null);
        }}
      />
    </Screen>
  );
}
