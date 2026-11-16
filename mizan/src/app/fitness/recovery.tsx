import { router } from 'expo-router';
import React from 'react';

import { useApp } from '@/state/AppContext';
import { Button, Notice, Screen } from '@/ui/primitives';
import { RecordList, newRecordHref } from '@/ui/records';

export default function Recovery() {
  const { t, today, fmt } = useApp();
  return (
    <Screen title={t('fit.recovery')} testID="screen-recovery">
      <Notice text={t('fit.recoveryNote')} />
      <Button label={t('common.add')} icon="add" onPress={() => router.push(newRecordHref('recovery_logs', { local_date: today }) as never)} testID="recovery-add" />
      <RecordList
        collection="recovery_logs"
        subtitle={(r) =>
          [r.sleep_hours != null ? `${t('field.sleep_hours')} ${fmt.number(r.sleep_hours as number)}` : null, r.energy != null ? `${t('field.energy')} ${r.energy}/5` : null, r.soreness != null ? `${t('field.soreness')} ${r.soreness}/5` : null]
            .filter(Boolean)
            .join(' · ')
        }
      />
    </Screen>
  );
}
