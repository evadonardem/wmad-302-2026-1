import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// TODO 4.1 [Tab Bar Configuration]: Configure the bottom tab bar inside the empty
// screenOptions object below. At minimum set:
// - tabBarActiveTintColor / tabBarInactiveTintColor (Paper's theme.colors from useTheme()
//   works great here so the tab bar follows your light/dark MD3 palette)
// - headerTitle styling (font weight, colors) to match your theme
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      // [Your code here]
    }}>
      {/* TODO 4.2 [Tab Screen Registration]: Both screens below are already routed by file name.
          For EACH <Tabs.Screen /> add an 'options' entry with:
          - title: a human-readable tab label
          - tabBarIcon: an Ionicons render function receiving { color, size }
            (suggested icons: "search" for the Search tab, "information-circle-outline" for About) */}
      <Tabs.Screen name="index" options={{ title: 'Search' }} />
      <Tabs.Screen name="about" options={{ title: 'About' }} />
    </Tabs>
  );
}
