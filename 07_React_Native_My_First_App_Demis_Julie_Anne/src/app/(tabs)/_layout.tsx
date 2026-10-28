import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Your Favorite Quotes</Text>

      {/* TODO 23 */}
      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        favorites.map((quote, index) => (
          <View
            key={`${quote.text}-${quote.author}-${index}`}
            style={[styles.row, { backgroundColor: theme.colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                {`"${quote.text}"`}
              </Text>
              <Text style={[styles.rowAuthor, { color: theme.colors.textSecondary }]}>
                {`— ${quote.author}`}
              </Text>
            </View>

            <Pressable style={styles.removeButton} onPress={() => removeFavorite(quote)}>
              <Ionicons name="trash-outline" size={22} color="#e53935" />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
} import { Tabs } from 'expo-router';
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
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      },
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { fontWeight: '700' },
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
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}