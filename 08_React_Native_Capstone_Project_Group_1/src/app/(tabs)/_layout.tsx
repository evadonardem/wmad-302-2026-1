import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

export default function TabsLayout() {
  const theme = useTheme();

  const activeColor =
    typeof theme.colors.primary === 'string'
      ? theme.colors.primary
      : '#176B45';

  const inactiveColor =
    typeof theme.colors.onSurfaceVariant === 'string'
      ? theme.colors.onSurfaceVariant
      : '#79747E';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="search"
              color={focused ? activeColor : inactiveColor}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="information-circle-outline"
              color={focused ? activeColor : inactiveColor}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}