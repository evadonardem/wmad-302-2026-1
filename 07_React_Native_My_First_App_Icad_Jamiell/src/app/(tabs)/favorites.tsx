import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headingBlock}>
        <View style={styles.headingRow}>
          <Ionicons name="heart" size={24} color={theme.colors.accent} />
          <Text style={[styles.heading, { color: theme.colors.text }]}>Your favorites</Text>
        </View>
        <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
          The words worth keeping close.
        </Text>
      </View>

      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        favorites.map((quote) => (
          <View
            key={quote.text}
            style={[styles.row, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.colors.text }]}>{quote.text}</Text>
              <Text style={[styles.rowAuthor, { color: theme.colors.textSecondary }]}>
                — {quote.author}
              </Text>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => removeFavorite(quote)}
              accessibilityRole="button"
              accessibilityLabel={`Remove quote by ${quote.author}`}
            >
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
    fontSize: 28,
    fontWeight: '800',
  },
  headingBlock: {
    gap: 6,
    marginBottom: 8,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  subheading: {
    fontSize: 14,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  rowText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  rowContent: {
    flex: 1,
  },
  rowAuthor: {
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    padding: 6,
    borderRadius: 10,
  },
});
