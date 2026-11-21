
import React from 'react';

import {
  ScrollView,
  Share,
  StyleSheet,
  View,
  Linking,
} from 'react-native';

import { Image } from 'expo-image';

import {
  Stack,
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  ActivityIndicator,
  Button,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

export default function AttractionDetailScreen() {
  const theme = useTheme();
  const isDarkMode = theme.dark;

  // ======================================
  // EMERALD THEME COLORS
  // MATCHING PHOTO DETAIL PAGE
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
    name,
    location,
    description,
    imageUrl,
    photographer,
    destinationName,
    province,
  } = useLocalSearchParams<{
    id?: string;
    name?: string;
    location?: string;
    description?: string;
    imageUrl?: string;
    photographer?: string;
    destinationName?: string;
    province?: string;
  }>();

  const attractionName = name || 'Tourist Attraction';
  const destination = destinationName || 'Philippines';
  const attractionLocation = location || destination;

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
  // SHARE ATTRACTION
  // ======================================

  const handleShare = async () => {
    try {
      await Share.share({
        title: attractionName,
        message:
          `Discover ${attractionName} in ${destination}, ` +
          `${province || 'Philippines'}!\n\n` +
          `${description || ''}\n\n` +
          'Explore more destinations with LAKBAY PH.',
      });
    } catch (error) {
      console.warn('Unable to share attraction:', error);
    }
  };

  // ======================================
  // GOOGLE MAPS DIRECTIONS
  // ======================================

  const handleGetDirections = async () => {
    const searchLocation = [
      attractionName,
      attractionLocation,
      destination,
      province,
      'Philippines',
    ]
      .filter(Boolean)
      .join(', ');

    const googleMapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchLocation)}`;

    try {
      await Linking.openURL(googleMapsUrl);
    } catch (error) {
      console.warn('Unable to open Google Maps:', error);
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
            title: attractionName,
            headerShown: false,
          }}
        />

        <ScrollView
          style={styles.transparentBackground}
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
              {
                backgroundColor: colors.placeholderBackground,
              },
            ]}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.mainImage}
                contentFit="cover"
                transition={400}
                accessibilityLabel={attractionName}
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  {
                    backgroundColor: colors.placeholderBackground,
                  },
                ]}
              >
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.secondaryText },
                  ]}
                >
                  No photograph available
                </Text>
              </View>
            )}
          </View>

          {/* ATTRACTION INFORMATION */}

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
              TOURIST ATTRACTION
            </Text>

            <Text
              variant="headlineMedium"
              style={[
                styles.attractionName,
                { color: colors.text },
              ]}
            >
              {attractionName}
            </Text>

            {/* LOCATION */}

            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>

              <View style={styles.locationTextContainer}>
                <Text
                  style={[
                    styles.locationName,
                    { color: colors.text },
                  ]}
                >
                  {attractionLocation}
                </Text>

                <Text
                  style={[
                    styles.locationSubtext,
                    { color: colors.mutedText },
                  ]}
                >
                  {destination}, {province || 'Philippines'}
                </Text>
              </View>
            </View>

            {/* DIVIDER */}

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.border },
              ]}
            />

            {/* DESCRIPTION */}

            <Text
              variant="titleMedium"
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              About this Attraction
            </Text>

            <Text
              variant="bodyLarge"
              style={[
                styles.description,
                { color: colors.secondaryText },
              ]}
            >
              {description ||
                'Discover this beautiful tourist destination in the Philippines.'}
            </Text>

            {/* PHOTOGRAPHER */}

            {photographer ? (
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

                <View>
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
            ) : null}

            {/* ACTION BUTTONS */}

            <View style={styles.buttonContainer}>
              {/* GOOGLE MAPS BUTTON */}

              <Button
                mode="contained"
                icon="google-maps"
                onPress={handleGetDirections}
                style={styles.directionsButton}
                buttonColor={colors.primary}
                textColor={colors.primaryText}
                labelStyle={styles.buttonLabel}
              >
                Get Directions
              </Button>

              {/* BACK BUTTON */}

              <Button
                mode="outlined"
                icon="arrow-left"
                onPress={handleGoBack}
                style={[
                  styles.backButton,
                  { borderColor: colors.primary },
                ]}
                textColor={colors.primary}
                labelStyle={styles.buttonLabel}
              >
                Back to Attractions
              </Button>

              {/* SHARE BUTTON */}

              <Button
                mode="contained"
                icon="share-variant"
                onPress={handleShare}
                style={styles.shareButton}
                buttonColor={colors.primary}
                textColor={colors.primaryText}
                labelStyle={styles.buttonLabel}
              >
                Share Attraction
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

  transparentBackground: {
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
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  placeholderText: {
    fontSize: 13,
  },

  // DETAILS CARD

  detailsCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  overline: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  attractionName: {
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

  locationIcon: {
    fontSize: 23,
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

  // DESCRIPTION

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 27,
  },

  // PHOTOGRAPHER

  photographerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  cameraIcon: {
    fontSize: 22,
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

  directionsButton: {
    width: '100%',
    borderRadius: 12,
  },

  backButton: {
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
