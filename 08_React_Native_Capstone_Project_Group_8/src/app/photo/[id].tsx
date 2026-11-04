
import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';
import { useThemeMode } from '@/themeMode';

export default function PhotoDetailScreen() {
  const { isDarkMode } = useThemeMode();
  const { photos } = usePhotos();

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

  // LAKBAY PH emerald theme
  const colors = {
    background: isDarkMode ? '#03291F' : '#ECFDF3',
    header: isDarkMode ? '#064332' : '#D8F3DC',
    primary: isDarkMode ? '#34D399' : '#15803D',
    accent: isDarkMode ? '#6EE7B7' : '#0D6B50',
    text: isDarkMode ? '#ECFDF5' : '#123B2A',
    muted: isDarkMode ? '#B7E4C7' : '#3F6B52',
    border: isDarkMode ? '#176B50' : '#B7E4C7',
    card: isDarkMode ? '#064332' : '#E8FAEE',
  };

  const currentIndex = photos.findIndex(
    (p) => String(p.id) === id
  );

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

  const handleOpenPhotographer = () => {
    if (photographerUrl) {
      WebBrowser.openBrowserAsync(photographerUrl);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Photo by ${photographer}`,
        message: `Check out this amazing spot! 📸 Photo by ${photographer} — ${photographerUrl || ''}`,
        url: photographerUrl,
      });
    } catch (err) {
      console.warn('Share cancelled or failed:', err);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          title: `By ${photographer}`,
          headerStyle: {
            backgroundColor: colors.header,
          },
          headerTintColor: colors.accent,
          headerTitleStyle: {
            fontWeight: '800',
            color: colors.accent,
          },
          headerShadowVisible: false,
        }}
      />

      {/* Previous Photo */}
      <View style={styles.navLeft}>
        <IconButton
          icon="chevron-left"
          iconColor={
            currentIndex <= 0
              ? colors.muted
              : colors.accent
          }
          size={32}
          onPress={() => goToAdjacentPhoto(-1)}
          disabled={currentIndex <= 0}
          accessibilityLabel="Previous photo"
        />
      </View>

      {/* Main Content */}
      <View style={styles.contentWrapper}>
        {/* Photo */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.photo}
            contentFit="contain"
            transition={300}
            accessibilityLabel={altText || 'Photo'}
          />
        </View>

        {/* Information */}
        <View style={styles.infoSection}>
          <Text
            variant="titleMedium"
            style={[
              styles.photographer,
              { color: colors.text },
            ]}
          >
            📸 Captured by {photographer}
          </Text>

          {/* Location */}
          {!!locationName && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={22}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.locationText,
                  { color: colors.muted },
                ]}
              >
                {locationName}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              icon="open-in-new"
              onPress={handleOpenPhotographer}
              disabled={!photographerUrl}
              style={[
                styles.btnOutline,
                { borderColor: colors.primary },
              ]}
              textColor={colors.accent}
              labelStyle={styles.btnLabel}
            >
              View Profile
            </Button>

            <Button
              mode="contained"
              icon="share-variant"
              onPress={handleShare}
              buttonColor={colors.primary}
              textColor={isDarkMode ? '#03291F' : '#FFFFFF'}
              style={styles.btnSolid}
              labelStyle={styles.btnLabel}
            >
              Share Spot
            </Button>
          </View>
        </View>
      </View>

      {/* Next Photo */}
      <View style={styles.navRight}>
        <IconButton
          icon="chevron-right"
          iconColor={
            currentIndex >= photos.length - 1
              ? colors.muted
              : colors.accent
          }
          size={32}
          onPress={() => goToAdjacentPhoto(1)}
          disabled={currentIndex >= photos.length - 1}
          accessibilityLabel="Next photo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 60,
    paddingVertical: 24,
  },

  navLeft: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },

  navRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },

  contentWrapper: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    gap: 24,
  },

  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 24,
    overflow: 'hidden',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  infoSection: {
    padding: 8,
    gap: 16,
    alignItems: 'center',
  },

  photographer: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  locationText: {
    fontSize: 15,
    fontWeight: '600',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },

  btnOutline: {
    borderRadius: 14,
    borderWidth: 1.2,
    flex: 1,
    minWidth: 150,
  },

  btnSolid: {
    borderRadius: 14,
    flex: 1,
    minWidth: 150,
  },

  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
