/**
 * Root Layout - entry point. Providers wrap everything; SplashGate hides the splash screen
 * once the saved session has been checked.
 */
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { ReactNode, useEffect } from 'react';
import { Providers } from './providers';
import { useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function SplashGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return isLoading ? null : <>{children}</>;
}

export default function RootLayout() {
  return (
    <Providers>
      <SplashGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SplashGate>
    </Providers>
  );
}
