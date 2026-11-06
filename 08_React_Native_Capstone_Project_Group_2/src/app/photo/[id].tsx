import { Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { photos } = usePhotos();

  const { id, imageUrl, photographer, photographerUrl, altText } =
    useLocalSearchParams<{ id?: string; imageUrl?: string; photographer?: string; photographerUrl?: string; altText?: string }>();

  if (!id || !imageUrl || !photographer) return <Redirect href="/" />;

  // Position of the current photo inside the shared result set (for prev/next)
  const currentIndex = photos.findIndex((p) => String(p.id) === id);

  const goToAdjacentPhoto = (offset: number) => {
    const target = photos[currentIndex + offset];
    if (!target) return;
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
    try {
      await Share.share({
        title: `${photographer} - Lakbay PH`,
        message: `Explore this tourist spot photo by ${photographer}.${photographerUrl ? ` ${photographerUrl}` : ''}`,
        url: imageUrl,
      });
    } catch (error) {
      console.warn('Unable to open the share sheet.', error);
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
        <Text variant="labelLarge" style={[styles.eyebrow, { color: theme.colors.primary }]}>FEATURED DISCOVERY</Text>
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
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
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
