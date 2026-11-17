import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { DOMAINS } from '@/domain/types';
import { useApp } from '@/state/AppContext';
import { DomainThemeKey, radius, spacing } from '@/theme/tokens';
import { FadeIn, IconBadge, PressableScale, useDomainTheme } from '@/ui/kit';
import { Card, ChevronForward, Icon, Row, Screen, SectionHeader, Txt } from '@/ui/primitives';
import { TopActions } from '@/ui/TopActions';
import { usePalette } from '@/ui/theme';

function DomainTile({ domain, index }: { domain: DomainThemeKey & (typeof DOMAINS)[number]; index: number }) {
  const { t } = useApp();
  const p = usePalette();
  const th = useDomainTheme(domain);
  return (
    <FadeIn delay={50 * index}>
      <PressableScale onPress={() => router.push(`/${domain}` as never)} testID={`section-${domain}`} accessibilityLabel={t(`domain.${domain}`)}>
        <LinearGradient colors={th.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: p.border, overflow: 'hidden', gap: spacing.xs }}>
          <View pointerEvents="none" style={{ position: 'absolute', end: -24, bottom: -24, opacity: 0.16 }}>
            <Icon name={th.icon} size={110} color={th.accent} />
          </View>
          <Row>
            <IconBadge icon={th.icon} color={th.accent} size={44} />
            <Txt variant="title" style={{ flex: 1 }}>
              {t(`domain.${domain}`)}
            </Txt>
            <ChevronForward />
          </Row>
          <Txt color="textSecondary">{t(`domain.${domain}.desc`)}</Txt>
        </LinearGradient>
      </PressableScale>
    </FadeIn>
  );
}

export default function Sections() {
  const { t } = useApp();
  return (
    <Screen title={t('sec.title')} back={false} actions={<TopActions />} testID="screen-sections">
      {DOMAINS.filter((d) => d !== 'general').map((d, i) => (
        <DomainTile key={d} domain={d as DomainThemeKey & (typeof DOMAINS)[number]} index={i} />
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
            <Icon name={icon} color="accent" />
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
