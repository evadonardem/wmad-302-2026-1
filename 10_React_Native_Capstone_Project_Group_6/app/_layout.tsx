/**
 * Root Layout - entry point. Providers wrap everything; SplashGate hides the splash screen
 * once the saved session has been checked.
 */
import { Stack } from 'expo-router';
import React from 'react';
import { Providers } from '@/components/Providers';
import { SplashGate } from '@/components/SplashGate';

export default function RootLayout() {
  return (
    <Providers>
      <SplashGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </Providers>
  );
}
