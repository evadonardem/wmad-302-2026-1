/**
 * App Layout - protected routes with an auth guard.
 * Signing out (or an unrefreshable session) flips `isAuthenticated` and redirects to login here.
 */
import { Redirect, Stack, usePathname } from 'expo-router';
import React from 'react';
import { useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { routes } from '@/utils/routes';

/** Deep links to these screens survive the trip through the login screen. */
const DEEP_LINK_PATTERN = /^\/(product|orders)\//;

export default function AppLayout() {
  const theme = useAppTheme();
  const { isAuthenticated, isHydrated } = useAuth();
  const pathname = usePathname();

  // The splash screen is still showing while the saved session is checked.
  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href={routes.login(DEEP_LINK_PATTERN.test(pathname) ? pathname : undefined)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.dark ? theme.colors.primaryContainer : theme.colors.primary,
        },
        headerTintColor: theme.dark ? theme.colors.onPrimaryContainer : theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Product details' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="orders/index" options={{ title: 'My orders' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Order details' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="addresses" options={{ title: 'Addresses' }} />
      <Stack.Screen name="wishlist" options={{ title: 'Wishlist' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
