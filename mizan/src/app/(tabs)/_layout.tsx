import { TabList, TabSlot, TabTrigger, TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { fw } from '@/theme/typography';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/AppContext';
import { IconName, Icon } from '@/ui/primitives';
import { usePalette } from '@/ui/theme';
import { MIN_TOUCH, type } from '@/theme/tokens';

const TABS: { name: string; href: '/' | '/calendar' | '/analytics' | '/goals' | '/sections'; label: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', href: '/', label: 'tab.home', icon: 'home-outline', iconActive: 'home' },
  { name: 'calendar', href: '/calendar', label: 'tab.calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'analytics', href: '/analytics', label: 'tab.analytics', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'goals', href: '/goals', label: 'tab.goals', icon: 'flag-outline', iconActive: 'flag' },
  { name: 'sections', href: '/sections', label: 'tab.sections', icon: 'grid-outline', iconActive: 'grid' },
];

function TabButton({ isFocused, label, icon, iconActive, ...props }: TabTriggerSlotProps & { label: string; icon: IconName; iconActive: IconName }) {
  const p = usePalette();
  return (
    <Pressable
      {...(props as object)}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={{ flex: 1, minHeight: MIN_TOUCH + 8, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View style={{ paddingHorizontal: 14, paddingVertical: 3, borderRadius: 999, backgroundColor: isFocused ? p.accentMuted : 'transparent' }}>
        <Icon name={isFocused ? iconActive : icon} size={22} color={isFocused ? 'accent' : 'textMuted'} />
      </View>
      <Text style={[type.caption, { fontSize: 11, color: isFocused ? p.accent : p.textMuted, ...fw(isFocused ? '600' : '400') }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { t } = useApp();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={{ flexDirection: 'row', backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.border, paddingBottom: insets.bottom, paddingHorizontal: 4 }}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild testID={`tab-${tab.name}`}>
            <TabButton label={t(tab.label)} icon={tab.icon} iconActive={tab.iconActive} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}
