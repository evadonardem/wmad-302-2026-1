import React from 'react';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ ADDED
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
  const [searchInput, setSearchInput] = useState('');

  const { q } = useLocalSearchParams<{ q?: string }>();

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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (lastSearchedCity) await doSearch(lastSearchedCity);
    } catch (err) {
      console.warn('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (q && typeof q === 'string' && q.trim()) doSearch(q.trim());
  }, [q]);

  return (
    <LinearGradient
      // Tropical gradient background
      colors={isDarkMode
        ? ['#0f172a', '#1e293b', '#0c4a6e']  // Deep ocean dark theme
        : ['#e0f2fe', '#f0fdf4', '#fffbeb']}  // Sky → green → sand light theme
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
          {/* Card — Slightly transparent so gradient shows through */}
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
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Discover tourist spots across regions, cities, and municipalities in the Philippines
            </Text>

            <TextInput
              label="Search Places"
              placeholder="Type a place name... e.g. El Nido, Boracay, Baguio"
              value={searchInput}
              onChangeText={setSearchInput}
              style={styles.searchInput}
              mode="outlined"
              right={<TextInput.Icon icon="magnify" onPress={() => doSearch(searchInput)} />}
              onSubmitEditing={() => doSearch(searchInput)}
            />

            <Text variant="labelMedium" style={styles.orText}>
              — Or select by location —
            </Text>

            <LocationForm onSearch={doSearch} />
          </View>

          <MediaGallery photos={photos} loading={loading} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

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
    maxWidth: 960,
    alignSelf: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
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
});