import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import MediaGallery from '@/components/MediaGallery';
import { useFavorites } from '@/favorites';
import { useThemeMode } from '@/themeMode';

type Collection = 'favorites' | 'liked';

export default function FavoritesScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { favorites, likedPhotos } = useFavorites();
  const [collection, setCollection] = useState<Collection>('favorites');
  const photos = collection === 'favorites' ? favorites : likedPhotos;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.replace('/')}
          accessibilityLabel="Back to search"
        >
          Back to search
        </Button>
        <Button
          mode="text"
          icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
          onPress={() => setIsDarkMode(!isDarkMode)}
          accessibilityLabel="Toggle dark mode"
        >
          {isDarkMode ? 'Light' : 'Dark'}
        </Button>
      </View>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        Favorites & Likes
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Your saved favorite and liked photos.
      </Text>

      <SegmentedButtons
        value={collection}
        onValueChange={(value) => {
          if (value === 'favorites' || value === 'liked') setCollection(value);
        }}
        buttons={[
          { value: 'favorites', label: `Favorites (${favorites.length})`, icon: 'heart' },
          { value: 'liked', label: `Liked (${likedPhotos.length})`, icon: 'thumb-up' },
        ]}
        style={styles.segmented}
      />

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {collection === 'favorites' ? 'No favorites yet' : 'No liked photos yet'}
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {collection === 'favorites'
              ? 'Tap the heart on a photo to add it to Favorites.'
              : 'Open a photo and tap Like to see it in this list.'}
          </Text>
          <Button
            mode="contained"
            icon="magnify"
            onPress={() => router.replace('/')}
            style={styles.searchButton}
          >
            Find photos
          </Button>
        </View>
      ) : (
        <MediaGallery photos={photos} loading={false} placeName={collection} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '800', textAlign: 'center', marginTop: 10 },
  subtitle: { textAlign: 'center', marginTop: 6, marginBottom: 20 },
  segmented: { marginBottom: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 56 },
  searchButton: { marginTop: 8 },
});
