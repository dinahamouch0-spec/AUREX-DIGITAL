import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useApp, useRecord } from '@/state/AppContext';
import { Badge, Card, EmptyState, IconButton, Notice, Row, Screen, Txt } from '@/ui/primitives';
import { RecordList, editRecordHref } from '@/ui/records';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today } = useApp();
  const c = useRecord('clients', id);
  if (!c)
    return (
      <Screen title={t('bus.clients')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  return (
    <Screen title={c.name} subtitle={c.organization ?? undefined} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('clients', c.id) as never)} testID="client-edit" />} testID="screen-client">
      <Card>
        <Row wrap>
          <Badge label={t(`opt.cstatus.${c.status}`)} />
          {c.follow_up_on ? <Badge label={`${t('field.follow_up_on')}: ${fmt.localDate(c.follow_up_on)}`} tone={c.follow_up_on <= today ? 'warning' : 'neutral'} /> : null}
        </Row>
        {c.phone ? <Txt>{`${t('field.phone')}: ${c.phone}`}</Txt> : null}
        {c.email ? <Txt>{`${t('field.email')}: ${c.email}`}</Txt> : null}
        {c.lead_source ? <Txt color="textSecondary">{`${t('field.lead_source')}: ${c.lead_source}`}</Txt> : null}
        {c.notes ? <Txt color="textSecondary">{c.notes}</Txt> : null}
      </Card>
      <Notice text={t('bus.noMessages')} />
      <RecordList collection="client_interactions" title={t('bus.interactions')} prefill={{ client_id: c.id }} filter={(r) => r.client_id === c.id} />
      <RecordList collection="deals" title={t('col.deals')} prefill={{ client_id: c.id }} filter={(r) => r.client_id === c.id} />
      <RecordList collection="projects" title={t('col.projects')} prefill={{ client_id: c.id }} filter={(r) => r.client_id === c.id} />
      <RecordList collection="invoices" title={t('col.invoices')} prefill={{ client_id: c.id }} filter={(r) => r.client_id === c.id} onPressItem={(iid) => router.push(`/business/invoice/${iid}`)} />
    </Screen>
  );
}
