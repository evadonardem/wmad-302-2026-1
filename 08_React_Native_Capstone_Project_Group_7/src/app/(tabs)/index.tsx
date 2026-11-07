import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { searchPhotosByLocation } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

export default function SearchScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const { recordSearch } = useSearchHistory();

  // TODO 3.7 [Global Search Coordination]: Replace the placeholder trackers below with real
  // React state hooks managed by this dashboard (the photo list itself lives in the shared
  // PhotosProvider — already wired above via usePhotos()):
  // - 'loading': Toggles the boolean workflow flag while operations are in flight (default: false)
  // - 'refreshing': Toggles while the pull-to-refresh gesture is running (default: false)
  // - 'lastSearchedCity': Remembers the most recent search keyword so pull-to-refresh can re-run it (default: empty string)
  const loading = false;
  const refreshing = false;
  const lastSearchedCity = '';

  // City handed back from the History screen as a route param (see TODO 5.4)
  const { q } = useLocalSearchParams<{ q?: string }>();

  const handleSearchSubmit = async (locationName: string) => {
    // TODO 3.8 [Operational Async Glue Engine]:
    // a. Shift the local 'loading' state tracker to true.
    // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
    // c. Capture the resulting photo dataset array into the shared store via setPhotos(...)
    //    (from usePhotos()).
    // d. Remember 'locationName' inside 'lastSearchedCity' (feeds the pull-to-refresh in TODO 4.6).
    // e. Toggle the 'loading' tracker back to false inside a finally safety wrapper execution tier.
    // [Your code here]

    // TODO 5.1 [History Recording]: Once the search above succeeds, record the searched city
    // with recordSearch(locationName) from useSearchHistory() so the History screen can list it.
    // [Your code here]
  };

  const handleRefresh = async () => {
    // TODO 4.6 [Pull-to-Refresh Workflow]: Implement the RefreshControl gesture handler below:
    // a. Flip the 'refreshing' tracker to true.
    // b. If 'lastSearchedCity' holds a value, re-run 'searchPhotosByLocation(lastSearchedCity)'
    //    and swap the shared photo store with the fresh results via setPhotos(...).
    // c. Flip 'refreshing' back to false inside a finally safety wrapper.
    // [Your code here]
  };

  useEffect(() => {
    // TODO 5.4 [Param-Driven Re-Search]: When the 'q' search param arrives or changes (the
    // History screen navigates back here with it), and it holds a non-empty value, run the
    // same search flow as TODO 3.8 with that city (locationName = q).
    // [Your code here]
  }, [q]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton
          icon="history"
          iconColor={theme.colors.onBackground}
          size={22}
          onPress={() => router.push('/history')}
          accessibilityLabel="Recent searches"
        />
        <IconButton
          icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
          iconColor={theme.colors.onBackground}
          size={24}
          onPress={() => setIsDarkMode(!isDarkMode)}
          accessibilityLabel="Toggle dark mode"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          🇵🇭 Lakbay PH
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Explore tourist spots across regions, cities, and municipalities in the Philippines
        </Text>

        {/* Connect the location selection input modules */}
        <LocationForm onSearch={handleSearchSubmit} />

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery photos={photos} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
});
