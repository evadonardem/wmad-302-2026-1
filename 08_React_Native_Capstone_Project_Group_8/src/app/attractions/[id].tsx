
import React from 'react';

import {
  ScrollView,
  Share,
  StyleSheet,
  View,
  Pressable,
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

export default function AttractionDetailScreen() {
  const theme = useTheme();

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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

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

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background },
      ]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen
        options={{
          title: attractionName,
          headerShown: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={26}
            iconColor={theme.colors.onBackground}
            onPress={handleGoBack}
            accessibilityLabel="Go back"
          />

          <Text
            variant="titleMedium"
            style={[
              styles.headerTitle,
              { color: theme.colors.onBackground },
            ]}
          >
            LAKBAY PH
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* MAIN IMAGE */}

        <View style={styles.imageContainer}>
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
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <ActivityIndicator
                size="large"
                color="#0d9488"
              />

              <Text style={styles.placeholderText}>
                No photograph available
              </Text>
            </View>
          )}
        </View>

        {/* ATTRACTION INFORMATION */}

        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={styles.overline}>
            TOURIST ATTRACTION
          </Text>

          <Text
            variant="headlineMedium"
            style={[
              styles.attractionName,
              { color: theme.colors.onSurface },
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
                  { color: theme.colors.onSurface },
                ]}
              >
                {attractionLocation}
              </Text>

              <Text style={styles.locationSubtext}>
                {destination}, {province || 'Philippines'}
              </Text>
            </View>
          </View>

          {/* DIVIDER */}

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* DESCRIPTION */}

          <Text
            variant="titleMedium"
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            About this Attraction
          </Text>

          <Text
            variant="bodyLarge"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {description ||
              'Discover this beautiful tourist destination in the Philippines.'}
          </Text>

          {/* PHOTOGRAPHER */}

          {photographer ? (
            <View style={styles.photographerContainer}>
              <Text style={styles.cameraIcon}>📸</Text>

              <View>
                <Text style={styles.photographerLabel}>
                  Photograph captured by
                </Text>

                <Text
                  style={[
                    styles.photographerName,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {photographer}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ACTION BUTTONS */}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              icon="arrow-left"
              onPress={handleGoBack}
              style={styles.backButton}
              labelStyle={styles.buttonLabel}
            >
              Back to Attractions
            </Button>

            <Button
              mode="contained"
              icon="share-variant"
              onPress={handleShare}
              style={styles.shareButton}
              buttonColor="#0d9488"
              textColor="#ffffff"
              labelStyle={styles.buttonLabel}
            >
              Share Attraction
            </Button>
          </View>
        </View>

        {/* FOOTER */}

        <Text style={styles.footer}>
          Discover the Philippines with LAKBAY PH.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    color: '#0d9488',
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
    backgroundColor: '#e5e7eb',
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
    color: '#64748b',
  },

  // DETAILS CARD

  detailsCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  overline: {
    color: '#f59e0b',
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
    color: '#999999',
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
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },

  cameraIcon: {
    fontSize: 22,
  },

  photographerLabel: {
    fontSize: 11,
    color: '#999999',
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

  backButton: {
    flex: 1,
    minWidth: 180,
    borderRadius: 12,
    borderColor: '#0d9488',
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
    color: '#999999',
    fontSize: 12,
    marginTop: 24,
  },
});
