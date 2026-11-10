import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// TODO 21 [Tab Bar Configuration]: Configure the bottom tab bar inside the empty
// screenOptions object below. At minimum set:
// - tabBarActiveTintColor / tabBarInactiveTintColor (pull colors from useTheme() if you like)
// - headerTitle styling (font weight, colors) to match your theme
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      // [Your code here]
    }}>
      {/* TODO 22 [Tab Screen Registration]: The three screens below are already routed by
          file name. For EACH <Tabs.Screen /> add an 'options' entry with:
          - title: a human-readable tab label
          - tabBarIcon: an Ionicons render function receiving { color, size }
            (suggested icons: "home", "heart", "settings") */}
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
