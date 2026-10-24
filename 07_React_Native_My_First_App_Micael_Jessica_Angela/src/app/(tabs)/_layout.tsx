import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

// TODO 21 [Tab Bar Configuration]: Configure the bottom tab bar inside the empty
// screenOptions object below. At minimum set:
// - tabBarActiveTintColor / tabBarInactiveTintColor (pull colors from useTheme() if you like)
// - headerTitle styling (font weight, colors) to match your theme
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarStyle: { backgroundColor: theme.colors.surface },
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTitleStyle: { color: theme.colors.text, fontWeight: '600' },
    }}>
      {/* TODO 22 [Tab Screen Registration]: The three screens below are already routed by
          file name. For EACH <Tabs.Screen /> add an 'options' entry with:
          - title: a human-readable tab label
          - tabBarIcon: an Ionicons render function receiving { color, size }
            (suggested icons: "home", "heart", "settings") */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              color={typeof color === 'number' ? theme.colors.primary : color ?? theme.colors.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="heart"
              color={typeof color === 'number' ? theme.colors.primary : color ?? theme.colors.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings"
              color={typeof color === 'number' ? theme.colors.primary : color ?? theme.colors.primary}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
