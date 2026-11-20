/**
 * App Layout - Protected routes with auth guard
 */
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { fontFamily } from '@/constants/theme';

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
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        headerTitleStyle: { fontFamily: fontFamily.displaySemi },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* Recipe detail and cooking mode slide up from the bottom */}
      <Stack.Screen name="recipe/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="cook/[id]"
        options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      {/* Other screens slide in from the side, with a back button */}
      <Stack.Screen name="shopping-list" options={{ headerShown: true, title: 'Shopping list' }} />
      <Stack.Screen name="meal-plan" options={{ headerShown: true, title: 'Meal planner' }} />
      <Stack.Screen name="collections" options={{ headerShown: true, title: 'Collections' }} />
      <Stack.Screen name="collection/[id]" options={{ headerShown: true, title: 'Collection' }} />
      <Stack.Screen name="fridge" options={{ headerShown: true, title: "What's in my fridge?" }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="my-recipes" options={{ headerShown: true, title: 'My Recipes' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
    </Stack>
  );
}