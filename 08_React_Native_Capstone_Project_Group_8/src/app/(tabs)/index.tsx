
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import {
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';

import { searchPhotosByLocation } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

// ======================================
// POPULAR DESTINATIONS
// ======================================

const POPULAR_DESTINATIONS = [
  {
    id: 'baguio-city',
    name: 'Baguio City',
    province: 'Benguet',
    islandGroup: 'luzon',
    query: 'Baguio City Philippines tourist attractions',
  },
  {
    id: 'elnido-palawan',
    name: 'El Nido',
    province: 'Palawan',
    islandGroup: 'luzon',
    query: 'El Nido Palawan Philippines island beach',
  },
  {
    id: 'boracay-island',
    name: 'Boracay Island',
    province: 'Aklan',
    islandGroup: 'visayas',
    query: 'Boracay Island White Beach Philippines',
  },
  {
    id: 'mt-apo',
    name: 'Mt. Apo',
    province: 'Davao del Sur',
    islandGroup: 'mindanao',
    query: 'Mount Apo Philippines mountain',
  },
  {
    id: 'siargao-island',
    name: 'Siargao Island',
    province: 'Surigao del Norte',
    islandGroup: 'mindanao',
    query: 'Siargao Island Philippines Cloud 9',
  },
];

// ======================================
// TYPES
// ======================================

type PopularDestination = (typeof POPULAR_DESTINATIONS)[number] & {
  imageUrl: string;
};

// ======================================
// PEXELS API
// ======================================

const fetchPexelsImage = async (
  searchQuery: string
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error('Pexels API key is missing.');
  }

  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      searchQuery
    )}&per_page=10&orientation=landscape`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.photos || data.photos.length === 0) {
    throw new Error(`No photos found for ${searchQuery}`);
  }

  return data.photos[0].src.large;
};

// ======================================
// MAIN SEARCH SCREEN
// ======================================

export default function SearchScreen() {
  const theme = useTheme();

  const { isDarkMode, setIsDarkMode } = useThemeMode();

  const { photos, setPhotos } = usePhotos();

  const { recordSearch } = useSearchHistory();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [lastSearchedCity, setLastSearchedCity] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Popular destination images
  const [popularDestinations, setPopularDestinations] =
    useState<PopularDestination[]>(
      POPULAR_DESTINATIONS.map((dest) => ({
        ...dest,
        imageUrl: '',
      }))
    );

  const [popularImagesLoading, setPopularImagesLoading] =
    useState(true);

  const { q } = useLocalSearchParams<{ q?: string }>();

  // ======================================
  // LOAD POPULAR DESTINATION IMAGES
  // ======================================

  useEffect(() => {
    let isActive = true;

    const loadPopularDestinationImages = async () => {
      const apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY;

      if (!apiKey) {
        console.warn(
          'Pexels API key is missing. Please check your .env file.'
        );

        if (isActive) {
          setPopularImagesLoading(false);
        }

        return;
      }

      try {
        const updatedDestinations = await Promise.all(
          POPULAR_DESTINATIONS.map(async (dest) => {
            try {
              const imageUrl = await fetchPexelsImage(dest.query);

              return {
                ...dest,
                imageUrl,
              };
            } catch (error) {
              console.warn(
                `Failed to load image for ${dest.name}:`,
                error
              );

              return {
                ...dest,
                imageUrl: '',
              };
            }
          })
        );

        if (isActive) {
          setPopularDestinations(updatedDestinations);
        }
      } catch (error) {
        console.warn(
          'Failed to load popular destination images:',
          error
        );
      } finally {
        if (isActive) {
          setPopularImagesLoading(false);
        }
      }
    };

    loadPopularDestinationImages();

    return () => {
      isActive = false;
    };
  }, []);

  // ======================================
  // SEARCH PHOTOS
  // ======================================

  const doSearch = async (locationName: string) => {
    if (!locationName.trim()) return;

    setLoading(true);

    try {
      const results = await searchPhotosByLocation(locationName);

      setPhotos(results);

      setLastSearchedCity(locationName);

      setSearchInput(locationName);

      await recordSearch(locationName);
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // HANDLE DESTINATION CLICK
  // ======================================

  const handleDestinationClick = (destination: PopularDestination) => {
    if (loading) return;

    // Automatically search the selected destination
    doSearch(destination.name);
  };

  // ======================================
  // REFRESH
  // ======================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      if (lastSearchedCity) {
        await doSearch(lastSearchedCity);
      }
    } catch (err) {
      console.warn('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ======================================
  // HANDLE SEARCH PARAMETERS
  // ======================================

  useEffect(() => {
    if (q && typeof q === 'string' && q.trim()) {
      doSearch(q.trim());
    }
  }, [q]);

  // ======================================
  // MAIN UI
  // ======================================

  return (
    <LinearGradient
      colors={
        isDarkMode
          ? ['#0f172a', '#1e293b', '#0c4a6e']
          : ['#e0f2fe', '#f0fdf4', '#fffbeb']
      }
      style={styles.screen}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="history"
            iconColor={isDarkMode ? '#a5f3fc' : '#0d9488'}
            size={22}
            onPress={() => router.push('/history')}
            accessibilityLabel="Recent searches"
          />

          <IconButton
            icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
            iconColor={isDarkMode ? '#fef08a' : '#0d9488'}
            size={24}
            onPress={() => setIsDarkMode(!isDarkMode)}
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDarkMode ? '#5eead4' : '#0d9488'}
            />
          }
        >
          {/* ================================== */}
          {/* SEARCH CARD */}
          {/* ================================== */}

          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(30, 41, 59, 0.85)'
                  : 'rgba(255, 255, 255, 0.85)',
              },
            ]}
          >
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Discover tourist spots across regions, cities, and
              municipalities in the Philippines
            </Text>

            {/* SEARCH INPUT */}
            <TextInput
              label="Search Places"
              placeholder="Type a place name... e.g. El Nido, Boracay, Baguio"
              value={searchInput}
              onChangeText={setSearchInput}
              style={styles.searchInput}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={() => doSearch(searchInput)}
                />
              }
              onSubmitEditing={() => doSearch(searchInput)}
            />

            <Text variant="labelMedium" style={styles.orText}>
              — Or select by location —
            </Text>

            {/* LOCATION SELECTOR */}
            <LocationForm onSearch={doSearch} />
          </View>

          {/* ================================== */}
          {/* POPULAR DESTINATIONS */}
          {/* ================================== */}

          <View style={styles.popularSection}>
            {/* SECTION HEADER */}
            <View style={styles.popularHeader}>
              <View>
                <Text
                  variant="labelMedium"
                  style={styles.popularSubheading}
                >
                  Practical Travel Guide
                </Text>

                <Text
                  variant="titleLarge"
                  style={styles.popularHeading}
                >
                  Popular Destination
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text
                  style={[
                    styles.statNumber,
                    {
                      color: isDarkMode
                        ? '#5eead4'
                        : '#0d9488',
                    },
                  ]}
                >
                  82
                </Text>

                <Text style={styles.statLabel}>
                  Provinces
                </Text>
              </View>
            </View>

            {/* ================================== */}
            {/* FIVE CLICKABLE DESTINATION CARDS */}
            {/* ================================== */}

            <View style={styles.destGrid}>
              {popularDestinations.map((dest) => (
                <Pressable
                  key={dest.id}
                  onPress={() => handleDestinationClick(dest)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Explore ${dest.name}`}
                  style={({ pressed }) => [
                    styles.destCard,
                    {
                      backgroundColor: isDarkMode
                        ? '#1e293b'
                        : '#ffffff',
                      opacity: pressed ? 0.8 : 1,
                      transform: [
                        {
                          scale: pressed ? 0.97 : 1,
                        },
                      ],
                    },
                  ]}
                >
                  {/* DESTINATION IMAGE */}
                  {dest.imageUrl ? (
                    <Image
                      source={{ uri: dest.imageUrl }}
                      style={styles.destImage}
                      contentFit="cover"
                      transition={300}
                    />
                  ) : (
                    <View
                      style={[
                        styles.destImagePlaceholder,
                        {
                          backgroundColor: isDarkMode
                            ? '#334155'
                            : '#e5e7eb',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isDarkMode
                            ? '#cbd5e1'
                            : '#64748b',
                          fontSize: 12,
                        }}
                      >
                        {popularImagesLoading
                          ? 'Loading image...'
                          : 'Image unavailable'}
                      </Text>
                    </View>
                  )}

                  {/* DESTINATION INFORMATION */}
                  <View style={styles.destInfo}>
                    <Text
                      variant="labelMedium"
                      style={styles.destName}
                    >
                      {dest.name}
                    </Text>

                    <Text
                      variant="labelSmall"
                      style={styles.destProvince}
                    >
                      {dest.province}
                    </Text>

                    {/* EXPLORE BUTTON */}
                    <View style={styles.exploreBtn}>
                      <Text style={styles.exploreIcon}>
                        →
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ================================== */}
          {/* MEDIA GALLERY */}
          {/* ================================== */}

          <MediaGallery
            photos={photos}
            loading={loading}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 8,
  },

  scrollContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },

  // SEARCH CARD

  cardContainer: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },

  searchInput: {
    marginBottom: 16,
  },

  orText: {
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.6,
  },

  // POPULAR DESTINATIONS

  popularSection: {
    marginBottom: 24,
    width: '100%',
  },

  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  popularSubheading: {
    color: '#f59e0b',
    fontWeight: '600',
  },

  popularHeading: {
    fontWeight: '800',
    fontSize: 22,
    color: '#f59e0b',
  },

  statBox: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },

  statLabel: {
    fontSize: 11,
    opacity: 0.5,
  },

  // DESTINATION GRID

  destGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
  },

  destCard: {
    flex: 1,
    maxWidth: 210,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  destImage: {
    width: '100%',
    height: 130,
  },

  destImagePlaceholder: {
    width: '100%',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },

  destInfo: {
    padding: 12,
    alignItems: 'center',
  },

  destName: {
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },

  destProvince: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 8,
  },

  exploreBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
