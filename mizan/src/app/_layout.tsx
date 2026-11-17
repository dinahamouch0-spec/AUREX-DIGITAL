import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Redirect, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/state/AppContext';
import { ConfirmHost, ToastHost } from '@/ui/overlays';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useIsDark, usePalette } from '@/ui/theme';
import { CelebrationHost } from '@/ui/celebrate';
import { enableCustomFonts } from '@/theme/typography';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell() {
  const { ready, loadError, rtl, settings } = useApp();
  const p = usePalette();
  const dark = useIsDark();
  const pathname = usePathname();
  useEffect(() => {
    if (ready || loadError) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, loadError]);

  if (loadError) return <View style={{ flex: 1, backgroundColor: p.background, justifyContent: 'center' }}><ErrorState message={loadError} /></View>;
  if (!ready) return <View style={{ flex: 1, backgroundColor: p.background }}><LoadingState /></View>;
  if (!settings.onboarded && pathname !== '/onboarding') return <Redirect href="/onboarding" />;

  return (
    // `direction` mirrors the whole layout for Arabic without an app restart.
    <View style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr', backgroundColor: p.background }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.background }, animation: rtl ? 'slide_from_left' : 'default' }} />
      <ToastHost />
      <ConfirmHost />
      <CelebrationHost />
    </View>
  );
}

const FONT_MAP = {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
};

export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_MAP);
  // never block the app on fonts: after 2.5 s continue with the system font
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(h);
  }, []);
  if (loaded) enableCustomFonts();
  if (!loaded && !error && !timedOut) return null; // splash stays visible meanwhile
  return (
    <>
      <SafeAreaProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </SafeAreaProvider>
    </>
  );
}
