import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.surfaceVariant,
        height: 70,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
      headerStyle: { backgroundColor: theme.colors.background },
      headerTintColor: theme.colors.onBackground,
      headerTitleStyle: { fontWeight: '700' },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
