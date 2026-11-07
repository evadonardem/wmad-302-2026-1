import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Chip, Searchbar, Surface, Text, useTheme } from 'react-native-paper';
import type { Photo } from '@/services/geoPhotoService';
import { useFeaturedPhotos } from '@/hooks/useFeaturedPhotos';
import { useSearchHistory } from '@/searchHistory';

// How many recent searches to show as chips.
const MAX_RECENT_CHIPS = 5;

// Extra feature (not part of the assignment TODOs):
// type any place, or tap a popular destination, and search instantly —
// a shortcut alongside the Region → City pickers in LocationForm.
// The panel's background is a photo from the Pexels API (no local image file needed).
const POPULAR_DESTINATIONS = [
  'Boracay',
  'El Nido',
  'Siargao',
  'Baguio City',
  'Vigan City',
  'Bohol',
  'Coron',
  'Cebu City',
  'Banaue',
  'Davao City',
];

export default function QuickSearch({
  onSearch,
  loading = false,
  backgroundPhoto,
}: {
  onSearch: (place: string) => void;
  loading?: boolean;
  // Optional: the current search's top photo. Falls back to a featured Philippines photo.
  backgroundPhoto?: Photo;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const featured = useFeaturedPhotos();
  const { entries } = useSearchHistory();
  const recentSearches = entries.slice(0, MAX_RECENT_CHIPS);

  // Uses a different featured photo than the header (index 1 vs 0) so they don't match.
  const photo = backgroundPhoto ?? featured[1] ?? featured[0];
  const hasPhoto = !!photo?.imageUrl;

  // Over a photo, text is white on a dark overlay; without one, normal theme colors.
  const headingColor = hasPhoto ? '#FFFFFF' : theme.colors.onSurface;
  const mutedColor = hasPhoto ? 'rgba(255, 255, 255, 0.85)' : theme.colors.onSurfaceVariant;
  const lineColor = hasPhoto ? 'rgba(255, 255, 255, 0.5)' : theme.colors.outlineVariant;

  const submit = (place: string) => {
    const trimmed = place.trim();
    if (!trimmed || loading) {
      return;
    }
    onSearch(trimmed);
  };

  return (
    <Surface style={styles.panel} elevation={2}>
      {hasPhoto && photo && (
        <>
          <Image
            source={{ uri: photo.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={500}
            accessibilityLabel={photo.altText}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none" />
        </>
      )}

      <View style={styles.content}>
        <Text variant="titleMedium" style={[styles.heading, { color: headingColor }]}>
          ⚡ Quick search
        </Text>

        <Searchbar
          placeholder="Type a place, e.g. Boracay"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => submit(query)}
          onIconPress={() => submit(query)}
          returnKeyType="search"
          loading={loading}
          style={styles.searchbar}
          accessibilityLabel="Quick search a place"
        />

        {/* Extra: last few searches (saved history), one tap to run again */}
        {recentSearches.length > 0 && (
          <>
            <Text variant="labelMedium" style={[styles.subheading, { color: mutedColor }]}>
              Recent searches
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {recentSearches.map((place) => (
                <Chip
                  key={`recent-${place}`}
                  icon="history"
                  mode={hasPhoto ? 'flat' : 'outlined'}
                  disabled={loading}
                  onPress={() => {
                    setQuery(place);
                    submit(place);
                  }}
                  accessibilityLabel={`Search ${place} again`}
                >
                  {place}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        <Text variant="labelMedium" style={[styles.subheading, { color: mutedColor }]}>
          Popular destinations
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {POPULAR_DESTINATIONS.map((place) => (
            <Chip
              key={place}
              icon="map-marker"
              mode={hasPhoto ? 'flat' : 'outlined'}
              disabled={loading}
              onPress={() => {
                setQuery(place);
                submit(place);
              }}
            >
              {place}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
          <Text variant="labelSmall" style={{ color: mutedColor }}>
            or browse by region
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
        </View>

        {/* Pexels asks apps to credit the photographer */}
        {hasPhoto && photo && (
          <Text variant="labelSmall" style={styles.credit} numberOfLines={1}>
            📸 {photo.photographer} on Pexels
          </Text>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  heading: {
    fontWeight: 'bold',
  },
  searchbar: {
    borderRadius: 14,
  },
  subheading: {
    marginTop: 4,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  credit: {
    alignSelf: 'flex-end',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});