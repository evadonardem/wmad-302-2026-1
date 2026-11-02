import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { usePhotos } from '@/photos';

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const { photos } = usePhotos();

  const {
    id,
    imageUrl,
    photographer,
    photographerUrl,
    altText,
  } = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
  }>();

  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  const currentIndex = photos.findIndex((p) => String(p.id) === id);

  const goToAdjacentPhoto = (offset: number) => {
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const target = photos[targetIndex];
    router.replace({
      pathname: '/photo/[id]',
      params: {
        id: String(target.id),
        imageUrl: target.imageUrl,
        photographer: target.photographer || '',
        photographerUrl: target.photographerUrl || '',
        altText: target.altText || '',
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
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: photographer ? `By ${photographer}` : 'Tourist Spot' }} />

      {/* Previous Button */}
      <View style={styles.navLeft}>
        <IconButton
          icon="chevron-left"
          iconColor={currentIndex <= 0 ? theme.colors.outline : theme.colors.onBackground}
          size={32}
          onPress={() => goToAdjacentPhoto(-1)}
          disabled={currentIndex <= 0}
          accessibilityLabel="Previous photo"
        />
      </View>

      {/* Main Content — Clean, Theme-Adaptive, NO Hard Background Box */}
      <View style={styles.contentWrapper}>
        {/* Image — Clean rounded, no conflicting background */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.photo}
            contentFit="contain"
            transition={300}
            accessibilityLabel={altText || 'Photo'}
          />
        </View>

        {/* Info Section — Uses theme colors directly, always readable */}
        <View style={styles.infoSection}>
          <Text variant="titleMedium" style={[styles.photographer, { color: theme.colors.onBackground }]}>
            📸 Captured by {photographer}
          </Text>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              icon="open-in-new"
              onPress={handleOpenPhotographer}
              disabled={!photographerUrl}
              style={styles.btnOutline}
              labelStyle={[styles.btnLabel, { color: theme.colors.onBackground }]}
            >
              View Profile
            </Button>

            <Button
              mode="contained"
              icon="share-variant"
              onPress={handleShare}
              style={styles.btnSolid}
              labelStyle={styles.btnLabel}
            >
              Share Spot
            </Button>
          </View>
        </View>
      </View>

      {/* Next Button */}
      <View style={styles.navRight}>
        <IconButton
          icon="chevron-right"
          iconColor={currentIndex >= photos.length - 1 ? theme.colors.outline : theme.colors.onBackground}
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
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'transparent', // ✅ No fixed background — matches theme perfectly
  },
  photo: {
    width: '100%',
    height: '100%',
  },

  infoSection: {
    padding: 8,
    gap: 20,
    alignItems: 'center',
  },

  photographer: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
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
  },
});