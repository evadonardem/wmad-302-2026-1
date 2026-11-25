/**
 * App Layout - Protected routes with auth guard
 *
 * Marketplace App
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
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="product/[id]" />

      <Stack.Screen name="settings" />

      <Stack.Screen name="checkout" />

      <Stack.Screen name="my-orders" />

      <Stack.Screen name="order-confirmation" />

      <Stack.Screen name="order-details/[id]" />

      <Stack.Screen name="contact-information" />

      <Stack.Screen name="shipping-address" />

      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}