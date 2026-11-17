/**
 * Auth Layout - Public routes only (login, register)
 */
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoadingAuth: isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Prevent authenticated users from accessing login.tsx or register.tsx
  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/home' as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}