import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Your Favorite Quotes</Text>

      {/* TODO 23 [Favorites List Mapping]: Build the favorites list below:
          a. Wrap the pre-rendered empty-state message below in a conditional so it only
             appears when 'favorites' is empty — otherwise show the list instead.
          b. Otherwise map through 'favorites' and render a row for each quote with a unique key,
             its text (styles.rowText) and author (styles.rowAuthor).
          c. Give each row a remove <Pressable> (Ionicons "trash-outline", styles.removeButton)
             wired to removeFavorite(quote). */}
      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          {favorites.map((quote) => (
            <View
              key={quote.text}
              style={[styles.row, { backgroundColor: theme.colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { flex: 0, color: theme.colors.text }]}>
                  &ldquo;{quote.text}&rdquo;
                </Text>
                <Text style={[styles.rowAuthor, { color: theme.colors.textSecondary }]}>
                  — {quote.author}
                </Text>
              </View>
              <Pressable style={styles.removeButton} onPress={() => removeFavorite(quote)}>
                <Ionicons name="trash-outline" size={22} color={theme.colors.text} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
  rowAuthor: {
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    padding: 6,
  },
});