import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

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

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* The hero below renders the imageUrl param once TODO 4.4 is wired. */}
        {/* DESIGN: the photo sits in a wrapper so small badges can float on top of it */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={200}
            accessibilityLabel={altText}
          />

          {/* DESIGN: gold "Tourist Spot" badge, top-left of the photo */}
          <View pointerEvents="none" style={styles.heroBadge}>
            <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.secondary }]} />
            <Text style={styles.heroBadgeText}>TOURIST SPOT</Text>
          </View>

          {/* DESIGN: photo counter, top-right of the photo (only when the photo is part of the result set) */}
          {currentIndex >= 0 ? (
            <View pointerEvents="none" style={styles.heroCounter}>
              <Text style={styles.heroCounterText}>
                📍 {currentIndex + 1} of {photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary },
          ]}
        >
          {/* DESIGN: soft background shapes (they only draw, they never catch touches) */}
          <View pointerEvents="none" style={[styles.decoCircleBig, { backgroundColor: theme.colors.primary }]} />
          <View pointerEvents="none" style={[styles.decoCircleSmall, { backgroundColor: theme.colors.secondary }]} />
          <View pointerEvents="none" style={[styles.decoRing, { borderColor: theme.colors.secondary }]} />

          {/* DESIGN: little landscape (sun + mountains) along the bottom of the sheet */}
          <View pointerEvents="none" style={styles.landscape}>
            <View style={[styles.sun, { backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.mountain, styles.mountainBack, { borderBottomColor: theme.colors.primary }]} />
            <View style={[styles.mountain, styles.mountainMid, { borderBottomColor: theme.colors.primary }]} />
            <View style={[styles.mountain, styles.mountainSmall, { borderBottomColor: theme.colors.primary }]} />
            <View style={[styles.mountain, styles.mountainFront, { borderBottomColor: theme.colors.primary }]} />
          </View>

          {/* Small gold handle at the top of the sheet */}
          <View style={[styles.handle, { backgroundColor: theme.colors.secondary }]} />

          {/* DESIGN: small label above the caption */}
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDot, { backgroundColor: theme.colors.secondary }]} />
            <Text style={[styles.eyebrowText, { color: theme.colors.primary }]}>TOURIST SPOT · PHILIPPINES</Text>
          </View>

          {altText ? (
            <Text variant="titleMedium" style={[styles.caption, { color: theme.colors.onSurface }]}>
              {altText}
            </Text>
          ) : null}

          {/* DESIGN: gold divider with a diamond in the middle */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerGold, { backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.dividerDiamond, { backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          <View style={[styles.pagerRow, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton
              icon="chevron-left"
              iconColor={theme.colors.onPrimaryContainer}
              size={28}
              disabled={!hasPrev}
              onPress={() => goToAdjacentPhoto(-1)}
              accessibilityLabel="Previous photo"
            />
            <Text variant="titleMedium" style={[styles.photographer, { color: theme.colors.onPrimaryContainer }]}>
              📸 Captured by {photographer || '—'}
            </Text>
            <IconButton
              icon="chevron-right"
              iconColor={theme.colors.onPrimaryContainer}
              size={28}
              disabled={!hasNext}
              onPress={() => goToAdjacentPhoto(1)}
              accessibilityLabel="Next photo"
            />
          </View>

          <Button
            mode="outlined"
            icon="open-in-new"
            onPress={handleOpenPhotographer}
            disabled={!photographerUrl}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Visit photographer profile
          </Button>

          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShare}
            style={[styles.button, styles.shareButton]}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.secondary}
            textColor={theme.colors.onSecondary}
            labelStyle={{ fontWeight: '700' }}
          >
            Share this spot
          </Button>

          {/* DESIGN: brand line under the buttons (sits above the landscape) */}
          <View style={styles.brandRow}>
            <View style={[styles.brandLine, { backgroundColor: theme.colors.secondary }]} />
            <Text style={[styles.brandText, { color: theme.colors.primary }]}>PH NAVYRA</Text>
            <View style={[styles.brandLine, { backgroundColor: theme.colors.secondary }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  heroWrap: {
    width: '100%',
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 520,
  },
  // DESIGN: badges floating on the photo
  heroBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroCounter: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 20,
    paddingBottom: 110, // leaves room for the landscape at the bottom
    gap: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 4,
    marginTop: -24,
    minHeight: 280,
    overflow: 'hidden',
  },
  // DESIGN: background shapes
  decoCircleBig: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -90,
    top: -80,
    opacity: 0.1,
  },
  decoCircleSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -36,
    top: 190,
    opacity: 0.18,
  },
  decoRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    right: 24,
    top: 40,
    opacity: 0.3,
  },
  // DESIGN: sun + mountains
  landscape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    right: 90,
    bottom: 46,
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.9,
  },
  mountain: {
    position: 'absolute',
    bottom: -1,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  mountainBack: {
    right: -20,
    borderLeftWidth: 110,
    borderRightWidth: 110,
    borderBottomWidth: 100,
    opacity: 0.18,
  },
  mountainMid: {
    left: '38%',
    borderLeftWidth: 80,
    borderRightWidth: 80,
    borderBottomWidth: 72,
    opacity: 0.22,
  },
  mountainSmall: {
    right: 170,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 55,
    opacity: 0.32,
  },
  mountainFront: {
    left: -30,
    borderLeftWidth: 130,
    borderRightWidth: 130,
    borderBottomWidth: 85,
    opacity: 0.26,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  // DESIGN: label above the caption
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  caption: {
    fontFamily: SERIF,
    fontWeight: '700',
    lineHeight: 24,
  },
  // DESIGN: divider under the caption
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerGold: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 4,
  },
  photographer: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    borderRadius: 999,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  shareButton: {
    marginTop: 4,
  },
  // DESIGN: brand line under the buttons
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  brandLine: {
    width: 28,
    height: 2,
    borderRadius: 1,
    opacity: 0.8,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    opacity: 0.85,
  },
});