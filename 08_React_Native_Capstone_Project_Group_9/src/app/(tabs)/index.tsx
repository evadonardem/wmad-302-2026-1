import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Chip, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { searchPhotosByLocation, type Photo } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { usePalette, useThemeMode } from '@/themeMode';

const QUICK_SEARCH = ['Baguio City', 'Boracay', 'El Nido', 'Vigan City', 'Cebu City', 'Siargao'];

// Hero banner with auto-moving backdrop pictures (kept in this file on purpose)
function HeroBanner({
  images,
  title,
  subtitle,
  actions,
  children,
}: {
  images: string[];
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images]);

  return (
    <View style={styles.hero}>
      {images.length > 0 && (
        <Image
          source={{ uri: images[index % images.length] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={600}
        />
      )}
      <View style={styles.heroOverlay} />

      {actions && <View style={styles.heroActions}>{actions}</View>}

      <View style={styles.heroContent}>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={styles.heroSubtitle}>
          {subtitle}
        </Text>
        {children}
      </View>

      {images.length > 1 && (
        <View style={styles.dots}>
          {images.slice(0, 8).map((_, i) => (
            <Pressable key={i} onPress={() => setIndex(i)} hitSlop={6}>
              <View style={[styles.dot, i === index % images.length && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SearchScreen() {
  const p = usePalette();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const { recordSearch } = useSearchHistory();

  // TODO 3.7 [Global Search Coordination]
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');

  // default backdrop pictures shown before the first search
  const [defaultBackdrop, setDefaultBackdrop] = useState<Photo[]>([]);

  const { q } = useLocalSearchParams<{ q?: string }>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await searchPhotosByLocation('Philippines');
      if (!cancelled) setDefaultBackdrop(result ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = async (locationName: string) => {
    // TODO 3.8 [Operational Async Glue Engine]
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
      setLastSearchedCity(locationName);

      // TODO 5.1 [History Recording]
      recordSearch(locationName);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // TODO 4.6 [Pull-to-Refresh Workflow]
    setRefreshing(true);
    try {
      if (lastSearchedCity) {
        const results = await searchPhotosByLocation(lastSearchedCity);
        setPhotos(results);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // TODO 5.4 [Param-Driven Re-Search]
    if (typeof q === 'string' && q.trim() !== '') {
      handleSearchSubmit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // backdrop follows the latest search; falls back to the default set
  const backdropImages = (photos.length > 0 ? photos : defaultBackdrop).map((ph) => ph.imageUrl);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={p.accent} />
        }
      >
        <HeroBanner
          images={backdropImages}
          title="Explore the Philippines"
          subtitle="Discover the best places to visit in the Philippines"
          actions={
            <>
              <IconButton
                icon="history"
                iconColor="#ffffff"
                size={22}
                onPress={() => router.push('/history')}
                accessibilityLabel="Recent searches"
              />
              <IconButton
                icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
                iconColor="#ffffff"
                size={22}
                onPress={() => setIsDarkMode(!isDarkMode)}
                accessibilityLabel="Toggle dark mode"
              />
            </>
          }
        >
          <LocationForm onSearch={handleSearchSubmit} />

          <View style={styles.quickRow}>
            <Text style={styles.quickLabel}>Quick search:</Text>
            {QUICK_SEARCH.map((city) => (
              <Chip
                key={city}
                compact
                style={styles.quickChip}
                textStyle={styles.quickChipText}
                onPress={() => handleSearchSubmit(city)}
              >
                {city}
              </Chip>
            ))}
          </View>
        </HeroBanner>

        <Text
          variant="titleLarge"
          style={[styles.sectionTitle, { color: p.text, borderBottomColor: p.accent }]}
        >
          {lastSearchedCity ? `Tourist spots in ${lastSearchedCity}` : 'Tourist spots'}
        </Text>

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
  scrollContent: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#4a4a3a',
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 2,
  },
  heroContent: {
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontWeight: '300',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 20,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  quickLabel: {
    color: '#ffffff',
  },
  quickChip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
  },
  quickChipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
});