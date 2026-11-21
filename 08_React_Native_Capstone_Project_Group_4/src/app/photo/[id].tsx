import { Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { photos } = usePhotos();

  // TODO 4.4 [Route Param Extraction]
  const params = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
  }>();

  const id = params.id ?? '';
  const imageUrl = params.imageUrl ?? '';
  const photographer = params.photographer ?? '';
  const photographerUrl = params.photographerUrl ?? '';
  const altText = params.altText ?? '';

  // TODO 4.8 [Route Guard]
  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  const currentIndex = photos.findIndex((p) => String(p.id) === id);

  // TODO 4.7 [Prev/Next Viewer]
  const goToAdjacentPhoto = (offset: number) => {
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + offset;
    if (targetIndex >= 0 && targetIndex < photos.length) {
      const target = photos[targetIndex];
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
    }
  };

  const handleOpenPhotographer = () => {
    if (photographerUrl) {
      WebBrowser.openBrowserAsync(photographerUrl);
    }
  };

  // TODO 4.5 [Generic Share Sheet]
  const handleShare = async () => {
    try {
      await Share.share({
        title: `Photo by ${photographer}`,
        message: `Check out this awesome tourist spot photo captured by ${photographer}!`,
        url: photographerUrl || imageUrl,
      });
    } catch (error) {
      console.error('Error sharing photo:', error);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: photographer ? `By ${photographer}` : 'Tourist Spot' }} />

      <Image
        source={{ uri: imageUrl }}
        style={styles.hero}
        contentFit="cover"
        transition={200}
        accessibilityLabel={altText}
      />

      <View style={[styles.body, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.pagerRow}>
          <IconButton
            icon="chevron-left"
            iconColor={theme.colors.onSurface}
            size={28}
            onPress={() => goToAdjacentPhoto(-1)}
            accessibilityLabel="Previous photo"
          />
          <Text variant="titleMedium" style={[styles.photographer, { color: theme.colors.onSurface }]}>
            📸 Captured by {photographer || '—'}
          </Text>
          <IconButton
            icon="chevron-right"
            iconColor={theme.colors.onSurface}
            size={28}
            onPress={() => goToAdjacentPhoto(1)}
            accessibilityLabel="Next photo"
          />
        </View>

        <Button mode="outlined" icon="open-in-new" onPress={handleOpenPhotographer} disabled={!photographerUrl}>
          Visit photographer profile
        </Button>

        <Button mode="contained" icon="share-variant" onPress={handleShare} style={styles.shareButton}>
          Share this spot
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  body: {
    flex: 1,
    padding: 20,
    gap: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
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
