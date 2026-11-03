
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useThemeMode } from '@/themeMode';

export default function TabsLayout() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  // ======================================
  // EMERALD THEME COLORS
  // ======================================

  const headerBackground = isDarkMode
    ? '#064332'
    : '#D8F3DC';

  const headerText = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  const activeColor = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  const inactiveColor = isDarkMode
    ? '#86A99B'
    : '#729487';

  const navigationBackground = isDarkMode
    ? '#064332'
    : '#D8F3DC';

  const navigationBorder = isDarkMode
    ? '#176B50'
    : '#B7E4C7';

  return (
    <Tabs
      screenOptions={{
        // BOTTOM NAVIGATION COLORS
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,

        tabBarStyle: {
          backgroundColor: navigationBackground,
          borderTopColor: navigationBorder,
          borderTopWidth: 1,
          paddingHorizontal: '50%',
        },

        // HEADER TITLE
        headerTitleAlign: 'center',

        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          letterSpacing: 2,
          color: headerText,
        },

        // HEADER BACKGROUND
        headerStyle: {
          backgroundColor: headerBackground,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: navigationBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'LAKBAY PH',
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="information-circle-outline"
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
