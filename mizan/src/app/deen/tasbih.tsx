import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { saveDhikrCount } from '@/data/usecases';
import { store, useApp } from '@/state/AppContext';
import { spacing } from '@/theme/tokens';
import { Button, Chip, Row, Screen, Txt } from '@/ui/primitives';
import { usePalette } from '@/ui/theme';

export default function Tasbih() {
  const { t, fmt, showToast } = useApp();
  const p = usePalette();
  const [count, setCount] = useState(0);
  const [category, setCategory] = useState<'tasbih' | 'istighfar'>('tasbih');
  return (
    <Screen title={t('deen.tasbih')} testID="screen-tasbih">
      <Row wrap>
        <Chip label={t('opt.adhkar.tasbih')} selected={category === 'tasbih'} onPress={() => setCategory('tasbih')} />
        <Chip label={t('opt.adhkar.istighfar')} selected={category === 'istighfar'} onPress={() => setCategory('istighfar')} />
      </Row>
      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <Pressable
          testID="tasbih-tap"
          onPress={() => setCount((c) => c + 1)}
          accessibilityRole="button"
          accessibilityLabel={`${t(`opt.adhkar.${category}`)} ${count}`}
          style={({ pressed }) => ({ width: 220, height: 220, borderRadius: 110, borderWidth: 3, borderColor: p.accent, backgroundColor: pressed ? p.accentMuted : p.surface, alignItems: 'center', justifyContent: 'center' })}>
          <Txt variant="display" style={{ fontSize: 56, lineHeight: 64 }} testID="tasbih-count">
            {fmt.number(count)}
          </Txt>
        </Pressable>
      </View>
      <Row>
        <Button
          label={t('deen.tasbihSave', { n: count })}
          disabled={count === 0}
          style={{ flex: 1 }}
          testID="tasbih-save"
          onPress={() => {
            saveDhikrCount(store, category, count, new Date());
            showToast({ message: t('deen.tasbihSaved') });
            setCount(0);
          }}
        />
        <Button label={t('deen.tasbihReset')} variant="secondary" onPress={() => setCount(0)} disabled={count === 0} />
      </Row>
    </Screen>
  );
}
