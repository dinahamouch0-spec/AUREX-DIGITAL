import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { Hero } from '@/ui/kit';

import { AiAnswer, LocalInsightsProvider, ProposedAction, getProviders } from '@/ai/provider';
import { addDays } from '@/domain/dates';
import { DOMAINS } from '@/domain/types';
import { store, useApp, useStoreVersion, listAll } from '@/state/AppContext';
import { InsightCard } from '@/ui/InsightCard';
import { Badge, Button, Card, EmptyState, Notice, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';

/**
 * Assistant. Implemented provider: on-device local insights (no network).
 * External providers plug in via src/ai/provider.ts (Pending External Setup).
 * It can only PROPOSE actions; each requires explicit confirmation and is
 * written to the audit log.
 */
export default function Assistant() {
  const { t, settings, today, confirm, showToast } = useApp();
  const version = useStoreVersion();
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [error, setError] = useState(false);
  const allowedKey = DOMAINS.filter((d) => settings.ai.domains[d]).join(',');

  useEffect(() => {
    if (!settings.ai.enabled) return;
    new LocalInsightsProvider()
      .analyse(listAll as never, { today, now: new Date(), timeZone: settings.timezone, weekStart: settings.weekStart, allowedDomains: allowedKey ? (allowedKey.split(',') as typeof DOMAINS) : [] })
      .then((a) => {
        setAnswer(a);
        setError(false);
      })
      .catch(() => setError(true));
  }, [version, settings.ai.enabled, allowedKey, today, settings.timezone, settings.weekStart]);

  const approve = async (a: ProposedAction) => {
    const ok = await confirm({ title: t('ai.confirmTitle'), body: t(a.summaryKey, a.params), confirmLabel: t('common.add') });
    if (!ok) return;
    if (a.kind === 'create_study_session' && a.payload) {
      const exam = store.get('exams', String(a.payload.exam_id));
      store.insert('study_sessions', { title: String(a.payload.title), exam_id: exam?.id ?? null, subject_id: exam?.subject_id ?? null, planned_date: addDays(today, 1), planned_minutes: 45 });
    }
    const ts = new Date().toISOString();
    store.insert('audit_logs', { action: 'ai_action_approved', entity_type: a.kind, entity_id: null, occurred_at: ts, metadata: { provider: answer?.providerId ?? 'local' } }, { skipValidation: true });
    showToast({ message: t('toast.saved') });
  };

  return (
    <Screen title={t('ai.title')} testID="screen-assistant">
      <Hero domain="general" eyebrow={t('ai.title')} title={t('ai.heroTitle')} subtitle={t('ai.heroSub')} />
      {!settings.ai.enabled ? (
        <>
          <EmptyState icon="sparkles-outline" body={t('ai.disabled')} />
          <Button label={t('set.ai')} onPress={() => router.push('/settings/ai')} />
        </>
      ) : (
        <>
          <Txt color="textSecondary">{t('ai.intro')}</Txt>
          <Row wrap>
            {getProviders().map((p) => (
              <Badge key={p.id} label={`${t(`ai.provider.${p.id}`)}: ${p.isAvailable() ? t('common.on') : t('ai.pendingSetup')}`} tone={p.isAvailable() ? 'success' : 'neutral'} />
            ))}
          </Row>
          {DOMAINS.filter((d) => !settings.ai.domains[d]).map((d) => (
            <Txt key={d} variant="caption" color="textMuted">
              {t('ai.domainOff', { domain: t(`domain.${d}`) })}
            </Txt>
          ))}
          {error ? <Notice tone="danger" text={t('state.errorBody')} /> : null}
          {answer && answer.insights.length === 0 ? <EmptyState icon="sparkles-outline" body={t('ai.noInsights')} /> : null}
          {answer?.insights.map((i) => <InsightCard key={i.id} insight={i} />)}
          {answer?.actions.length ? (
            <>
              <SectionHeader title={t('ai.suggestedActions')} />
              {answer.actions.map((a) => (
                <Card key={a.id}>
                  <Txt>{t(a.summaryKey, a.params)}</Txt>
                  <Button small label={t('ai.review')} onPress={() => approve(a)} testID={`ai-action-${a.id}`} />
                </Card>
              ))}
            </>
          ) : null}
          <Notice text={t('ai.noProvider')} />
          <Button variant="ghost" label={t('set.ai')} onPress={() => router.push('/settings/ai')} />
        </>
      )}
    </Screen>
  );
}
