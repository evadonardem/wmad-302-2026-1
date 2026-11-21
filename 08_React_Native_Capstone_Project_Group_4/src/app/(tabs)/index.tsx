import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { fetchPhotosForLocation, type Photo } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

const HERO_BACKGROUNDS = [
  'https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg',
  'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg',
  'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
  'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg',
];

const NEON_GLOW_COLORS = ['#00f3ff', '#ff007f', '#a855f7', '#3b82f6'];

export default function SearchScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const { addSearch } = useSearchHistory();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [bgIndex, setBgIndex] = useState(0);

  const [flickerIndex, setFlickerIndex] = useState(0);
  const [isFlickerOn, setIsFlickerOn] = useState(true);

  // Background Fading Slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Text Neon Flickering Interval
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setFlickerIndex((prev) => (prev + 1) % NEON_GLOW_COLORS.length);
      setIsFlickerOn((prev) => !prev);
    }, 600);
    return () => clearInterval(flickerInterval);
  }, []);

  const executeSearch = useCallback(
    async (cityName: string) => {
      if (!cityName) return;
      setLoading(true);
      setLastQuery(cityName);
      
      addSearch(cityName);

      try {
        const results = await fetchPhotosForLocation(cityName);
        setPhotos(results);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    },
    [addSearch, setPhotos]
  );

  useEffect(() => {
    if (q && typeof q === 'string' && q !== lastQuery) {
      executeSearch(q);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [q, lastQuery, executeSearch]);

  const onRefresh = async () => {
    if (!lastQuery) return;
    setRefreshing(true);
    await executeSearch(lastQuery);
    setRefreshing(false);
  };

  const currentGlowColor = NEON_GLOW_COLORS[flickerIndex];

  return (
    <View style={[styles.mainWrapper, { backgroundColor: isDarkMode ? '#0b1329' : '#f8fafc' }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 2 }}>
        <Appbar.Content title="Lakbay PH" titleStyle={{ fontWeight: '800', letterSpacing: 0.5 }} />
        <Appbar.Action icon="history" onPress={() => router.push('/history')} />
        <Appbar.Action
          icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
          onPress={() => setIsDarkMode(!isDarkMode)}
        />
      </Appbar.Header>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: HERO_BACKGROUNDS[bgIndex] }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={1000}
          />

          <View style={styles.darkOverlay} />

          <View style={styles.headerContent}>
            <View style={styles.badgeRow}>
              <Text style={[styles.neonBadge, { borderColor: currentGlowColor, color: currentGlowColor }]}>
                ✨ DISCOVER THE PHILIPPINES
              </Text>
            </View>

            <Text
              style={[
                styles.glowingTitle,
                {
                  textShadowColor: currentGlowColor,
                  textShadowRadius: isFlickerOn ? 35 : 15,
                  opacity: isFlickerOn ? 1 : 0.85,
                },
              ]}
            >
              LAKBAY PH
            </Text>

            <Text style={styles.heroSubtitle}>
              Explore paradise destinations across regions, cities, and municipalities in real-time.
            </Text>

            <View style={[styles.glassFormCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.95)' }]}>
              <LocationForm
                onSearch={async (city) => {
                  await executeSearch(city.name);
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.gallerySection}>
          <MediaGallery photos={photos} loading={loading} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 32,
    width: '100%',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 480,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 11, 22, 0.65)',
  },
  headerContent: {
    width: '100%',
    maxWidth: 960,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    zIndex: 2,
  },
  badgeRow: {
    marginBottom: 12,
  },
  neonBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glowingTitle: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 8,
    color: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 580,
    lineHeight: 22,
  },
  glassFormCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 243, 255, 0.35)',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  gallerySection: {
    width: '100%',
    paddingHorizontal: 16,
  },
});