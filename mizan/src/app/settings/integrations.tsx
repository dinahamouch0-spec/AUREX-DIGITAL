import React, { useEffect, useState } from 'react';

import { INTEGRATIONS } from '@/integrations/appleHealth';
import type { IntegrationStatus } from '@/integrations/types';
import { useApp } from '@/state/AppContext';
import { Badge, Card, Notice, Row, Screen, Txt } from '@/ui/primitives';

export default function Integrations() {
  const { t } = useApp();
  const [status, setStatus] = useState<Record<string, IntegrationStatus>>({});
  useEffect(() => {
    Promise.all(INTEGRATIONS.map(async (i) => [i.id, await i.status()] as const)).then((r) => setStatus(Object.fromEntries(r)));
  }, []);
  return (
    <Screen title={t('int.title')} testID="screen-integrations">
      <Notice text={t('int.intro')} />
      {INTEGRATIONS.map((i) => (
        <Card key={i.id} testID={`integration-${i.id}`}>
          <Row style={{ justifyContent: 'space-between' }} wrap>
            <Txt variant="heading">{t(i.nameKey)}</Txt>
            <Badge label={t(`int.status.${status[i.id] ?? 'unavailable'}`)} tone={status[i.id] === 'connected' ? 'success' : 'neutral'} />
          </Row>
          <Txt color="textSecondary">{t(i.descriptionKey)}</Txt>
          <Txt variant="label">{t('int.scopes')}</Txt>
          {i.scopes.map((s) => (
            <Txt key={s.id} variant="caption" color="textSecondary">
              • {t(s.labelKey)} ({t(`int.access.${s.access}`)})
            </Txt>
          ))}
          {i.unavailableReasonKey ? <Notice tone="warning" text={t(i.unavailableReasonKey)} /> : null}
        </Card>
      ))}
    </Screen>
  );
}
