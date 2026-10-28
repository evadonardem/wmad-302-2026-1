import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import React from 'react';

// TODO 21 [Tab Bar Configuration]: Configure the bottom tab bar inside the empty

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      headerTitleStyle: {
        fontWeight: '600',
        color: theme.colors.text,
      },
      headerStyle: {
        backgroundColor: theme.colors.surface,
      },
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      },
    }}>
      {/* Your Tabs.Screen entries go here later */}
    </Tabs>
  );
}

          {/* TODO 22 [Tab Screen Registration] */}
      <><Tabs.Screen
  name="index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
  }} /><Tabs.Screen
    name="favorites"
    options={{
      title: 'Favorites',
      tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />
    }} /><Tabs.Screen
    name="settings"
    options={{
      title: 'Settings',
      tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />
    }} /></>