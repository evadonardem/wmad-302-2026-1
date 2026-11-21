import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  downloadPhoto,
  openLocation,
  sharePhoto,
  useEngagement,
  type Photo,
} from '@/services/geoPhotoService';

export default function MediaGallery({
  photos,
  loading,
  locationName,
}: {
  photos: Photo[];
  loading: boolean;
  locationName?: string;
}) {
  const theme = useTheme();
  const { favorites, likes, toggleFavorite, toggleLike } = useEngagement();
  const [toast, setToast] = useState('');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
          Finding tourist spots…
        </Text>
      </View>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          No tourist spots found for this area yet. 🏝️
        </Text>
      </View>
    );
  }

  const openDetail = (photo: Photo) =>
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: String(photo.id),
        imageUrl: photo.imageUrl,
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        altText: photo.altText,
        location: locationName ?? '',
      },
    });

  const handleShare = async (photo: Photo) => {
    const msg = await sharePhoto(photo, locationName);
    if (msg) setToast(msg);
  };

  const handleDownload = async (photo: Photo) => setToast(await downloadPhoto(photo));

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.onBackground }}>
          📍 {locationName || 'Results'}
        </Text>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {photos.length} spots
        </Text>
      </View>

      <View style={styles.grid}>
        {photos.map((photo) => {
          const id = String(photo.id);
          const liked = likes.has(id);
          const favorite = favorites.has(id);
          return (
            <View key={id} style={styles.gridItem}>
              <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                {/* Photo */}
                <Pressable
                  onPress={() => openDetail(photo)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.image}
                    contentFit="cover"
                    transition={250}
                    accessibilityLabel={photo.altText}
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.shade} />
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>📍 {locationName || 'Philippines'}</Text>
                  </View>
                </Pressable>

                {/* Heart + star on top of the photo */}
                <View style={styles.badges}>
                  <IconButton
                    mode="contained"
                    containerColor="rgba(255,255,255,0.92)"
                    icon={liked ? 'heart' : 'heart-outline'}
                    iconColor={liked ? '#E11D48' : '#475569'}
                    size={20}
                    onPress={() => toggleLike(id)}
                    accessibilityLabel={liked ? 'Unlike' : 'Like'}
                  />
                  <IconButton
                    mode="contained"
                    containerColor="rgba(255,255,255,0.92)"
                    icon={favorite ? 'star' : 'star-outline'}
                    iconColor={favorite ? '#F59E0B' : '#475569'}
                    size={20}
                    onPress={() => toggleFavorite(id)}
                    accessibilityLabel={favorite ? 'Remove favorite' : 'Add to favorites'}
                  />
                </View>

                {/* Caption + credit */}
                <View style={styles.content}>
                  <Text variant="bodyMedium" numberOfLines={2} style={styles.caption}>
                    {photo.altText || 'Beautiful tourist spot'}
                  </Text>
                  <Pressable
                    onPress={() => photo.photographerUrl && WebBrowser.openBrowserAsync(photo.photographerUrl)}
                    accessibilityRole="link"
                  >
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      📸 {photo.photographer}
                    </Text>
                  </Pressable>
                </View>

                {/* Actions */}
                <View style={[styles.actions, { borderTopColor: theme.colors.outlineVariant }]}>
                  <IconButton
                    icon="map-marker"
                    iconColor={theme.colors.primary}
                    size={22}
                    onPress={() => openLocation(locationName)}
                    accessibilityLabel="Open location in maps"
                  />
                  <IconButton
                    icon="share-variant"
                    iconColor={theme.colors.primary}
                    size={22}
                    onPress={() => handleShare(photo)}
                    accessibilityLabel="Share"
                  />
                  <IconButton
                    icon="download"
                    iconColor={theme.colors.primary}
                    size={22}
                    onPress={() => handleDownload(photo)}
                    accessibilityLabel="Download"
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={2500}>
        {toast}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%' },
  gridItem: { flexGrow: 1, flexBasis: '30%', minWidth: 240 },
  card: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  image: { width: '100%', aspectRatio: 4 / 3 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, pointerEvents: 'none' },
  pill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  badges: { position: 'absolute', top: 6, right: 6, flexDirection: 'row' },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 4 },
  caption: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
});