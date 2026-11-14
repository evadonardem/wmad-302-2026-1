
/**
 * Tabs Layout - Cookbook App Navigation
 * Main Tabs: Discover, Search, Favorites, Profile
 * Supports Global Light and Dark Mode.
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { isDark } = useThemeMode();

  const activeColor = isDark ? '#78C6A3' : '#24543D';
  const inactiveColor = isDark ? '#AAB8AE' : '#858B80';

  const backgroundColor = isDark ? '#15231C' : '#FFFDF7';
  const borderColor = isDark ? '#293B32' : '#EEECE4';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,

        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          backgroundColor,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 6,
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
        },

        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="chef-hat"
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
