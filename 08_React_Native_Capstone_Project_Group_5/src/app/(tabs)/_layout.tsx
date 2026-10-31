import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      // Both tab screens draw their own PH NAVYRA header, so the default header bar is hidden
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      // Surface tab bar with a thin gold line on top
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 2,
        borderTopColor: theme.colors.secondary,
      },
      tabBarLabelStyle: { fontWeight: '700' },
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.onSurface,
      headerTitleStyle: { fontWeight: '700', color: theme.colors.onSurface },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}