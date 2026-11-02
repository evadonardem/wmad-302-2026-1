import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useThemeMode } from '@/themeMode'; // ✅ Added for theme-aware colors

export default function TabsLayout() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode(); // ✅ Get theme mode for perfect color match

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          paddingHorizontal: '50%', // ✅ KEPT — balances About tab position
        },
        headerTitleAlign: 'center',
        // ✨ POLISHED: Title styling
        headerTitleStyle: {
          fontWeight: '800', // Bolder — premium brand feel
          fontSize: 20, // Slightly larger
          letterSpacing: 2, // Spaced letters — travel brand style
          color: isDarkMode ? '#5eead4' : '#0d9488', // ✅ Tropical teal → cyan in dark mode
        },
        headerStyle: {
          backgroundColor: 'transparent', // ✅ Let gradient show through beautifully
          elevation: 0, // Remove shadow for clean look
          borderBottomWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'LAKBAY PH', // ✅ KEPT — your title
          tabBarButton: () => null, // ✅ KEPT — Search stays hidden
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}