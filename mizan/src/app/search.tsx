import { router } from 'expo-router';
import React, { useState } from 'react';

import { searchRecords } from '@/domain/aggregate';
import { DOMAINS, Domain } from '@/domain/types';
import { domainOf, listAll, useApp, useStoreVersion } from '@/state/AppContext';
import { agendaRoute } from '@/ui/agenda';
import { Input } from '@/ui/fields';
import { DomainDot, EmptyState, FilterChips, ListItem, Screen, Txt } from '@/ui/primitives';

export default function Search() {
  const { t } = useApp();
  const version = useStoreVersion();
  const [q, setQ] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  void version; // re-render on any store change
  const results = searchRecords(listAll as never, q, domainOf, domains);
  return (
    <Screen title={t('search.title')} testID="screen-search">
      <Input value={q} onChangeText={setQ} placeholder={t('search.placeholder')} accessibilityLabel={t('search.placeholder')} autoFocus testID="search-input" />
      <FilterChips options={[...DOMAINS, 'general'] as Domain[]} value={domains} onChange={(d) => setDomains((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]))} labelOf={(d) => t(`domain.${d}`)} />
      {q.trim().length < 2 ? (
        <Txt color="textMuted">{t('search.hint')}</Txt>
      ) : results.length === 0 ? (
        <EmptyState icon="search-outline" title={t('state.noResults')} body={t('search.hint')} />
      ) : (
        results.map((r) => (
          <ListItem
            key={`${r.collection}:${r.id}`}
            testID={`search-result-${r.id}`}
            left={<DomainDot domain={r.domain} />}
            title={r.title || t('common.untitled')}
            subtitle={`${t(`col.${r.collection}`)} · ${t(`field.${r.field}`)}`}
            onPress={() => router.push((agendaRoute({ key: '', domain: r.domain, start: null, source: { collection: r.collection, id: r.id } }) ?? '/') as never)}
          />
        ))
      )}
    </Screen>
  );
}
