import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { financialSummary, pipelineSummary, winRate } from '@/domain/business';
import { startOfMonth } from '@/domain/dates';
import { CurrencyCode, CurrencyTotals } from '@/domain/money';
import { useApp, useCollection } from '@/state/AppContext';
import { Button, Icon, IconName, ListItem, MetricCard, Notice, Row, Screen, SectionHeader, Txt, styles } from '@/ui/primitives';
import { newRecordHref } from '@/ui/records';
import { Hero } from '@/ui/kit';

const moneyText = (totals: CurrencyTotals, fmt: ReturnType<typeof useApp>['fmt']) => {
  const e = Object.entries(totals) as [CurrencyCode, number][];
  return e.length ? e.map(([c, v]) => fmt.money(v, c)).join(' · ') : '—';
};

export default function Business() {
  const { t, fmt, today } = useApp();
  const transactions = useCollection('transactions');
  const invoices = useCollection('invoices');
  const payments = useCollection('invoice_payments');
  const deals = useCollection('deals');
  const clients = useCollection('clients');
  const tasks = useCollection('tasks').filter((x) => x.domain === 'business' && x.status !== 'completed' && x.status !== 'archived');
  const month = financialSummary({ transactions, invoices, payments }, { from: startOfMonth(today), to: today, today });
  const all = financialSummary({ transactions, invoices, payments }, { today });
  const pipe = pipelineSummary(deals);
  const wr = winRate(deals);
  const followUps = [
    ...clients.filter((c) => c.follow_up_on && c.follow_up_on <= today).map((c) => ({ id: c.id, title: c.name, on: c.follow_up_on as string, href: `/business/client/${c.id}` })),
    ...deals.filter((d) => d.follow_up_on && d.follow_up_on <= today && d.stage !== 'won' && d.stage !== 'lost').map((d) => ({ id: d.id, title: d.title, on: d.follow_up_on as string, href: `/records/deals/${d.id}` })),
  ];
  const links: [string, string, IconName][] = [
    ['bus.clients', '/business/clients', 'people-outline'],
    ['bus.pipeline', '/business/pipeline', 'funnel-outline'],
    ['bus.finance', '/business/finance', 'wallet-outline'],
    ['bus.projects', '/records/projects', 'folder-outline'],
    ['col.tasks', '/records/tasks?prefill=' + encodeURIComponent(JSON.stringify({ domain: 'business' })), 'checkbox-outline'],
  ];
  return (
    <Screen title={t('bus.title')} subtitle={t('bus.subtitle')} testID="screen-business">
      <Hero domain="business" eyebrow={t('bus.thisMonth')} title={moneyText(month.netCash, fmt)} subtitle={`${t('home.receivables')}: ${moneyText(all.receivables, fmt)}`} />
      <Row wrap>
        <Button small label={t('qa.addTransaction')} icon="add" onPress={() => router.push(newRecordHref('transactions', { occurred_on: today }) as never)} testID="bus-add-tx" />
        <Button small variant="secondary" label={t('col.clients')} icon="person-add-outline" onPress={() => router.push(newRecordHref('clients') as never)} testID="bus-add-client" />
        <Button small variant="secondary" label={t('col.deals')} icon="add" onPress={() => router.push(newRecordHref('deals') as never)} />
      </Row>
      <SectionHeader title={t('bus.thisMonth')} />
      <View style={styles.grid}>
        <MetricCard label={t('bus.cashReceived')} value={moneyText(month.cashReceived, fmt)} tone="success" testID="bus-cash" />
        <MetricCard label={t('bus.expensesPaid')} value={moneyText(month.expensesPaid, fmt)} />
        <MetricCard label={t('bus.netCash')} value={moneyText(month.netCash, fmt)} />
      </View>
      <SectionHeader title={t('bus.allTime')} />
      <View style={styles.grid}>
        <MetricCard label={t('bus.receivables')} value={moneyText(all.receivables, fmt)} onPress={() => router.push('/business/finance')} testID="bus-receivables" />
        <MetricCard label={t('bus.liabilities')} value={moneyText(all.unpaidLiabilities, fmt)} />
        <MetricCard label={t('bus.planned')} value={moneyText(all.plannedIncome, fmt)} hint={t('common.estimate')} />
        <MetricCard label={t('bus.weighted')} value={moneyText(pipe.weighted, fmt)} hint={pipe.unweightedOpenCount ? t('bus.unweighted', { n: pipe.unweightedOpenCount }) : t('common.estimate')} onPress={() => router.push('/business/pipeline')} />
      </View>
      <Notice text={t('bus.currencyNote')} />
      <Txt variant="caption" color="textMuted">
        {wr ? t('bus.winRate', { n: Math.round(wr.rate * 100), closed: wr.closed }) : t('bus.winRateWithheld')}
      </Txt>
      <SectionHeader title={t('bus.followUps')} />
      {followUps.length === 0 ? <Txt color="textMuted">{t('bus.noFollowUps')}</Txt> : followUps.map((f) => <ListItem key={f.id} title={f.title} subtitle={fmt.localDate(f.on)} onPress={() => router.push(f.href as never)} />)}
      {tasks.length ? (
        <>
          <SectionHeader title={t('col.tasks')} />
          {tasks.slice(0, 5).map((x) => (
            <ListItem key={x.id} title={x.title} subtitle={[t(`opt.priority.${x.priority}`), x.due_at ? fmt.dateTime(x.due_at) : null].filter(Boolean).join(' · ')} onPress={() => router.push(`/records/tasks/${x.id}`)} />
          ))}
        </>
      ) : null}
      <SectionHeader title={t('common.more')} />
      {links.map(([k, href, icon]) => (
        <ListItem key={k} title={t(k)} left={<Icon name={icon} />} onPress={() => router.push(href as never)} testID={`bus-link-${k}`} />
      ))}
      <Txt variant="caption" color="textMuted">
        {t('bus.noMessages')}
      </Txt>
    </Screen>
  );
}
