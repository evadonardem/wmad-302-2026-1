import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MediaGallery from '@/components/MediaGallery';
import { useFavorites } from '@/favorites';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites } = useFavorites();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Your favorites
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Keep the places you want to visit close at hand.
        </Text>
      </View>
      {favorites.length > 0 ? (
        <MediaGallery photos={favorites} loading={false} />
      ) : (
        <View style={[styles.empty, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={styles.icon}>♡</Text>
          <Text variant="titleMedium" style={styles.emptyTitle}>No favorites yet</Text>
          <Text variant="bodyMedium" style={styles.emptyBody}>
            Tap the heart on a photo to save it here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: 16,
    gap: 20,
  },
  title: { fontWeight: '800' },
  empty: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  icon: { fontSize: 42, color: '#E58B2A', lineHeight: 48 },
  emptyTitle: { fontWeight: '800' },
  emptyBody: { textAlign: 'center', opacity: 0.7 },
});
