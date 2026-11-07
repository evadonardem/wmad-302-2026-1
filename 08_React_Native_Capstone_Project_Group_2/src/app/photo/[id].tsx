import { Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';
import { useFavorites } from '@/favorites';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const { photos } = usePhotos();
  const { isFavorite, toggleFavorite } = useFavorites();
  const scale = useSharedValue(1);

  const { id, imageUrl, photographer, photographerUrl, altText } =
    useLocalSearchParams<{ id?: string; imageUrl?: string; photographer?: string; photographerUrl?: string; altText?: string }>();

  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const imageFrameHeight = Math.min(viewportHeight * 0.48, viewportWidth * 0.75, 520);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.set(Math.max(1, Math.min(event.scale, 4)));
    })
    .onEnd(() => {
      if (scale.get() < 1.05) scale.set(withTiming(1));
    });
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.set(withTiming(scale.get() > 1 ? 1 : 2));
    });

  if (!id || !imageUrl || !photographer) return <Redirect href="/" />;

  const photoId = Number(id);
  const favorite = isFavorite(photoId);
  const image = { id: photoId, imageUrl, photographer, photographerUrl: photographerUrl ?? '', altText: altText ?? 'Tourist spot' };

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

      <GestureDetector gesture={Gesture.Simultaneous(pinchGesture, doubleTapGesture)}>
        <View style={[styles.imageFrame, { height: imageFrameHeight }]}>
          <AnimatedImage
            source={{ uri: imageUrl }}
            style={[styles.hero, imageStyle]}
            contentFit="contain"
            transition={200}
            accessibilityLabel={altText}
          />
        </View>
      </GestureDetector>

      <View style={[styles.body, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headingRow}>
          <Text variant="labelLarge" style={[styles.eyebrow, { color: theme.colors.primary }]}>FEATURED DISCOVERY</Text>
          <IconButton
            icon={favorite ? 'heart' : 'heart-outline'}
            iconColor={favorite ? theme.colors.error : theme.colors.primary}
            onPress={() => toggleFavorite(image)}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>
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
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  imageFrame: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
