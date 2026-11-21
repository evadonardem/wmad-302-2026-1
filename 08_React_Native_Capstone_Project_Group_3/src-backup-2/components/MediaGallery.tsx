import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { ActivityIndicator, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';
import { useFavorites } from '@/favorites';

// Extra: responsive column count based on the grid's measured width.
const GRID_GAP = 12;
const SKELETON_COUNT = 6;
const columnsForWidth = (width: number) => (width < 560 ? 1 : width < 900 ? 2 : 3);

// Extra: a fake gradient made of stacked translucent bands, so no extra package is needed.
const SCRIM_BANDS = [0, 0.12, 0.28, 0.45, 0.6];

// Extra: pulsing placeholder card shown while photos load.
function SkeletonCard({ itemStyle }: { itemStyle: object }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={itemStyle}>
      <Animated.View
        style={[styles.skeletonCard, { opacity, backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={[styles.skeletonImage, { backgroundColor: theme.colors.outlineVariant }]} />
        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonLine, styles.skeletonLineShort, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.outlineVariant }]} />
        </View>
      </Animated.View>
    </View>
  );
}

export default function MediaGallery({ photos, loading }: { photos: Photo[]; loading: boolean }) {
  const theme = useTheme();
  const [gridWidth, setGridWidth] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleGridLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (Math.abs(width - gridWidth) > 1) {
      setGridWidth(width);
    }
  };

  // Until the grid has been measured, fall back to the original flexBasis styling.
  const columns = columnsForWidth(gridWidth);
  const itemStyle =
    gridWidth > 0
      ? [
          styles.gridItem,
          {
            width: Math.floor((gridWidth - GRID_GAP * (columns - 1)) / columns),
            flexGrow: 0,
            flexBasis: 'auto' as const,
            minWidth: 0,
          },
        ]
      : styles.gridItem;

  const openPhotographerProfile = async (url: string) => {
    if (!url) {
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Failed to open photographer profile:', error);
    }
  };

  // TODO 3.1 [Loading Skeletal Feedbacks]: If the 'loading' prop evaluates true, return a visual
  // waiting feedback layout instead of the gallery.
  // Pro Tip: render a Paper <ActivityIndicator /> (or loop mock placeholder Views) to show a
  // clean visual waiting state while photos are being fetched.
  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <View style={styles.loadingHeader}>
          <ActivityIndicator animating size="small" />
          <Text variant="bodyMedium" style={styles.statusText}>
            Finding tourist spots...
          </Text>
        </View>
        <View style={styles.grid} onLayout={handleGridLayout}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <SkeletonCard key={`skeleton-${index}`} itemStyle={itemStyle} />
          ))}
        </View>
      </View>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]: If the photos array contains no records, return a
  // fallback layout displaying a simple status message like:
  // "No tourist spots found for this area yet."
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.statusContainer}>
        <Text variant="titleMedium">🏝️</Text>
        <Text variant="bodyMedium" style={styles.statusText}>
          No tourist spots found for this area yet.
        </Text>
      </View>
    );
  }

  return (
    // TODO 3.3 [Fluid Layout Architecture]: Build a responsive wrapping grid using flexbox
    // (the RN substitute for MUI <Grid> breakpoints): a row container with flexWrap enabled,
    // then map across your structured 'photos' payload elements inside it.
    <View style={styles.grid} onLayout={handleGridLayout}>
      {/* TODO 3.4 [Card Content Loop Mapping]: Loop across the photo elements with a unique key,
          wrapping each one in a grid cell View (styles.gridItem) containing the Card template below. */}
      {/* TODO 4.3 [Detail Navigation Trigger]: Make each grid cell (or its Card) pressable so a tap
          pushes the photo detail route (a DYNAMIC segment) with router.push:
            router.push({ pathname: '/photo/[id]', params: { id: String(photo.id), imageUrl: photo.imageUrl, photographer: photo.photographer, photographerUrl: photo.photographerUrl, altText: photo.altText } })
          Pass every field the detail screen needs — route params travel as strings, and the id
          becomes part of the URL path (/photo/12345?...). */}
      {photos.map((photo) => (
        <View key={photo.id} style={itemStyle}>
          <Card
            style={styles.card}
            elevation={2}
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
            {/* TODO 3.5 [Multimedia Presentation Layer]: Render a Paper <Card.Cover /> image block.
                Set its source to {{ uri: photo.imageUrl }} and bind 'photo.altText' as the
                accessibilityLabel for the image asset. */}
            <View style={styles.coverWrapper}>
              <Card.Cover
                source={{ uri: photo.imageUrl }}
                accessibilityLabel={photo.altText}
                style={[styles.cover, { backgroundColor: photo.avgColor ?? theme.colors.surfaceVariant }]}
              />

              {/* Extra: dark fade + caption over the bottom of the photo */}
              <View style={styles.scrim} pointerEvents="none">
                {SCRIM_BANDS.map((alpha) => (
                  <View key={alpha} style={[styles.scrimBand, { backgroundColor: `rgba(0,0,0,${alpha})` }]} />
                ))}
                <Text variant="labelLarge" numberOfLines={2} style={styles.caption}>
                  {photo.altText}
                </Text>
              </View>

              {/* Extra: save / unsave this photo as a favorite */}
              <IconButton
                icon={isFavorite(photo.id) ? 'heart' : 'heart-outline'}
                iconColor={isFavorite(photo.id) ? '#FF4D6D' : '#FFFFFF'}
                containerColor="rgba(0, 0, 0, 0.35)"
                size={20}
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(photo)}
                accessibilityLabel={isFavorite(photo.id) ? 'Remove from favorites' : 'Add to favorites'}
              />
            </View>

            <Card.Content style={styles.cardContent}>
              <Text variant="labelSmall" style={styles.creditLabel}>
                📸 Captured by:
              </Text>
              {/* TODO 3.6 [Attribution Links]: Render the photographer credit as a Pressable Text.
                  Display 'photo.photographer' and, on press, open 'photo.photographerUrl' in the
                  device browser using WebBrowser.openBrowserAsync (RN has no <a> hyperlinks). */}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open ${photo.photographer}'s profile`}
                onPress={() => openPhotographerProfile(photo.photographerUrl)}
                hitSlop={8}
              >
                <Text
                  variant="bodyMedium"
                  style={[styles.photographerLink, { color: theme.colors.primary }]}
                >
                  {photo.photographer}
                </Text>
              </Pressable>
            </Card.Content>
          </Card>
        </View>
      ))}
      {/* End Loop */}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
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
  },
  coverWrapper: {
    position: 'relative',
  },
  cover: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    justifyContent: 'flex-end',
  },
  scrimBand: {
    flex: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    margin: 0,
  },
  caption: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    color: '#FFFFFF',
  },
  cardContent: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  creditLabel: {
    opacity: 0.7,
  },
  photographerLink: {
    marginTop: 2,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingWrapper: {
    width: '100%',
    gap: 16,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  skeletonCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 195,
    width: '100%',
  },
  skeletonBody: {
    padding: 14,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    width: '70%',
  },
  skeletonLineShort: {
    width: '35%',
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  statusText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
