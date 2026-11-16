import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { invoiceBalance } from '@/domain/business';
import { useApp, useCollection, useRecord } from '@/state/AppContext';
import { Badge, Button, Card, EmptyState, IconButton, Notice, Row, Screen, Txt } from '@/ui/primitives';
import { RecordList, editRecordHref, newRecordHref } from '@/ui/records';

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, fmt, today } = useApp();
  const inv = useRecord('invoices', id);
  const payments = useCollection('invoice_payments');
  const clients = useCollection('clients');
  if (!inv)
    return (
      <Screen title={t('col.invoices')} testID="screen-not-found">
        <EmptyState body={t('state.notFound')} />
      </Screen>
    );
  const bal = invoiceBalance(inv, payments, today);
  return (
    <Screen title={inv.invoice_number} subtitle={clients.find((c) => c.id === inv.client_id)?.name} actions={<IconButton icon="create-outline" label={t('common.edit')} onPress={() => router.push(editRecordHref('invoices', inv.id) as never)} />} testID="screen-invoice">
      <Card>
        <Txt variant="title">{fmt.money(inv.amount_minor, inv.currency)}</Txt>
        <Row wrap>
          <Badge label={t(`opt.invdisplay.${bal.status}`)} tone={bal.status === 'paid' ? 'success' : bal.status === 'overdue' || bal.status === 'overpaid' ? 'warning' : 'neutral'} />
          {inv.due_on ? <Badge label={`${t('field.due_on')}: ${fmt.localDate(inv.due_on)}`} /> : null}
        </Row>
        <Txt testID="invoice-paid">{t('bus.paid', { amount: fmt.money(bal.paid, inv.currency) })}</Txt>
        <Txt testID="invoice-outstanding">{t('bus.outstanding', { amount: fmt.money(bal.outstanding, inv.currency) })}</Txt>
      </Card>
      {inv.status === 'draft' ? <Notice text={t('bus.draftNote')} /> : null}
      <Button label={t('bus.addPayment')} icon="add" disabled={inv.status === 'void'} onPress={() => router.push(newRecordHref('invoice_payments', { invoice_id: inv.id, paid_on: today }) as never)} testID="invoice-add-payment" />
      <RecordList collection="invoice_payments" title={t('bus.payments')} hideAdd filter={(p) => p.invoice_id === inv.id} subtitle={(p) => `${fmt.money(p.amount_minor as number, inv.currency)}${p.method ? ` · ${p.method}` : ''}`} />
      <Txt variant="caption" color="textMuted">
        {t('bus.noMessages')}
      </Txt>
    </Screen>
  );
}
