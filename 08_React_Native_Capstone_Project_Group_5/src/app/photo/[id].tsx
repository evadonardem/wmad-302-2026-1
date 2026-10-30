import { Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';

// Search params can arrive as string | string[] — always take the first string.
const firstParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { photos } = usePhotos();

  // TODO 4.4 [Route Param Extraction]: Replace the placeholder values below with real route
  // parameters read from this screen's URL using useLocalSearchParams() ('expo-router'):
  // - 'id' arrives from the dynamic path segment (/photo/[id])
  // - the rest arrive as search params (?imageUrl=...&photographer=...)
  // Example: const { id, imageUrl, photographer, photographerUrl, altText } =
  //            useLocalSearchParams<{ id?: string; imageUrl?: string; photographer?: string; photographerUrl?: string; altText?: string }>();
  // NOTE: search params always arrive as strings (or string arrays) — coerce types as needed.
  const params = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
  }>();
  const id = firstParam(params.id);
  const imageUrl = firstParam(params.imageUrl);
  const photographer = firstParam(params.photographer);
  const photographerUrl = firstParam(params.photographerUrl);
  const altText = firstParam(params.altText);

  // TODO 4.8 [Route Guard]: Before rendering anything, check the required params above.
  // If 'imageUrl' or 'photographer' is missing (someone opened the URL directly, or a stale
  // link was tapped), bounce safely back to the Search tab:
  //   return <Redirect href="/" />;
  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  // Position of the current photo inside the shared result set (for prev/next)
  const currentIndex = photos.findIndex((p) => String(p.id) === id);

  const goToAdjacentPhoto = (offset: number) => {
    // TODO 4.7 [Prev/Next Viewer]: Browse the shared result set without closing the modal:
    // a. Compute the target photo: photos[currentIndex + offset] — guard against out-of-bounds
    //    (stay put when there is nothing to move to).
    // b. Swap the CURRENT route for the target with router.replace:
    //    router.replace({ pathname: '/photo/[id]', params: { id: String(target.id), imageUrl: target.imageUrl, photographer: target.photographer, photographerUrl: target.photographerUrl, altText: target.altText } })
    // WHY replace instead of push? push would stack every photo on the history stack, so Back
    // would step through each one — replace keeps a single entry so Back closes the modal.
    if (currentIndex < 0) {
      return;
    }

    const target = photos[currentIndex + offset];
    if (!target) {
      return;
    }

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
    // TODO 4.5 [Generic Share Sheet]: Open the platform share sheet with React Native's Share API:
    // a. Call Share.share() with a { title, message, url } payload describing the photo and
    //    linking to the photographer's profile.
    // b. Wrap the call in try/catch: platforms/browsers without share support (and user
    //    cancellations) must fail gracefully without crashing the screen.
    // Hint: Messenger, WhatsApp, and every other installed app appear inside this sheet —
    // no per-app deep links required.
    try {
      await Share.share({
        title: 'Tourist Spot',
        message: `Check out this tourist spot photo by ${photographer}${photographerUrl ? `: ${photographerUrl}` : ''}`,
        url: photographerUrl || imageUrl,
      });
    } catch (error) {
      // Unsupported platform or user cancellation — ignore gracefully.
      console.warn('Share failed or was cancelled:', error);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Dynamic native header title — takes effect once TODO 4.4 wires the photographer param */}
      <Stack.Screen options={{ title: photographer ? `By ${photographer}` : 'Tourist Spot' }} />

      {/* The hero below renders the imageUrl param once TODO 4.4 is wired. */}
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