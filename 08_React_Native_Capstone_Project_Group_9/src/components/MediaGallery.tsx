import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Text } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';
import { usePalette, useThemeMode } from '@/themeMode';

// ---- Favorites (hearts), saved in the browser so it survives refresh ----
export type FavoritePhoto = Photo & { place?: string };

const FAV_KEY = 'lakbay_favorites';
const storage = () => (globalThis as any).localStorage;

let favorites: FavoritePhoto[] = (() => {
  try {
    const raw = storage()?.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as FavoritePhoto[]) : [];
  } catch {
    return [];
  }
})();

const favListeners = new Set<() => void>();

function emitFavorites() {
  try {
    storage()?.setItem(FAV_KEY, JSON.stringify(favorites));
  } catch { }
  favListeners.forEach((listener) => listener());
}

function subscribeFavorites(listener: () => void) {
  favListeners.add(listener);
  return () => {
    favListeners.delete(listener);
  };
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribeFavorites, () => favorites, () => favorites);

  const isFavorite = (id: string | number) => list.some((f) => String(f.id) === String(id));

  const toggleFavorite = (photo: FavoritePhoto) => {
    favorites = isFavorite(photo.id)
      ? favorites.filter((f) => String(f.id) !== String(photo.id))
      : [...favorites, photo];
    emitFavorites();
  };

  return { favorites: list, isFavorite, toggleFavorite };
}

// ---- Cursive font (web: loaded from Google Fonts, native: serif fallback) ----
const SCRIPT_FONT = Platform.select({
  web: "'Great Vibes', cursive",
  default: 'serif',
}) as string;

function useScriptFont() {
  useEffect(() => {
    const doc = (globalThis as any).document;
    if (Platform.OS !== 'web' || !doc || doc.getElementById('lakbay-script-font')) return;
    const link = doc.createElement('link');
    link.id = 'lakbay-script-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
    doc.head.appendChild(link);
  }, []);
}

// Shrinks the cursive name for long place names so it always fits
const fitSize = (text: string, max: number, min: number, fitChars: number) =>
  Math.round(Math.max(min, Math.min(max, (max * fitChars) / Math.max(text.length, fitChars))));

const PAGE_SIZE = 6;

// ---- Gallery ----
export default function MediaGallery({
  photos,
  loading,
  locationName,
}: {
  photos: FavoritePhoto[];
  loading: boolean;
  locationName?: string;
}) {
  const p = usePalette();
  const { isDarkMode } = useThemeMode();
  const { isFavorite, toggleFavorite } = useFavorites();
  useScriptFont();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Start from the first page whenever the list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [photos]);

  const cardBg = isDarkMode ? '#3a3524' : '#ead9b9';

  const openDirections = (place: string) => {
    WebBrowser.openBrowserAsync(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} Philippines`)}`,
    );
  };

  // TODO 3.1 [Loading Skeletal Feedbacks]
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" animating color={p.accent} />
      </View>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyMedium" style={{ color: p.textSoft, textAlign: 'center' }}>
          No tourist spots found for this area yet.
        </Text>
      </View>
    );
  }

  const visible = photos.slice(0, visibleCount);
  const remaining = photos.length - visible.length;

  return (
    <View style={styles.root}>
      {/* TODO 3.3 [Fluid Layout Architecture] */}
      <View style={styles.grid}>
        {/* TODO 3.4 [Card Content Loop Mapping] */}
        {visible.map((photo) => {
          const place = photo.place ?? locationName;
          const liked = isFavorite(photo.id);

          return (
            <View key={String(photo.id)} style={styles.gridItem}>
              {/* TODO 4.3 [Detail Navigation Trigger] */}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/photo/[id]',
                    params: {
                      id: String(photo.id),
                      imageUrl: photo.imageUrl,
                      photographer: photo.photographer,
                      photographerUrl: photo.photographerUrl,
                      altText: photo.altText,
                    },
                  })
                }
              >
                <Card style={[styles.card, { backgroundColor: cardBg }]} elevation={2}>
                  <View style={styles.imageWrap}>
                    {/* TODO 3.5 [Multimedia Presentation Layer] */}
                    <Card.Cover
                      source={{ uri: photo.imageUrl }}
                      accessibilityLabel={photo.altText}
                      style={styles.cover}
                    />

                    {!!place && (
                      <IconButton
                        icon="directions"
                        iconColor="#556b2f"
                        containerColor="#ffffff"
                        size={20}
                        style={styles.directions}
                        onPress={() => openDirections(place)}
                        accessibilityLabel={`Directions to ${place}`}
                      />
                    )}

                    {!!place && (
                      <Text
                        style={[styles.imageTag, { fontSize: fitSize(place, 34, 20, 14) }]}
                        numberOfLines={1}
                      >
                        {place}
                      </Text>
                    )}

                    <IconButton
                      icon={liked ? 'heart' : 'heart-outline'}
                      iconColor={liked ? '#e0245e' : '#3b3a2a'}
                      containerColor="#ffffff"
                      size={22}
                      style={styles.heart}
                      onPress={() => toggleFavorite({ ...photo, place })}
                      accessibilityLabel={liked ? 'Remove from favorites' : 'Add to favorites'}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.textCol}>
                      <Text variant="bodyMedium" numberOfLines={2} style={{ color: p.text }}>
                        {photo.altText}
                      </Text>
                      {/* TODO 3.6 [Attribution Links] */}
                      <Text variant="bodySmall" style={{ color: p.textSoft }}>
                        📸 Captured by:{' '}
                        <Text
                          variant="bodySmall"
                          style={{ color: p.accent, textDecorationLine: 'underline' }}
                          onPress={() => {
                            if (photo.photographerUrl) {
                              WebBrowser.openBrowserAsync(photo.photographerUrl);
                            }
                          }}
                        >
                          {photo.photographer}
                        </Text>
                      </Text>
                    </View>

                    {!!place && (
                      <Text
                        style={[
                          styles.cornerTag,
                          { color: p.accent, fontSize: fitSize(place, 30, 16, 11) },
                        ]}
                        numberOfLines={2}
                      >
                        {place}
                      </Text>
                    )}
                  </View>
                </Card>
              </Pressable>
            </View>
          );
        })}
        {/* End Loop */}
      </View>

      {remaining > 0 && (
        <View style={styles.loadMoreWrap}>
          <Button
            mode="outlined"
            compact
            textColor={p.accent}
            style={{ borderColor: p.accent }}
            onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            {`Load more (${remaining} left)`}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 16,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 240,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 24,
  },
  imageWrap: {
    zIndex: 1,
  },
  cover: {
    borderRadius: 0,
    height: 210,
  },
  directions: {
    position: 'absolute',
    top: 8,
    right: 8,
    margin: 0,
  },
  imageTag: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    color: '#ffffff',
    fontFamily: SCRIPT_FONT,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    maxWidth: '72%',
  },
  heart: {
    position: 'absolute',
    right: 12,
    bottom: -20,
    margin: 0,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  cornerTag: {
    fontFamily: SCRIPT_FONT,
    opacity: 0.85,
    maxWidth: '48%',
    textAlign: 'right',
    flexShrink: 0,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
});