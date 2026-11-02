import React from 'react';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
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
  const [searchInput, setSearchInput] = useState(''); // ✅ Search text input

  const { q } = useLocalSearchParams<{ q?: string }>();

  // Handle search from LocationForm OR from the search bar
  const doSearch = async (locationName: string) => {
    if (!locationName.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
      setLastSearchedCity(locationName);
      setSearchInput(locationName); // Update input with searched text
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
      if (lastSearchedCity) {
        await doSearch(lastSearchedCity);
      }
    } catch (err) {
      console.warn('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Search when coming from history or direct link
  useEffect(() => {
    if (q && typeof q === 'string' && q.trim()) {
      doSearch(q.trim());
    }
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
        {/* ✅ CARD WITH SEARCH BAR */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDarkMode
                ? 'rgba(30, 30, 45, 0.95)'
                : '#ffffff',
              shadowColor: isDarkMode ? '#000000' : '#6b46c1',
            },
          ]}
        >
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Discover tourist spots across regions, cities, and municipalities in the Philippines
          </Text>

          {/* ✅ DIRECT SEARCH BAR — Type any place name! */}
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

          {/* LocationForm still works too */}
          <LocationForm onSearch={doSearch} />

          
        </View>

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
    paddingHorizontal: 8,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingBottom: 24,
  },

  cardContainer: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
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
  searchButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});