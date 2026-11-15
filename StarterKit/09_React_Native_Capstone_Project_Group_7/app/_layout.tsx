/**
 * Root Layout - Entry point with providers
 */
import { Stack } from 'expo-router';
import { Providers } from './providers';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </Providers>
  );
}