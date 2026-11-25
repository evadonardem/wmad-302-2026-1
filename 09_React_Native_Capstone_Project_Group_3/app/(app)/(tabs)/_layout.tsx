/**
 * Tabs Layout - Cookbook App Navigation
 * Tabs: Home (Discover), Search, Favorites, Profile
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useAppTheme } from '@/constants/theme';

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return React.createElement(Text, { style: { color, fontSize: 24, lineHeight: 28 } }, symbol);
}

export default function TabsLayout() {
  const theme = useAppTheme();

  return React.createElement(
    Tabs,
    {
      screenOptions: {
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      },
    },
    React.createElement(Tabs.Screen, {
      name: 'home',
      options: {
        title: 'Discover',
        tabBarIcon: ({ color }: { color: string }) => React.createElement(TabIcon, { symbol: '♨', color }),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: 'search',
      options: {
        title: 'Search',
        tabBarIcon: ({ color }: { color: string }) => React.createElement(TabIcon, { symbol: '⌕', color }),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: 'categories',
      options: {
        title: 'Categories',
        tabBarIcon: ({ color }: { color: string }) => React.createElement(TabIcon, { symbol: '▦', color }),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: 'favorites',
      options: {
        title: 'Favorites',
        tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => React.createElement(TabIcon, { symbol: focused ? '♥' : '♡', color }),
      },
    }),
    React.createElement(Tabs.Screen, {
      name: 'profile',
      options: {
        title: 'Profile',
        tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => React.createElement(TabIcon, { symbol: focused ? '●' : '○', color }),
      },
    }),
  );
}