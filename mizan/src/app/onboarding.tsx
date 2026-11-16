import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useApp } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { TextField } from '@/ui/fields';
import { Button, Card, Chip, Icon, Row, Screen, Txt } from '@/ui/primitives';

export default function Onboarding() {
  const { t, settings, updateSettings } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.displayName);
  const finish = () => {
    updateSettings({ displayName: name.trim(), onboarded: true });
    router.replace('/');
  };
  return (
    <Screen title={t('onb.welcome')} back={false} testID="screen-onboarding">
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Txt variant="display" color="accent" align="center">
          ميزان · MIZAN
        </Txt>
        <Txt color="textSecondary" align="center">
          {t('onb.intro')}
        </Txt>
      </View>
      {step === 0 ? (
        <Card>
          <Txt variant="heading">{t('onb.chooseLanguage')}</Txt>
          <Row wrap>
            <Chip label="العربية" selected={settings.locale === 'ar'} onPress={() => updateSettings({ locale: 'ar' })} testID="onb-lang-ar" />
            <Chip label="English" selected={settings.locale === 'en'} onPress={() => updateSettings({ locale: 'en' })} testID="onb-lang-en" />
          </Row>
          <Button label={t('onb.next')} onPress={() => setStep(1)} testID="onb-next" />
        </Card>
      ) : step === 1 ? (
        <Card>
          <TextField label={t('onb.name')} value={name} onChange={setName} testID="onb-name" hint={t('common.optional')} />
          <Button label={t('onb.next')} onPress={() => setStep(2)} testID="onb-next" />
        </Card>
      ) : (
        <Card>
          <Txt variant="heading">{t('onb.privacyTitle')}</Txt>
          {(['onb.privacy1', 'onb.privacy2', 'onb.privacy3'] as const).map((k) => (
            <Row key={k} style={{ alignItems: 'flex-start' }}>
              <Icon name="shield-checkmark-outline" color="accent" />
              <Txt style={{ flex: 1 }}>{t(k)}</Txt>
            </Row>
          ))}
          <Button label={t('onb.start')} onPress={finish} testID="onb-start" />
        </Card>
      )}
    </Screen>
  );
}
