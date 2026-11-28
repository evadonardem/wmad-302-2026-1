/**
 * App Layout - Protected routes with auth guard
 * Deep links such as marketplace://product/12 or a shared cart link land here;
 * signed-out users are sent to login with `redirect` (path + query) so they
 * return to the same screen afterwards.
 */
import React from 'react';
import { View } from 'react-native';
import { Redirect, Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { FlyToCartProvider } from '@/components/FlyToCart';

/** "/shared" + { items: "1x2" } -> "/shared?items=1x2" */
function withQuery(pathname: string, params: Record<string, string | string[] | undefined>): string {
  const query = Object.entries(params)
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
    .join('&');
  return query ? `${pathname}?${query}` : pathname;
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { palette, heading, t } = useSettings();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  // The splash screen covers the initial session check
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated (also fires after logout or a failed token refresh)
  if (!isAuthenticated) {
    const keepTarget = pathname && pathname !== '/' && pathname !== '/home';
    // Dynamic segments like [id] are already part of the pathname
    const query = Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'id'));
    return (
      <Redirect
        href={keepTarget ? { pathname: '/login', params: { redirect: withQuery(pathname, query) } } : '/login'}
      />
    );
  }

  return (
    <FlyToCartProvider>
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: true,
            // Theme-colored headers in the season's display font
            headerTintColor: palette.onPrimary,
            headerTitleStyle: { color: palette.onPrimary, ...heading(20) } as { color: string; fontFamily?: string },
            headerStyle: { backgroundColor: palette.primary },
            headerShadowVisible: false,
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: palette.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: t('title.product') }} />
          <Stack.Screen name="checkout" options={{ title: t('title.checkout') }} />
          <Stack.Screen name="orders/index" options={{ title: t('title.orders') }} />
          <Stack.Screen name="orders/[id]" options={{ title: t('title.order') }} />
          <Stack.Screen name="wishlist" options={{ title: t('title.wishlist') }} />
          <Stack.Screen name="compare" options={{ title: t('title.compare') }} />
          <Stack.Screen name="edit-profile" options={{ title: t('title.editProfile') }} />
          <Stack.Screen name="addresses" options={{ title: t('title.addresses') }} />
          <Stack.Screen name="payment-methods" options={{ title: t('title.payments') }} />
          <Stack.Screen name="settings" options={{ title: t('title.settings') }} />
          <Stack.Screen name="rewards" options={{ title: t('title.rewards') }} />
          <Stack.Screen name="advent" options={{ title: t('title.advent') }} />
          <Stack.Screen name="gift-lists" options={{ title: t('title.giftLists') }} />
          <Stack.Screen name="shared" options={{ title: t('title.shared') }} />
        </Stack>
      </View>
    </FlyToCartProvider>
  );
}
