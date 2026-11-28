/**
 * Auth Layout - Public routes only (login, register)
 * Signed-in users are sent on: to the deep link they originally opened
 * (`?redirect=/product/12`) or to the shop.
 */
import { Redirect, Stack, useGlobalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { safeRedirect } from '@/utils/navigation';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const { redirect } = useGlobalSearchParams<{ redirect?: string }>();

  if (isAuthenticated) {
    return <Redirect href={safeRedirect(redirect)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
