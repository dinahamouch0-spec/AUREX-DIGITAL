import { router } from 'expo-router';
import React, { useState } from 'react';

import { invoiceBalance } from '@/domain/business';
import { useApp, useCollection } from '@/state/AppContext';
import { Badge, Button, FilterChips, ListItem, Notice, Row, Screen, SectionHeader } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';

export default function Finance() {
  const { t, fmt, today } = useApp();
  const [tab, setTab] = useState<'transactions' | 'invoices'>('invoices');
  const invoices = useCollection('invoices');
  const payments = useCollection('invoice_payments');
  return (
    <Screen title={t('bus.finance')} testID="screen-finance">
      <Notice text={t('bus.currencyNote')} />
      <FilterChips options={['invoices', 'transactions'] as const} value={tab} onChange={setTab} labelOf={(k) => t(`col.${k}`)} testIDPrefix="fin-tab" />
      {tab === 'invoices' ? (
        <>
          <Button label={t('common.new')} icon="add" onPress={() => router.push(newRecordHref('invoices', { issued_on: today }) as never)} testID="invoice-add" />
          {invoices
            .sort((a, b) => b.issued_on.localeCompare(a.issued_on))
            .map((inv) => {
              const bal = invoiceBalance(inv, payments, today);
              return (
                <ListItem
                  key={inv.id}
                  testID={`invoice-${inv.id}`}
                  title={`${inv.invoice_number} · ${fmt.money(inv.amount_minor, inv.currency)}`}
                  subtitle={`${t('bus.outstanding', { amount: fmt.money(bal.outstanding, inv.currency) })}${inv.due_on ? ` · ${t('field.due_on')} ${fmt.localDate(inv.due_on)}` : ''}`}
                  right={<Badge label={t(`opt.invdisplay.${bal.status}`)} tone={bal.status === 'paid' ? 'success' : bal.status === 'overdue' || bal.status === 'overpaid' ? 'warning' : 'neutral'} />}
                  onPress={() => router.push(`/business/invoice/${inv.id}`)}
                />
              );
            })}
          {invoices.length === 0 ? <RecordList collection="invoices" /> : null}
        </>
      ) : (
        <>
          <Row>
            <Button label={t('qa.addTransaction')} icon="add" onPress={() => router.push(newRecordHref('transactions', { occurred_on: today }) as never)} style={{ flex: 1 }} />
          </Row>
          <SectionHeader title={t('col.transactions')} />
          <RecordList collection="transactions" subtitle={(r) => [t(`opt.direction.${r.direction}`), t(`opt.txstatus.${r.status}`), fmt.money(r.amount_minor as number, r.currency as never), fmt.localDate(r.occurred_on as string)].join(' · ')} />
        </>
      )}
    </Screen>
  );
}
