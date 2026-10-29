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

      {/* TODO 23 [Favorites List Mapping] */}
      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        favorites.map((quote) => (
          <View key={`${quote.text}-${quote.author}`} style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowText}>{quote.text}</Text>
              <Text style={styles.rowAuthor}>— {quote.author}</Text>
            </View>
            <Pressable onPress={() => removeFavorite(quote)} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
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
    backgroundColor: '#4a1d82',
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#ffffff',
  },
  rowAuthor: {
    fontSize: 12,
    marginTop: 4,
    color: '#d9c7f5',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e53935',
  },
});