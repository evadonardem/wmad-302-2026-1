import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import MediaGallery from '@/components/MediaGallery';
import { useFavorites } from '@/favorites';

// Extra feature (not part of the assignment TODOs):
// saved photos, pushed from the ♥ button in the Search header.
export default function FavoritesScreen() {
  const theme = useTheme();
  const { favorites, clearFavorites } = useFavorites();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Favorites' }} />

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleLarge">🤍</Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No favorites yet — tap the ♡ on any photo to save it here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {favorites.length} saved {favorites.length === 1 ? 'spot' : 'spots'}
            </Text>
            <Button mode="text" icon="delete-outline" textColor={theme.colors.error} onPress={clearFavorites}>
              Clear all
            </Button>
          </View>

          <MediaGallery photos={favorites} loading={false} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
});
