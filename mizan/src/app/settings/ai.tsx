import React from 'react';

import { DOMAINS } from '@/domain/types';
import { useApp } from '@/state/AppContext';
import { BooleanField } from '@/ui/fields';
import { Notice, Screen, SectionHeader } from '@/ui/primitives';

export default function AiSettings() {
  const { t, settings, updateSettings } = useApp();
  const ai = settings.ai;
  return (
    <Screen title={t('set.ai')} testID="screen-ai-settings">
      <Notice text={t('setai.explain')} />
      <BooleanField label={t('setai.enabled')} value={ai.enabled} onChange={(v) => updateSettings({ ai: { ...ai, enabled: v } })} testID="ai-enabled" />
      <SectionHeader title={t('setai.domains')} />
      {DOMAINS.map((d) => (
        <BooleanField key={d} label={t(`domain.${d}`)} value={ai.domains[d]} onChange={(v) => updateSettings({ ai: { ...ai, domains: { ...ai.domains, [d]: v } } })} testID={`ai-domain-${d}`} />
      ))}
      <Notice text={t('ai.noProvider')} />
    </Screen>
  );
}
