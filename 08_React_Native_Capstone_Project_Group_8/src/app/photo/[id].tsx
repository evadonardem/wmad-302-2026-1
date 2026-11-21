
import React from 'react';

import {
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { Image } from 'expo-image';

import {
  Redirect,
  Stack,
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Button,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import * as WebBrowser from 'expo-web-browser';

import { usePhotos } from '@/photos';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const isDarkMode = theme.dark;

  const { photos } = usePhotos();

  // ======================================
  // EMERALD THEME COLORS
  // MATCHING LAKBAY PH HOME SCREEN
  // ======================================

  const colors = isDarkMode
    ? {
        background: ['#03291F', '#064332', '#0B563D'] as [string, string, ...string[]],
        surface: 'rgba(9, 74, 49, 0.94)',
        text: '#ECFDF5',
        secondaryText: '#B7E4C7',
        mutedText: '#86B99A',
        primary: '#34D399',
        primaryText: '#03291F',
        border: 'rgba(110, 231, 183, 0.28)',
        photographerBackground: 'rgba(5, 50, 35, 0.84)',
        placeholderBackground: '#164E3B',
        divider: 'rgba(167, 243, 208, 0.22)',
      }
    : {
        background: ['#B7E4C7', '#D8F3DC', '#ECFDF3'] as [string, string, ...string[]],
        surface: 'rgba(247, 255, 249, 0.97)',
        text: '#123B2A',
        secondaryText: '#3F6B52',
        mutedText: '#648B72',
        primary: '#15803D',
        primaryText: '#FFFFFF',
        border: 'rgba(22, 101, 52, 0.24)',
        photographerBackground: 'rgba(232, 250, 238, 0.96)',
        placeholderBackground: '#D1FAE5',
        divider: 'rgba(22, 101, 52, 0.18)',
      };

  // ======================================
  // ROUTE PARAMETERS
  // ======================================

  const {
    id,
    imageUrl,
    photographer,
    photographerUrl,
    altText,
    locationName,
  } = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
    locationName?: string;
  }>();

  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  const currentIndex = photos.findIndex(
    (p) => String(p.id) === id
  );

  const searchedLocation = locationName || 'Philippines';

  // ======================================
  // BACK NAVIGATION
  // ======================================

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // ======================================
  // PREVIOUS / NEXT PHOTO
  // ======================================

  const goToAdjacentPhoto = (offset: number) => {
    const targetIndex = currentIndex + offset;

    if (
      targetIndex < 0 ||
      targetIndex >= photos.length
    ) {
      return;
    }

    const target = photos[targetIndex];

    router.replace({
      pathname: '/photo/[id]',
      params: {
        id: String(target.id),
        imageUrl: target.imageUrl,
        photographer: target.photographer || '',
        photographerUrl: target.photographerUrl || '',
        altText: target.altText || '',
        locationName: locationName || '',
      },
    });
  };

  // ======================================
  // OPEN PHOTOGRAPHER PROFILE
  // ======================================

  const handleOpenPhotographer = () => {
    if (photographerUrl) {
      WebBrowser.openBrowserAsync(photographerUrl);
    }
  };

  // ======================================
  // SHARE PHOTO
  // ======================================

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Photo of ${searchedLocation}`,
        message:
          `Discover ${searchedLocation} with LAKBAY PH!\n\n` +
          `Photograph captured by ${photographer}.\n\n` +
          'Explore more destinations with LAKBAY PH.',
      });
    } catch (error) {
      console.warn('Unable to share photo:', error);
    }
  };

  // ======================================
  // MAIN SCREEN
  // ======================================

  return (
    <LinearGradient
      colors={colors.background}
      style={styles.screen}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <Stack.Screen
          options={{
            title: 'LAKBAY PH',
            headerShown: false,
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={26}
              iconColor={colors.text}
              onPress={handleGoBack}
              accessibilityLabel="Go back"
            />

            <Text
              variant="titleMedium"
              style={[
                styles.headerTitle,
                { color: colors.primary },
              ]}
            >
              LAKBAY PH
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* MAIN IMAGE */}

          <View
            style={[
              styles.imageContainer,
              { backgroundColor: colors.placeholderBackground },
            ]}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.mainImage}
              contentFit="cover"
              transition={400}
              accessibilityLabel={altText || 'Destination photograph'}
            />

            {/* PREVIOUS PHOTO */}

            <View style={styles.navLeft}>
              <IconButton
                icon="chevron-left"
                size={32}
                iconColor="#FFFFFF"
                containerColor="rgba(0, 0, 0, 0.45)"
                onPress={() => goToAdjacentPhoto(-1)}
                disabled={currentIndex <= 0}
                accessibilityLabel="Previous photo"
              />
            </View>

            {/* NEXT PHOTO */}

            <View style={styles.navRight}>
              <IconButton
                icon="chevron-right"
                size={32}
                iconColor="#FFFFFF"
                containerColor="rgba(0, 0, 0, 0.45)"
                onPress={() => goToAdjacentPhoto(1)}
                disabled={currentIndex < 0 || currentIndex >= photos.length - 1}
                accessibilityLabel="Next photo"
              />
            </View>
          </View>

          {/* PHOTO INFORMATION CARD */}

          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.overline,
                { color: colors.primary },
              ]}
            >
              DESTINATION PHOTO
            </Text>

            <Text
              variant="headlineMedium"
              style={[
                styles.destinationName,
                { color: colors.text },
              ]}
            >
              {searchedLocation}
            </Text>

            {/* LOCATION */}

            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={25}
                color={colors.primary}
              />

              <View style={styles.locationTextContainer}>
                <Text
                  style={[
                    styles.locationName,
                    { color: colors.text },
                  ]}
                >
                  {searchedLocation}
                </Text>

                <Text
                  style={[
                    styles.locationSubtext,
                    { color: colors.mutedText },
                  ]}
                >
                  Explore this destination in the Philippines
                </Text>
              </View>
            </View>

            {/* DIVIDER */}

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.divider },
              ]}
            />

            {/* PHOTOGRAPHER */}

            <View
              style={[
                styles.photographerContainer,
                {
                  backgroundColor: colors.photographerBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.cameraIcon}>📸</Text>

              <View style={styles.photographerInfo}>
                <Text
                  style={[
                    styles.photographerLabel,
                    { color: colors.mutedText },
                  ]}
                >
                  Photograph captured by
                </Text>

                <Text
                  style={[
                    styles.photographerName,
                    { color: colors.text },
                  ]}
                >
                  {photographer}
                </Text>
              </View>
            </View>

            {/* ACTION BUTTONS */}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                icon="open-in-new"
                onPress={handleOpenPhotographer}
                disabled={!photographerUrl}
                style={[
                  styles.profileButton,
                  { borderColor: colors.primary },
                ]}
                textColor={colors.primary}
                labelStyle={styles.buttonLabel}
              >
                View Profile
              </Button>

              <Button
                mode="contained"
                icon="share-variant"
                onPress={handleShare}
                style={styles.shareButton}
                buttonColor={colors.primary}
                textColor={colors.primaryText}
                labelStyle={styles.buttonLabel}
              >
                Share Spot
              </Button>
            </View>
          </View>

          {/* FOOTER */}

          <Text
            style={[
              styles.footer,
              { color: colors.mutedText },
            ]}
          >
            Discover the Philippines with LAKBAY PH.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollView: {
    backgroundColor: 'transparent',
  },

  scrollContent: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },

  headerSpacer: {
    width: 48,
  },

  // IMAGE

  imageContainer: {
    width: '100%',
    height: 420,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  // PHOTO NAVIGATION

  navLeft: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  navRight: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // DETAILS CARD

  detailsCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#064E45',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },

  overline: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  destinationName: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 18,
  },

  // LOCATION

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationName: {
    fontSize: 15,
    fontWeight: '700',
  },

  locationSubtext: {
    fontSize: 12,
    marginTop: 3,
  },

  divider: {
    height: 1,
    width: '100%',
    marginBottom: 22,
  },

  // PHOTOGRAPHER

  photographerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  cameraIcon: {
    fontSize: 22,
  },

  photographerInfo: {
    flex: 1,
  },

  photographerLabel: {
    fontSize: 11,
  },

  photographerName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  // BUTTONS

  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 28,
  },

  profileButton: {
    flex: 1,
    minWidth: 180,
    borderRadius: 12,
  },

  shareButton: {
    flex: 1,
    minWidth: 180,
    borderRadius: 12,
  },

  buttonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  // FOOTER

  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
