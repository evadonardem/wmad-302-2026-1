/**
 * Root Layout - Entry point with providers
 * Loads the theme fonts, keeps the splash screen up until the session and
 * settings are restored, and plays the theme-switch animation.
 */
import { useEffect } from 'react';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Providers } from '@/context/Providers';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeTransition } from '@/components/ThemeTransition';
import { SEASON_FONT_ASSETS, setFontsReady } from '@/constants/fonts';
import { subscribeToNotificationTaps } from '@/services/notifications';

// Keep the splash screen up until the stored session, settings and fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { hydrated, isDark, palette } = useSettings();
  const [fontsLoaded, fontError] = useFonts(SEASON_FONT_ASSETS);
  const fontsSettled = fontsLoaded || !!fontError;
  // Headings use the display fonts only when they actually loaded
  setFontsReady(fontsLoaded);

  useEffect(() => {
    if (!isLoading && hydrated && fontsSettled) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading, hydrated, fontsSettled]);

  // Tapping a notification (e.g. "Order placed") opens the screen it points to
  useEffect(() => subscribeToNotificationTaps((url) => router.push(url)), [router]);

  if (!fontsSettled) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ThemeTransition />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Providers>
        <RootNavigator />
      </Providers>
    </ErrorBoundary>
  );
}
