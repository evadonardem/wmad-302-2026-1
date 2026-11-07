import { useCallback, useEffect, useState } from 'react';
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

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');

  const { q } = useLocalSearchParams<{ q?: string }>();

  const handleSearchSubmit = useCallback(async (locationName: string) => {
    const trimmedLocation = locationName.trim();
    if (!trimmedLocation) return;
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(trimmedLocation);
      setPhotos(results);
      setLastSearchedCity(trimmedLocation);
      recordSearch(trimmedLocation);
    } finally {
      setLoading(false);
    }
  }, [recordSearch, setPhotos]);

  const handleRefresh = async () => {
    if (!lastSearchedCity) return;
    setRefreshing(true);
    try {
      setPhotos(await searchPhotosByLocation(lastSearchedCity));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof q === 'string' && q.trim()) {
      const timeout = setTimeout(() => void handleSearchSubmit(q), 0);
      return () => clearTimeout(timeout);
    }
  }, [handleSearchSubmit, q]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.brand, { color: theme.colors.primary }]}>LAKBAY PH</Text>
        <View style={styles.headerActions}>
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
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.heroOrb} />
          <Text variant="labelLarge" style={[styles.eyebrow, { color: theme.colors.secondary }]}>
            YOUR NEXT ESCAPE
          </Text>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onPrimaryContainer }]}>
            Find your way{'\n'}to wonder.
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onPrimaryContainer }]}>
            Discover unforgettable places across the Philippines.
          </Text>
          <Text style={[styles.heroMark, { color: theme.colors.primary }]}>✦</Text>
        </View>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
    gap: 4,
  },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 250,
    lineHeight: 21,
  },
  hero: {
    minHeight: 220,
    borderRadius: 28,
    padding: 24,
    marginTop: 4,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  heroOrb: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -40,
    top: -50,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroMark: {
    position: 'absolute',
    right: 28,
    bottom: 26,
    fontSize: 44,
    opacity: 0.8,
  },
});
