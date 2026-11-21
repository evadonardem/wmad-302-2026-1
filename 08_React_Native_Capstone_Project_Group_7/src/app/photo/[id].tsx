import { useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';
import { downloadPhoto, openLocation, sharePhoto, useEngagement } from '@/services/geoPhotoService';

// Search params may arrive as string | string[]; always coerce to a plain string
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { photos } = usePhotos();
  const { favorites, likes, toggleFavorite, toggleLike } = useEngagement();
  const [toast, setToast] = useState('');

  const params = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
    location?: string;
  }>();
  const id = one(params.id);
  const imageUrl = one(params.imageUrl);
  const photographer = one(params.photographer);
  const photographerUrl = one(params.photographerUrl);
  const altText = one(params.altText);
  const location = one(params.location);

  // Position of the current photo inside the shared result set (for prev/next)
  const currentIndex = photos.findIndex((p) => String(p.id) === id);

  const goToAdjacentPhoto = (offset: number) => {
    const target = photos[currentIndex + offset];
    if (currentIndex < 0 || !target) return; // nothing to move to
    // replace (not push) so Back closes the modal instead of stepping through every photo
    router.replace({
      pathname: '/photo/[id]',
      params: {
        id: String(target.id),
        imageUrl: target.imageUrl,
        photographer: target.photographer,
        photographerUrl: target.photographerUrl,
        altText: target.altText,
        location,
      },
    });
  };

  // Swipe left/right on the photo to browse (phones)
  const goRef = useRef(goToAdjacentPhoto);
  goRef.current = goToAdjacentPhoto;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goRef.current(1);
        else if (g.dx > 50) goRef.current(-1);
      },
    }),
  ).current;

  // Route guard — opened directly or via a stale link
  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  const photo = { imageUrl, photographer, photographerUrl, altText };
  const liked = likes.has(id);
  const favorite = favorites.has(id);

  const handleOpenPhotographer = () => {
    if (photographerUrl) WebBrowser.openBrowserAsync(photographerUrl);
  };

  const handleShare = async () => {
    const msg = await sharePhoto(photo, location);
    if (msg) setToast(msg);
  };

  const handleDownload = async () => setToast(await downloadPhoto(photo));

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: photographer ? `By ${photographer}` : 'Tourist Spot' }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View {...pan.panHandlers}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={200}
            accessibilityLabel={altText}
          />
        </View>

        <View style={[styles.body, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.pagerRow}>
            <IconButton
              icon="chevron-left"
              iconColor={theme.colors.onSurface}
              size={28}
              disabled={currentIndex <= 0}
              onPress={() => goToAdjacentPhoto(-1)}
              accessibilityLabel="Previous photo"
            />
            <View style={styles.pagerCenter}>
              <Text variant="titleMedium" style={[styles.photographer, { color: theme.colors.onSurface }]}>
                📸 Captured by {photographer || '—'}
              </Text>
              {currentIndex >= 0 && (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {currentIndex + 1} / {photos.length}
                </Text>
              )}
            </View>
            <IconButton
              icon="chevron-right"
              iconColor={theme.colors.onSurface}
              size={28}
              disabled={currentIndex < 0 || currentIndex >= photos.length - 1}
              onPress={() => goToAdjacentPhoto(1)}
              accessibilityLabel="Next photo"
            />
          </View>

          {/* Caption */}
          {!!altText && (
            <Text variant="bodyLarge" style={[styles.caption, { color: theme.colors.onSurface }]}>
              {altText}
            </Text>
          )}
          {!!location && (
            <Text variant="labelLarge" style={{ color: theme.colors.primary, textAlign: 'center' }}>
              📍 {location}, Philippines
            </Text>
          )}

          <View style={styles.actionRow}>
            <IconButton
              mode="contained-tonal"
              icon={liked ? 'heart' : 'heart-outline'}
              iconColor={liked ? '#E11D48' : undefined}
              onPress={() => toggleLike(id)}
              accessibilityLabel="Like"
            />
            <IconButton
              mode="contained-tonal"
              icon={favorite ? 'star' : 'star-outline'}
              iconColor={favorite ? '#F59E0B' : undefined}
              onPress={() => toggleFavorite(id)}
              accessibilityLabel="Favorite"
            />
            <IconButton
              mode="contained-tonal"
              icon="map-marker"
              onPress={() => openLocation(location)}
              accessibilityLabel="Open location in maps"
            />
            <IconButton mode="contained-tonal" icon="download" onPress={handleDownload} accessibilityLabel="Download" />
          </View>

          <Button mode="outlined" icon="open-in-new" onPress={handleOpenPhotographer} disabled={!photographerUrl}>
            Visit photographer profile
          </Button>

          <Button mode="contained" icon="share-variant" onPress={handleShare} style={styles.shareButton}>
            Share this spot
          </Button>
        </View>
      </ScrollView>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={2500}>
        {toast}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  body: {
    flex: 1,
    padding: 20,
    gap: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    minHeight: 320,
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pagerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  photographer: {
    fontWeight: '600',
    textAlign: 'center',
  },
  caption: {
    textAlign: 'center',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  shareButton: {
    marginTop: 4,
  },
});