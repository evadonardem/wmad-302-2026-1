/**
 * Root Layout - Entry point with providers
 */
import { Stack } from 'expo-router';
import { Providers } from './providers';
import * as SplashScreen from 'expo-splash-screen';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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