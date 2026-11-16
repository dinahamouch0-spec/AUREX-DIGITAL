import { router } from 'expo-router';
import React from 'react';

import { DOMAINS } from '@/domain/types';
import { useApp } from '@/state/AppContext';
import { DOMAIN_COLORS } from '@/theme/tokens';
import { Card, ChevronForward, Icon, IconName, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { TopActions } from '@/ui/TopActions';

const ICONS: Record<string, IconName> = { deen: 'moon-outline', fitness: 'barbell-outline', academics: 'school-outline', business: 'briefcase-outline', habits: 'repeat-outline' };

export default function Sections() {
  const { t } = useApp();
  return (
    <Screen title={t('sec.title')} back={false} actions={<TopActions />} testID="screen-sections">
      {DOMAINS.map((d) => (
        <Card key={d} onPress={() => router.push(`/${d}` as never)} testID={`section-${d}`} accessibilityLabel={t(`domain.${d}`)} style={{ borderStartWidth: 3, borderStartColor: DOMAIN_COLORS[d] }}>
          <Row>
            <Icon name={ICONS[d]} size={26} color={DOMAIN_COLORS[d]} />
            <Txt variant="heading" style={{ flex: 1 }}>
              {t(`domain.${d}`)}
            </Txt>
            <ChevronForward />
          </Row>
          <Txt color="textSecondary">{t(`domain.${d}.desc`)}</Txt>
        </Card>
      ))}
      <SectionHeader title={t('set.general')} />
      {(
        [
          ['tasks', 'checkbox-outline'],
          ['calendar_events', 'calendar-outline'],
          ['reminders', 'alarm-outline'],
        ] as const
      ).map(([c, icon]) => (
        <Card key={c} onPress={() => router.push(`/records/${c}`)} testID={`section-${c}`}>
          <Row>
            <Icon name={icon} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {t(`col.${c}`)}
            </Txt>
            <ChevronForward />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
