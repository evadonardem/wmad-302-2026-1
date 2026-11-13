import { Pressable, StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headingBlock}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Your favorites</Text>
        <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
          The words worth keeping close.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.border} />
            <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
              No favorites yet.{'\n'}Tap the heart on a quote to save it here.
            </Text>
          </View>
        ) : (
          favorites.map((quote) => (
            <View
              key={quote.text}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.quoteText, { color: theme.colors.text }]}>&quot;{quote.text}&quot;</Text>
                <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
                  — {quote.author}
                </Text>
              </View>
              <Pressable
                style={[styles.removeButton, { backgroundColor: `${theme.colors.accent}15` }]}
                onPress={() => removeFavorite(quote)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.accent} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headingBlock: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 16,
  },
  empty: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    paddingRight: 12,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    padding: 12,
    borderRadius: 14,
  },
});