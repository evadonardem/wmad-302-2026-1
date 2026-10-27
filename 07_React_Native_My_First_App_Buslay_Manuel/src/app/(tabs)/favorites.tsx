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

      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        favorites.map((quote) => (
          <View key={quote.text} style={[styles.row, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: theme.colors.text }]}>{quote.text}</Text>
              <Text style={[styles.rowAuthor, { color: theme.colors.textSecondary }]}>— {quote.author}</Text>
            </View>
            <Pressable style={styles.removeButton} onPress={() => removeFavorite(quote)}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        ))
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
