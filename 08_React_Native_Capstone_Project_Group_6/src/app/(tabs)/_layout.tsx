import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import type { ColorValue, NativeColorValue } from 'react-native';

const iconColor = (color: ColorValue): string | NativeColorValue | undefined =>
  color === null || typeof color === 'number' ? undefined : color;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    // TODO 4.1 [Tab Bar Configuration]: follows the Paper MD3 light/dark palette
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          display: 'none',
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: 'bold', color: theme.colors.onSurface },
      }}
    >
      {/* TODO 4.2 [Tab Screen Registration] */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={iconColor(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
