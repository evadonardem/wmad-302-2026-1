/**
 * Root Layout - Global Stack & Auth Scaffolding
 */
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Providers } from './providers';
import { useAuth } from '@/context/AuthContext';
import { LoadingOverlay } from '@/components/CommonComponents';

function RootLayoutNav() {
  const { isAuthenticated, isLoadingAuth: isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait until both session hydration AND Expo Router navigation tree are ready
    if (isLoading || !rootNavigationState?.key) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inAppGroup = firstSegment === '(app)';
    const isAtRootIndex = !firstSegment || firstSegment === 'index';

    let targetRoute: string | null = null;

    if (!isAuthenticated) {
      // Redirect unauthenticated users to login if on protected routes or root URL
      if (inAppGroup || isAtRootIndex) {
        targetRoute = '/(auth)/login';
      }
    } else {
      // Redirect authenticated users away from login/register or root URL to Home,
      // while keeping them on their exact current page (e.g., cart, profile, product/[id]) on refresh
      if (inAuthGroup || isAtRootIndex) {
        targetRoute = '/(app)/(tabs)/home';
      }
    }

    if (targetRoute && lastRedirectRef.current !== targetRoute) {
      lastRedirectRef.current = targetRoute;
      router.replace(targetRoute as any);
    } else if (!targetRoute) {
      lastRedirectRef.current = null;
    }
  }, [isAuthenticated, isLoading, segments, rootNavigationState?.key, router]);

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Hydrating session..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}