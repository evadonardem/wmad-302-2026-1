import { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { cleanPlaceName, searchPhotosByLocation } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

type TabNavigation = {
  addListener: (event: 'tabPress', listener: () => void) => () => void;
};

export default function SearchScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { width } = useWindowDimensions();
  const wideLayout = width >= 640;
  const foregroundColor = '#fff';
  const { photos, setPhotos } = usePhotos();
  const { recordSearch } = useSearchHistory();
  const navigation = useNavigation<TabNavigation>();

  // TODO 3.7 [Global Search Coordination]
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');
  const [searchError, setSearchError] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  // City handed back from the History screen as a route param (see TODO 5.4)
  const { q } = useLocalSearchParams<{ q?: string }>();

  const handleSearchSubmit = useCallback(async (locationName: string) => {
    // TODO 3.8 [Operational Async Glue Engine]
    setLoading(true);
    setLastSearchedCity(locationName);
    setSearchError('');
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);

      // TODO 5.1 [History Recording]: only reached when the search above succeeded
      recordSearch(locationName);
    } catch (error) {
      setPhotos([]);
      setSearchError(
        error instanceof Error ? error.message : 'Unable to load photos. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [recordSearch, setPhotos]);

  useEffect(
    () =>
      navigation.addListener('tabPress', () => {
        if (lastSearchedCity && !loading) {
          void handleSearchSubmit(lastSearchedCity);
        }
      }),
    [handleSearchSubmit, lastSearchedCity, loading, navigation],
  );

  const handleRefresh = async () => {
    // TODO 4.6 [Pull-to-Refresh Workflow]
    setRefreshing(true);
    try {
      if (lastSearchedCity) {
        const results = await searchPhotosByLocation(lastSearchedCity);
        setPhotos(results);
      }
    } catch (error) {
      setPhotos([]);
      setSearchError(
        error instanceof Error ? error.message : 'Unable to load photos. Please try again.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // TODO 5.4 [Param-Driven Re-Search]
    if (q && q.trim()) {
      // Route-param changes intentionally trigger this search and its loading state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSearchSubmit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <ImageBackground
      source={{
        uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/El_Nido%2C_Filipino_sunset%2C_Palawan%2C_Philippines.jpg/1920px-El_Nido%2C_Filipino_sunset%2C_Palawan%2C_Philippines.jpg',
      }}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      accessibilityLabel="Sunset over El Nido, Palawan"
    >
      <View
        pointerEvents="none"
        style={[
          styles.scrim,
          {
            backgroundColor: isDarkMode
              ? 'rgba(0, 0, 0, 0.58)'
              : 'rgba(0, 0, 0, 0.34)',
          },
        ]}
      />
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !wideLayout && styles.scrollContentCompact,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
        >
          <View style={[styles.navbar, !wideLayout && styles.navbarCompact]}>
            <Text style={[styles.brand, { color: foregroundColor }]}>Philippine Compass</Text>
            <View style={[styles.navActions, !wideLayout && styles.navActionsCompact]}>
              <TextInput
                mode="outlined"
                dense
                value={quickSearch}
                onChangeText={setQuickSearch}
                onSubmitEditing={() => {
                  const place = quickSearch.trim();
                  if (place) void handleSearchSubmit(place);
                }}
                placeholder="Search a Philippine place, e.g. Batanes"
                placeholderTextColor="rgba(255,255,255,0.78)"
                textColor={foregroundColor}
                outlineColor="rgba(255,255,255,0.65)"
                activeOutlineColor="#fff"
                returnKeyType="search"
                right={
                  <TextInput.Icon
                    icon="magnify"
                    color={foregroundColor}
                    onPress={() => {
                      const place = quickSearch.trim();
                      if (place) void handleSearchSubmit(place);
                    }}
                    accessibilityLabel="Search place"
                  />
                }
                style={[
                  styles.quickSearch,
                  !wideLayout && styles.quickSearchCompact,
                  {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  },
                ]}
                accessibilityLabel="Search any Philippine place"
              />
              <IconButton
                icon="history"
                iconColor={foregroundColor}
                size={21}
                onPress={() => router.push('/history')}
                accessibilityLabel="Recent searches"
              />
              <IconButton
                icon="heart"
                iconColor={foregroundColor}
                size={23}
                onPress={() => router.push('/favorites')}
                accessibilityLabel="Favorites and liked photos"
              />
              <IconButton
                icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
                iconColor={foregroundColor}
                size={23}
                onPress={() => setIsDarkMode(!isDarkMode)}
                accessibilityLabel="Toggle dark mode"
              />
              <IconButton
                icon="information-outline"
                iconColor={foregroundColor}
                size={23}
                onPress={() => router.push('/about')}
                accessibilityLabel="About"
              />
            </View>
          </View>

          <View style={styles.hero}>
            <Text
              style={[
                styles.title,
                !wideLayout && styles.titleCompact,
                styles.heroTextShadow,
              ]}
            >
              PHILIPPINES
            </Text>
            <Text
              style={[
                styles.subtitle,
                !wideLayout && styles.subtitleCompact,
                styles.heroTextShadow,
              ]}
            >
              Explore tourist spots across regions, cities, and municipalities in the Philippines.
            </Text>
          </View>
          <LocationForm onSearch={handleSearchSubmit} />

          {lastSearchedCity ? (
            <Text
              variant="titleLarge"
              style={[
                styles.searchedPlace,
                { color: foregroundColor },
                styles.heroTextShadow,
              ]}
            >
              Tourist spots in {cleanPlaceName(lastSearchedCity)}
            </Text>
          ) : null}

          <MediaGallery
            photos={photos}
            loading={loading}
            placeName={lastSearchedCity}
            errorMessage={searchError}
          />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  backgroundImage: { resizeMode: 'cover' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  screen: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  scrollContent: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 36,
    paddingTop: 10,
    paddingBottom: 24,
  },
  scrollContentCompact: { paddingHorizontal: 16 },
  navbar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    marginBottom: 42,
  },
  navbarCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 26 },
  brand: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  navActionsCompact: { width: '100%', justifyContent: 'flex-start' },
  quickSearch: {
    width: 320,
    height: 42,
  },
  quickSearchCompact: { flex: 1, width: undefined, minWidth: 0 },
  hero: { marginBottom: 26, maxWidth: 600 },
  title: { color: '#fff', fontWeight: '900', fontSize: 60, lineHeight: 68, letterSpacing: 1 },
  titleCompact: { fontSize: 42, lineHeight: 48 },
  subtitle: {
    maxWidth: 480,
    marginTop: 4,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    lineHeight: 21,
  },
  subtitleCompact: { fontSize: 14, lineHeight: 20 },
  searchedPlace: { fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  heroTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.58)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
