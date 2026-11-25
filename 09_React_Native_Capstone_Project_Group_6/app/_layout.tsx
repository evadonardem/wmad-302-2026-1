/**
 * Root Layout - Entry point with providers
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Providers } from './providers';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <Providers>
      <AppErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AppErrorBoundary>
    </Providers>
  );
}