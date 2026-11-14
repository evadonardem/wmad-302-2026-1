/**
 * Root Layout - Entry point with providers
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Providers } from './providers';
import { useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { tc, useAppTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Hides the splash screen once the saved session has been checked. */
function SplashGate() {
  const { isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading]);
  return null;
}

/** Stack lives inside the providers so its background can follow light / dark mode. */
function RootStack() {
  useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: tc('#FEF9FB', 'backgroundColor') },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Providers>
        <SplashGate />
        <RootStack />
      </Providers>
    </ErrorBoundary>
  );
}