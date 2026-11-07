import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, Button, Divider, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import { searchPhotosByLocation, type Photo } from '@/services/geoPhotoService';
import { findPlace, usePlaceIndex, type PlaceEntry } from '@/hooks/usePlaceIndex';
import { openInMaps } from '@/utils/openInMaps';

// Extra feature (not part of the assignment TODOs):
// pick two places and see their PSGC details and Pexels photos side by side.
const PHOTOS_PER_SIDE = 3;

type Side = {
  label: string;
  place: PlaceEntry | null;
  photos: Photo[];
};

const capitalize = (text?: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '—');

export default function CompareScreen() {
  const theme = useTheme();
  const { places } = usePlaceIndex();

  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [placeA, setPlaceA] = useState<PlaceEntry | null>(null);
  const [placeB, setPlaceB] = useState<PlaceEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<[Side, Side] | null>(null);

  // Use the picked suggestion if the text still matches it, otherwise try an exact name match.
  const resolve = (text: string, picked: PlaceEntry | null) =>
    picked && picked.displayName === text.trim() ? picked : findPlace(places, text);

  const canCompare = textA.trim().length > 0 && textB.trim().length > 0 && !loading;

  const handleCompare = async () => {
    if (!canCompare) return;
    const a = resolve(textA, placeA);
    const b = resolve(textB, placeB);
    const labelA = a?.displayName ?? textA.trim();
    const labelB = b?.displayName ?? textB.trim();

    setLoading(true);
    try {
      const [photosA, photosB] = await Promise.all([
        searchPhotosByLocation(labelA),
        searchPhotosByLocation(labelB),
      ]);
      setResult([
        { label: labelA, place: a, photos: photosA },
        { label: labelB, place: b, photos: photosB },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setTextA(textB);
    setTextB(textA);
    setPlaceA(placeB);
    setPlaceB(placeA);
    if (result) setResult([result[1], result[0]]);
  };

  const openPhoto = (photo: Photo) =>
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: String(photo.id),
        imageUrl: photo.imageUrl,
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        altText: photo.altText,
      },
    });

  const renderSide = (side: Side) => {
    const rows: [string, string][] = [
      ['Type', side.place ? (side.place.isCity ? 'City' : 'Municipality') : '—'],
      ['Province', side.place?.province ?? '—'],
      ['Region', side.place?.regionName ?? '—'],
      ['Island group', capitalize(side.place?.islandGroupCode)],
      ['Photos found', String(side.photos.length)],
    ];

    return (
      <Surface style={styles.column} elevation={1}>
        <Text variant="titleMedium" numberOfLines={2} style={styles.columnTitle}>
          {side.label}
        </Text>

        {rows.map(([label, value]) => (
          <View key={label} style={styles.infoRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {label}
            </Text>
            <Text variant="bodyMedium" numberOfLines={2}>
              {value}
            </Text>
          </View>
        ))}

        <Divider style={styles.divider} />

        {side.photos.length === 0 ? (
          <Text variant="bodySmall" style={[styles.noPhotos, { color: theme.colors.onSurfaceVariant }]}>
            No photos — Pexels may be unreachable on this network.
          </Text>
        ) : (
          side.photos.slice(0, PHOTOS_PER_SIDE).map((photo) => (
            <Pressable key={photo.id} onPress={() => openPhoto(photo)} accessibilityLabel={photo.altText}>
              <Image
                source={{ uri: photo.imageUrl }}
                style={[styles.photo, { backgroundColor: photo.avgColor ?? theme.colors.surfaceVariant }]}
                contentFit="cover"
                transition={300}
              />
            </Pressable>
          ))
        )}

        {/* Hand the place to the Search tab (uses the same ?q= handoff as History) */}
        <Button
          mode="outlined"
          icon="magnify"
          compact
          style={styles.searchThis}
          onPress={() => router.navigate({ pathname: '/', params: { q: side.label } })}
        >
          Search this
        </Button>

        {/* Extra: show this place in Google Maps (with its province, when known) */}
        <Button
          mode="text"
          icon="map-marker"
          compact
          onPress={() =>
            openInMaps(side.place?.province ? `${side.label}, ${side.place.province}` : side.label)
          }
        >
          Map
        </Button>
      </Surface>
    );
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Compare places' }} />

      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Pick two cities or municipalities to compare them side by side.
      </Text>

      <PlaceAutocomplete
        placeholder="First place, e.g. Baguio"
        value={textA}
        onChangeText={(text) => {
          setTextA(text);
          setPlaceA(null);
        }}
        onSelectPlace={setPlaceA}
        accessibilityLabel="First place"
      />

      <View style={styles.swapRow}>
        <IconButton icon="swap-vertical" onPress={handleSwap} accessibilityLabel="Swap places" />
      </View>

      <PlaceAutocomplete
        placeholder="Second place, e.g. Vigan"
        value={textB}
        onChangeText={(text) => {
          setTextB(text);
          setPlaceB(null);
        }}
        onSelectPlace={setPlaceB}
        onSubmit={handleCompare}
        accessibilityLabel="Second place"
      />

      <Button
        mode="contained"
        icon="compare-horizontal"
        onPress={handleCompare}
        disabled={!canCompare}
        style={styles.compareButton}
        contentStyle={styles.compareButtonContent}
      >
        Compare
      </Button>

      {loading && <ActivityIndicator style={styles.loader} />}

      {!loading && result && (
        <View style={styles.columns}>
          {renderSide(result[0])}
          {renderSide(result[1])}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  swapRow: {
    alignItems: 'center',
    marginVertical: -6,
  },
  compareButton: {
    marginTop: 6,
  },
  compareButtonContent: {
    paddingVertical: 6,
  },
  loader: {
    marginTop: 24,
  },
  columns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  columnTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    gap: 1,
  },
  divider: {
    marginVertical: 6,
  },
  noPhotos: {
    textAlign: 'center',
    paddingVertical: 12,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  searchThis: {
    marginTop: 4,
  },
});
