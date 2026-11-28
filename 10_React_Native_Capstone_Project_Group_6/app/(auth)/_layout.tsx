/**
 * Auth Layout - public routes (login, register). Signed-in users are sent on to the app
 * (or back to the page they were trying to open).
 */
import { Redirect, Stack, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { safeRedirect } from '@/utils/routes';

export default function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuth();
  const { redirect } = useGlobalSearchParams<{ redirect?: string }>();

  if (isHydrated && isAuthenticated) {
    return <Redirect href={safeRedirect(redirect)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
