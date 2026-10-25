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

      {favorites.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
          No favorites yet — tap the heart on a quote to save it here.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          {favorites.map((item) => (
            <View
              key={item.text}
              style={[styles.row, { backgroundColor: theme.colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { color: theme.colors.text }]}>
                  "{item.text}"
                </Text>
                <Text style={[styles.rowAuthor, { color: theme.colors.textSecondary }]}>
                  — {item.author}
                </Text>
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeFavorite(item)}
              >
                <Ionicons name="trash-outline" size={20} color="#e53935" />
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
    padding: 20,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  empty: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  rowAuthor: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});