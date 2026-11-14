
/**
 * App Layout - Protected routes with authentication guard
 */

import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main application tabs */}
      <Stack.Screen name="(tabs)" />

      {/* Recipe Details screen */}
      <Stack.Screen name="recipe/[id]" />
    </Stack>
  );
}
