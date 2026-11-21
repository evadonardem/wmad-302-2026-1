import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';
import { useFavorites } from '@/components/MediaGallery';
import { usePalette } from '@/themeMode';
import type { Photo } from '@/services/geoPhotoService';

// search params can arrive as string | string[] — always take a single string
const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';

export default function PhotoDetailScreen() {
  const p = usePalette();
  const { photos } = usePhotos();
  const { isFavorite, toggleFavorite } = useFavorites();

  // TODO 4.4 [Route Param Extraction]
  const params = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
  }>();
  const id = first(params.id);
  const imageUrl = first(params.imageUrl);
  const photographer = first(params.photographer);
  const photographerUrl = first(params.photographerUrl);
  const altText = first(params.altText);

  // TODO 4.8 [Route Guard]
  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  // Position of the current photo inside the shared result set (for prev/next)
  const currentIndex = photos.findIndex((ph) => String(ph.id) === id);
  const liked = isFavorite(id);

  const goToAdjacentPhoto = (offset: number) => {
    // TODO 4.7 [Prev/Next Viewer]
    if (currentIndex === -1) return;
    const target = photos[currentIndex + offset];
    if (!target) return; // out of bounds: stay put

    router.replace({
      pathname: '/photo/[id]',
      params: {
        id: String(target.id),
        imageUrl: target.imageUrl,
        photographer: target.photographer,
        photographerUrl: target.photographerUrl,
        altText: target.altText,
      },
    });
  };

  const handleOpenPhotographer = () => {
    if (photographerUrl) {
      WebBrowser.openBrowserAsync(photographerUrl);
    }
  };

  const handleShare = async () => {
    // TODO 4.5 [Generic Share Sheet]
    try {
      await Share.share({
        title: `Tourist spot by ${photographer}`,
        message: `Check out this tourist spot photo by ${photographer}: ${photographerUrl || imageUrl}`,
        url: photographerUrl || imageUrl,
      });
    } catch {
      // no share support on this platform, or the user cancelled: fail quietly
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={styles.content}
    >
      {/* Dynamic native header title */}
      <Stack.Screen options={{ title: photographer ? `By ${photographer}` : 'Tourist Spot' }} />

      <View style={[styles.card, { backgroundColor: p.card }]}>
        <View style={[styles.imageWrap, { backgroundColor: p.field }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
            accessibilityLabel={altText}
          />
          <IconButton
            icon={liked ? 'heart' : 'heart-outline'}
            iconColor={liked ? '#e0245e' : '#ffffff'}
            size={24}
            style={styles.heart}
            onPress={() =>
              toggleFavorite({ id: id as unknown as Photo['id'], imageUrl, photographer, photographerUrl, altText })
            }
            accessibilityLabel={liked ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>

        <View style={styles.body}>
          {!!altText && (
            <Text variant="bodyMedium" style={{ color: p.text, textAlign: 'center' }}>
              {altText}
            </Text>
          )}

          <View style={styles.pagerRow}>
            <IconButton
              icon="chevron-left"
              iconColor={p.text}
              size={28}
              onPress={() => goToAdjacentPhoto(-1)}
              accessibilityLabel="Previous photo"
            />
            <Text variant="titleMedium" style={[styles.photographer, { color: p.text }]}>
              📸 Captured by {photographer || '—'}
            </Text>
            <IconButton
              icon="chevron-right"
              iconColor={p.text}
              size={28}
              onPress={() => goToAdjacentPhoto(1)}
              accessibilityLabel="Next photo"
            />
          </View>

          <Button
            mode="outlined"
            icon="open-in-new"
            textColor={p.accent}
            onPress={handleOpenPhotographer}
            disabled={!photographerUrl}
          >
            Visit photographer profile
          </Button>

          <Button
            mode="contained"
            icon="share-variant"
            buttonColor={p.accent}
            textColor="#ffffff"
            onPress={handleShare}
            style={styles.shareButton}
          >
            Share this spot
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    alignItems: 'center',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  body: {
    padding: 20,
    gap: 14,
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photographer: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareButton: {
    marginTop: 4,
  },
});