/**
 * Tabs Layout - the pages of the app: Discover, Search, Planner, Favorites, Profile (and Categories,
 * reached from Home). The navigation bar itself lives in app/(app)/_layout.tsx so it also shows on
 * recipe pages, so the built-in tab bar is switched off here.
 */
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="home" options={{ title: 'Discover' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="categories" options={{ href: null }} />
    </Tabs>
  );
}