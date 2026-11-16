import React, { useState } from 'react';
import { View } from 'react-native';

import { addDays } from '@/domain/dates';
import { rangePrayerSummary } from '@/domain/deen';
import { PRAYERS } from '@/domain/prayerTimes';
import { useApp, useCollection } from '@/state/AppContext';
import { radius, spacing } from '@/theme/tokens';
import { FilterChips, Icon, Notice, Row, Screen, Txt } from '@/ui/primitives';
import { usePalette } from '@/ui/theme';

export default function DeenHistory() {
  const { t, fmt, today } = useApp();
  const p = usePalette();
  const [days, setDays] = useState<'7' | '30'>('7');
  const logs = useCollection('prayer_logs');
  const from = addDays(today, -(Number(days) - 1));
  const r = rangePrayerSummary(logs, from, today);
  return (
    <Screen title={t('deen.history')} testID="screen-deen-history">
      <FilterChips options={['7', '30'] as const} value={days} onChange={setDays} labelOf={(d) => t(`an.range.${d}`)} />
      <Notice text={t('deen.historyLegend')} />
      <Txt color="textSecondary">
        {t('an.deen.performed')}: {fmt.number(r.totals.performed)} · {t('opt.pstatus.excused')}: {fmt.number(r.totals.excused)} · {t('opt.pstatus.missed')}: {fmt.number(r.totals.missed)} · {t('an.deen.notRecorded')}: {fmt.number(r.totals.notRecorded)}
      </Txt>
      <Row gap={spacing.xs}>
        <View style={{ width: 84 }} />
        {PRAYERS.map((pr) => (
          <Txt key={pr} variant="caption" color="textMuted" align="center" style={{ flex: 1 }} numberOfLines={1}>
            {t(`opt.prayer.${pr}`)}
          </Txt>
        ))}
      </Row>
      {[...r.days].reverse().map((d) => (
        <Row key={d.date} gap={spacing.xs} style={{ minHeight: 36 }}>
          <Txt variant="caption" style={{ width: 84 }}>
            {fmt.localDate(d.date, 'short')}
          </Txt>
          {PRAYERS.map((pr) => {
            const st = d.statuses[pr];
            return (
              <View
                key={pr}
                accessible
                accessibilityLabel={`${fmt.localDate(d.date)} ${t(`opt.prayer.${pr}`)}: ${t(`opt.pstatus.${st}`)}`}
                style={{ flex: 1, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: st === 'performed' ? p.success : p.border, backgroundColor: st === 'performed' ? p.accentMuted : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {st === 'performed' ? <Icon name="checkmark" size={16} color="success" /> : st === 'excused' ? <Txt variant="caption">E</Txt> : st === 'missed' ? <Icon name="remove" size={16} color="warning" /> : null}
              </View>
            );
          })}
        </Row>
      ))}
      <Txt variant="caption" color="textMuted">
        ✓ {t('opt.pstatus.performed')} · E {t('opt.pstatus.excused')} · − {t('opt.pstatus.missed')} · □ {t('opt.pstatus.not_recorded')}
      </Txt>
    </Screen>
  );
}
