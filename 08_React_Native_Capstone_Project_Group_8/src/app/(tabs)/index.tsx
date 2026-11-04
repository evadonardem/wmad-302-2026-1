
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
  ActivityIndicator,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';

import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';

import {
  searchPhotosByLocation,
  getTouristAttractions,
  getDestinationImage,
  type TouristAttraction,
} from '@/services/geoPhotoService';

import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

// ======================================
// 30 POPULAR DESTINATIONS
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
  {
    id: 'vigan-city',
    name: 'Vigan City',
    province: 'Ilocos Sur',
    islandGroup: 'luzon',
    query: 'Vigan City Calle Crisologo Philippines',
  },
  {
    id: 'sagada',
    name: 'Sagada',
    province: 'Mountain Province',
    islandGroup: 'luzon',
    query: 'Sagada Mountain Province Philippines',
  },
  {
    id: 'banaue',
    name: 'Banaue',
    province: 'Ifugao',
    islandGroup: 'luzon',
    query: 'Banaue Rice Terraces Philippines',
  },
  {
    id: 'bohol',
    name: 'Bohol',
    province: 'Bohol',
    islandGroup: 'visayas',
    query: 'Chocolate Hills Bohol Philippines',
  },
  {
    id: 'cebu-city',
    name: 'Cebu City',
    province: 'Cebu',
    islandGroup: 'visayas',
    query: 'Cebu City Philippines tourist attractions',
  },
  {
    id: 'puerto-princesa',
    name: 'Puerto Princesa',
    province: 'Palawan',
    islandGroup: 'luzon',
    query: 'Puerto Princesa Underground River Philippines',
  },
  {
    id: 'coron',
    name: 'Coron',
    province: 'Palawan',
    islandGroup: 'luzon',
    query: 'Coron Palawan Philippines island',
  },
  {
    id: 'batanes',
    name: 'Batanes',
    province: 'Batanes',
    islandGroup: 'luzon',
    query: 'Batanes Philippines rolling hills',
  },
  {
    id: 'la-union',
    name: 'La Union',
    province: 'La Union',
    islandGroup: 'luzon',
    query: 'San Juan La Union Philippines beach',
  },
  {
    id: 'tagaytay',
    name: 'Tagaytay',
    province: 'Cavite',
    islandGroup: 'luzon',
    query: 'Tagaytay Taal Volcano Philippines',
  },
  {
    id: 'batangas',
    name: 'Batangas',
    province: 'Batangas',
    islandGroup: 'luzon',
    query: 'Batangas Philippines beaches',
  },
  {
    id: 'camiguin',
    name: 'Camiguin',
    province: 'Camiguin',
    islandGroup: 'mindanao',
    query: 'Camiguin Philippines White Island',
  },
  {
    id: 'davao-city',
    name: 'Davao City',
    province: 'Davao del Sur',
    islandGroup: 'mindanao',
    query: 'Davao City Philippines tourist attractions',
  },
  {
    id: 'cagayan-de-oro',
    name: 'Cagayan de Oro',
    province: 'Misamis Oriental',
    islandGroup: 'mindanao',
    query: 'Cagayan de Oro Philippines river',
  },
  {
    id: 'iloilo-city',
    name: 'Iloilo City',
    province: 'Iloilo',
    islandGroup: 'visayas',
    query: 'Iloilo City Philippines heritage',
  },
  {
    id: 'bacolod-city',
    name: 'Bacolod City',
    province: 'Negros Occidental',
    islandGroup: 'visayas',
    query: 'Bacolod City Philippines tourist attractions',
  },
  {
    id: 'dumaguete',
    name: 'Dumaguete',
    province: 'Negros Oriental',
    islandGroup: 'visayas',
    query: 'Dumaguete Philippines Rizal Boulevard',
  },
  {
    id: 'samal-island',
    name: 'Samal Island',
    province: 'Davao del Norte',
    islandGroup: 'mindanao',
    query: 'Samal Island Philippines beach',
  },
  {
    id: 'lake-sebu',
    name: 'Lake Sebu',
    province: 'South Cotabato',
    islandGroup: 'mindanao',
    query: 'Lake Sebu Philippines waterfalls',
  },
  {
    id: 'zamboanga-city',
    name: 'Zamboanga City',
    province: 'Zamboanga del Sur',
    islandGroup: 'mindanao',
    query: 'Zamboanga City Philippines tourist attractions',
  },
  {
    id: 'hundred-islands',
    name: 'Hundred Islands',
    province: 'Pangasinan',
    islandGroup: 'luzon',
    query: 'Hundred Islands Pangasinan Philippines',
  },
  {
    id: 'taal-volcano',
    name: 'Taal Volcano',
    province: 'Batangas',
    islandGroup: 'luzon',
    query: 'Taal Volcano Batangas Philippines',
  },
  {
    id: 'mayon-volcano',
    name: 'Mayon Volcano',
    province: 'Albay',
    islandGroup: 'luzon',
    query: 'Mayon Volcano Albay Philippines',
  },
  {
    id: 'tubbataha-reef',
    name: 'Tubbataha Reef',
    province: 'Palawan',
    islandGroup: 'luzon',
    query: 'Tubbataha Reefs Natural Park Philippines',
  },
  {
    id: 'apo-island',
    name: 'Apo Island',
    province: 'Negros Oriental',
    islandGroup: 'visayas',
    query: 'Apo Island Negros Oriental Philippines',
  },
];

// ======================================
// TYPES
// ======================================

type PopularDestination = (typeof POPULAR_DESTINATIONS)[number] & {
  imageUrl: string;
};

// ======================================
// PAGINATION SETTINGS
// ======================================

const ITEMS_PER_PAGE = 5;

const TOTAL_PAGES = Math.ceil(
  POPULAR_DESTINATIONS.length / ITEMS_PER_PAGE
);


// Keep destination image URLs between screen visits while the app is running.
const popularDestinationImageCache = new Map<string, string>();

// ======================================
// MAIN SEARCH SCREEN
// ======================================

export default function SearchScreen() {
  const { isDarkMode, setIsDarkMode } = useThemeMode();

  // Greener Tropical Ocean + Emerald glass palette
  const palette = isDarkMode
    ? {
        // Deep forest-green background and emerald glass surfaces
        background: ['#03291F', '#064332', '#0B563D'] as [string, string, ...string[]],
        glass: 'rgba(5, 50, 35, 0.84)',
        glassStrong: 'rgba(8, 66, 45, 0.96)',
        card: 'rgba(9, 74, 49, 0.94)',
        border: 'rgba(110, 231, 183, 0.28)',
        primary: '#34D399',
        primarySoft: '#14532D',
        accent: '#34D399',
        text: '#ECFDF5',
        muted: '#B7E4C7',
        subtle: '#86B99A',
        placeholder: '#164E3B',
        divider: 'rgba(167, 243, 208, 0.22)',
      }
    : {
        // Fresh jade-green background with softly tinted glass panels
        background: ['#B7E4C7', '#D8F3DC', '#ECFDF3'] as [string, string, ...string[]],
        glass: 'rgba(236, 253, 243, 0.86)',
        glassStrong: 'rgba(247, 255, 249, 0.97)',
        card: 'rgba(232, 250, 238, 0.96)',
        border: 'rgba(22, 101, 52, 0.24)',
        primary: '#15803D',
        primarySoft: '#BBF7D0',
        accent: '#15803D',
        text: '#123B2A',
        muted: '#3F6B52',
        subtle: '#648B72',
        placeholder: '#D1FAE5',
        divider: 'rgba(22, 101, 52, 0.18)',
      };

  const { photos, setPhotos } = usePhotos();

  const { recordSearch } = useSearchHistory();

  // SEARCH STATES

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [lastSearchedCity, setLastSearchedCity] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // PAGINATION STATE

  const [currentPage, setCurrentPage] = useState(0);

  // DESTINATION IMAGE STATES

  const [popularDestinations, setPopularDestinations] =
    useState<PopularDestination[]>(
      POPULAR_DESTINATIONS.map((dest) => ({
        ...dest,
        imageUrl: popularDestinationImageCache.get(dest.id) || '',
      }))
    );

  const [popularImagesLoading, setPopularImagesLoading] =
    useState(true);

  // GET FIVE DESTINATIONS FOR THE CURRENT PAGE

  const displayedDestinations = popularDestinations.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // TOURIST ATTRACTION STATES

  const [selectedDestination, setSelectedDestination] =
    useState<PopularDestination | null>(null);

  const [attractions, setAttractions] =
    useState<TouristAttraction[]>([]);

  const [attractionsLoading, setAttractionsLoading] =
    useState(false);

  const [attractionError, setAttractionError] =
    useState('');

  const { q } = useLocalSearchParams<{ q?: string }>();

  // ======================================
  // PAGINATION FUNCTIONS
  // ======================================

  const goToNextPage = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      setCurrentPage((previous) => previous + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((previous) => previous - 1);
    }
  };

  // ======================================
  // LOAD IMAGES FOR THE CURRENT PAGE ONLY
  // ======================================

  useEffect(() => {
    let isActive = true;

    const loadCurrentPageImages = async () => {
      const destinationsOnPage = POPULAR_DESTINATIONS.slice(
        currentPage * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
      );

      // Show cached images immediately before requesting anything new.
      setPopularDestinations((previous) =>
        previous.map((destination) => ({
          ...destination,
          imageUrl:
            popularDestinationImageCache.get(destination.id) ||
            destination.imageUrl,
        }))
      );

      const missingImages = destinationsOnPage.filter(
        (destination) => !popularDestinationImageCache.has(destination.id)
      );

      if (missingImages.length === 0) {
        setPopularImagesLoading(false);
        return;
      }

      setPopularImagesLoading(true);

      const updatedImages = await Promise.all(
        missingImages.map(async (destination) => {
          const imageUrl = await getDestinationImage(destination.query);
          popularDestinationImageCache.set(destination.id, imageUrl);
          return { id: destination.id, imageUrl };
        })
      );

      if (isActive) {
        setPopularDestinations((previous) =>
          previous.map((destination) => {
            const updated = updatedImages.find(
              (item) => item.id === destination.id
            );

            return updated
              ? { ...destination, imageUrl: updated.imageUrl }
              : {
                  ...destination,
                  imageUrl:
                    popularDestinationImageCache.get(destination.id) ||
                    destination.imageUrl,
                };
          })
        );

        setPopularImagesLoading(false);
      }
    };

    loadCurrentPageImages().catch((error) => {
      console.warn('Failed to load destination images:', error);
      if (isActive) setPopularImagesLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [currentPage]);

  // ======================================
  // SEARCH PHOTOS
  // ======================================

  const doSearch = async (
    locationName: string,
    keepDestinationSelected = false
  ) => {
    if (!locationName.trim()) return;

    if (!keepDestinationSelected) {
      setSelectedDestination(null);
      setAttractions([]);
      setAttractionError('');
    }

    setLoading(true);

    try {
      const results = await searchPhotosByLocation(locationName);

      setPhotos(results);

      setLastSearchedCity(locationName);

      setSearchInput(locationName);

      await recordSearch(locationName);
    } catch (error) {
      console.warn('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // HANDLE DESTINATION CLICK
  // ======================================

  const handleDestinationClick = async (
    destination: PopularDestination
  ) => {
    if (loading || attractionsLoading) return;

    setSelectedDestination(destination);

    setAttractions([]);

    setAttractionError('');

    setAttractionsLoading(true);

    try {
      const [_, attractionResults] = await Promise.all([
        doSearch(destination.name, true),
        getTouristAttractions(
          destination.id,
          destination.imageUrl ||
            popularDestinationImageCache.get(destination.id) ||
            ''
        ),
      ]);

      setAttractions(attractionResults);

      if (attractionResults.length === 0) {
        setAttractionError(
          'No tourist attractions could be loaded. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error loading tourist attractions:', error);

      setAttractionError(
        'Unable to load tourist attractions. Please try again.'
      );
    } finally {
      setAttractionsLoading(false);
    }
  };

  // ======================================
  // HANDLE ATTRACTION CLICK
  // ======================================

  const handleAttractionClick = (attraction: TouristAttraction) => {
    if (!selectedDestination) return;

    router.push({
      pathname: '/attractions/[id]',
      params: {
        id: String(attraction.id),
        name: attraction.name || 'Tourist Attraction',
        location: attraction.location || '',
        description: attraction.description || '',
        imageUrl: attraction.imageUrl || '',
        photographer: attraction.photographer || '',
        destinationName: selectedDestination.name,
        province: selectedDestination.province,
      },
    });
  };

  // ======================================
  // CLOSE ATTRACTION EXPLORER
  // ======================================

  const closeAttractions = () => {
    setSelectedDestination(null);
    setAttractions([]);
    setAttractionError('');
  };

  // ======================================
  // REFRESH
  // ======================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      if (selectedDestination) {
        await handleDestinationClick(selectedDestination);
      } else if (lastSearchedCity) {
        await doSearch(lastSearchedCity);
      }
    } catch (error) {
      console.warn('Refresh failed:', error);
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
      colors={palette.background}
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
            iconColor={palette.primary}
            size={22}
            onPress={() => router.push('/history')}
            accessibilityLabel="Recent searches"
          />

          <IconButton
            icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
            iconColor={palette.accent}
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
              tintColor={palette.primary}
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
                backgroundColor: palette.glass,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.heroHeading}>
              <Text style={[styles.heroEyebrow, { color: palette.primary }]}>
                YOUR NEXT ADVENTURE STARTS HERE
              </Text>
              <Text style={[styles.heroTitle, { color: palette.text }]}>
                Explore the Philippines
              </Text>
              <Text style={[styles.heroAccent, { color: palette.accent }]}>
                Islands • Mountains • Memories
              </Text>
            </View>
            <Text
              variant="bodyLarge"
              style={[
                styles.subtitle,
                { color: palette.muted },
              ]}
            >
              Discover tourist spots across regions, cities, and
              municipalities in the Philippines
            </Text>

            <TextInput
              label="Search Places"
              placeholder="Search a tourist destination..."
              value={searchInput}
              onChangeText={setSearchInput}
              style={[styles.searchInput, { backgroundColor: palette.glassStrong }]}
              textColor={palette.text}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
              placeholderTextColor={palette.subtle}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={() => doSearch(searchInput)}
                />
              }
              onSubmitEditing={() => doSearch(searchInput)}
            />

            <Text variant="labelMedium" style={[styles.orText, { color: palette.muted }]}>
              — Or select by location —
            </Text>

            <LocationForm onSearch={doSearch} />
          </View>

          {/* ================================== */}
          {/* POPULAR DESTINATIONS */}
          {/* ================================== */}

          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <View>
                <Text
                  variant="labelMedium"
                  style={[styles.popularSubheading, { color: palette.primary }]}
                >
                  Practical Travel Guide
                </Text>

                <Text
                  variant="titleLarge"
                  style={[styles.popularHeading, { color: palette.text }]}
                >
                  Popular Destination
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text
                  style={[
                    styles.statNumber,
                    {
                      color: palette.primary,
                    },
                  ]}
                >
                  30
                </Text>

                <Text style={[styles.statLabel, { color: palette.muted }]}>
                  Destinations
                </Text>
              </View>
            </View>

            {/* FIVE CLICKABLE DESTINATION CARDS */}

            <View style={styles.destGrid}>
              {displayedDestinations.map((dest) => (
                <Pressable
                  key={dest.id}
                  onPress={() => handleDestinationClick(dest)}
                  disabled={loading || attractionsLoading}
                  accessibilityRole="button"
                  accessibilityLabel={`Explore ${dest.name}`}
                  style={({ pressed }) => [
                    styles.destCard,
                    {
                      backgroundColor: palette.glassStrong,
                      borderWidth: selectedDestination?.id === dest.id ? 2 : 1,
                      borderColor: selectedDestination?.id === dest.id ? palette.primary : palette.border,
                      opacity: pressed ? 0.8 : 1,
                      transform: [
                        { scale: pressed ? 0.97 : 1 },
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
                          backgroundColor: palette.placeholder,
                        },
                      ]}
                    >
                      <Text style={styles.placeholderText}>
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
                      style={[
                        styles.destName,
                        {
                          color: palette.text,
                        },
                      ]}
                    >
                      {dest.name}
                    </Text>

                    <Text style={[styles.destProvince, { color: palette.muted }]}>
                      {dest.province}
                    </Text>

                    <View style={[styles.exploreBtn, { backgroundColor: palette.primary }]}>
                      <Text style={styles.exploreIcon}>→</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* ================================== */}
            {/* DESTINATION PAGINATION */}
            {/* ================================== */}

            <View style={styles.paginationContainer}>
              <Pressable
                onPress={goToPreviousPage}
                disabled={currentPage === 0}
                style={({ pressed }) => [
                  styles.paginationButton,
                  {
                    backgroundColor:
                      currentPage === 0
                        ? palette.placeholder
                        : palette.primary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={styles.paginationButtonText}>
                  ← Previous
                </Text>
              </Pressable>

              <View style={styles.paginationInfo}>
                <Text
                  style={[
                    styles.paginationPage,
                    {
                      color: palette.primary,
                    },
                  ]}
                >
                  {currentPage + 1} / {TOTAL_PAGES}
                </Text>

                <Text
                  style={[
                    styles.paginationCaption,
                    {
                      color: palette.muted,
                    },
                  ]}
                >
                  Showing {currentPage * ITEMS_PER_PAGE + 1}–
                  {Math.min(
                    (currentPage + 1) * ITEMS_PER_PAGE,
                    POPULAR_DESTINATIONS.length
                  )} of 30
                </Text>
              </View>

              <Pressable
                onPress={goToNextPage}
                disabled={currentPage === TOTAL_PAGES - 1}
                style={({ pressed }) => [
                  styles.paginationButton,
                  {
                    backgroundColor:
                      currentPage === TOTAL_PAGES - 1
                        ? palette.placeholder
                        : palette.primary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={styles.paginationButtonText}>
                  Next →
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ================================== */}
          {/* TOURIST ATTRACTION EXPLORER */}
          {/* ================================== */}

          {selectedDestination && (
            <View
              style={[
                styles.attractionSection,
                {
                  backgroundColor: palette.glass,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.attractionHeader}>
                <View style={styles.attractionTitleContainer}>
                  <Text style={[styles.attractionOverline, { color: palette.accent }]}>
                    DESTINATION GUIDE
                  </Text>

                  <Text
                    variant="headlineSmall"
                    style={[
                      styles.attractionHeading,
                      {
                        color: palette.primary,
                      },
                    ]}
                  >
                    Explore {selectedDestination.name}
                  </Text>

                  <Text style={[styles.attractionLocation, { color: palette.muted }]}>
                    {selectedDestination.province}, Philippines
                  </Text>
                </View>

                <IconButton
                  icon="close-circle-outline"
                  size={26}
                  iconColor={isDarkMode ? '#cbd5e1' : '#64748b'}
                  onPress={closeAttractions}
                  accessibilityLabel="Close attraction guide"
                />
              </View>

              <Text
                variant="bodyMedium"
                style={[
                  styles.attractionIntro,
                  {
                    color: palette.muted,
                  },
                ]}
              >
                Discover the beautiful places and must-visit tourist
                attractions in {selectedDestination.name}.
              </Text>

              {/* LOADING */}

              {attractionsLoading && (
                <View style={styles.attractionLoading}>
                  <ActivityIndicator
                    animating
                    size="large"
                    color={palette.primary}
                  />

                  <Text style={[styles.attractionLoadingText, { color: palette.muted }]}>
                    Finding tourist attractions and photos...
                  </Text>
                </View>
              )}

              {/* ERROR */}

              {!attractionsLoading && attractionError !== '' && (
                <View style={styles.attractionEmpty}>
                  <Text style={[styles.attractionEmptyText, { color: palette.muted }]}>
                    {attractionError}
                  </Text>

                  <Pressable
                    style={[styles.retryButton, { backgroundColor: palette.primary }]}
                    onPress={() =>
                      handleDestinationClick(selectedDestination)
                    }
                  >
                    <Text style={styles.retryButtonText}>
                      Try Again
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ATTRACTION CARDS */}

              {!attractionsLoading && attractions.length > 0 && (
                <>
                  <View style={styles.attractionCountRow}>
                    <Text
                      style={[
                        styles.attractionCount,
                        {
                          color: palette.primary,
                        },
                      ]}
                    >
                      {attractions.length} Tourist Attractions
                    </Text>
                  </View>

                  <View style={styles.attractionGrid}>
                    {attractions.map((attraction) => (
                      <Pressable
                        key={attraction.id}
                        onPress={() =>
                          handleAttractionClick(attraction)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`View details for ${attraction.name}`}
                        style={({ pressed }) => [
                          styles.attractionCard,
                          {
                            backgroundColor: palette.glassStrong,
                            borderWidth: 1,
                            borderColor: palette.border,
                            opacity: pressed ? 0.85 : 1,
                            transform: [
                              { scale: pressed ? 0.98 : 1 },
                            ],
                          },
                        ]}
                      >
                        {attraction.imageUrl ? (
                          <Image
                            source={{ uri: attraction.imageUrl }}
                            style={styles.attractionImage}
                            contentFit="cover"
                            transition={300}
                            accessibilityLabel={attraction.name}
                          />
                        ) : (
                          <View
                            style={[
                              styles.attractionImagePlaceholder,
                              {
                                backgroundColor: palette.placeholder,
                              },
                            ]}
                          >
                            <Text style={styles.placeholderText}>
                              Photo unavailable
                            </Text>
                          </View>
                        )}

                        <View style={styles.attractionContent}>
                          <Text
                            variant="titleMedium"
                            style={[
                              styles.attractionName,
                              {
                                color: palette.text,
                              },
                            ]}
                          >
                            {attraction.name}
                          </Text>

                          <Text style={[styles.attractionPlace, { color: palette.muted }]}>
                            <Text style={[styles.locationIcon, { color: palette.primary }]}>⌖ </Text>
                            {attraction.location}
                          </Text>

                          <Text
                            variant="bodyMedium"
                            style={[
                              styles.attractionDescription,
                              {
                                color: palette.muted,
                              },
                            ]}
                          >
                            {attraction.description}
                          </Text>

                          {attraction.photographer !== '' && (
                            <Text style={[styles.photoCredit, { color: palette.primary }]}>
                              📸 {attraction.photographer}
                            </Text>
                          )}

                          <View style={[styles.viewDetailsRow, { borderTopColor: palette.divider }]}>
                            <Text style={[styles.viewDetailsText, { color: palette.primary }]}>
                              View Attraction Details
                            </Text>

                            <Text style={[styles.viewDetailsArrow, { color: palette.accent }]}>
                              →
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* CLOSE GUIDE */}

              {!attractionsLoading && attractions.length > 0 && (
                <Pressable
                  onPress={closeAttractions}
                  style={[styles.closeGuideButton, { backgroundColor: palette.primary }]}
                >
                  <Text style={styles.closeGuideText}>
                    Back to Popular Destinations
                  </Text>
                </Pressable>
              )}
            </View>
          )}

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
    paddingBottom: 32,
    paddingHorizontal: 16,
  },

  // SEARCH CARD

  heroHeading: {
    alignItems: 'center',
    marginBottom: 20,
  },

  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },

  heroAccent: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 7,
  },

  cardContainer: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
    color: '#087F73',
    fontWeight: '600',
  },

  popularHeading: {
    fontWeight: '900',
    fontSize: 23,
    color: '#173B35',
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

  destGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
  },

  destCard: {
    flex: 1,
    maxWidth: 210,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    overflow: 'hidden',
    shadowColor: '#064E45',
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

  placeholderText: {
    fontSize: 12,
    color: '#64748b',
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
    color: '#999999',
    marginBottom: 8,
  },

  exploreBtn: {
    width: 36,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#087F73',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // PAGINATION

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 4,
    gap: 8,
  },

  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paginationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  paginationInfo: {
    alignItems: 'center',
    flex: 1,
  },

  paginationPage: {
    fontSize: 17,
    fontWeight: '800',
  },

  paginationCaption: {
    fontSize: 10,
    marginTop: 3,
  },

  // TOURIST ATTRACTION SECTION

  attractionSection: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  attractionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  attractionTitleContainer: {
    flex: 1,
  },

  attractionOverline: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  attractionHeading: {
    fontWeight: '800',
  },

  attractionLocation: {
    color: '#999999',
    fontSize: 13,
    marginTop: 4,
  },

  attractionIntro: {
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 22,
  },

  attractionLoading: {
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },

  attractionLoadingText: {
    color: '#999999',
    fontSize: 13,
  },

  attractionCountRow: {
    marginBottom: 14,
  },

  attractionCount: {
    fontWeight: '800',
    fontSize: 15,
  },

  attractionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },

  attractionCard: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 240,
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    overflow: 'hidden',
    shadowColor: '#064E45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  attractionImage: {
    width: '100%',
    height: 190,
  },

  attractionImagePlaceholder: {
    width: '100%',
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },

  attractionContent: {
    padding: 16,
  },

  attractionName: {
    fontWeight: '800',
    marginBottom: 6,
  },

  attractionPlace: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
  },

  locationIcon: {
    color: '#0d9488',
  },

  attractionDescription: {
    lineHeight: 21,
    fontSize: 13,
  },

  photoCredit: {
    fontSize: 11,
    color: '#0d9488',
    marginTop: 12,
  },

  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
    paddingTop: 12,
  },

  viewDetailsText: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 12,
  },

  viewDetailsArrow: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '800',
  },

  attractionEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 14,
  },

  attractionEmptyText: {
    textAlign: 'center',
    color: '#999999',
  },

  retryButton: {
    backgroundColor: '#0d9488',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  closeGuideButton: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
  },

  closeGuideText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
