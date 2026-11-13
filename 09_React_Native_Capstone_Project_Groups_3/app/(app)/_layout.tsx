/**
 * App Layout - Protected routes with auth guard
 */
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return null; // Or a loading screen
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Recipe detail opens above the tabs, with a back button */}
      <Stack.Screen name="recipe/[id]" options={{ headerShown: true, title: 'Recipe' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="my-recipes" options={{ headerShown: true, title: 'My Recipes' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
      {/* Add other protected screens here */}
    </Stack>
  );
}