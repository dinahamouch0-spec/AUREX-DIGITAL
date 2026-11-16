import { router } from 'expo-router';
import React, { useMemo } from 'react';

import { generateInsights } from '@/domain/aggregate';
import { DOMAINS } from '@/domain/types';
import { store, useApp, useStoreVersion } from '@/state/AppContext';
import { InsightCard } from '@/ui/InsightCard';
import { Button, EmptyState, Notice, Screen, Txt } from '@/ui/primitives';

/**
 * Local assistant: deterministic insights computed on-device from the
 * domains the user allows. No external AI provider is connected (decision
 * pending — blueprint 10 §8). It never changes data; insights only link to
 * screens.
 */
export default function Assistant() {
  const { t, settings, today } = useApp();
  const version = useStoreVersion();
  const allowed = DOMAINS.filter((d) => settings.ai.domains[d]);
  const insights = useMemo(
    () => (settings.ai.enabled ? generateInsights(store.list.bind(store) as never, { today, now: new Date(), timeZone: settings.timezone, weekStart: settings.weekStart, allowedDomains: allowed }) : []),
    [version, settings.ai, today],
  );
  return (
    <Screen title={t('ai.title')} testID="screen-assistant">
      <Notice text={t('ai.noProvider')} />
      {!settings.ai.enabled ? (
        <>
          <EmptyState icon="sparkles-outline" body={t('ai.disabled')} />
          <Button label={t('set.ai')} onPress={() => router.push('/settings/ai')} />
        </>
      ) : (
        <>
          <Txt color="textSecondary">{t('ai.intro')}</Txt>
          {DOMAINS.filter((d) => !settings.ai.domains[d]).map((d) => (
            <Txt key={d} variant="caption" color="textMuted">
              {t('ai.domainOff', { domain: t(`domain.${d}`) })}
            </Txt>
          ))}
          {insights.length === 0 ? <EmptyState icon="sparkles-outline" body={t('ai.noInsights')} /> : insights.map((i) => <InsightCard key={i.id} insight={i} />)}
          <Button variant="ghost" label={t('set.ai')} onPress={() => router.push('/settings/ai')} />
        </>
      )}
    </Screen>
  );
}
